import React from 'react';
import {
  Search,
  Filter,
  Download,
  Table as TableIcon,
  FileCode,
  Info,
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { CsvDelimiter, CsvHeaderMode } from '../types/csv';
import { COMMON_DELIMITERS } from '../lib/delimiter';

interface CsvToolbarProps {
  viewMode: 'table' | 'raw' | 'overview';
  onViewModeChange: (mode: 'table' | 'raw' | 'overview') => void;
  search: string;
  onSearchChange: (val: string) => void;
  totalFilteredRows: number;
  totalOriginalRows: number;
  selectedDelimiter: CsvDelimiter;
  onChangeDelimiter: (del: CsvDelimiter) => void;
  headerMode: CsvHeaderMode;
  onToggleHeaderMode: (mode: CsvHeaderMode) => void;
  isFilterBarOpen: boolean;
  onToggleFilterBar: () => void;
  activeFilterCount: number;
  onExportCsv: () => void;
  onExportJson: () => void;
}

export const CsvToolbar: React.FC<CsvToolbarProps> = ({
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
  totalFilteredRows,
  totalOriginalRows,
  selectedDelimiter,
  onChangeDelimiter,
  headerMode,
  onToggleHeaderMode,
  isFilterBarOpen,
  onToggleFilterBar,
  activeFilterCount,
  onExportCsv,
  onExportJson,
}) => {
  const isFiltered = search.trim().length > 0 || activeFilterCount > 0;

  return (
    <div className="h-10 border-b border-border bg-card/50 px-3 flex items-center justify-between gap-2 select-none text-xs">
      {/* Left: Search & Filters */}
      <div className="flex items-center gap-2 flex-1 max-w-xl">
        {/* Global Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search all columns..."
            className="w-full bg-muted/60 border border-border text-foreground rounded pl-8 pr-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring font-mono"
          />
        </div>

        {/* Filter Bar Toggle Button */}
        <Button
          variant={isFilterBarOpen ? 'secondary' : 'ghost'}
          size="xs"
          onClick={onToggleFilterBar}
          className="gap-1.5 text-muted-foreground hover:text-foreground relative"
        >
          <Filter className="w-3 h-3 text-primary" />
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-mono flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Match Counter Badge */}
        {isFiltered && (
          <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
            <strong className="text-foreground">{totalFilteredRows.toLocaleString()}</strong> of{' '}
            {totalOriginalRows.toLocaleString()} rows
          </span>
        )}
      </div>

      {/* Right: Controls & Views */}
      <div className="flex items-center gap-2">
        {/* Delimiter Selector */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-muted-foreground hidden md:inline">Delimiter:</span>
          <select
            value={selectedDelimiter}
            onChange={(e) => onChangeDelimiter(e.target.value as CsvDelimiter)}
            aria-label="CSV Delimiter"
            className="bg-muted border border-border text-foreground rounded px-2 py-0.5 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {COMMON_DELIMITERS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Header Toggle */}
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onToggleHeaderMode(headerMode === 'none' ? 'first_row' : 'none')}
          className="text-[11px] text-muted-foreground hover:text-foreground gap-1 font-mono"
          title="Toggle whether first row is treated as column headers"
        >
          <span>Header:</span>
          <span className={headerMode === 'none' ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
            {headerMode === 'none' ? 'OFF' : 'ON'}
          </span>
        </Button>

        {/* Export Buttons */}
        <div className="flex items-center gap-1 border-l border-border/60 pl-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={onExportCsv}
            className="gap-1 text-muted-foreground hover:text-foreground text-[11px]"
            title="Export filtered data to CSV"
          >
            <Download className="w-3 h-3" />
            <span className="hidden lg:inline">CSV</span>
          </Button>

          <Button
            variant="ghost"
            size="xs"
            onClick={onExportJson}
            className="gap-1 text-muted-foreground hover:text-foreground text-[11px]"
            title="Export filtered data to JSON"
          >
            <Download className="w-3 h-3" />
            <span className="hidden lg:inline">JSON</span>
          </Button>
        </div>

        {/* View Switcher: Table / Raw / Overview */}
        <div className="flex items-center bg-muted/60 p-0.5 rounded-md border border-border/60 ml-1">
          <button
            onClick={() => onViewModeChange('table')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              viewMode === 'table'
                ? 'bg-background text-foreground shadow-xs border border-border/40 font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Table View"
          >
            <TableIcon className="w-3 h-3 text-blue-400" />
            <span className="hidden sm:inline">Table</span>
          </button>

          <button
            onClick={() => onViewModeChange('raw')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              viewMode === 'raw'
                ? 'bg-background text-foreground shadow-xs border border-border/40 font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Raw Source Text"
          >
            <FileCode className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Raw</span>
          </button>

          <button
            onClick={() => onViewModeChange('overview')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              viewMode === 'overview'
                ? 'bg-background text-foreground shadow-xs border border-border/40 font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Overview & Metadata"
          >
            <Info className="w-3 h-3 text-sky-400" />
            <span className="hidden sm:inline">Overview</span>
          </button>
        </div>
      </div>
    </div>
  );
};
