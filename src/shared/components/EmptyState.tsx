import React from 'react';
import {
  Database,
  Sparkles,
  Upload,
  FileJson,
  ShieldCheck,
  Terminal,
  Table,
  FileCode,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface EmptyStateProps {
  activeFormat?: 'json' | 'sqlite';
  onLoadSampleJson: () => void;
  onLoadSampleSqlite: () => void;
  onOpenFilePicker: () => void;
  onPasteJson?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onLoadSampleJson,
  onLoadSampleSqlite,
  onOpenFilePicker,
  onPasteJson,
}) => {
  return (
    <div className="flex-1 h-full overflow-y-auto flex flex-col items-center justify-center p-6 md:p-10 select-none bg-background/50">
      <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-6">
        {/* Main Logo & Title */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <Database className="w-7 h-7 text-primary" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Data Viewer
              </h1>
              <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                v1.0
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Fast, private data inspection and SQL workspace. Runs entirely in your browser.
            </p>
          </div>

          {/* Supported Format Pills */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[11px] text-muted-foreground/80 font-medium">Supported formats:</span>
            <Badge variant="info" className="text-[10px] font-mono px-2 py-0.5 font-semibold">
              <FileJson className="w-3 h-3 mr-1" />
              JSON (.json)
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-mono px-2 py-0.5 font-semibold bg-blue-950/40 text-blue-300 border border-blue-800/50">
              <Database className="w-3 h-3 mr-1" />
              SQLite (.db, .sqlite)
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Button
            variant="default"
            size="sm"
            onClick={onOpenFilePicker}
            className="gap-1.5 shadow-sm font-medium"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Open File</span>
          </Button>

          {onPasteJson && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onPasteJson}
              className="gap-1.5 font-medium"
            >
              <FileCode className="w-3.5 h-3.5 text-sky-400" />
              <span>Write / Paste JSON</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onLoadSampleJson}
            className="gap-1.5 font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sample JSON</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onLoadSampleSqlite}
            className="gap-1.5 font-medium"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Sample SQLite</span>
          </Button>
        </div>

        {/* Instructions Guide */}
        <div className="w-full bg-card/60 border border-border/80 rounded-xl p-5 text-left space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5 font-mono">
              <Layers className="w-3.5 h-3.5 text-primary" />
              How to get started
            </span>
            <span className="text-[11px] text-muted-foreground">3 simple ways</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            {/* Step 1 */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1.5">
              <div className="flex items-center gap-1.5 text-foreground font-semibold text-[11px]">
                <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-mono font-bold">
                  1
                </span>
                <span>Open or Drag & Drop</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Drag any <code className="text-foreground bg-muted px-1 py-0.2 rounded font-mono">.json</code> or{' '}
                <code className="text-foreground bg-muted px-1 py-0.2 rounded font-mono">.db</code> file anywhere onto the page. Format is auto-detected.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1.5">
              <div className="flex items-center gap-1.5 text-foreground font-semibold text-[11px]">
                <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-mono font-bold">
                  2
                </span>
                <span>Explore & Query</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Browse JSON in lazy Tree View with JSONPath copy. For SQLite, inspect tables, schema, and run queries in the SQL Console.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1.5">
              <div className="flex items-center gap-1.5 text-foreground font-semibold text-[11px]">
                <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-mono font-bold">
                  3
                </span>
                <span>Export Data</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Format, minify, and save your JSON. Export SQLite query results or table pages directly to CSV or JSON with a click.
              </p>
            </div>
          </div>

          {/* Feature Highlights List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <Table className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Virtualized SQLite grid handling large tables</span>
            </div>
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Read-only SQL console with template queries</span>
            </div>
            <div className="flex items-center gap-2">
              <FileJson className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Interactive JSON tree with search &amp; depth expand</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Click sample buttons above to try without files</span>
            </div>
          </div>
        </div>

        {/* Privacy Callout Banner */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium text-foreground">
            100% Client-Side Privacy:
          </span>
          <span>Your files and queries never leave your device.</span>
        </div>
      </div>
    </div>
  );
};
