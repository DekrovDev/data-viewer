import { useState, useEffect, useCallback, useRef } from 'react';
import { ParseResult } from '../types/json';
import { parseJson, formatJson, minifyJson, SAMPLE_JSON } from '../lib/json';

const DEBOUNCE_MS = 250;

export function useJsonParser(initialValue: string = SAMPLE_JSON) {
  const [rawJson, setRawJson] = useState<string>(initialValue);
  const [parseResult, setParseResult] = useState<ParseResult>(() => parseJson(initialValue));
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // Debounced parsing when rawJson changes
  useEffect(() => {
    setIsParsing(true);

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      const result = parseJson(rawJson);
      setParseResult(result);
      setIsParsing(false);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [rawJson]);

  // Synchronous format action
  const format = useCallback((indent: number = 2): boolean => {
    try {
      const formatted = formatJson(rawJson, indent);
      setRawJson(formatted);
      setParseResult(parseJson(formatted));
      return true;
    } catch {
      return false;
    }
  }, [rawJson]);

  // Synchronous minify action
  const minify = useCallback((): boolean => {
    try {
      const minified = minifyJson(rawJson);
      setRawJson(minified);
      setParseResult(parseJson(minified));
      return true;
    } catch {
      return false;
    }
  }, [rawJson]);

  // Clear action
  const clear = useCallback(() => {
    setRawJson('');
    setParseResult(parseJson(''));
  }, []);

  // Load sample action
  const loadSample = useCallback(() => {
    setRawJson(SAMPLE_JSON);
    setParseResult(parseJson(SAMPLE_JSON));
  }, []);

  // Load file or custom content action
  const loadContent = useCallback((content: string) => {
    setRawJson(content);
    setParseResult(parseJson(content));
  }, []);

  return {
    rawJson,
    setRawJson,
    parseResult,
    isParsing,
    format,
    minify,
    clear,
    loadSample,
    loadContent,
  };
}
