/**
 * test/verify.mjs — Data Viewer Verification Tests
 *
 * Tests the REAL implementations directly via esbuild in-memory bundling & data URL imports.
 * No production logic is duplicated in this test file.
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Helper to bundle and import a TypeScript module in-memory via data URI
async function importModule(entryRelPath, mockPlugins = []) {
  const absPath = join(root, entryRelPath);
  const result = await esbuild.build({
    entryPoints: [absPath],
    bundle: true,
    format: 'esm',
    write: false,
    platform: 'node',
    plugins: mockPlugins,
  });

  const code = result.outputFiles[0].text;
  const base64 = Buffer.from(code).toString('base64');
  return import(`data:text/javascript;base64,${base64}`);
}

// ─── 1. Load Real Modules ───────────────────────────────────────────────────

const { isSqliteFile, detectDataFormat } = await importModule('src/core/detection/formatDetector.ts');
const { quoteIdentifier } = await importModule('src/modules/sqlite/lib/identifiers.ts');
const { stripComments, countStatements, validateReadOnlyQuery } = await importModule('src/modules/sqlite/lib/safety.ts');

// Mock downloadFile so export.ts can be tested without browser DOM APIs
const mockFilePlugin = {
  name: 'mock-file-plugin',
  setup(build) {
    build.onResolve({ filter: /file/ }, (args) => {
      if (args.path.endsWith('/file') || args.path.endsWith('/file.ts')) {
        return { path: 'mock-file', namespace: 'mock-ns' };
      }
      return null;
    });
    build.onLoad({ filter: /.*/, namespace: 'mock-ns' }, () => ({
      contents: `
        export let lastDownload = null;
        export function downloadFile(content, filename, mimeType) {
          lastDownload = { content, filename, mimeType };
        }
      `,
      loader: 'js',
    }));
  },
};

const { escapeCsvCell, exportToCsv, exportToJson } = await importModule(
  'src/modules/sqlite/lib/export.ts',
  [mockFilePlugin]
);

const { formatJsonPath } = await importModule('src/modules/json/lib/jsonPath.ts');
const { calculateJsonStats } = await importModule('src/modules/json/lib/jsonStats.ts');

console.log('✅ Real modules loaded successfully.\n');

// ─── 2. SQLite Magic Header & Format Detection ──────────────────────────────

console.log('Testing SQLite magic header & format detection (REAL implementation)...');

const SQLITE_MAGIC = 'SQLite format 3\x00';

function createMockFile(name, content, type = '') {
  let bytes;
  if (typeof content === 'string') {
    bytes = Buffer.from(content, 'utf8');
  } else if (content instanceof Uint8Array || Buffer.isBuffer(content)) {
    bytes = content;
  } else {
    bytes = Buffer.alloc(0);
  }

  return {
    name,
    type,
    size: bytes.length,
    slice(start = 0, end = bytes.length) {
      const sliced = bytes.slice(start, end);
      return {
        async arrayBuffer() {
          const ab = new ArrayBuffer(sliced.length);
          new Uint8Array(ab).set(sliced);
          return ab;
        },
      };
    },
  };
}

// isSqliteFile tests
const validSqliteHeader = Buffer.alloc(100);
validSqliteHeader.write(SQLITE_MAGIC, 0, 'utf8');

assert.equal(await isSqliteFile(createMockFile('test.db', validSqliteHeader)), true, 'Valid 16-byte magic returns true');
assert.equal(await isSqliteFile(createMockFile('test.db', 'Not a valid sqlite header')), false, 'Invalid header returns false');
assert.equal(await isSqliteFile(createMockFile('test.db', Buffer.alloc(10))), false, 'Files < 16 bytes return false');
assert.equal(await isSqliteFile(null), false, 'Null file returns false');

// Real sample.db file check
const sampleDbPath = join(root, 'public', 'sample.db');
if (existsSync(sampleDbPath)) {
  const sampleBuf = readFileSync(sampleDbPath);
  const sampleFile = createMockFile('sample.db', sampleBuf, 'application/x-sqlite3');
  assert.equal(await isSqliteFile(sampleFile), true, 'public/sample.db is recognized as SQLite');
  assert.equal(await detectDataFormat(sampleFile), 'sqlite', 'public/sample.db format is detected as "sqlite"');
}

// detectDataFormat tests
const validDbFile = createMockFile('database.sqlite', validSqliteHeader, 'application/x-sqlite3');
assert.equal(await detectDataFormat(validDbFile), 'sqlite', 'database.sqlite with valid header MUST be detected as "sqlite"');

const validDbNoExt = createMockFile('unknown_name', validSqliteHeader);
assert.equal(await detectDataFormat(validDbNoExt), 'sqlite', 'Header magic fallback detects sqlite even without .db/.sqlite extension');

