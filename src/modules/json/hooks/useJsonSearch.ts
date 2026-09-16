import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { JsonValue, SearchMatch, JsonPathSegment } from '../types/json';
import { formatJsonPath } from '../lib/jsonPath';

const SEARCH_DEBOUNCE_MS = 250;

export function useJsonSearch(data: JsonValue | undefined) {
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  // Debounce search query input
  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setDebouncedQuery(searchInput);
      setCurrentMatchIndex(0);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [searchInput]);

  // Traverse data and collect search matches (only when debouncedQuery or data changes)
  const matches = useMemo<SearchMatch[]>(() => {
    const query = debouncedQuery.trim().toLowerCase();
    if (!query || data === undefined) {
      return [];
    }

    const results: SearchMatch[] = [];
    const MAX_MATCHES = 1000; // Cap search matches for extreme cases

    function searchRecursive(val: JsonValue, currentPath: JsonPathSegment[]) {
      if (results.length >= MAX_MATCHES) return;

      if (val === null) {
        if ('null'.includes(query)) {
          results.push({
            id: formatJsonPath(currentPath) + ':val',
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
            id: formatJsonPath(currentPath) + ':val',
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
            id: formatJsonPath(currentPath) + ':val',
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
            id: formatJsonPath(currentPath) + ':val',
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
          if (results.length >= MAX_MATCHES) break;
        }
        return;
      }

      if (typeof val === 'object') {
        for (const key of Object.keys(val)) {
          const keyPath = [...currentPath, key];
          // Check if key itself matches
          if (key.toLowerCase().includes(query)) {
            results.push({
              id: formatJsonPath(keyPath) + ':key',
              path: keyPath,
              formattedPath: formatJsonPath(keyPath),
              type: 'key',
              valueStr: key,
            });
          }
          // Recurse into object value
          searchRecursive(val[key], keyPath);
          if (results.length >= MAX_MATCHES) break;
        }
      }
    }

    searchRecursive(data, []);
    return results;
  }, [data, debouncedQuery]);

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

  // ONLY expand the ancestor path of the current active match!
  const activeAncestors = useMemo<Set<string>>(() => {
    const ancestors = new Set<string>();
    if (!activeMatch) return ancestors;

    const path = activeMatch.path;
    // Ancestors are path prefixes up to path.length
    for (let i = 1; i <= path.length; i++) {
      ancestors.add(formatJsonPath(path.slice(0, i)));
    }
    return ancestors;
  }, [activeMatch]);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    setDebouncedQuery('');
    setCurrentMatchIndex(0);
  }, []);

  return {
    searchQuery: searchInput,
    debouncedQuery,
    setSearchQuery: setSearchInput,
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
