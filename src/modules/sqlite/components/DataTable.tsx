import React, { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from 'lucide-react';
import { CellData } from '../types/sqlite';
import { CellInspector } from './CellInspector';

interface DataTableProps {
  columns: string[];
  rows: CellData[][];
  columnTypes?: Record<string, string>;
  totalRows?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  sortColumn?: string;
  sortDirection?: 'ASC' | 'DESC';
  onToggleSort?: (column: string) => void;
  filterColumn?: string;
  filterValue?: string;
  onFilterColumnChange?: (col: string | undefined) => void;
  onFilterValueChange?: (val: string) => void;
  isLoading?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  columnTypes = {},
  totalRows,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection,
  onToggleSort,
  filterColumn,
  filterValue,
  onFilterColumnChange,
  onFilterValueChange,
  isLoading = false,
}) => {
  const [inspectedCell, setInspectedCell] = useState<{
    columnName: string;
    value: CellData;
    declaredType?: string;
  } | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 10,
  });

  const formatCellValue = (val: CellData) => {
    if (val === null || val === undefined) {
      return <span className="text-gray-500 italic text-xs font-mono">NULL</span>;
    }
    if (val instanceof Uint8Array) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-900/40 text-purple-300 border border-purple-700/40">
          BLOB ({val.length} B)
        </span>
      );
    }
    if (typeof val === 'number') {
      return <span className="font-mono text-emerald-400">{val}</span>;
    }
    if (typeof val === 'boolean') {
      return <span className="font-mono text-amber-400">{val ? 'true' : 'false'}</span>;
    }
    const str = String(val);
    if (str.length > 80) {
      return <span title={str}>{str.slice(0, 80)}…</span>;
    }
    return <span>{str}</span>;
  };

  const hasPagination = page !== undefined && pageSize !== undefined && totalPages !== undefined;

  return (
    <div className="flex flex-col h-full bg-editor-bg border border-editor-border rounded-lg overflow-hidden">
      {/* Filter toolbar */}
      {(onFilterValueChange || onFilterColumnChange) && (
        <div className="flex flex-wrap items-center gap-2 p-2 border-b border-editor-border bg-gray-900/60 text-xs">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium">Filter:</span>
          </div>

          <select
            aria-label="Filter column"
            value={filterColumn || ''}
            onChange={(e) => onFilterColumnChange && onFilterColumnChange(e.target.value || undefined)}
            className="bg-gray-800 border border-gray-700 text-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">All Columns</option>
            {columns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[140px] max-w-sm">
            <input
              type="text"
              placeholder={filterColumn ? `Filter by ${filterColumn}...` : 'Filter across columns...'}
              value={filterValue || ''}
              onChange={(e) => onFilterValueChange && onFilterValueChange(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded pl-2.5 pr-6 py-1 text-xs focus:outline-none focus:border-blue-500 placeholder-gray-500"
            />
            {filterValue && onFilterValueChange && (
              <button
                onClick={() => onFilterValueChange('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {totalRows !== undefined && (
            <div className="ml-auto text-xs text-gray-400 font-mono">
              Total: <span className="text-gray-200 font-semibold">{totalRows.toLocaleString()}</span> rows
            </div>
          )}
        </div>
      )}

      {/* Main Virtualized Table Area */}
      <div ref={parentRef} className="flex-1 overflow-auto relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-[1px] flex items-center justify-center z-20">
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 px-4 py-2 rounded-md shadow-lg">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-200">Loading data...</span>
            </div>
          </div>
        )}

        {columns.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            No columns to display
          </div>
        ) : (
          <div className="min-w-full inline-block align-middle">
            <table className="min-w-full divide-y divide-gray-800 border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur shadow-sm">
                <tr>
                  <th className="w-12 px-2 py-2 text-left text-[11px] font-mono text-gray-500 border-b border-r border-gray-800 bg-gray-900 select-none">
                    #
                  </th>
                  {columns.map((col) => {
                    const isSorted = sortColumn === col;
                    const declaredType = columnTypes[col];
                    return (
                      <th
                        key={col}
                        onClick={() => onToggleSort && onToggleSort(col)}
                        className={`px-3 py-2 text-left text-xs font-medium border-b border-r border-gray-800 select-none transition-colors ${
                          onToggleSort ? 'cursor-pointer hover:bg-gray-800/80' : ''
                        } ${isSorted ? 'bg-blue-950/30 text-blue-300' : 'text-gray-300'}`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-baseline gap-1 truncate">
                            <span className="truncate font-semibold">{col}</span>
                            {declaredType && (
                              <span className="text-[10px] text-gray-500 font-mono uppercase truncate font-normal">
                                {declaredType}
                              </span>
                            )}
                          </div>
                          {onToggleSort && (
                            <span className="shrink-0 text-gray-400">
                              {isSorted ? (
                                sortDirection === 'ASC' ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                                )
                              ) : (
                                <ChevronsUpDown className="w-3 h-3 text-gray-600 opacity-40 hover:opacity-100" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody
                className="relative bg-editor-bg divide-y divide-gray-800/40"
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                }}
              >
                {rows.length === 0 && !isLoading ? (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="text-center py-12 text-gray-500 text-sm italic"
                    >
                      No rows found matching current filters
                    </td>
                  </tr>
                ) : (
                  rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    const rowIndex = (page !== undefined && pageSize !== undefined)
                      ? (page - 1) * pageSize + virtualRow.index + 1
                      : virtualRow.index + 1;

                    return (
                      <tr
                        key={virtualRow.index}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="hover:bg-gray-800/40 transition-colors flex items-center border-b border-gray-800/40"
                      >
                        <td className="w-12 px-2 py-1.5 text-[11px] font-mono text-gray-500 text-right pr-3 select-none border-r border-gray-800/60 shrink-0">
                          {rowIndex}
                        </td>
                        {columns.map((col, colIdx) => {
                          const val = row ? row[colIdx] : null;
                          return (
                            <td
                              key={col}
                              onClick={() =>
                                setInspectedCell({
                                  columnName: col,
                                  value: val,
                                  declaredType: columnTypes[col],
                                })
                              }
                              className="px-3 py-1.5 text-xs text-gray-300 border-r border-gray-800/40 truncate cursor-pointer hover:bg-blue-900/20 flex-1 min-w-[120px]"
                            >
                              {formatCellValue(val)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination footer */}
      {hasPagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 border-t border-editor-border bg-gray-900/80 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(e) => onPageSizeChange && onPageSizeChange(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 text-gray-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-500"
            >
              {[50, 100, 250, 500].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-mono text-gray-300 mr-2">
              Page <span className="font-semibold text-white">{page}</span> of{' '}
              <span className="font-semibold text-white">{totalPages || 1}</span>
            </span>

            <button
              onClick={() => onPageChange && onPageChange(1)}
              disabled={page <= 1}
              className="p-1 rounded hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-300"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange && onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1 rounded hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-300"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange && onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1 rounded hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-300"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange && onPageChange(totalPages)}
              disabled={page >= totalPages}
              className="p-1 rounded hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-300"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cell Inspector Modal */}
      {inspectedCell && (
        <CellInspector
          columnName={inspectedCell.columnName}
          value={inspectedCell.value}
          declaredType={inspectedCell.declaredType}
          onClose={() => setInspectedCell(null)}
        />
      )}
    </div>
  );
};
