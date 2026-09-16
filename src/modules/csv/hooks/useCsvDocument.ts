import { useState, useCallback, useEffect } from 'react';
import { getCsvClient } from '../worker/csvClient';
import { CsvOverviewInfo, CsvColumn, CsvDelimiter, CsvHeaderMode } from '../types/csv';
import { toast } from 'sonner';

export function useCsvDocument(rawText: string | null, filename: string | null) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<CsvOverviewInfo | null>(null);
  const [columns, setColumns] = useState<CsvColumn[]>([]);

  const [selectedDelimiter, setSelectedDelimiter] = useState<CsvDelimiter>('auto');
  const [headerMode, setHeaderMode] = useState<CsvHeaderMode>('auto');

  const client = getCsvClient();

  const loadDocument = useCallback(
    async (
      text: string,
      fname: string,
      del: CsvDelimiter = 'auto',
      hMode: CsvHeaderMode = 'auto'
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await client.loadCsv(text, fname, del, hMode);
        setOverview(result.overview);
        setColumns(result.columns);
        setSelectedDelimiter(del);
        setHeaderMode(hMode);
        setIsOpen(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to parse CSV file';
        setError(msg);
        setIsOpen(false);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  // Auto-load when rawText and filename change
  useEffect(() => {
    if (rawText && filename) {
      loadDocument(rawText, filename, 'auto', 'auto');
    } else {
      setIsOpen(false);
      setOverview(null);
      setColumns([]);
    }
  }, [rawText, filename, loadDocument]);

  const changeDelimiter = useCallback(
    async (newDel: CsvDelimiter) => {
      if (!isOpen) return;
      setIsLoading(true);
      try {
        const result = await client.changeConfig(newDel, headerMode);
        setOverview(result.overview);
        setColumns(result.columns);
        setSelectedDelimiter(newDel);
        toast.success(`Delimiter changed to ${result.overview.delimiterName}`);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to update delimiter');
      } finally {
        setIsLoading(false);
      }
    },
    [client, isOpen, headerMode]
  );

  const toggleHeaderMode = useCallback(
    async (newMode: CsvHeaderMode) => {
      if (!isOpen) return;
      setIsLoading(true);
      try {
        const result = await client.changeConfig(selectedDelimiter, newMode);
        setOverview(result.overview);
        setColumns(result.columns);
        setHeaderMode(newMode);
        toast.success(`Header mode set to ${newMode === 'none' ? 'OFF' : 'ON'}`);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to toggle header');
      } finally {
        setIsLoading(false);
      }
    },
    [client, isOpen, selectedDelimiter]
  );

  const closeDocument = useCallback(async () => {
    try {
      await client.closeCsv();
    } catch {
      // ignore
    }
    setIsOpen(false);
    setOverview(null);
    setColumns([]);
    setError(null);
  }, [client]);

  return {
    isOpen,
    isLoading,
    error,
    overview,
    columns,
    selectedDelimiter,
    headerMode,
    changeDelimiter,
    toggleHeaderMode,
    closeDocument,
    reload: () => rawText && filename && loadDocument(rawText, filename, selectedDelimiter, headerMode),
  };
}
