/**
 * Safely quotes a SQLite identifier (table, column, index name)
 * using double quotes with standard escaping for internal quotes.
 * 
 * Examples:
 *   'users'        -> '"users"'
 *   'user data'    -> '"user data"'
 *   'foo"bar'      -> '"foo""bar"'
 *   'order'        -> '"order"'
 */
export function quoteIdentifier(identifier: string): string {
  if (typeof identifier !== 'string') {
    throw new Error(`Expected identifier string, got ${typeof identifier}`);
  }
  return `"${identifier.replace(/"/g, '""')}"`;
}
