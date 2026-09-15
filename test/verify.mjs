import assert from 'node:assert/strict';

// Test jsonPath logic
const RESERVED_WORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
  'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
  'for', 'function', 'if', 'import', 'in', 'instanceof', 'new',
  'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
  'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'enum',
  'await', 'null', 'true', 'false', 'undefined', 'NaN', 'Infinity'
]);

const IDENTIFIER_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

function isValidIdentifier(key) {
  if (typeof key !== 'string' || key.length === 0) return false;
  if (RESERVED_WORDS.has(key)) return false;
  return IDENTIFIER_REGEX.test(key);
}

function formatBracketKey(key) {
  return `[${JSON.stringify(key)}]`;
}

function formatJsonPath(segments) {
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

console.log('Testing Safe Path Builder...');

assert.equal(formatJsonPath([]), '$');
assert.equal(formatJsonPath(['user', 'profile', 'name']), 'user.profile.name');
assert.equal(formatJsonPath(['users', 3, 'email']), 'users[3].email');
assert.equal(formatJsonPath(['hello.world', 'some key']), '["hello.world"]["some key"]');
assert.equal(formatJsonPath([0, 'id']), '[0].id');
assert.equal(formatJsonPath(['items', 0, 'meta.data']), 'items[0]["meta.data"]');
assert.equal(formatJsonPath(['key with "quotes"']), '["key with \\"quotes\\""]');
assert.equal(formatJsonPath(['class', 'name']), '["class"].name');

console.log('All Safe Path tests passed! ✓');

// Test calculateJsonStats
function calculateJsonStats(data, rawText) {
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

  const stack = [[data, 1]];

  while (stack.length > 0) {
    const [current, depth] = stack.pop();
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

console.log('Testing Statistics Calculator...');

const testObj = {
  a: 1,
  b: "str",
  c: [true, false, null],
  d: {
    nested: 42
  }
};
const stats = calculateJsonStats(testObj, JSON.stringify(testObj, null, 2));

assert.equal(stats.objectCount, 2); // testObj + d
assert.equal(stats.arrayCount, 1); // c
assert.equal(stats.keyCount, 5); // a, b, c, d, nested
assert.equal(stats.primitiveCount, 6); // 1, "str", true, false, null, 42
assert.equal(stats.maxDepth, 3);

// Test primitives as root
assert.equal(calculateJsonStats(null, 'null').primitiveCount, 1);
assert.equal(calculateJsonStats(123, '123').primitiveCount, 1);
assert.equal(calculateJsonStats("hello", '"hello"').primitiveCount, 1);
assert.equal(calculateJsonStats(true, 'true').primitiveCount, 1);
assert.equal(calculateJsonStats([], '[]').arrayCount, 1);
assert.equal(calculateJsonStats({}, '{}').objectCount, 1);

console.log('All Statistics tests passed! ✓');
console.log('Verification successful!');