const invalidDbFile = createMockFile('database.sqlite', 'Invalid content without header', 'application/x-sqlite3');
assert.equal(await detectDataFormat(invalidDbFile), 'unknown', 'database.sqlite without SQLite magic header returns "unknown"');

const jsonFile = createMockFile('data.json', '{"key": "value"}', 'application/json');
assert.equal(await detectDataFormat(jsonFile), 'json', 'data.json detected as "json"');

const jsonUpperFile = createMockFile('DATASET.JSON', '[]');
assert.equal(await detectDataFormat(jsonUpperFile), 'json', 'DATASET.JSON detected as "json"');

const jsonMimeOnly = createMockFile('payload.txt', '{}', 'application/json');
assert.equal(await detectDataFormat(jsonMimeOnly), 'json', 'application/json mime detected as "json"');

const csvFile = createMockFile('data.csv', 'a,b,c\n1,2,3', 'text/csv');
assert.equal(await detectDataFormat(csvFile), 'unknown', 'data.csv detected as "unknown"');

console.log('✅ SQLite magic header & format detection tests passed.\n');

// ─── 3. Identifier Quoting ──────────────────────────────────────────────────

console.log('Testing quoteIdentifier (REAL implementation)...');

assert.equal(quoteIdentifier('users'), '"users"');
assert.equal(quoteIdentifier('user table'), '"user table"');
assert.equal(quoteIdentifier('quoted"table"name'), '"quoted""table""name"');
assert.equal(quoteIdentifier('select'), '"select"');
assert.equal(quoteIdentifier('order'), '"order"');
assert.throws(() => quoteIdentifier(123), /Expected identifier string/);

console.log('✅ quoteIdentifier tests passed.\n');

// ─── 4. Read-Only SQL Safety Validation & Quote-Aware Parsing ───────────────

console.log('Testing SQL safety validation & quote-aware parser (REAL implementation)...');

// Comments stripping (preserves comment-like patterns inside strings)
assert.equal(stripComments('SELECT 1 -- inline comment'), 'SELECT 1');
assert.equal(stripComments("SELECT '--not a comment'"), "SELECT '--not a comment'");
assert.equal(stripComments("SELECT '/* not a block comment */'"), "SELECT '/* not a block comment */'");

// Single-statement counting with quote-awareness
assert.equal(countStatements('SELECT 1'), 1, 'Single statement without semicolon');
assert.equal(countStatements('SELECT 1;'), 1, 'Single statement with semicolon');
assert.equal(countStatements("SELECT 'hello; world'"), 1, 'Semicolon inside single-quoted string literal');
assert.equal(countStatements('SELECT "col;name" FROM t'), 1, 'Semicolon inside double-quoted identifier');
assert.equal(countStatements('SELECT 1; SELECT 2'), 2, 'Two statements separated by semicolon');
assert.equal(countStatements('SELECT 1; -- comment with ;\nSELECT 2'), 2, 'Two statements with comment');
assert.equal(countStatements(''), 0, 'Empty SQL has 0 statements');
assert.equal(countStatements(';;;'), 0, 'Semicolons only have 0 statements');

// Safe Read-Only Queries Allowed
assert.equal(validateReadOnlyQuery('SELECT * FROM users').isSafe, true, 'SELECT is allowed');
assert.equal(validateReadOnlyQuery('select count(*) from users;').isSafe, true, 'Lowercase select is allowed');
assert.equal(validateReadOnlyQuery('WITH cte AS (SELECT 1) SELECT * FROM cte;').isSafe, true, 'WITH (CTE) query is allowed');
assert.equal(validateReadOnlyQuery('EXPLAIN QUERY PLAN SELECT * FROM users').isSafe, true, 'EXPLAIN is allowed');
assert.equal(validateReadOnlyQuery('PRAGMA page_size').isSafe, true, 'Read-only PRAGMA is allowed');
assert.equal(validateReadOnlyQuery('PRAGMA table_info("users")').isSafe, true, 'PRAGMA table_info is allowed');
assert.equal(validateReadOnlyQuery("SELECT 'hello; world' AS greeting;").isSafe, true, 'SELECT with semicolon in literal is allowed');

// Mutating / Unsafe Queries Blocked
const mutatingQueries = [
  'INSERT INTO users (name) VALUES ("Hacker")',
  'UPDATE users SET name = "Admin"',
  'DELETE FROM users',
  'DROP TABLE users',
  'CREATE TABLE evil (id INT)',
  'ALTER TABLE users ADD COLUMN secret TEXT',
  'VACUUM',
  'ATTACH DATABASE "other.db" AS other',
  'BEGIN TRANSACTION',
];

for (const q of mutatingQueries) {
  const res = validateReadOnlyQuery(q);
  assert.equal(res.isSafe, false, `Mutating query "${q}" must be blocked`);
}

