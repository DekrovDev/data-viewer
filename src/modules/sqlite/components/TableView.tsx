import React, { useState } from 'react';
import { Table, FileText, Download, Database, Layers } from 'lucide-react';
import { useTableData } from '../hooks/useTableData';
import { DataTable } from './DataTable';
import { StructureView } from './StructureView';
import { exportToCsv, exportToJson } from '../lib/export';
import { toast } from 'sonner';

interface TableViewProps {
  tableName: string;
  isView?: boolean;
}

export const TableView: React.FC<TableViewProps> = ({ tableName, isView = false }) => {
  const [activeTab, setActiveTab] = useState<'data' | 'structure'>('data');
  const [isExporting, setIsExporting] = useState(false);

  const {
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
  } = useTableData(tableName);

  const columnTypes = React.useMemo(() => {
    const types: Record<string, string> = {};
    if (structure?.columns) {
      for (const col of structure.columns) {
        types[col.name] = col.type;
      }
    }
    return types;
  }, [structure]);

  const handleExportCsv = () => {
    if (!data || data.rows.length === 0) {
      toast.error('No data to export');
      return;
    }
    setIsExporting(true);
    try {
      exportToCsv(data.columns, data.rows, `${tableName}_page_${page}.csv`);
      toast.success(`Exported page ${page} (${data.rows.length} rows) to CSV`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = () => {
    if (!data || data.rows.length === 0) {
      toast.error('No data to export');
      return;
    }
    setIsExporting(true);
    try {
      exportToJson(data.columns, data.rows, `${tableName}_page_${page}.json`);
      toast.success(`Exported page ${page} (${data.rows.length} rows) to JSON`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-editor-bg">
      {/* Table Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-editor-border bg-gray-900/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            {isView ? (
              <Layers className="w-5 h-5 text-indigo-400 shrink-0" />
            ) : (
              <Table className="w-5 h-5 text-blue-400 shrink-0" />
            )}
            <h2 className="text-base font-semibold text-white truncate font-mono">
              {tableName}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono border border-gray-700">
              {isView ? 'VIEW' : 'TABLE'}
            </span>
            {data && (
              <span className="px-2 py-0.5 rounded bg-blue-950/40 text-blue-300 font-mono border border-blue-800/40">
                {data.totalRows.toLocaleString()} rows
              </span>
            )}
          </div>
        </div>

        {/* Action Controls & Subtabs */}
        <div className="flex items-center gap-2">
          {/* Subtabs */}
          <div className="flex items-center bg-gray-800/80 p-0.5 rounded border border-gray-700">
            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'data'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Data</span>
            </button>
            <button
              onClick={() => setActiveTab('structure')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'structure'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Structure</span>
            </button>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportCsv}
              disabled={isExporting || !data || data.rows.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Export current page to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportJson}
              disabled={isExporting || !data || data.rows.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Export current page to JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'data' ? (
          <DataTable
            columns={data ? data.columns : []}
            rows={data ? data.rows : []}
            columnTypes={columnTypes}
            totalRows={data?.totalRows}
            page={page}
            pageSize={pageSize}
            totalPages={data?.totalPages || 1}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onToggleSort={toggleSort}
            filterColumn={filterColumn}
            filterValue={filterValue}
            onFilterColumnChange={setFilterColumn}
            onFilterValueChange={setFilterValue}
            isLoading={isLoading}
          />
        ) : (
          <StructureView tableName={tableName} structure={structure} />
        )}
      </div>
    </div>
  );
};
