

export type WorkerRequestType = 
  | 'OPEN_DATABASE'
  | 'CLOSE_DATABASE'
  | 'GET_OVERVIEW'
  | 'GET_SCHEMA'
  | 'GET_TABLE_STRUCTURE'
  | 'GET_TABLE_ROWS'
  | 'GET_ROW_COUNT'
  | 'EXECUTE_QUERY';

export interface WorkerRequest<T = any> {
  id: string;
  type: WorkerRequestType;
  payload: T;
}

export interface WorkerResponse<T = any> {
  id: string;
  ok: boolean;
  data?: T;
  error?: string;
}

export interface OpenDatabasePayload {
  buffer: ArrayBuffer;
  filename: string;
}

export interface TableNamePayload {
  tableName: string;
}

export interface ExecuteQueryPayload {
  sql: string;
}
