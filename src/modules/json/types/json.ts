export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonArray = JsonValue[];

export interface JsonStats {
  sizeBytes: number;
  lineCount: number;
  keyCount: number;
  objectCount: number;
  arrayCount: number;
  primitiveCount: number;
  maxDepth: number;
}

export interface ParseSuccess {
  isValid: true;
  data: JsonValue;
  stats: JsonStats;
  rawText: string;
}

export interface ParseError {
  isValid: false;
  error: string;
  line?: number;
  column?: number;
  position?: number;
  rawText: string;
}

export type ParseResult = ParseSuccess | ParseError;

export type JsonPathSegment = string | number;

export interface SearchMatch {
  id: string;
  path: JsonPathSegment[];
  formattedPath: string;
  type: 'key' | 'value';
  valueStr: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  sizeBytes: number;
  preview: string;
  content: string;
}

export type ViewMode = 'tree' | 'pretty' | 'raw';
