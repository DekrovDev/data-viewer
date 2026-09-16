import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './shared/components/Header';
import { JsonModule } from './modules/json/components/JsonModule';
import { StatusBar } from './modules/json/components/StatusBar';
import { HistoryPanel } from './modules/json/components/HistoryPanel';
import { useJsonParser } from './modules/json/hooks/useJsonParser';
import { useJsonHistory } from './modules/json/hooks/useJsonHistory';
import { detectDataFormat } from './core/detection/formatDetector';
import { DataFormat } from './core/detection/types';
import { readTextFile } from './core/files/file';
import { toast } from 'sonner';

export const App: React.FC = () => {
  const [activeFormat, setActiveFormat] = useState<DataFormat>('json');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

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

  // Local storage history hook
  const {
    history,
    saveToHistory,
    removeItem,
    clearHistory,
  } = useJsonHistory();

  // Save to history when JSON is valid after a short idle timeout
  useEffect(() => {
    if (parseResult.isValid && rawJson.trim().length > 0) {
      const timer = window.setTimeout(() => {
        saveToHistory(rawJson);
      }, 1200);
      return () => window.clearTimeout(timer);
    }
  }, [parseResult, rawJson, saveToHistory]);

  const handleOpenFilePicker = useCallback(() => {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    input?.click();
  }, []);

  // Global window drop handler for multi-format auto-detection
  const handleGlobalDrop = useCallback(async (e: React.DragEvent) => {
    // Only handle if file was dropped outside the editor
    const target = e.target as HTMLElement | null;
    if (target?.closest('textarea')) return;

    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const detected = detectDataFormat(file);
    if (detected === 'json') {
      setActiveFormat('json');
      try {
        const result = await readTextFile(file);
        loadContent(result.content);
        toast.success(`Loaded "${result.filename}" (JSON)`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error reading file';
        toast.error(msg);
      }
    } else {
      toast.info(`Detected file: "${file.name}". Format support coming soon to Data Viewer! Currently supporting JSON.`);
    }
  }, [loadContent]);

  const handleGlobalDragOver = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('textarea')) return;
    e.preventDefault();
  }, []);

  return (
    <div 
      className="flex flex-col h-screen w-screen bg-background text-foreground select-none overflow-hidden"
      onDrop={handleGlobalDrop}
      onDragOver={handleGlobalDragOver}
    >
      {/* Top Header */}
      <Header
        activeFormat={activeFormat}
        onSelectFormat={setActiveFormat}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        onLoadSample={loadSample}
        currentDataText={rawJson}
        isValidData={parseResult.isValid}
      />

      {/* Main Split Body: Modules */}
      <main className="flex-1 flex overflow-hidden">
        {activeFormat === 'json' && (
          <JsonModule
            rawJson={rawJson}
            setRawJson={setRawJson}
            parseResult={parseResult}
            format={format}
            minify={minify}
            clear={clear}
            loadSample={loadSample}
            loadContent={loadContent}
            onOpenFilePicker={handleOpenFilePicker}
          />
        )}
      </main>

      {/* Bottom Status Bar */}
      {activeFormat === 'json' && (
        <StatusBar parseResult={parseResult} isParsing={isParsing} />
      )}

      {/* History Slide-over / Modal */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onRestore={loadContent}
        onRemoveItem={removeItem}
        onClearHistory={clearHistory}
      />
    </div>
  );
};

export default App;
