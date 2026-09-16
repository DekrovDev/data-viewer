import { CsvDelimiter } from '../types/csv';

export const COMMON_DELIMITERS: Array<{ value: CsvDelimiter; label: string; char: string }> = [
  { value: 'auto', label: 'Auto Detect', char: '' },
  { value: ',', label: 'Comma (,)', char: ',' },
  { value: ';', label: 'Semicolon (;)', char: ';' },
  { value: '\t', label: 'Tab (⇥)', char: '\t' },
  { value: '|', label: 'Pipe (|)', char: '|' },
];

export function getDelimiterDisplayName(char: string): string {
  switch (char) {
    case ',':
      return 'Comma (,)';
    case ';':
      return 'Semicolon (;)';
    case '\t':
      return 'Tab (\\t)';
    case '|':
      return 'Pipe (|)';
    default:
      return char ? `Custom (${char})` : 'Unknown';
  }
}

/**
 * Fast delimiter detection on sample lines of text.
 * Examines counts across multiple lines to find the delimiter with the highest
 * and most uniform column count.
 */
export function detectDelimiter(text: string): string {
  const candidates = [',', ';', '\t', '|'];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 15);

  if (lines.length === 0) return ',';

  let bestDel = ',';
  let bestScore = -1;

  for (const del of candidates) {
    const counts = lines.map((line) => {
      // count outside double quotes
      let count = 0;
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === del && !inQuotes) {
          count++;
        }
      }
      return count;
    });

    const nonZeroCounts = counts.filter((c) => c > 0);
    if (nonZeroCounts.length === 0) continue;

    // Check consistency: how close is variance to 0?
    const first = nonZeroCounts[0];
    const isUniform = nonZeroCounts.every((c) => c === first);
    const avg = nonZeroCounts.reduce((a, b) => a + b, 0) / nonZeroCounts.length;

    // Higher score for uniform lines and more occurrences
    const score = (isUniform ? 1000 : 100) + avg * nonZeroCounts.length;

    if (score > bestScore) {
      bestScore = score;
      bestDel = del;
    }
  }

  return bestDel;
}
