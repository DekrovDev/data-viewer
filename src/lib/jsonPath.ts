import { JsonPathSegment } from '../types/json';

const RESERVED_WORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
  'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
  'for', 'function', 'if', 'import', 'in', 'instanceof', 'new',
  'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
  'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'enum',
  'await', 'null', 'true', 'false', 'undefined', 'NaN', 'Infinity'
]);

const IDENTIFIER_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

/**
 * Checks if a string key is a safe, valid JavaScript identifier
 * that can be accessed with dot notation.
 */
export function isValidIdentifier(key: string): boolean {
  if (typeof key !== 'string' || key.length === 0) return false;
  if (RESERVED_WORDS.has(key)) return false;
  return IDENTIFIER_REGEX.test(key);
}

/**
 * Formats a key for bracket notation with proper JSON string escaping.
 * e.g. 'some "quoted" key' -> '["some \"quoted\" key"]'
 */
export function formatBracketKey(key: string): string {
  return `[${JSON.stringify(key)}]`;
}

/**
 * Builds a safe, unambiguous path string for a sequence of path segments.
 * 
 * Examples:
 *   ['user', 'profile', 'name'] -> 'user.profile.name'
 *   ['users', 3, 'email'] -> 'users[3].email'
 *   ['hello.world', 'some key'] -> '["hello.world"]["some key"]'
 *   [0, 'id'] -> '[0].id'
 *   ['items', 0, 'meta.data'] -> 'items[0]["meta.data"]'
 */
export function formatJsonPath(segments: JsonPathSegment[]): string {
  if (!segments || segments.length === 0) {
    return '$';
  }

  let result = '';

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (typeof seg === 'number') {
      result += `[${seg}]`;
    } else {
      const isIdentifier = isValidIdentifier(seg);

      if (i === 0) {
        if (isIdentifier) {
          result += seg;
        } else {
          result += formatBracketKey(seg);
        }
      } else {
        if (isIdentifier) {
          result += `.${seg}`;
        } else {
          result += formatBracketKey(seg);
        }
      }
    }
  }

  return result;
}
