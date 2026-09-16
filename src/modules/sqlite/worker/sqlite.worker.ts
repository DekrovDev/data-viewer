import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { 
  WorkerRequest, 
  WorkerResponse, 
  OpenDatabasePayload, 
  TableNamePayload, 
  ExecuteQueryPayload 
} from './types';
import { 
  DatabaseOverviewInfo, 
  DatabaseSchema, 
  TableStructure, 
  ColumnMeta, 
  ForeignKeyMeta, 
  IndexMeta, 
  TableQueryOptions, 
  TableQueryResult, 
  SqlQueryResult 
} from '../types/sqlite';
import { quoteIdentifier } from '../lib/identifiers';
import { validateReadOnlyQuery } from '../lib/safety';

let sqlite3Instance: any = null;
let activeDb: any = null;
let currentFileName = '';
let currentFileSize = 0;

const MAX_QUERY_ROWS = 5000;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Initializes sqlite3 WASM module once.
 */
async function getSqlite3() {
  if (sqlite3Instance) {
    return sqlite3Instance;
  }
  sqlite3Instance = await (sqlite3InitModule as (opts?: Record<string, unknown>) => Promise<any>)({
    print: console.log,
    printErr: console.error,
    locateFile: (file: string) => `/${file}`,
  });
  return sqlite3Instance;
}

/**
 * Closes currently open database and frees resources.
 */
function closeCurrentDatabase() {
  if (activeDb) {
    try { activeDb.close(); } catch (err) { console.warn('Error closing database:', err); }
    activeDb = null;
  }
  currentFileName = '';
  currentFileSize = 0;
}

/**
 * Helper to fetch a single scalar value from a query.
 */
