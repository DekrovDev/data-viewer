import { 
  WorkerRequest, 
  WorkerResponse, 
  WorkerRequestType 
} from './types';
import { 
  DatabaseOverviewInfo, 
  DatabaseSchema, 
  TableStructure, 
  TableQueryOptions, 
  TableQueryResult, 
  SqlQueryResult 
} from '../types/sqlite';

export class SqliteClient {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, {
    resolve: (data: any) => void;
    reject: (error: Error) => void;
  }>();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (this.worker) {
      this.worker.terminate();
    }

    this.worker = new Worker(
      new URL('./sqlite.worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { id, ok, data, error } = event.data;
      const pending = this.pendingRequests.get(id);
      if (!pending) return;

      this.pendingRequests.delete(id);

      if (ok) {
        pending.resolve(data);
      } else {
        pending.reject(new Error(error || 'Worker request failed'));
      }
    };

    this.worker.onerror = (err) => {
      console.error('SQLite Worker encountered an error:', err);
      // Reject all pending requests
      for (const [, { reject }] of this.pendingRequests) {
        reject(new Error('SQLite Worker encountered an unhandled error.'));
      }
      this.pendingRequests.clear();
    };
  }

  private send<T = any>(type: WorkerRequestType, payload?: any): Promise<T> {
    if (!this.worker) {
      this.initWorker();
    }

    const id = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    const request: WorkerRequest = { id, type, payload };

    return new Promise<T>((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.worker!.postMessage(request);
    });
  }

  public openDatabase(
    buffer: ArrayBuffer, 
    filename: string
  ): Promise<{ overview: DatabaseOverviewInfo; schema: DatabaseSchema }> {
    return this.send('OPEN_DATABASE', { buffer, filename });
  }

  public closeDatabase(): Promise<void> {
    return this.send('CLOSE_DATABASE');
  }

  public getOverview(): Promise<DatabaseOverviewInfo> {
    return this.send('GET_OVERVIEW');
  }

  public getSchema(): Promise<DatabaseSchema> {
    return this.send('GET_SCHEMA');
  }

  public getTableStructure(tableName: string): Promise<TableStructure> {
    return this.send('GET_TABLE_STRUCTURE', { tableName });
  }

  public getTableRowCount(tableName: string): Promise<number> {
    return this.send('GET_ROW_COUNT', { tableName });
  }

  public getTableRows(options: TableQueryOptions): Promise<TableQueryResult> {
    return this.send('GET_TABLE_ROWS', options);
  }

  public executeQuery(sql: string): Promise<SqlQueryResult> {
    return this.send('EXECUTE_QUERY', { sql });
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }

  public reset(): void {
    this.terminate();
    this.initWorker();
  }
}

// Global shared client instance for the session
let globalClient: SqliteClient | null = null;

export function getSqliteClient(): SqliteClient {
  if (!globalClient) {
    globalClient = new SqliteClient();
  }
  return globalClient;
}
