import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ParseResult, ViewMode } from '../types/json';
import { useJsonSearch } from '../hooks/useJsonSearch';
import { JsonEditor } from './JsonEditor';
import { ViewTabs } from './ViewTabs';
import { SearchBar } from './SearchBar';
import { JsonTree } from './JsonTree';
import { PrettyView } from './PrettyView';
import { RawView } from './RawView';
import { EmptyState } from '../../../shared/components/EmptyState';
import { toast } from 'sonner';

export interface JsonModuleProps {
  rawJson: string;
  setRawJson: (value: string) => void;
  parseResult: ParseResult;
  format: () => boolean;
  minify: () => boolean;
  clear: () => void;
  loadSample: () => void;
  loadContent: (content: string) => void;
  onOpenFilePicker: () => void;
}

export const JsonModule: React.FC<JsonModuleProps> = ({
  rawJson,
  setRawJson,
  parseResult,
  format,
  minify,
  clear,
  loadSample,
  onOpenFilePicker,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [sortKeys, setSortKeys] = useState<boolean>(false);
  const [isInputHidden, setIsInputHidden] = useState<boolean>(false);
  const [expandDepth, setExpandDepth] = useState<number>(0);
  const [expandSignal, setExpandSignal] = useState<number>(0);
  const [collapseSignal, setCollapseSignal] = useState<number>(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search hook over parsed JSON value with debounced query
  const {
    searchQuery,
    debouncedQuery,
    setSearchQuery,
    totalMatches,
    currentMatchIndex,
    activeMatch,
    activeAncestors,
    nextMatch,
    prevMatch,
    clearSearch,
  } = useJsonSearch(parseResult.isValid ? parseResult.data : undefined);

  // Determine if Expand All is safe (only for small JSON documents)
  const canExpandAll = Boolean(
    parseResult.isValid &&
    (parseResult.stats.objectCount + parseResult.stats.arrayCount) <= 120 &&
    parseResult.stats.sizeBytes <= 60_000
  );

  const handleExpandLevel = useCallback((level: number) => {
    setExpandDepth(level);
    setExpandSignal((s) => s + 1);
    toast.success(`Expanded to ${level} level${level > 1 ? 's' : ''}`);
  }, []);

  const handleExpandAll = useCallback(() => {
    if (!canExpandAll) {
      toast.warning('Expand All is disabled for large JSON to maintain performance. Use +1 / +2 Levels.');
      return;
    }
    setExpandDepth(999);
    setExpandSignal((s) => s + 1);
    toast.success('All nodes expanded');
  }, [canExpandAll]);

  const handleCollapseAll = useCallback(() => {
    setCollapseSignal((s) => s + 1);
    toast.success('All nodes collapsed');
  }, []);

  // Global keyboard shortcuts for JSON module
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Ctrl + Enter -> Format
      if (isCtrlOrCmd && e.key === 'Enter') {
        e.preventDefault();
        const ok = format();
        if (ok) {
          toast.success('JSON formatted (2 spaces)');
        } else {
          toast.error('Cannot format invalid JSON');
        }
        return;
      }

      // Ctrl + Shift + C -> Copy Formatted
      if (isCtrlOrCmd && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        if (!rawJson.trim()) {
          toast.error('Editor is empty');
          return;
        }
        if (parseResult.isValid) {
          navigator.clipboard.writeText(JSON.stringify(parseResult.data, null, 2))
            .then(() => toast.success('JSON copied'));
        } else {
          navigator.clipboard.writeText(rawJson)
            .then(() => toast.success('JSON copied'));
        }
        return;
      }

      // Ctrl + F -> Focus Search input
      if (isCtrlOrCmd && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        if (viewMode !== 'tree') {
          setViewMode('tree');
        }
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 50);
        return;
      }

      // Ctrl + B -> Toggle Input Panel
      if (isCtrlOrCmd && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsInputHidden((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [format, parseResult, rawJson, viewMode]);

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full h-full">
      {/* Left Pane: JSON Editor (collapsible) */}
      {!isInputHidden && (
        <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-border flex flex-col">
          <JsonEditor
            value={rawJson}
            onChange={setRawJson}
            onFormat={format}
            onMinify={minify}
            onClear={clear}
            isValid={parseResult.isValid}
            errorLine={!parseResult.isValid ? parseResult.line : undefined}
          />
        </div>
      )}

      {/* Right Pane: Tree / Pretty / Raw / Empty State */}
      <div className={`h-full flex flex-col bg-card/10 overflow-hidden ${
        isInputHidden ? 'w-full' : 'w-full md:w-1/2 h-1/2 md:h-full'
      }`}>
        {!rawJson.trim() ? (
          <EmptyState
            onLoadSample={loadSample}
            onOpenFilePicker={onOpenFilePicker}
          />
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs, Tree Controls and Hide Input button */}
            <ViewTabs
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortKeys={sortKeys}
              onToggleSortKeys={() => setSortKeys(!sortKeys)}
              onExpandLevel={handleExpandLevel}
              onExpandAll={handleExpandAll}
              onCollapseAll={handleCollapseAll}
              canExpandAll={canExpandAll}
              isInputHidden={isInputHidden}
              onToggleInputHidden={() => setIsInputHidden(!isInputHidden)}
            />

            {/* View Content */}
            {viewMode === 'tree' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search Bar */}
                <SearchBar
                  ref={searchInputRef}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  totalMatches={totalMatches}
                  currentMatchIndex={currentMatchIndex}
                  onNext={nextMatch}
                  onPrev={prevMatch}
                  onClear={clearSearch}
                />

                {/* Tree or Error Message */}
                <div className="flex-1 overflow-auto">
                  {parseResult.isValid ? (
                    <JsonTree
                      data={parseResult.data}
                      sortKeys={sortKeys}
                      activeAncestors={activeAncestors}
                      activeMatchPath={activeMatch?.formattedPath}
                      searchQuery={debouncedQuery}
                      expandDepth={expandDepth}
                      expandSignal={expandSignal}
                      collapseSignal={collapseSignal}
                    />
                  ) : (
                    <div className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center h-full">
                      <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-4 max-w-md w-full">
                        <p className="font-semibold mb-1 text-sm">Cannot display Tree View</p>
                        <p className="font-mono text-xs">{parseResult.error}</p>
                        {parseResult.line !== undefined && (
                          <p className="mt-2 text-[11px] text-destructive/80">
                            Error at Line {parseResult.line}, Column {parseResult.column}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {viewMode === 'pretty' && (
              <div className="flex-1 overflow-hidden">
                {parseResult.isValid ? (
                  <PrettyView data={parseResult.data} sortKeys={sortKeys} />
                ) : (
                  <div className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center h-full">
                    <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-4 max-w-md w-full">
                      <p className="font-semibold mb-1 text-sm">Cannot display Pretty View</p>
                      <p className="font-mono text-xs">{parseResult.error}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'raw' && (
              <div className="flex-1 overflow-hidden">
                <RawView rawText={rawJson} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
