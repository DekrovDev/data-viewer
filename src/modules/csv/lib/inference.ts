import { InferredColumnType, CsvColumnStats } from '../types/csv';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
const BOOLEAN_VALUES = new Set(['true', 'false', '1', '0', 'yes', 'no']);

/**
 * Tests if a single string represents a valid finite number.
 */
export function isNumericString(val: string): boolean {
  if (!val || val.trim() === '') return false;
  const num = Number(val);
  return !isNaN(num) && isFinite(num);
}

/**
 * Tests if a single string represents a boolean value.
 */
export function isBooleanString(val: string): boolean {
  return BOOLEAN_VALUES.has(val.trim().toLowerCase());
}

/**
 * Tests if a single string represents a valid date.
 */
export function isDateString(val: string): boolean {
  const trimmed = val.trim();
  if (!ISO_DATE_REGEX.test(trimmed)) return false;
  const timestamp = Date.parse(trimmed);
  return !isNaN(timestamp);
}

/**
 * Conservative sampling-based type inference for a column.
 * Samples up to maxSampleRows non-empty values.
 */
export function inferColumnType(values: string[], maxSampleRows = 200): InferredColumnType {
  let sampled = 0;
  let numCount = 0;
  let boolCount = 0;
  let dateCount = 0;
  let strCount = 0;

  for (let i = 0; i < values.length && sampled < maxSampleRows; i++) {
    const v = values[i];
    if (v === undefined || v === null || v.trim() === '') {
      continue;
    }

    sampled++;
    const trimmed = v.trim();

    if (isNumericString(trimmed)) {
      numCount++;
    } else if (isBooleanString(trimmed)) {
      boolCount++;
    } else if (isDateString(trimmed)) {
      dateCount++;
    } else {
      strCount++;
    }
  }

  if (sampled === 0) return 'empty';

  // If 90%+ of non-empty values match a specific type, classify as that type
  const threshold = sampled * 0.9;
  if (numCount >= threshold) return 'number';
  if (boolCount >= threshold) return 'boolean';
  if (dateCount >= threshold) return 'date';
  if (strCount >= threshold) return 'string';

  return 'mixed';
}

/**
 * Computes statistics for a column given its values.
 * Uses sampling if row count exceeds sampleLimit.
 */
export function computeColumnStats(
  columnId: string,
  columnName: string,
  inferredType: InferredColumnType,
  values: string[],
  sampleLimit = 50000
): CsvColumnStats {
  const totalCount = values.length;
  const isSampled = totalCount > sampleLimit;
  const targetValues = isSampled ? values.slice(0, sampleLimit) : values;

  let emptyCount = 0;
  let nonEmptyCount = 0;

  let minNum = Infinity;
  let maxNum = -Infinity;
  let sumNum = 0;
  let validNumCount = 0;

  let minLen = Infinity;
  let maxLen = -Infinity;

  const uniqueSet = new Set<string>();
  const trackUniques = targetValues.length <= 10000;

  for (const raw of targetValues) {
    if (raw === undefined || raw === null || raw === '') {
      emptyCount++;
      continue;
    }

    nonEmptyCount++;
    const trimmed = raw.trim();
    const len = raw.length;

    if (len < minLen) minLen = len;
    if (len > maxLen) maxLen = len;

    if (trackUniques && uniqueSet.size < 5000) {
      uniqueSet.add(raw);
    }

    if (inferredType === 'number' && isNumericString(trimmed)) {
      const n = Number(trimmed);
      if (n < minNum) minNum = n;
      if (n > maxNum) maxNum = n;
      sumNum += n;
      validNumCount++;
    }
  }

  // Scale empty count if sampled
  const effectiveEmptyCount = isSampled
    ? Math.round((emptyCount / targetValues.length) * totalCount)
    : emptyCount;
  const effectiveNonEmptyCount = totalCount - effectiveEmptyCount;

  const stats: CsvColumnStats = {
    columnId,
    columnName,
    type: inferredType,
    totalCount,
    nonEmptyCount: effectiveNonEmptyCount,
    emptyCount: effectiveEmptyCount,
    isSampled,
  };

  if (trackUniques) {
    stats.uniqueCount = uniqueSet.size;
  }

  if (inferredType === 'number' && validNumCount > 0) {
    stats.min = minNum;
    stats.max = maxNum;
    stats.avg = parseFloat((sumNum / validNumCount).toFixed(4));
  } else if (nonEmptyCount > 0) {
    stats.minLength = minLen === Infinity ? 0 : minLen;
    stats.maxLength = maxLen === -Infinity ? 0 : maxLen;
  }

  return stats;
}
