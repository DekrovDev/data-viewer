import React from 'react';
import { Braces, Sparkles, Upload, FileCode } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  onLoadSample: () => void;
  onOpenFilePicker: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onLoadSample,
  onOpenFilePicker,
}) => {
  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center bg-card/10 select-none">
      <div className="w-12 h-12 rounded-xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground mb-4">
        <Braces className="w-6 h-6 text-primary/80" />
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-1">
        JSON Output & Tree Inspector
      </h3>
      <p className="text-xs text-muted-foreground max-w-sm mb-5 leading-relaxed">
        Paste or type JSON in the editor on the left, drag & drop a <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono text-foreground/80">.json</code> file, or start with our sample data.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <Button
          variant="default"
          size="sm"
          onClick={onLoadSample}
          className="gap-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Load Sample JSON</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenFilePicker}
          className="gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Open .json File</span>
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 max-w-xs text-left text-[11px] text-muted-foreground border-t border-border/60 pt-4">
        <div className="flex items-start gap-1.5">
          <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
          <span>Safe path copying with bracket & dot notation</span>
        </div>
        <div className="flex items-start gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <span>Real-time search across keys & values</span>
        </div>
      </div>
    </div>
  );
};
