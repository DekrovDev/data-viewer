const DISALLOWED_KEYWORDS = new Set([
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'CREATE',
  'ALTER',
  'REPLACE',
  'ATTACH',
  'DETACH',
  'VACUUM',
  'REINDEX',
  'BEGIN',
  'COMMIT',
  'ROLLBACK',
  'SAVEPOINT',
  'RELEASE',
  'GRANT',
  'REVOKE',
]);

const ALLOWED_PRAGMAS = new Set([
  'table_info',
  'table_list',
  'foreign_key_list',
  'index_list',
  'index_info',
  'database_list',
  'compile_options',
  'user_version',
  'page_size',
  'page_count',
  'encoding',
  'application_id',
  'schema_version',
  'freelist_count',
  'integrity_check',
  'quick_check',
  'sqlite_version',
]);

/**
 * Strips SQL comments (both -- single-line and /* ... *\/ block).
 * Skips comment-like text inside string literals.
 */
export function stripComments(sql: string): string {
  let result = '';
  let i = 0;
  const len = sql.length;

  while (i < len) {
    const ch = sql[i];

    // Single-quoted string literal — pass through verbatim
    if (ch === "'") {
      let j = i + 1;
      while (j < len) {
        if (sql[j] === "'") {
          // escaped '' inside string?
          if (j + 1 < len && sql[j + 1] === "'") { j += 2; continue; }
          break;
        }
        j++;
      }
      result += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    // Double-quoted identifier — pass through verbatim
    if (ch === '"') {
      let j = i + 1;
      while (j < len) {
        if (sql[j] === '"') {
          if (j + 1 < len && sql[j + 1] === '"') { j += 2; continue; }
          break;
        }
        j++;
      }
      result += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    // Backtick identifier
    if (ch === '`') {
      const j = sql.indexOf('`', i + 1);
      if (j === -1) { result += sql.slice(i); break; }
      result += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    // Block comment /* ... */
    if (ch === '/' && i + 1 < len && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      i = end === -1 ? len : end + 2;
      result += ' '; // replace with space to avoid merging tokens
      continue;
    }

    // Line comment --
    if (ch === '-' && i + 1 < len && sql[i + 1] === '-') {
      const nl = sql.indexOf('\n', i + 2);
      i = nl === -1 ? len : nl + 1;
      result += ' ';
      continue;
    }

    result += ch;
    i++;
  }

  return result.trim();
}

/**
 * Counts top-level SQL statements in a string using a quote-aware
 * semicolon scanner.  Semicolons inside string literals, identifiers,
 * or comments are ignored.
 *
 * Returns the number of non-empty statements found.
 */
export function countStatements(sql: string): number {
  const clean = stripComments(sql);
  let count = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let hasContent = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];

    if (inSingle) {
      if (ch === "'" && clean[i + 1] === "'") { i++; continue; }
      if (ch === "'") { inSingle = false; }
      continue;
    }
    if (inDouble) {
      if (ch === '"' && clean[i + 1] === '"') { i++; continue; }
      if (ch === '"') { inDouble = false; }
      continue;
    }
    if (inBacktick) {
      if (ch === '`') { inBacktick = false; }
      continue;
    }

    if (ch === "'") { inSingle = true; hasContent = true; continue; }
    if (ch === '"') { inDouble = true; hasContent = true; continue; }
    if (ch === '`') { inBacktick = true; hasContent = true; continue; }

    if (ch === ';') {
      if (hasContent) { count++; hasContent = false; }
      continue;
    }

    if (ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r') {
      hasContent = true;
    }
  }

  // trailing statement without semicolon
  if (hasContent) count++;

  return count;
}

/**
 * Validates whether a SQL query is safe and strictly read-only.
 * Returns { isSafe: true } or { isSafe: false, reason: string }.
 *
 * NOTE: This is the JS-level pre-check.  The authoritative runtime check
 * is sqlite3_stmt_readonly() performed in the worker after prepare().
 */
export function validateReadOnlyQuery(rawSql: string): { isSafe: boolean; reason?: string } {
  const clean = stripComments(rawSql);
  if (!clean) {
    return { isSafe: false, reason: 'Empty query' };
  }

  // Reject multiple statements using quote-aware counter
  const stmtCount = countStatements(clean);
  if (stmtCount > 1) {
    return {
      isSafe: false,
      reason: 'Multiple statements are not permitted in a single run. Please execute one statement at a time.',
    };
  }

  // Extract first token from cleaned SQL
  const firstTokenMatch = clean.match(/^([A-Za-z_]+)/);
  if (!firstTokenMatch) {
    return { isSafe: false, reason: 'Invalid SQL statement syntax' };
  }

  const firstToken = firstTokenMatch[1].toUpperCase();

  if (DISALLOWED_KEYWORDS.has(firstToken)) {
    return {
      isSafe: false,
      reason: `Mutating statement "${firstToken}" is prohibited. Data Viewer operates in strict Read-Only mode.`,
    };
  }

  // PRAGMA inspection
  if (firstToken === 'PRAGMA') {
    // Reject assignment form: PRAGMA x = y
    if (/PRAGMA\s+\w+\s*=/i.test(clean)) {
      return {
        isSafe: false,
        reason: 'Modifying PRAGMA statements are not allowed in Read-Only mode.',
      };
    }

    const pragmaMatch = clean.match(/^PRAGMA\s+([A-Za-z0-9_]+)/i);
    if (!pragmaMatch) {
      return { isSafe: false, reason: 'Invalid PRAGMA syntax.' };
    }

    const pragmaName = pragmaMatch[1].toLowerCase();
    if (!ALLOWED_PRAGMAS.has(pragmaName)) {
      return {
        isSafe: false,
        reason: `PRAGMA "${pragmaName}" is not in the safe read-only allowlist.`,
      };
    }
  }

  // Must be one of the allowed starting keywords
  if (!['SELECT', 'WITH', 'EXPLAIN', 'PRAGMA'].includes(firstToken)) {
    return {
      isSafe: false,
      reason: `Statement starting with "${firstToken}" is not supported. Only SELECT, WITH, EXPLAIN, and read-only PRAGMA queries are allowed.`,
    };
  }

  return { isSafe: true };
}
