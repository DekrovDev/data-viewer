import { useState, useCallback, useEffect } from 'react';
import { SqlQueryResult } from '../types/sqlite';
import { getSqliteClient } from '../worker/sqliteClient';
import { toast } from 'sonner';

const SQL_HISTORY_KEY = 'data_viewer_sql_history_v1';
const MAX_HISTORY = 20;

export function useSqlQuery(defaultSql: string = 'SELECT * FROM users LIMIT 50;') {
  const [sql, setSql] = useState<string>(defaultSql);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [result, setResult] = useState<SqlQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(SQL_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.slice(0, MAX_HISTORY);
      }
    } catch {
      // Ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(SQL_HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Ignore
    }
  }, [history]);

  const client = getSqliteClient();

  const runQuery = useCallback(async (queryToRun?: string) => {
    const targetSql = (queryToRun !== undefined ? queryToRun : sql).trim();
    if (!targetSql) {
      toast.error('Query is empty');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const res = await client.executeQuery(targetSql);
      setResult(res);

      // Add to history if unique at top
      setHistory((prev) => {
        const filtered = prev.filter((item) => item !== targetSql);
        return [targetSql, ...filtered].slice(0, MAX_HISTORY);
      });

      if (res.truncated) {
        toast.info(`Query executed in ${res.durationMs} ms. Showing first ${res.rows.length.toLocaleString()} rows (result truncated).`);
      } else {
        toast.success(`Query returned ${res.rowCount} row${res.rowCount === 1 ? '' : 's'} in ${res.durationMs} ms`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error executing query';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsExecuting(false);
    }
  }, [sql, client]);

  const cancelQuery = useCallback(() => {
    client.reset();
    setIsExecuting(false);
    setError('Query was cancelled by user.');
    toast.info('Query execution cancelled');
  }, [client]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(SQL_HISTORY_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    sql,
    setSql,
    isExecuting,
    result,
    error,
    history,
    runQuery,
    cancelQuery,
    clearHistory,
  };
}
