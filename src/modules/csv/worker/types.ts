import {
  CsvDelimiter,
  CsvHeaderMode,
  CsvSort,
  CsvFilter,
} from '../types/csv';

export type CsvWorkerRequestType =
  | 'LOAD_CSV'
  | 'GET_OVERVIEW'
  | 'GET_COLUMNS'
  | 'GET_ROWS'
  | 'GET_COLUMN_STATS'
  | 'CHANGE_CONFIG'
  | 'EXPORT_DATA'
  | 'CLOSE_CSV';

export interface CsvWorkerRequest<T = any> {
  id: string;
  type: CsvWorkerRequestType;
  payload?: T;
}

export interface CsvWorkerResponse<T = any> {
  id: string;
  ok: boolean;
  data?: T;
  error?: string;
}

export interface LoadCsvPayload {
  rawText: string;
  filename: string;
  delimiter?: CsvDelimiter;
  headerMode?: CsvHeaderMode;
}

export interface ChangeConfigPayload {
  delimiter?: CsvDelimiter;
  headerMode?: CsvHeaderMode;
}

export interface GetColumnStatsPayload {
  columnId: string;
}

export interface ExportDataPayload {
  format: 'csv' | 'json';
  search?: string;
  filters?: CsvFilter[];
  sort?: CsvSort | null;
}
