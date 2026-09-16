export type CsvDelimiter = ',' | ';' | '\t' | '|' | 'auto';

export type CsvHeaderMode = 'auto' | 'first_row' | 'none';

export type InferredColumnType = 'string' | 'number' | 'boolean' | 'date' | 'empty' | 'mixed';

export interface CsvColumn {
  id: string;            // Unique internal ID (e.g. col_0, col_1)
  name: string;          // Display name (from header or generated Column N)
  originalIndex: number; // Position in row array
  inferredType: InferredColumnType;
  sampleValues: string[];
}

export interface CsvOverviewInfo {
  filename: string;
  fileSize: number;
  fileSizeFormatted: string;
  totalRows: number;
  columnCount: number;
  detectedDelimiter: string;
  delimiterName: string;
  hasHeader: boolean;
  encoding: string;
  parseDurationMs: number;
  warnings: string[];
  inconsistentRowCount: number;
}

export type CsvFilterOperator =
  | 'contains'
  | 'equals'
  | 'not_equals'
  | 'is_empty'
  | 'is_not_empty'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte';

export interface CsvFilter {
  columnId: string;
  operator: CsvFilterOperator;
  value: string;
}

export interface CsvSort {
  columnId: string;
  direction: 'ASC' | 'DESC';
}

export interface CsvQueryOptions {
  search?: string;
  filters?: CsvFilter[];
  sort?: CsvSort | null;
  offset: number;
  limit: number;
}

export interface CsvQueryResult {
  rows: string[][];
  rowIndices: number[]; // 1-based original row numbers
  totalFilteredRows: number;
  offset: number;
  limit: number;
  durationMs: number;
}

export interface CsvColumnStats {
  columnId: string;
  columnName: string;
  type: InferredColumnType;
  totalCount: number;
  nonEmptyCount: number;
  emptyCount: number;
  uniqueCount?: number;
  min?: number | string;
  max?: number | string;
  avg?: number;
  minLength?: number;
  maxLength?: number;
  isSampled: boolean;
}
