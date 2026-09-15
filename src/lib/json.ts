import { JsonValue, ParseResult } from '../types/json';
import { calculateJsonStats } from './jsonStats';

/**
 * Extracts line and column numbers from character position in source text.
 */
export function getLineAndColumn(text: string, position: number): { line: number; column: number } {
  const safePos = Math.max(0, Math.min(position, text.length));
  const lines = text.slice(0, safePos).split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}

/**
 * Parses JSON safely with detailed error diagnostics (message, position, line, column).
 * Root values like null, booleans, numbers, strings, arrays, and objects are supported.
 */
export function parseJson(text: string): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Empty input',
      rawText: text,
    };
  }

  try {
    const data = JSON.parse(text) as JsonValue;
    const stats = calculateJsonStats(data, text);
    return {
      isValid: true,
      data,
      stats,
      rawText: text,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid JSON syntax';

    // V8 standard error format usually includes "at position X"
    const posMatch = message.match(/at position (\d+)/i);
    let line: number | undefined;
    let column: number | undefined;
    let position: number | undefined;

    if (posMatch && posMatch[1]) {
      position = parseInt(posMatch[1], 10);
      const loc = getLineAndColumn(text, position);
      line = loc.line;
      column = loc.column;
    } else {
      // Check for line / col patterns if available (e.g. Firefox or Safari)
      const lineColMatch = message.match(/line (\d+) column (\d+)/i);
      if (lineColMatch) {
        line = parseInt(lineColMatch[1], 10);
        column = parseInt(lineColMatch[2], 10);
      }
    }

    return {
      isValid: false,
      error: message,
      line,
      column,
      position,
      rawText: text,
    };
  }
}

/**
 * Formats JSON string with specified spaces indentation (default 2).
 */
export function formatJson(text: string, indent: number = 2): string {
  const parsed = JSON.parse(text);
  return JSON.stringify(parsed, null, indent);
}

/**
 * Minifies JSON string by removing extraneous whitespace.
 */
export function minifyJson(text: string): string {
  const parsed = JSON.parse(text);
  return JSON.stringify(parsed);
}

/**
 * Recursively sorts keys of all JSON objects alphabetically.
 * Does not alter array order or primitive values.
 */
export function sortJsonKeys(value: JsonValue): JsonValue {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sortJsonKeys);
  }

  const sortedObj: Record<string, JsonValue> = {};
  const sortedKeys = Object.keys(value).sort((a, b) => a.localeCompare(b));

  for (const key of sortedKeys) {
    sortedObj[key] = sortJsonKeys(value[key]);
  }

  return sortedObj;
}

/**
 * High-quality sample developer JSON for testing all features.
 */
export const SAMPLE_JSON = `{
  "app": {
    "name": "JSON Viewer",
    "version": "1.0.0",
    "build": 2048,
    "isProduction": true,
    "maintainedBy": null
  },
  "features": [
    "Interactive Tree Navigation",
    "Safe Path Generator",
    "Real-time Search",
    "Instant Format & Minify",
    "Deep Statistics Analysis"
  ],
  "performance": {
    "latencyMs": 1.42,
    "memoryAllocatedMb": 12.8,
    "cacheHitRatio": 0.985
  },
  "users": [
    {
      "id": 101,
      "username": "alex_dev",
      "email": "alex@example.com",
      "roles": ["admin", "developer"],
      "profile": {
        "verified": true,
        "avatarUrl": "https://avatar.dev/alex",
        "loginCount": 42
      }
    },
    {
      "id": 102,
      "username": "sophia_tech",
      "email": "sophia@example.com",
      "roles": ["developer"],
      "profile": {
        "verified": false,
        "avatarUrl": null,
        "loginCount": 7
      }
    }
  ],
  "nested.key.demonstration": {
    "hello.world": {
      "some key": "Bracket notation is used here safely!",
      "key with \\"quotes\\"": 42
    },
    "regularKey": "Dot notation works here"
  }
}`;
