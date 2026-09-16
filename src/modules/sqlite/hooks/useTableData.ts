import { useState, useEffect, useCallback, useRef } from 'react';
import { TableQueryResult, TableStructure } from '../types/sqlite';
import { getSqliteClient } from '../worker/sqliteClient';
import { toast } from 'sonner';

export function useTableData(tableName: string | null) {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(100);
  const [sortColumn, setSortColumn] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC' | undefined>(undefined);
  const [filterColumn, setFilterColumn] = useState<string | undefined>(undefined);
  const [filterValue, setFilterValue] = useState<string>('');
  const [debouncedFilterValue, setDebouncedFilterValue] = useState<string>('');

  const [data, setData] = useState<TableQueryResult | null>(null);
  const [structure, setStructure] = useState<TableStructure | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const filterTimerRef = useRef<number | null>(null);
  const client = getSqliteClient();

  // Reset pagination & filters on table change
  useEffect(() => {
    setPage(1);
    setSortColumn(undefined);
    setSortDirection(undefined);
    setFilterColumn(undefined);
    setFilterValue('');
    setDebouncedFilterValue('');
    setData(null);
    setStructure(null);
    setError(null);
  }, [tableName]);

  // Debounce filter input
  useEffect(() => {
    if (filterTimerRef.current !== null) {
      window.clearTimeout(filterTimerRef.current);
    }

    filterTimerRef.current = window.setTimeout(() => {
      setDebouncedFilterValue(filterValue);
      setPage(1); // Return to first page on new filter
    }, 250);

    return () => {
      if (filterTimerRef.current !== null) {
        window.clearTimeout(filterTimerRef.current);
      }
    };
  }, [filterValue]);

  // Fetch structure
  useEffect(() => {
    if (!tableName) return;
    let isCancelled = false;

    client.getTableStructure(tableName)
      .then((struct) => {
        if (!isCancelled) {
          setStructure(struct);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('Failed to load table structure:', err);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [tableName, client]);

  // Fetch rows
  const fetchRows = useCallback(async () => {
    if (!tableName) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await client.getTableRows({
        tableName,
        page,
        pageSize,
        sortColumn,
        sortDirection,
        filterColumn,
        filterValue: debouncedFilterValue,
      });

      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching table rows';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [tableName, page, pageSize, sortColumn, sortDirection, filterColumn, debouncedFilterValue, client]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const toggleSort = useCallback((columnName: string) => {
    if (sortColumn !== columnName) {
      setSortColumn(columnName);
      setSortDirection('ASC');
    } else if (sortDirection === 'ASC') {
      setSortDirection('DESC');
    } else {
      setSortColumn(undefined);
      setSortDirection(undefined);
    }
    setPage(1);
  }, [sortColumn, sortDirection]);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    sortColumn,
    sortDirection,
    toggleSort,
    filterColumn,
    setFilterColumn,
    filterValue,
    setFilterValue,
    data,
    structure,
    isLoading,
    error,
    refresh: fetchRows,
  };
}