function getScalar<T = any>(db: any, sql: string, defaultValue: T): T {
  try {
    const rows: any[] = [];
    db.exec({ sql, rowMode: 'array', resultRows: rows });
    if (rows.length > 0 && rows[0].length > 0) return rows[0][0] as T;
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Builds the DatabaseOverviewInfo metadata object using PRAGMAs.
 */
function buildOverview(db: any, fileName: string, fileSizeBytes: number): DatabaseOverviewInfo {
  const sqlite = sqlite3Instance;
  const version = sqlite?.version?.libVersion || getScalar(db, 'SELECT sqlite_version()', '3.x');
  const pageSize  = Number(getScalar(db, 'PRAGMA page_size;', 4096));
  const pageCount = Number(getScalar(db, 'PRAGMA page_count;', 0));
  const encoding  = String(getScalar(db, 'PRAGMA encoding;', 'UTF-8'));
  const userVersion   = Number(getScalar(db, 'PRAGMA user_version;', 0));
  const applicationId = Number(getScalar(db, 'PRAGMA application_id;', 0));

  const tableCount   = Number(getScalar(db, "SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';", 0));
  const viewCount    = Number(getScalar(db, "SELECT count(*) FROM sqlite_master WHERE type='view';", 0));
  const indexCount   = Number(getScalar(db, "SELECT count(*) FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%';", 0));
  const triggerCount = Number(getScalar(db, "SELECT count(*) FROM sqlite_master WHERE type='trigger';", 0));

  return {
    fileName,
    fileSizeBytes,
    fileSizeFormatted: formatBytes(fileSizeBytes),
    sqliteVersion: version,
    pageSize,
    pageCount,
    encoding,
    userVersion,
    applicationId,
    tableCount,
    viewCount,
    indexCount,
    triggerCount,
  };
}

/**
 * Fetches the database schema (tables, views, indexes, triggers) with row counts for tables.
 */
function getSchema(db: any): DatabaseSchema {
  const rows: any[] = [];
  db.exec({
    sql: "SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name COLLATE NOCASE;",
    rowMode: 'object',
    resultRows: rows,
  });

  const schema: DatabaseSchema = { tables: [], views: [], indexes: [], triggers: [] };

  for (const item of rows) {
    if (item.type === 'table') {
      const rowCount = Number(getScalar(db, `SELECT count(*) FROM ${quoteIdentifier(item.name)};`, 0));
      schema.tables.push({ ...item, rowCount });
    } else if (item.type === 'view') {
      schema.views.push(item);
    } else if (item.type === 'index') {
      schema.indexes.push(item);
    } else if (item.type === 'trigger') {
      schema.triggers.push(item);
    }
  }

  return schema;
}

/**
 * Fetches column, foreign key, and index metadata for a specific table.
 */
function getTableStructure(db: any, tableName: string): TableStructure {
  const quoted = quoteIdentifier(tableName);

  // 1. Columns
  const colRows: any[] = [];
  db.exec({ sql: `PRAGMA table_info(${quoted});`, rowMode: 'object', resultRows: colRows });

  const columns: ColumnMeta[] = colRows.map((r) => ({
    cid: Number(r.cid),
    name: String(r.name),
    type: String(r.type || ''),
    notnull: (Number(r.notnull) === 1 ? 1 : 0) as 0 | 1,
    dflt_value: r.dflt_value !== null ? String(r.dflt_value) : null,
    pk: Number(r.pk),
  }));

  // 2. Foreign Keys
  const fkRows: any[] = [];
  try {
    db.exec({ sql: `PRAGMA foreign_key_list(${quoted});`, rowMode: 'object', resultRows: fkRows });
  } catch { /* Ignore if not supported */ }

  const foreignKeys: ForeignKeyMeta[] = fkRows.map((r) => ({
    id: Number(r.id),
    seq: Number(r.seq),
    table: String(r.table),
    from: String(r.from),
    to: String(r.to),
    on_update: String(r.on_update || 'NO ACTION'),
    on_delete: String(r.on_delete || 'NO ACTION'),
    match: String(r.match || 'NONE'),
  }));

  // 3. Indexes
  const idxRows: any[] = [];
  try {
    db.exec({ sql: `PRAGMA index_list(${quoted});`, rowMode: 'object', resultRows: idxRows });
  } catch { /* Ignore */ }

  const indexes: IndexMeta[] = idxRows.map((idx) => {
    const idxQuoted = quoteIdentifier(idx.name);
    const infoRows: any[] = [];
    try {
      db.exec({ sql: `PRAGMA index_info(${idxQuoted});`, rowMode: 'object', resultRows: infoRows });
    } catch { /* Ignore */ }

    const idxCols = infoRows.map((info) => String(info.name));
    const sql = getScalar<string | null>(
      db,
      `SELECT sql FROM sqlite_master WHERE type='index' AND name=${JSON.stringify(idx.name)};`,
      null
    );

    return {
      name: String(idx.name),
      unique: (Number(idx.unique) === 1 ? 1 : 0) as 0 | 1,
      origin: String(idx.origin || 'c'),
      partial: (Number(idx.partial) === 1 ? 1 : 0) as 0 | 1,
      columns: idxCols,
      sql: sql || undefined,
    };
  });

  // 4. DDL SQL
  const tableSql = getScalar<string | null>(
    db,
    `SELECT sql FROM sqlite_master WHERE type IN ('table', 'view') AND name=${JSON.stringify(tableName)};`,
    null
  );

  return { columns, foreignKeys, indexes, sql: tableSql };
}

/**
 * Main message handler inside Worker.
 */
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = event.data;

  try {
    const sqlite = await getSqlite3();

    switch (type) {
      case 'OPEN_DATABASE': {
        const { buffer, filename } = payload as OpenDatabasePayload;
        closeCurrentDatabase();

        const bytes = new Uint8Array(buffer);
        const p = sqlite.wasm.allocFromTypedArray(bytes);
        const db = new sqlite.oo1.DB();

        const deserializeFlags = sqlite.capi.SQLITE_DESERIALIZE_FREEONCLOSE;
        const rc = sqlite.capi.sqlite3_deserialize(
          db.pointer, 'main', p,
          bytes.byteLength, bytes.byteLength,
          deserializeFlags
        );
        db.checkRc(rc);

        activeDb = db;
        currentFileName = filename;
        currentFileSize = bytes.byteLength;

        const overview = buildOverview(activeDb, currentFileName, currentFileSize);
        const schema   = getSchema(activeDb);

        self.postMessage({ id, ok: true, data: { overview, schema } } as WorkerResponse);
        break;
      }

      case 'CLOSE_DATABASE': {
        closeCurrentDatabase();
        self.postMessage({ id, ok: true } as WorkerResponse);
        break;
      }

      case 'GET_OVERVIEW': {
        if (!activeDb) throw new Error('No database is currently open');
        const overview = buildOverview(activeDb, currentFileName, currentFileSize);
        self.postMessage({ id, ok: true, data: overview } as WorkerResponse);
        break;
      }

      case 'GET_SCHEMA': {
        if (!activeDb) throw new Error('No database is currently open');
        self.postMessage({ id, ok: true, data: getSchema(activeDb) } as WorkerResponse);
        break;
      }

      case 'GET_TABLE_STRUCTURE': {
        if (!activeDb) throw new Error('No database is currently open');
        const { tableName } = payload as TableNamePayload;
        const structure = getTableStructure(activeDb, tableName);
        self.postMessage({ id, ok: true, data: structure } as WorkerResponse);
        break;
      }

      case 'GET_ROW_COUNT': {
        if (!activeDb) throw new Error('No database is currently open');
        const { tableName } = payload as TableNamePayload;
        const count = Number(getScalar(activeDb, `SELECT COUNT(*) FROM ${quoteIdentifier(tableName)};`, 0));
        self.postMessage({ id, ok: true, data: count } as WorkerResponse);
        break;
      }

      case 'GET_TABLE_ROWS': {
        if (!activeDb) throw new Error('No database is currently open');
        const options = payload as TableQueryOptions;
        const { tableName, page, pageSize, sortColumn, sortDirection, filterColumn, filterValue } = options;

        const quotedTable = quoteIdentifier(tableName);
        const binds: any[] = [];
        let whereClause = '';

        if (filterColumn && filterValue && filterValue.trim()) {
          whereClause = ` WHERE ${quoteIdentifier(filterColumn)} LIKE ? `;
          binds.push(`%${filterValue.trim()}%`);
        }

        // 1. Total filtered row count
        const countRows: any[] = [];
        activeDb.exec({
          sql: `SELECT COUNT(*) FROM ${quotedTable}${whereClause};`,
          bind: binds.length > 0 ? [...binds] : undefined,
          rowMode: 'array',
          resultRows: countRows,
        });
        const totalRows  = countRows.length > 0 ? Number(countRows[0][0]) : 0;
        const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

        // 2. Fetch page rows
        let orderClause = '';
        if (sortColumn) {
          const dir = sortDirection === 'DESC' ? 'DESC' : 'ASC';
          orderClause = ` ORDER BY ${quoteIdentifier(sortColumn)} ${dir} `;
        }

        const offset = Math.max(0, (page - 1) * pageSize);
        const dataBinds = [...binds, pageSize, offset];

        const columns: string[] = [];
        const rows: any[][] = [];

        const start = performance.now();
        activeDb.exec({
          sql: `SELECT * FROM ${quotedTable}${whereClause}${orderClause}LIMIT ? OFFSET ?;`,
          bind: dataBinds,
          rowMode: 'array',
          columnNames: columns,
          resultRows: rows,
        });
        const durationMs = Math.round(performance.now() - start);

        const result: TableQueryResult = { columns, rows, totalRows, totalPages, page, pageSize, durationMs };
        self.postMessage({ id, ok: true, data: result } as WorkerResponse);
        break;
      }

      case 'EXECUTE_QUERY': {
        if (!activeDb) throw new Error('No database is currently open');
        const { sql } = payload as ExecuteQueryPayload;

        // 1. Validate read-only in JS
        const validation = validateReadOnlyQuery(sql);
        if (!validation.isSafe) {
          throw new Error(validation.reason || 'Query validation failed');
        }

        // 2. Prepare & verify read-only via SQLite C API
        let stmt: any = null;
        try {
          stmt = activeDb.prepare(sql);
          if (sqlite.capi.sqlite3_stmt_readonly) {
            const isReadonly = Boolean(sqlite.capi.sqlite3_stmt_readonly(stmt.pointer));
            if (!isReadonly) {
              stmt.finalize();
              stmt = null;
              throw new Error('Query blocked: SQLite engine identified statement as modifying/not read-only.');
            }
          }
        } finally {
          if (stmt) stmt.finalize();
        }

        // 3. Execute with safety row cap
        const columns: string[] = [];
        const rows: any[][] = [];
        let rowCount = 0;
        let truncated = false;

        const start = performance.now();
        activeDb.exec({
          sql,
          rowMode: 'array',
          columnNames: columns,
          callback: (row: any[]) => {
            rowCount++;
            if (rows.length < MAX_QUERY_ROWS) {
              rows.push(row);
            } else {
              truncated = true;
            }
          },
        });
        const durationMs = Math.round(performance.now() - start);

        const result: SqlQueryResult = { columns, rows, rowCount, truncated, durationMs, sql };
        self.postMessage({ id, ok: true, data: result } as WorkerResponse);
        break;
      }

      default:
        throw new Error(`Unknown worker request type: ${type}`);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    self.postMessage({ id, ok: false, error: errorMsg } as WorkerResponse);
  }
};
