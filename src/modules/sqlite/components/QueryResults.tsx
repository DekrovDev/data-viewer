import React from 'react';
import { SqlQueryResult } from '../types/sqlite';
import { DataTable } from './DataTable';
import { exportToCsv, exportToJson } from '../lib/export';
import { Download, AlertCircle, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface QueryResultsProps {
  result: SqlQueryResult | null;
  error: string | null;
  isExecuting: boolean;
}

export const QueryResults: React.FC<QueryResultsProps> = ({
  result,
  error,
  isExecuting,
}) => {
  const handleExportCsv = () => {
    if (!result || result.rows.length === 0) return;
    try {
      exportToCsv(result.columns, result.rows, 'query_result.csv');
      toast.success(`Exported ${result.rows.length.toLocaleString()} rows to CSV`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    }
  };

  const handleExportJson = () => {
    if (!result || result.rows.length === 0) return;
    try {
      exportToJson(result.columns, result.rows, 'query_result.json');
      toast.success(`Exported ${result.rows.length.toLocaleString()} rows to JSON`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    }
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-editor-bg">
        <div className="max-w-xl w-full p-4 rounded-lg bg-red-950/30 border border-red-800/50 text-red-200">
          <div className="flex items-center gap-2 font-semibold text-red-400 mb-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Query Execution Error</span>
          </div>
          <pre className="font-mono text-xs whitespace-pre-wrap text-red-300/90 bg-red-950/40 p-3 rounded border border-red-900/50 overflow-x-auto">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  if (isExecuting) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-editor-bg text-gray-400 space-y-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Executing query in Web Worker...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-editor-bg text-gray-500 text-sm">
        <Clock className="w-8 h-8 mb-2 opacity-40 text-gray-400" />
        <span>Execute a query above to see results</span>
        <span className="text-xs text-gray-600 mt-1">Press Ctrl+Enter (Cmd+Enter) to run</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-editor-bg">
      {/* Query Stats Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-editor-border bg-gray-900/80 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {result.rowCount.toLocaleString()} row{result.rowCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-gray-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span>{result.durationMs.toFixed(1)} ms</span>
          </div>

          {result.truncated && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/50 font-medium text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Result capped at 5,000 rows</span>
            </div>
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportCsv}
            disabled={result.rows.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors disabled:opacity-40"
            title="Export query results to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportJson}
            disabled={result.rows.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors disabled:opacity-40"
            title="Export query results to JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Virtualized Result Table */}
      <div className="flex-1 overflow-hidden">
        <DataTable
          columns={result.columns}
          rows={result.rows}
          totalRows={result.rowCount}
        />
      </div>
    </div>
  );
};
