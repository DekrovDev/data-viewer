import { DataFormat } from './types';

const SQLITE_MAGIC_HEADER = 'SQLite format 3\0';

/**
 * Checks whether the first 16 bytes of a file match the SQLite 3 header.
 */
export async function isSqliteFile(file: File): Promise<boolean> {
  if (!file || file.size < 16) return false;
  try {
    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < 16; i++) {
      if (bytes[i] !== SQLITE_MAGIC_HEADER.charCodeAt(i)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Detects the data format of a given file based on extension, MIME type,
 * and header magic bytes.
 */
export async function detectDataFormat(file: File): Promise<DataFormat> {
  if (!file) return 'unknown';

  const name = file.name.toLowerCase();

  // Fast JSON extension & MIME check
  if (name.endsWith('.json') || file.type === 'application/json') {
    return 'json';
  }

  // SQLite extension & MIME check
  if (
    name.endsWith('.db') ||
    name.endsWith('.sqlite') ||
    name.endsWith('.sqlite3') ||
    file.type === 'application/x-sqlite3' ||
    file.type === 'application/vnd.sqlite3'
  ) {
    const valid = await isSqliteFile(file);
    if (valid) return 'sqlite';
  }

  // CSV / TSV extension & MIME check
  if (
    name.endsWith('.csv') ||
    name.endsWith('.tsv') ||
    file.type === 'text/csv' ||
    file.type === 'text/tab-separated-values'
  ) {
    return 'csv';
  }

  // Fallback: Check magic bytes regardless of extension (for SQLite)
  if (file.size >= 16) {
    const valid = await isSqliteFile(file);
    if (valid) return 'sqlite';
  }

  return 'unknown';
}
