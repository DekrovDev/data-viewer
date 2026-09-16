export type CellData = null | number | string | Uint8Array;

// ─── Overview ──────────────────────────────────────────────────────────────────

export interface DatabaseOverviewInfo {
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  sqliteVersion: string;
  pageSize: number;
  pageCount: number;
  encoding: string;
  userVersion: number;
  applicationId: number;
  tableCount: number;
  viewCount: number;
  indexCount: number;
  triggerCount: number;
}

// ─── Schema ────────────────────────────────────────────────────────────────────

export interface SchemaItem {
  type: 'table' | 'view' | 'index' | 'trigger';
  name: string;
  tbl_name: string;
  sql: string | null;
  /** For tables: approximate row count */
  rowCount?: number;
}

export interface DatabaseSchema {
  tables: SchemaItem[];
  views: SchemaItem[];
  indexes: SchemaItem[];
  triggers: SchemaItem[];
}

// ─── Table Structure ───────────────────────────────────────────────────────────

export interface ColumnMeta {
  cid: number;
  name: string;
  type: string;
  notnull: 0 | 1;
  dflt_value: string | null;
  pk: number; // 0 = not PK, 1+ = PK position (composite support)
}

export interface ForeignKeyMeta {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
  match: string;
}

export interface IndexMeta {
  name: string;
  unique: 0 | 1;
  origin: string;
  partial: 0 | 1;
  columns?: string[];
  sql?: string;
}

export interface TableStructure {
  columns: ColumnMeta[];
  foreignKeys: ForeignKeyMeta[];
  indexes: IndexMeta[];
  sql?: string | null; // DDL definition
}

// ─── Query ─────────────────────────────────────────────────────────────────────

export interface TableQueryOptions {
  tableName: string;
  page: number;
  pageSize: number;
  sortColumn?: string;
  sortDirection?: 'ASC' | 'DESC';
  filterColumn?: string;
  filterValue?: string;
}

export interface TableQueryResult {
  columns: string[];
  rows: CellData[][];
  totalRows: number;
  totalPages: number;
  page: number;
  pageSize: number;
  durationMs: number;
}

export interface SqlQueryResult {
  columns: string[];
  rows: CellData[][];
  rowCount: number;
  truncated: boolean;
  durationMs: number;
  sql: string;
}

// ─── Legacy alias for backward compatibility ────────────────────────────────────

/** @deprecated Use DatabaseOverviewInfo */
export type DatabaseOverview = DatabaseOverviewInfo;

export type SqliteTab = 'overview' | 'table' | 'console';
export type TableTab = 'data' | 'structure' | 'foreign_keys' | 'indexes';
