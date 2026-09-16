import { JsonStats, JsonValue } from '../types/json';
import { formatBytes } from '../../../shared/lib/formatters';

export { formatBytes };

/**
 * Calculates metrics and statistics for any parsed JSON value.
 * Uses an iterative depth traversal to prevent call stack overflow on deep JSON.
 */
export function calculateJsonStats(data: JsonValue, rawText: string): JsonStats {
  const sizeBytes = new TextEncoder().encode(rawText).length;
  const lineCount = rawText ? rawText.split('\n').length : 0;

  if (data === null || typeof data !== 'object') {
    return {
      sizeBytes,
      lineCount,
      keyCount: 0,
      objectCount: 0,
      arrayCount: 0,
      primitiveCount: 1,
      maxDepth: 1,
    };
  }

  let keyCount = 0;
  let objectCount = 0;
  let arrayCount = 0;
  let primitiveCount = 0;
  let maxDepth = 0;

  // Stack stores [currentValue, currentDepth]
  const stack: [JsonValue, number][] = [[data, 1]];

  while (stack.length > 0) {
    const [current, depth] = stack.pop()!;
    if (depth > maxDepth) {
      maxDepth = depth;
    }

    if (current === null) {
      primitiveCount++;
    } else if (Array.isArray(current)) {
      arrayCount++;
      for (let i = current.length - 1; i >= 0; i--) {
        stack.push([current[i], depth + 1]);
      }
    } else if (typeof current === 'object') {
      objectCount++;
      const keys = Object.keys(current);
      keyCount += keys.length;
      for (let i = keys.length - 1; i >= 0; i--) {
        const key = keys[i];
        stack.push([current[key], depth + 1]);
      }
    } else {
      primitiveCount++;
    }
  }

  return {
    sizeBytes,
    lineCount,
    keyCount,
    objectCount,
    arrayCount,
    primitiveCount,
    maxDepth,
  };
}
