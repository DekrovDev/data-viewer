import {
  CsvWorkerRequest,
  CsvWorkerResponse,
  CsvWorkerRequestType,
  LoadCsvPayload,
  ChangeConfigPayload,
  ExportDataPayload,
} from './types';
import {
  CsvOverviewInfo,
  CsvColumn,
  CsvQueryResult,
  CsvQueryOptions,
  CsvColumnStats,
  CsvDelimiter,
  CsvHeaderMode,
  CsvFilter,
  CsvSort,
} from '../types/csv';

export class CsvClient {
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (data: any) => void;
      reject: (error: Error) => void;
    }
  >();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (this.worker) {
      this.worker.terminate();
    }

    this.worker = new Worker(
      new URL('./csv.worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (event: MessageEvent<CsvWorkerResponse>) => {
      const { id, ok, data, error } = event.data;
      const pending = this.pendingRequests.get(id);
      if (!pending) return;

      this.pendingRequests.delete(id);

      if (ok) {
        pending.resolve(data);
      } else {
        pending.reject(new Error(error || 'CSV Worker request failed'));
      }
    };

    this.worker.onerror = (err) => {
      console.error('CSV Worker encountered an error:', err);
      for (const [, { reject }] of this.pendingRequests) {
        reject(new Error('CSV Worker encountered an unhandled error.'));
      }
      this.pendingRequests.clear();
    };
  }

  private send<T = any>(type: CsvWorkerRequestType, payload?: any): Promise<T> {
    if (!this.worker) {
      this.initWorker();
    }

    const id = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    const request: CsvWorkerRequest = { id, type, payload };

    return new Promise<T>((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.worker!.postMessage(request);
    });
  }

  public loadCsv(
    rawText: string,
    filename: string,
    delimiter?: CsvDelimiter,
    headerMode?: CsvHeaderMode
  ): Promise<{ overview: CsvOverviewInfo; columns: CsvColumn[] }> {
    const payload: LoadCsvPayload = { rawText, filename, delimiter, headerMode };
    return this.send('LOAD_CSV', payload);
  }

  public getOverview(): Promise<CsvOverviewInfo> {
    return this.send('GET_OVERVIEW');
  }

  public getColumns(): Promise<CsvColumn[]> {
    return this.send('GET_COLUMNS');
  }

  public getRows(options: CsvQueryOptions): Promise<CsvQueryResult> {
    return this.send('GET_ROWS', options);
  }

  public getColumnStats(columnId: string): Promise<CsvColumnStats> {
    return this.send('GET_COLUMN_STATS', { columnId });
  }

  public changeConfig(
    delimiter?: CsvDelimiter,
    headerMode?: CsvHeaderMode
  ): Promise<{ overview: CsvOverviewInfo; columns: CsvColumn[] }> {
    const payload: ChangeConfigPayload = { delimiter, headerMode };
    return this.send('CHANGE_CONFIG', payload);
  }

  public exportData(
    format: 'csv' | 'json',
    search?: string,
    filters?: CsvFilter[],
    sort?: CsvSort | null
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    const payload: ExportDataPayload = { format, search, filters, sort };
    return this.send('EXPORT_DATA', payload);
  }

  public closeCsv(): Promise<void> {
    return this.send('CLOSE_CSV');
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

let globalCsvClient: CsvClient | null = null;

export function getCsvClient(): CsvClient {
  if (!globalCsvClient) {
    globalCsvClient = new CsvClient();
  }
  return globalCsvClient;
}
