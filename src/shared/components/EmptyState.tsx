import React from 'react';
import { Database, Sparkles, Upload, FileCode, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

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
      <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground mb-4 shadow-sm">
        <Database className="w-7 h-7 text-primary/90" />
      </div>

      <h2 className="text-base font-semibold text-foreground mb-1">
        Data Viewer
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        Drop a data file here or paste in the editor
      </p>

      {/* Format Indicator */}
      <div className="flex items-center gap-1.5 mb-6">
        <span className="text-[11px] text-muted-foreground">Currently supported:</span>
        <Badge variant="info" className="text-[10px] font-mono px-2 py-0.5 font-semibold">
          JSON
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
          onClick={onLoadSample}
          className="gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Load Sample Data</span>
        </Button>
      </div>

      {/* Security note & features */}
      <div className="flex flex-col items-center gap-3 max-w-sm border-t border-border/60 pt-5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Everything stays in your browser. 100% client-side.</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-left w-full mt-1">
          <div className="flex items-start gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
            <span>Interactive Tree View with safe path copying</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>Real-time search across keys & values</span>
          </div>
        </div>
      </div>
    </div>
  );
};
