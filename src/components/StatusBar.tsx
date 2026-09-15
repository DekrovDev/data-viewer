import React from 'react';
import { ParseResult } from '../types/json';
import { formatBytes } from '../lib/jsonStats';
import { CheckCircle2, AlertCircle, Cpu } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface StatusBarProps {
  parseResult: ParseResult;
  isParsing?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ parseResult, isParsing }) => {
  return (
    <TooltipProvider delayDuration={300}>
      <footer className="h-7 border-t border-border bg-card/90 px-3 flex items-center justify-between text-[11px] font-mono select-none overflow-hidden">
        {/* Left side: Parsing status & statistics */}
        <div className="flex items-center gap-2 truncate">
          {isParsing ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Cpu className="w-3 h-3 animate-pulse text-sky-400" />
              <span>Parsing...</span>
            </span>
          ) : parseResult.isValid ? (
            <div className="flex items-center gap-2 text-muted-foreground truncate">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Valid JSON</span>
              </span>

              <span className="text-border">·</span>
              <span className="text-foreground/90 font-medium">
                {formatBytes(parseResult.stats.sizeBytes)}
              </span>

              <span className="text-border">·</span>
              <span>{parseResult.stats.keyCount} keys</span>

              <span className="text-border">·</span>
              <span>{parseResult.stats.objectCount} objects</span>

              <span className="text-border">·</span>
              <span>{parseResult.stats.arrayCount} arrays</span>

              <span className="text-border">·</span>
              <span>Depth {parseResult.stats.maxDepth}</span>

              <span className="hidden lg:inline text-border">·</span>
              <span className="hidden lg:inline">{parseResult.stats.primitiveCount} primitives</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-destructive font-medium truncate">
              <span className="flex items-center gap-1 shrink-0">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Invalid JSON</span>
              </span>

              {parseResult.line !== undefined && parseResult.column !== undefined && (
                <span className="bg-destructive/20 border border-destructive/30 text-destructive-foreground px-1 py-0.2 rounded text-[10px]">
                  Ln {parseResult.line}, Col {parseResult.column}
                </span>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-destructive/90 truncate cursor-help max-w-[300px] md:max-w-md">
                    {parseResult.error}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  {parseResult.error}
                  {parseResult.position !== undefined && ` (at position ${parseResult.position})`}
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Right side: Keyboard shortcuts hint */}
        <div className="hidden md:flex items-center gap-2 text-muted-foreground/70 shrink-0 text-[10px]">
          <span><kbd className="bg-muted px-1 py-0.5 rounded border border-border/80">Ctrl</kbd>+<kbd className="bg-muted px-1 py-0.5 rounded border border-border/80">Enter</kbd> Format</span>
          <span className="text-border">·</span>
          <span><kbd className="bg-muted px-1 py-0.5 rounded border border-border/80">Ctrl</kbd>+<kbd className="bg-muted px-1 py-0.5 rounded border border-border/80">F</kbd> Search</span>
          <span className="text-border">·</span>
          <span><kbd className="bg-muted px-1 py-0.5 rounded border border-border/80">Ctrl</kbd>+<kbd className="bg-muted px-1 py-0.5 rounded border border-border/80">Shift</kbd>+<kbd className="bg-muted px-1 py-0.5 rounded border border-border/80">C</kbd> Copy</span>
        </div>
      </footer>
    </TooltipProvider>
  );
};