// Multi-statement execution blocked
assert.equal(validateReadOnlyQuery('SELECT 1; DROP TABLE users;').isSafe, false, 'Multiple statements blocked');
assert.equal(validateReadOnlyQuery('SELECT 1; SELECT 2;').isSafe, false, 'Multiple SELECTs blocked');

// Modifying PRAGMAs blocked
assert.equal(validateReadOnlyQuery('PRAGMA user_version = 5').isSafe, false, 'PRAGMA assignment blocked');
assert.equal(validateReadOnlyQuery('PRAGMA foreign_keys = OFF').isSafe, false, 'Disallowed/modifying PRAGMA blocked');

console.log('✅ SQL safety validation & quote-aware parser tests passed.\n');

// ─── 5. Export Helpers ──────────────────────────────────────────────────────

console.log('Testing export helpers (REAL implementation)...');

// escapeCsvCell
assert.equal(escapeCsvCell(null), '', 'null -> empty string');
assert.equal(escapeCsvCell(undefined), '', 'undefined -> empty string');
assert.equal(escapeCsvCell(123), '123', 'number -> string');
assert.equal(escapeCsvCell('plain text'), 'plain text', 'simple text unchanged');
assert.equal(escapeCsvCell('text with, comma'), '"text with, comma"', 'comma quoted');
assert.equal(escapeCsvCell('text with "quotes"'), '"text with ""quotes"""', 'internal quotes doubled');
assert.equal(escapeCsvCell('line 1\nline 2'), '"line 1\nline 2"', 'newlines quoted');
assert.equal(escapeCsvCell(new Uint8Array([1, 2, 3, 4])), '"[BLOB 4 B]"', 'Uint8Array -> BLOB placeholder');

// exportToCsv & exportToJson (triggers downloadFile with RFC 4180 format)
assert.doesNotThrow(() => {
  exportToCsv(['id', 'name', 'notes'], [[1, 'Alice', 'Hello, world!'], [2, 'Bob', 'Normal']], 'test.csv');
}, 'exportToCsv completes without throwing');

assert.doesNotThrow(() => {
  exportToJson(['id', 'name'], [[1, 'Alice'], [2, 'Bob']], 'test.json');
}, 'exportToJson completes without throwing');

console.log('✅ Export helpers tests passed.\n');

// ─── 6. JSON Path Builder (Existing JSON module regression test) ────────────

console.log('Testing JSON Path Builder (REAL implementation)...');

assert.equal(formatJsonPath([]), '$');
assert.equal(formatJsonPath(['user', 'profile', 'name']), 'user.profile.name');
assert.equal(formatJsonPath(['users', 3, 'email']), 'users[3].email');
assert.equal(formatJsonPath(['hello.world', 'some key']), '["hello.world"]["some key"]');
assert.equal(formatJsonPath([0, 'id']), '[0].id');
assert.equal(formatJsonPath(['items', 0, 'meta.data']), 'items[0]["meta.data"]');
assert.equal(formatJsonPath(['key with "quotes"']), '["key with \\"quotes\\""]');
assert.equal(formatJsonPath(['class', 'name']), '["class"].name');

console.log('✅ JSON Path Builder tests passed.\n');

// ─── 7. JSON Statistics Calculator (Existing JSON module regression test) ───

console.log('Testing JSON Statistics Calculator (REAL implementation)...');

const sampleJsonObject = {
  id: 1,
  username: 'admin',
  roles: ['superuser', 'staff'],
  details: {
    active: true,
    score: null,
    nested: { count: 10 },
  },
};

const stats = calculateJsonStats(sampleJsonObject, JSON.stringify(sampleJsonObject, null, 2));

assert.equal(stats.objectCount, 3, 'objectCount is 3 (root, details, nested)');
assert.equal(stats.arrayCount, 1, 'arrayCount is 1 (roles)');
assert.equal(stats.primitiveCount, 7, 'primitiveCount is 7 (id, username, superuser, staff, active, score, count)');
assert.equal(stats.keyCount, 8, 'keyCount is 8 (id, username, roles, details, active, score, nested, count)');
assert.equal(stats.maxDepth, 4, 'maxDepth is 4');

// Primitives as root
assert.equal(calculateJsonStats(null, 'null').primitiveCount, 1);
assert.equal(calculateJsonStats(12345, '12345').primitiveCount, 1);
assert.equal(calculateJsonStats('hello', '"hello"').primitiveCount, 1);
assert.equal(calculateJsonStats([], '[]').arrayCount, 1);
assert.equal(calculateJsonStats({}, '{}').objectCount, 1);

console.log('✅ JSON Statistics Calculator tests passed.\n');

console.log('🎉 ALL PRODUCTION VERIFICATION TESTS PASSED SUCCESSFULLY! ✓');
