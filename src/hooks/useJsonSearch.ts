import { useState, useMemo, useCallback } from 'react';
import { JsonValue, SearchMatch, JsonPathSegment } from '../types/json';
import { formatJsonPath } from '../lib/jsonPath';

export function useJsonSearch(data: JsonValue | undefined) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  // Traverse data and collect all search matches
  const matches = useMemo<SearchMatch[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query || data === undefined) {
      return [];
    }

    const results: SearchMatch[] = [];

    function searchRecursive(val: JsonValue, currentPath: JsonPathSegment[]) {
      if (val === null) {
        if ('null'.includes(query)) {
          results.push({
            id: `${formatJsonPath(currentPath)}:val`,
            path: currentPath,
            formattedPath: formatJsonPath(currentPath),
            type: 'value',
            valueStr: 'null',
          });
        }
        return;
      }

      if (typeof val === 'boolean') {
        const str = String(val);
        if (str.toLowerCase().includes(query)) {
          results.push({
            id: `${formatJsonPath(currentPath)}:val`,
            path: currentPath,
            formattedPath: formatJsonPath(currentPath),
            type: 'value',
            valueStr: str,
          });
        }
        return;
      }

      if (typeof val === 'number') {
        const str = String(val);
        if (str.toLowerCase().includes(query)) {
          results.push({
            id: `${formatJsonPath(currentPath)}:val`,
            path: currentPath,
            formattedPath: formatJsonPath(currentPath),
            type: 'value',
            valueStr: str,
          });
        }
        return;
      }

      if (typeof val === 'string') {
        if (val.toLowerCase().includes(query)) {
          results.push({
            id: `${formatJsonPath(currentPath)}:val`,
            path: currentPath,
            formattedPath: formatJsonPath(currentPath),
            type: 'value',
            valueStr: val,
          });
        }
        return;
      }

      if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
          searchRecursive(val[i], [...currentPath, i]);
        }
        return;
      }

      if (typeof val === 'object') {
        for (const key of Object.keys(val)) {
          const keyPath = [...currentPath, key];
          // Check if key itself matches
          if (key.toLowerCase().includes(query)) {
            results.push({
              id: `${formatJsonPath(keyPath)}:key`,
              path: keyPath,
              formattedPath: formatJsonPath(keyPath),
              type: 'key',
              valueStr: key,
            });
          }
          // Recurse into object value
          searchRecursive(val[key], keyPath);
        }
      }
    }

    searchRecursive(data, []);
    return results;
  }, [data, searchQuery]);

  // Adjust match index if matches length changes
  const safeCurrentIndex = matches.length > 0
    ? Math.min(Math.max(0, currentMatchIndex), matches.length - 1)
    : 0;

  const nextMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  }, [matches.length]);

  const prevMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  }, [matches.length]);

  const activeMatch = matches[safeCurrentIndex];

  // Set of all ancestor paths for the active match to expand them
  const activeAncestors = useMemo<Set<string>>(() => {
    const ancestors = new Set<string>();
    if (!activeMatch) return ancestors;

    const path = activeMatch.path;
    // Ancestors are path prefixes up to path.length - 1
    for (let i = 1; i <= path.length; i++) {
      ancestors.add(formatJsonPath(path.slice(0, i)));
    }
    return ancestors;
  }, [activeMatch]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setCurrentMatchIndex(0);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    matches,
    currentMatchIndex: safeCurrentIndex,
    totalMatches: matches.length,
    activeMatch,
    activeAncestors,
    nextMatch,
    prevMatch,
    clearSearch,
  };
}
