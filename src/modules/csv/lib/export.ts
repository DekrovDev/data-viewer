import { downloadFile } from '../../../core/files/file';

/**
 * Escapes a single string cell according to RFC 4180 standards for CSV.
 */
export function escapeCsvCell(val: string, delimiter = ','): string {
  if (val === null || val === undefined) return '';

  const str = String(val);
  const mustQuote =
    str.includes(delimiter) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r');

  if (mustQuote) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converts column headers and row arrays into a valid RFC 4180 CSV string.
 */
export function rowsToCsv(columns: string[], rows: string[][], delimiter = ','): string {
  const headerLine = columns.map((col) => escapeCsvCell(col, delimiter)).join(delimiter);
  const dataLines = rows.map((row) =>
    columns.map((_, colIdx) => escapeCsvCell(row[colIdx] ?? '', delimiter)).join(delimiter)
  );

  return [headerLine, ...dataLines].join('\r\n');
}

/**
 * Converts column headers and row arrays into a formatted JSON string (array of objects).
 * Handles duplicate column headers safely by appending index suffix if collision occurs.
 */
export function rowsToJson(columns: string[], rows: string[][]): string {
  // Deduplicate column keys for valid JSON object keys
  const keyMap = new Map<string, number>();
  const safeKeys = columns.map((name) => {
    const base = name || 'column';
    const count = keyMap.get(base) || 0;
    keyMap.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });

  const records = rows.map((row) => {
    const obj: Record<string, string> = {};
    for (let i = 0; i < safeKeys.length; i++) {
      obj[safeKeys[i]] = row[i] ?? '';
    }
    return obj;
  });

  return JSON.stringify(records, null, 2);
}

/**
 * Exports data as a CSV file download.
 */
export function exportToCsv(
  columns: string[],
  rows: string[][],
  filename = 'export.csv',
  delimiter = ','
): void {
  const content = rowsToCsv(columns, rows, delimiter);
  downloadFile(content, filename, 'text/csv;charset=utf-8');
}

/**
 * Exports data as a JSON file download.
 */
export function exportToJson(
  columns: string[],
  rows: string[][],
  filename = 'export.json'
): void {
  const content = rowsToJson(columns, rows);
  downloadFile(content, filename, 'application/json;charset=utf-8');
}
