import { DataFormat } from './types';

/**
 * Detects the data format of a given file based on extension and MIME type.
 * Currently supports 'json', returns 'unknown' for unsupported formats.
 */
export function detectDataFormat(file: File): DataFormat {
  if (!file) return 'unknown';

  const name = file.name.toLowerCase();
  if (name.endsWith('.json')) {
    return 'json';
  }

  if (file.type === 'application/json') {
    return 'json';
  }

  // Fallback check for plain text files with json content will be handled in module
  return 'unknown';
}
