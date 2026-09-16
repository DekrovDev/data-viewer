import React, { useState, useCallback, useRef } from 'react';
import { Header } from './shared/components/Header';
import { EmptyState } from './shared/components/EmptyState';
import { JsonModule } from './modules/json/components/JsonModule';
import { StatusBar } from './modules/json/components/StatusBar';
import { HistoryPanel } from './modules/json/components/HistoryPanel';
import { SqliteModule } from './modules/sqlite/components/SqliteModule';
import { useJsonParser } from './modules/json/hooks/useJsonParser';
import { useJsonHistory } from './modules/json/hooks/useJsonHistory';
import { detectDataFormat } from './core/detection/formatDetector';
import { DataFormat } from './core/detection/types';
import { readTextFile, readBinaryFile } from './core/files/file';
import { toast } from 'sonner';

export const App: React.FC = () => {
  const [activeFormat, setActiveFormat] = useState<DataFormat>('json');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // SQLite state
  const [sqliteBytes, setSqliteBytes] = useState<Uint8Array | null>(null);
  const [sqliteFileName, setSqliteFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    rawJson,
    setRawJson,
    parseResult,
    isParsing,
    format,
    minify,
    clear,
    loadSample,
    loadContent,
  } = useJsonParser();

  const {
    history,
    saveToHistory,
    removeItem,
    clearHistory,
  } = useJsonHistory();

  // Auto-save valid JSON to history
  React.useEffect(() => {
    if (parseResult.isValid && rawJson.trim().length > 0) {
      const timer = window.setTimeout(() => {
        saveToHistory(rawJson);
      }, 1200);
      return () => window.clearTimeout(timer);
    }
  }, [parseResult, rawJson, saveToHistory]);

  // ─── File Handling ───────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    const detected = await detectDataFormat(file);

    if (detected === 'json') {
      try {
        const result = await readTextFile(file);
        setActiveFormat('json');
        setSqliteBytes(null);
        setSqliteFileName(null);
        loadContent(result.content);
        toast.success(`Loaded "${result.filename}" (JSON, ${(result.sizeBytes / 1024).toFixed(1)} KB)`);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to read JSON file');
      }

    } else if (detected === 'sqlite') {
      try {
        const result = await readBinaryFile(file);
        const bytes = new Uint8Array(result.buffer);
        setActiveFormat('sqlite');
        setSqliteBytes(bytes);
        setSqliteFileName(result.filename);
        toast.success(`Loaded "${result.filename}" (SQLite, ${(result.sizeBytes / 1024).toFixed(1)} KB)`);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to read SQLite file');
      }

    } else {
      toast.error(`Unsupported file format: "${file.name}". Supported: JSON, SQLite (.db/.sqlite/.sqlite3)`);
    }
  }, [loadContent]);

  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
    // reset input so same file can be re-picked
    e.target.value = '';
  }, [handleFile]);

  const handleOpenFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ─── Drag & Drop ─────────────────────────────────────────────────────────────

  const handleGlobalDrop = useCallback(async (e: React.DragEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('textarea')) return;
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  }, [handleFile]);

  const handleGlobalDragOver = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('textarea')) return;
    e.preventDefault();
  }, []);

  // ─── Sample Loaders ───────────────────────────────────────────────────────────

  const handleLoadSampleJson = useCallback(() => {
    setActiveFormat('json');
    setSqliteBytes(null);
    setSqliteFileName(null);
    loadSample();
    toast.success('Sample JSON dataset loaded');
  }, [loadSample]);

  const handleLoadSampleSqlite = useCallback(async () => {
    try {
      toast.loading('Fetching sample.db...');
      const resp = await fetch('/sample.db');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      const buffer = await resp.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      setActiveFormat('sqlite');
      setSqliteBytes(bytes);
      setSqliteFileName('sample.db');
      toast.dismiss();
      toast.success(`Sample SQLite database loaded (${(bytes.length / 1024).toFixed(1)} KB)`);
    } catch (err: unknown) {
      toast.dismiss();
      toast.error(err instanceof Error ? err.message : 'Failed to load sample SQLite DB');
    }
  }, []);

  // ─── Header Sample handler (unified per active format) ────────────────────────

  const handleHeaderLoadSample = useCallback(() => {
    if (activeFormat === 'sqlite') {
      handleLoadSampleSqlite();
    } else {
      handleLoadSampleJson();
    }
  }, [activeFormat, handleLoadSampleJson, handleLoadSampleSqlite]);

  // ─── Format Switch ───────────────────────────────────────────────────────────

  const handleSelectFormat = useCallback((fmt: DataFormat) => {
    setActiveFormat(fmt);
    // Don't destroy data when switching—just show the right module or empty state
  }, []);

  const handleCloseSqlite = useCallback(() => {
    setSqliteBytes(null);
    setSqliteFileName(null);
    setActiveFormat('json');
  }, []);

  // ─── Determine what to show ──────────────────────────────────────────────────

  const showSqliteModule = activeFormat === 'sqlite' && sqliteBytes !== null;
  const showJsonModule = activeFormat === 'json' && rawJson.trim().length > 0;
  const showEmptyState = !showSqliteModule && !showJsonModule;

  return (
    <div
      className="flex flex-col h-screen w-screen bg-background text-foreground select-none overflow-hidden"
      onDrop={handleGlobalDrop}
      onDragOver={handleGlobalDragOver}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.db,.sqlite,.sqlite3,application/json,application/x-sqlite3"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Top Header */}
      <Header
        activeFormat={activeFormat}
        onSelectFormat={handleSelectFormat}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        onLoadSample={handleHeaderLoadSample}
        currentDataText={rawJson}
        isValidData={parseResult.isValid}
      />

      {/* Main Split Body */}
      <main className="flex-1 flex overflow-hidden">
        {showSqliteModule && (
          <SqliteModule
            fileBytes={sqliteBytes}
            fileName={sqliteFileName}
            onCloseFile={handleCloseSqlite}
          />
        )}

        {showJsonModule && (
          <JsonModule
            rawJson={rawJson}
            setRawJson={setRawJson}
            parseResult={parseResult}
            format={format}
            minify={minify}
            clear={clear}
            loadSample={handleLoadSampleJson}
            loadContent={loadContent}
            onOpenFilePicker={handleOpenFilePicker}
          />
        )}

        {showEmptyState && (
          <EmptyState
            activeFormat={activeFormat === 'sqlite' ? 'sqlite' : 'json'}
            onLoadSampleJson={handleLoadSampleJson}
            onLoadSampleSqlite={handleLoadSampleSqlite}
            onOpenFilePicker={handleOpenFilePicker}
            onPasteJson={() => {
              setActiveFormat('json');
              loadContent('{\n  \n}');
            }}
          />
        )}
      </main>

      {/* Status Bar (JSON only) */}
      {activeFormat === 'json' && rawJson.trim().length > 0 && (
        <StatusBar parseResult={parseResult} isParsing={isParsing} />
      )}

      {/* History Slide-over (JSON only) */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onRestore={(content) => {
          setActiveFormat('json');
          loadContent(content);
        }}
        onRemoveItem={removeItem}
        onClearHistory={clearHistory}
      />
    </div>
  );
};

export default App;
