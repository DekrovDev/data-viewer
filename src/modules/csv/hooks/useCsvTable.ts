import { useState, useCallback, useEffect, useRef } from 'react';
import { getCsvClient } from '../worker/csvClient';
import {
  CsvQueryResult,
  CsvFilter,
  CsvSort,
  CsvColumnStats,
} from '../types/csv';
import { downloadFile } from '../../../core/files/file';
import { toast } from 'sonner';

export function useCsvTable(isOpen: boolean, totalRows: number) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [filters, setFilters] = useState<CsvFilter[]>([]);
  const [sort, setSort] = useState<CsvSort | null>(null);

  const [data, setData] = useState<CsvQueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pagination / windowing for virtualized grid
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(1000); // chunk size for worker retrieval

  const client = getCsvClient();
  const searchTimeoutRef = useRef<number | null>(null);

  // Debounce search input (250ms)
  useEffect(() => {
    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = window.setTimeout(() => {
      setDebouncedSearch(search);
      setOffset(0); // Reset to top on search
    }, 250);

    return () => {
      if (searchTimeoutRef.current !== null) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // Fetch rows whenever search, filters, sort, offset, or limit change
  const fetchRows = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      const res = await client.getRows({
        search: debouncedSearch,
        filters,
        sort,
        offset,
        limit,
      });
      setData(res);
    } catch (err: unknown) {
      console.error('Failed to fetch CSV rows:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, debouncedSearch, filters, sort, offset, limit, client]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows, totalRows]);

  const toggleSort = useCallback((columnId: string) => {
    setSort((prev) => {
      if (!prev || prev.columnId !== columnId) {
        return { columnId, direction: 'ASC' };
      }
      if (prev.direction === 'ASC') {
        return { columnId, direction: 'DESC' };
      }
      return null;
    });
    setOffset(0);
  }, []);

  const addFilter = useCallback((filter: CsvFilter) => {
    setFilters((prev) => [...prev.filter((f) => f.columnId !== filter.columnId), filter]);
    setOffset(0);
  }, []);

  const removeFilter = useCallback((columnId: string) => {
    setFilters((prev) => prev.filter((f) => f.columnId !== columnId));
    setOffset(0);
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters([]);
    setOffset(0);
  }, []);

  const exportFiltered = useCallback(
    async (format: 'csv' | 'json') => {
      try {
        toast.loading(`Preparing ${format.toUpperCase()} export...`);
        const result = await client.exportData(format, debouncedSearch, filters, sort);
        downloadFile(result.content, result.filename, result.mimeType);
        toast.dismiss();
        toast.success(`Exported ${result.filename}`);
      } catch (err: unknown) {
        toast.dismiss();
        toast.error(err instanceof Error ? err.message : 'Export failed');
      }
    },
    [client, debouncedSearch, filters, sort]
  );

  const getColumnStats = useCallback(
    async (columnId: string): Promise<CsvColumnStats | null> => {
      try {
        return await client.getColumnStats(columnId);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to fetch column statistics');
        return null;
      }
    },
    [client]
  );

  return {
    search,
    setSearch,
    debouncedSearch,
    filters,
    addFilter,
    removeFilter,
    clearAllFilters,
    sort,
    toggleSort,
    data,
    isLoading,
    offset,
    setOffset,
    limit,
    setLimit,
    exportFiltered,
    getColumnStats,
    refetch: fetchRows,
  };
}
