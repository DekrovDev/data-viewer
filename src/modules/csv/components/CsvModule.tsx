import React, { useState } from 'react';
import { useCsvDocument } from '../hooks/useCsvDocument';
import { useCsvTable } from '../hooks/useCsvTable';
import { CsvToolbar } from './CsvToolbar';
import { CsvFilterBar } from './CsvFilterBar';
import { CsvTable } from './CsvTable';
import { CsvOverview } from './CsvOverview';
import { CsvRawViewer } from './CsvRawViewer';
import { CsvColumnInspector } from './CsvColumnInspector';
import { CsvColumnStats } from '../types/csv';
import { FileSpreadsheet, X, Download, AlertTriangle } from 'lucide-react';
import { downloadFile } from '../../../core/files/file';

interface CsvModuleProps {
  rawText?: string | null;
  content?: string | null;
  fileName: string | null;
  onCloseFile: () => void;
}

export const CsvModule: React.FC<CsvModuleProps> = ({
  rawText,
  content,
  fileName,
  onCloseFile,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'raw' | 'overview'>('table');
  const [isFilterBarOpen, setIsFilterBarOpen] = useState(false);

  // Column Inspector state
  const [inspectedColumnId, setInspectedColumnId] = useState<string | null>(null);
  const [columnStats, setColumnStats] = useState<CsvColumnStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  const textToParse = content ?? rawText ?? null;

  const {
    isOpen,
    isLoading: isDocLoading,
    error: docError,
    overview,
    columns,
    selectedDelimiter,
    headerMode,
    changeDelimiter,
    toggleHeaderMode,
    closeDocument,
  } = useCsvDocument(textToParse, fileName);

  const {
    search,
    setSearch,
    filters,
    addFilter,
    removeFilter,
    clearAllFilters,
    sort,
    toggleSort,
    data,
    isLoading: isTableLoading,
    exportFiltered,
    getColumnStats,
  } = useCsvTable(isOpen, overview?.totalRows || 0);

  const handleClose = () => {
    closeDocument();
    onCloseFile();
  };

  const handleDownloadOriginal = () => {
    if (!rawText || !fileName) return;
    downloadFile(rawText, fileName, 'text/csv;charset=utf-8');
  };

  const handleInspectColumn = async (colId: string) => {
    setInspectedColumnId(colId);
    setIsStatsLoading(true);
    const stats = await getColumnStats(colId);
    setColumnStats(stats);
    setIsStatsLoading(false);
  };

  if (isDocLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-editor-bg text-muted-foreground select-none">
        <div className="w-9 h-9 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <h3 className="text-sm font-semibold text-foreground">Parsing CSV Dataset</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Processing in Web Worker &amp; inferring column types...
        </p>
      </div>
    );
  }

  if (docError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-editor-bg select-none">
        <div className="max-w-md w-full p-5 rounded-lg bg-red-950/40 border border-red-800/50 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-200">Failed to Parse CSV</h3>
          <p className="text-xs text-red-300/80 mt-1.5 whitespace-pre-wrap">{docError}</p>
          <button
            onClick={handleClose}
            className="mt-4 px-3.5 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-medium transition-colors"
          >
            Close &amp; Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!isOpen || !overview) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs bg-editor-bg">
        No CSV dataset currently open.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-editor-bg">
      {/* Top Module Sub-Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card/60 text-xs select-none">
        <div className="flex items-center gap-2 truncate">
          <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
          <span className="font-mono font-semibold text-foreground truncate">
            {overview.filename}
          </span>
          <span className="text-muted-foreground/60">•</span>
          <span className="text-muted-foreground font-mono text-[11px]">
            {overview.totalRows.toLocaleString()} rows • {overview.columnCount} cols • {overview.delimiterName}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDownloadOriginal}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border text-xs transition-colors"
            title="Download original file"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={handleClose}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted hover:bg-red-950/60 hover:text-red-300 text-muted-foreground border border-border text-xs transition-colors"
            title="Close dataset"
          >
            <X className="w-3 h-3" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <CsvToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        onSearchChange={setSearch}
        totalFilteredRows={data?.totalFilteredRows ?? overview.totalRows}
        totalOriginalRows={overview.totalRows}
        selectedDelimiter={selectedDelimiter}
        onChangeDelimiter={changeDelimiter}
        headerMode={headerMode}
        onToggleHeaderMode={toggleHeaderMode}
        isFilterBarOpen={isFilterBarOpen}
        onToggleFilterBar={() => setIsFilterBarOpen(!isFilterBarOpen)}
        activeFilterCount={filters.length}
        onExportCsv={() => exportFiltered('csv')}
        onExportJson={() => exportFiltered('json')}
      />

      {/* Filter Bar (Collapsible) */}
      {isFilterBarOpen && (
        <CsvFilterBar
          columns={columns}
          filters={filters}
          onAddFilter={addFilter}
          onRemoveFilter={removeFilter}
          onClearAll={clearAllFilters}
          onCloseBar={() => setIsFilterBarOpen(false)}
        />
      )}

      {/* Content Area */}
      <main className="flex-1 overflow-hidden">
        {viewMode === 'table' && (
          <CsvTable
            columns={columns}
            rows={data?.rows || []}
            rowIndices={data?.rowIndices || []}
            sort={sort}
            onToggleSort={toggleSort}
            onInspectColumn={handleInspectColumn}
            isLoading={isTableLoading}
          />
        )}

        {viewMode === 'raw' && (
          <CsvRawViewer rawText={rawText || ''} filename={overview.filename} />
        )}

        {viewMode === 'overview' && (
          <CsvOverview
            overview={overview}
            columns={columns}
            onInspectColumn={handleInspectColumn}
            onOpenTableView={() => setViewMode('table')}
          />
        )}
      </main>

      {/* Column Inspector Dialog */}
      {inspectedColumnId && (
        <CsvColumnInspector
          isOpen={true}
          onClose={() => {
            setInspectedColumnId(null);
            setColumnStats(null);
          }}
          stats={columnStats}
          isLoading={isStatsLoading}
        />
      )}
    </div>
  );
};
