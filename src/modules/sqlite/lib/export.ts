import { downloadFile } from '../../../core/files/file';
import { CellData } from '../types/sqlite';

/**
 * Safely escapes a single CSV cell value according to RFC 4180.
 */
export function escapeCsvCell(val: CellData | any): string {
  if (val === null || val === undefined) return '';
  if (val instanceof Uint8Array) return `"[BLOB ${val.byteLength} B]"`;
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts columns and rows into a CSV string (RFC 4180) and triggers download.
 */
export function exportToCsv(columns: string[], rows: CellData[][], filename = 'export.csv'): void {
  const header = columns.map(escapeCsvCell).join(',');
  const lines  = [header];
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(','));
  }
  const csv = lines.join('\r\n');
  downloadFile(csv, filename, 'text/csv;charset=utf-8');
}

/**
 * Converts columns and rows into a formatted JSON array of objects and triggers download.
 */
export function exportToJson(columns: string[], rows: CellData[][], filename = 'export.json'): void {
  const objects = rows.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      const val = row[i];
      obj[col] = val instanceof Uint8Array ? `[BLOB ${val.byteLength} B]` : val;
    });
    return obj;
  });
  const json = JSON.stringify(objects, null, 2);
  downloadFile(json, filename, 'application/json;charset=utf-8');
}
