import React, { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  BarChart2,
} from 'lucide-react';
import { CsvColumn, CsvSort, InferredColumnType } from '../types/csv';
import { CsvCellInspector } from './CsvCellInspector';

interface CsvTableProps {
  columns: CsvColumn[];
  rows: string[][];
  rowIndices: number[];
  sort: CsvSort | null;
  onToggleSort: (columnId: string) => void;
  onInspectColumn: (columnId: string) => void;
  isLoading?: boolean;
}

export const CsvTable: React.FC<CsvTableProps> = ({
  columns,
  rows,
  rowIndices,
  sort,
  onToggleSort,
  onInspectColumn,
  isLoading = false,
}) => {
  const [inspectedCell, setInspectedCell] = useState<{
    columnName: string;
    rowNumber: number;
    value: string;
    inferredType: InferredColumnType;
  } | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 34,
    overscan: 10,
  });

  const getTypeIcon = (type: InferredColumnType) => {
    switch (type) {
      case 'number':
        return <span className="text-[10px] font-mono text-emerald-400 font-semibold">#</span>;
      case 'boolean':
        return <span className="text-[10px] font-mono text-amber-400 font-semibold">✓</span>;
      case 'date':
        return <span className="text-[10px] font-mono text-purple-400 font-semibold">📅</span>;
      case 'empty':
        return <span className="text-[10px] font-mono text-gray-500 font-semibold">∅</span>;
      default:
        return <span className="text-[10px] font-mono text-sky-400 font-semibold">Abc</span>;
    }
  };

  const renderCellContent = (val: string, type: InferredColumnType) => {
    if (val === undefined || val === null || val === '') {
      return <span className="text-muted-foreground/40 italic font-mono text-[11px]">(empty)</span>;
    }

    if (type === 'number') {
      return <span className="font-mono text-emerald-300 font-medium">{val}</span>;
    }

    if (type === 'boolean') {
      const lower = val.toLowerCase();
      const isTrue = lower === 'true' || lower === '1' || lower === 'yes';
      return (
        <span className={`font-mono font-medium ${isTrue ? 'text-amber-300' : 'text-zinc-400'}`}>
          {val}
        </span>
      );
    }

    if (type === 'date') {
      return <span className="font-mono text-purple-300">{val}</span>;
    }

    // String formatting
    if (val.length > 80) {
      return <span title={val}>{val.slice(0, 80)}…</span>;
    }

    return <span>{val}</span>;
  };

  if (columns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs italic bg-editor-bg">
        No columns detected.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-editor-bg overflow-hidden select-none">
      <div ref={parentRef} className="flex-1 overflow-auto relative">
        <div className="min-w-full inline-block align-middle">
          <table className="min-w-full divide-y divide-border/60 border-separate border-spacing-0">
            {/* Sticky Table Header */}
            <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur shadow-xs">
              <tr>
                {/* Row number header */}
                <th className="w-14 px-2 py-2 text-left text-[11px] font-mono text-muted-foreground border-b border-r border-border bg-card select-none shrink-0">
                  #
                </th>

                {/* Column Headers */}
                {columns.map((col) => {
                  const isSorted = sort?.columnId === col.id;
                  const sortDir = sort?.direction;

                  return (
                    <th
                      key={col.id}
                      className={`px-3 py-1.5 text-left text-xs font-medium border-b border-r border-border select-none transition-colors min-w-[140px] max-w-[280px] ${
                        isSorted ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div
                          onClick={() => onToggleSort(col.id)}
                          className="flex items-center gap-1.5 truncate cursor-pointer flex-1"
                          title={`Sort by ${col.name}`}
                        >
                          <span className="shrink-0">{getTypeIcon(col.inferredType)}</span>
                          <span className="truncate font-semibold text-xs font-mono">{col.name}</span>

                          {/* Sort indicator */}
                          <span className="shrink-0 text-muted-foreground ml-0.5">
                            {isSorted ? (
                              sortDir === 'ASC' ? (
                                <ChevronUp className="w-3.5 h-3.5 text-primary" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-primary" />
                              )
                            ) : (
                              <ChevronsUpDown className="w-3 h-3 opacity-30 hover:opacity-100" />
                            )}
                          </span>
                        </div>

                        {/* Column Stats Inspector Trigger */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectColumn(col.id);
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-accent transition-colors"
                          title={`Inspect column "${col.name}" statistics`}
                        >
                          <BarChart2 className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Virtualized Table Body */}
            <tbody
              className="relative bg-editor-bg divide-y divide-border/40"
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
              }}
            >
              {rows.length === 0 && !isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="text-center py-16 text-muted-foreground text-xs italic"
                  >
                    No matching rows found.
                  </td>
                </tr>
              ) : (
                rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  const originalRowNumber = rowIndices[virtualRow.index] ?? virtualRow.index + 1;

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
                      className="hover:bg-muted/40 transition-colors flex items-center border-b border-border/40 font-mono text-xs"
                    >
                      {/* Row Index */}
                      <td className="w-14 px-2 py-1 text-[11px] font-mono text-muted-foreground/80 text-right pr-3 select-none border-r border-border/60 shrink-0">
                        {originalRowNumber.toLocaleString()}
                      </td>

                      {/* Row Cells */}
                      {columns.map((col, colIdx) => {
                        const cellVal = row ? row[colIdx] ?? '' : '';

                        return (
                          <td
                            key={col.id}
                            onClick={() =>
                              setInspectedCell({
                                columnName: col.name,
                                rowNumber: originalRowNumber,
                                value: cellVal,
                                inferredType: col.inferredType,
                              })
                            }
                            className="px-3 py-1 text-xs text-foreground/90 border-r border-border/40 truncate cursor-pointer hover:bg-primary/10 flex-1 min-w-[140px] max-w-[280px]"
                            title="Click to inspect cell"
                          >
                            {renderCellContent(cellVal, col.inferredType)}
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
      </div>

      {/* Cell Inspector Modal */}
      {inspectedCell && (
        <CsvCellInspector
          isOpen={true}
          onClose={() => setInspectedCell(null)}
          columnName={inspectedCell.columnName}
          rowNumber={inspectedCell.rowNumber}
          value={inspectedCell.value}
          inferredType={inspectedCell.inferredType}
        />
      )}
    </div>
  );
};
