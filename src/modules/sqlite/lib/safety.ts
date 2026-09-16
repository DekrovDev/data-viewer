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
 * Strips comments from SQL (both single-line -- and multi-line /* ... *\/).
 */
export function stripComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '')
    .trim();
}

/**
 * Validates whether a SQL query is safe and strictly read-only.
 * Returns { isSafe: true } or { isSafe: false, reason: string }.
 */
export function validateReadOnlyQuery(rawSql: string): { isSafe: boolean; reason?: string } {
  const clean = stripComments(rawSql);
  if (!clean) {
    return { isSafe: false, reason: 'Empty query' };
  }

  // Check for multiple statements
  // Split on semicolons that are not inside quotes
  const statements = clean
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  if (statements.length > 1) {
    return {
      isSafe: false,
      reason: 'Multiple statements are not permitted in a single run. Please execute one statement at a time.',
    };
  }

  const statement = statements[0];

  // Extract first token
  const firstTokenMatch = statement.match(/^([A-Za-z_]+)/);
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
    // Check if it's an assignment like PRAGMA x = y
    if (statement.includes('=')) {
      return {
        isSafe: false,
        reason: 'Modifying PRAGMA statements are not allowed in Read-Only mode.',
      };
    }

    const pragmaMatch = statement.match(/^PRAGMA\s+([A-Za-z0-9_]+)/i);
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

  // Must be one of SELECT, WITH, EXPLAIN, PRAGMA
  if (!['SELECT', 'WITH', 'EXPLAIN', 'PRAGMA'].includes(firstToken)) {
    return {
      isSafe: false,
      reason: `Statement starting with "${firstToken}" is not supported. Only SELECT, WITH, EXPLAIN, and read-only PRAGMA queries are allowed.`,
    };
  }

  return { isSafe: true };
}
