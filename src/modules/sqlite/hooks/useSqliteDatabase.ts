import { useState, useCallback } from 'react';
import { DatabaseOverviewInfo, DatabaseSchema, SqliteTab } from '../types/sqlite';
import { getSqliteClient } from '../worker/sqliteClient';
import { toast } from 'sonner';

export function useSqliteDatabase() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<DatabaseOverviewInfo | null>(null);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [activeTab, setActiveTab] = useState<SqliteTab>('overview');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const client = getSqliteClient();

  const openDatabase = useCallback(async (buffer: ArrayBuffer, filename: string) => {
    setIsLoading(true);
    setLoadingMessage(`Opening ${filename}...`);
    setError(null);

    try {
      const result = await client.openDatabase(buffer, filename);
      setOverview(result.overview);
      setSchema(result.schema);
      setIsOpen(true);
      setActiveTab('overview');
      setSelectedTable(result.schema.tables.length > 0 ? result.schema.tables[0].name : null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to open SQLite database';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [client]);

  const closeDatabase = useCallback(async () => {
    try {
      await client.closeDatabase();
    } catch {
      // Ignore
    }
    setIsOpen(false);
    setOverview(null);
    setSchema(null);
    setSelectedTable(null);
    setActiveTab('overview');
    setError(null);
    toast.info('Database closed');
  }, [client]);

  const loadSample = useCallback(async () => {
    setIsLoading(true);
    setLoadingMessage('Downloading sample SQLite database...');
    setError(null);

    try {
      const res = await fetch('/sample.db');
      if (!res.ok) {
        throw new Error(`Failed to download sample database (HTTP ${res.status})`);
      }
      const buffer = await res.arrayBuffer();
      await openDatabase(buffer, 'sample.db');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading sample database';
      setError(msg);
      toast.error(msg);
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [openDatabase]);

  /**
   * Accepts Uint8Array (as used by App.tsx file-drop flow).
   */
  const loadDatabase = useCallback(async (bytes: Uint8Array, filename: string) => {
    await openDatabase(bytes.buffer as ArrayBuffer, filename);
  }, [openDatabase]);

  const selectEntity = useCallback((_type: 'table' | 'view', name: string) => {
    setSelectedTable(name);
    setActiveTab('table');
  }, []);

  return {
    isOpen,
    isLoading,
    loadingMessage,
    error,
    overview,
    schema,
    activeTab,
    setActiveTab,
    selectedTable,
    setSelectedTable,
    selectEntity,
    openDatabase,
    loadDatabase,
    closeDatabase,
    loadSample,
  };
}
