import React from 'react';
import { Database, Sparkles, Upload, FileJson, ShieldCheck, Terminal, Table } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface EmptyStateProps {
  activeFormat?: 'json' | 'sqlite';
  onLoadSampleJson: () => void;
  onLoadSampleSqlite: () => void;
  onOpenFilePicker: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onLoadSampleJson,
  onLoadSampleSqlite,
  onOpenFilePicker,
}) => {
  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center bg-card/10 select-none">
      <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground mb-4 shadow-sm">
        <Database className="w-7 h-7 text-primary/90" />
      </div>

      <h2 className="text-base font-semibold text-foreground mb-1">
        Data Viewer
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        Drop a file here or use the buttons below to get started
      </p>

      {/* Format Indicators */}
      <div className="flex items-center gap-1.5 mb-6">
        <span className="text-[11px] text-muted-foreground">Supported:</span>
        <Badge variant="info" className="text-[10px] font-mono px-2 py-0.5 font-semibold">
          JSON
        </Badge>
        <Badge variant="info" className="text-[10px] font-mono px-2 py-0.5 font-semibold bg-blue-950/50 text-blue-300 border-blue-800/50">
          SQLite
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
        <Button
          variant="default"
          size="sm"
          onClick={onOpenFilePicker}
          className="gap-1.5 shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Open File</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onLoadSampleJson}
          className="gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Sample JSON</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onLoadSampleSqlite}
          className="gap-1.5"
        >
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span>Sample SQLite</span>
        </Button>
      </div>

      {/* Features grid */}
      <div className="flex flex-col items-center gap-3 max-w-sm border-t border-border/60 pt-5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Everything stays in your browser. 100% client-side.</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-left w-full mt-1">
          <div className="flex items-start gap-1.5">
            <FileJson className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
            <span>JSON Tree View with search &amp; path copy</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Table className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <span>SQLite Table Browser with virtual rows</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>SQLite SQL Console (read-only safe)</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>Export table data to CSV &amp; JSON</span>
          </div>
        </div>
      </div>
    </div>
  );
};
