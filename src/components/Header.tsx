import React from 'react';
import { 
  Braces, 
  ShieldCheck, 
  History, 
  Download, 
  Sparkles,
  Github
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { downloadJsonFile } from '../lib/file';
import { toast } from 'sonner';

interface HeaderProps {
  onOpenHistory: () => void;
  historyCount: number;
  onLoadSample: () => void;
  rawJson: string;
  isValidJson: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  historyCount,
  onLoadSample,
  rawJson,
  isValidJson,
}) => {
  const handleDownload = () => {
    if (!rawJson.trim()) {
      toast.error('Nothing to download');
      return;
    }
    downloadJsonFile(rawJson, 'formatted.json');
    toast.success('JSON downloaded');
  };

  return (
    <TooltipProvider delayDuration={300}>
      <header className="h-11 border-b border-border bg-card/70 backdrop-blur px-3 flex items-center justify-between select-none">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <Braces className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs tracking-tight text-foreground">
              JSON Viewer
            </span>
            <Badge variant="muted" className="text-[9px] py-0 px-1 font-mono">
              v1.0
            </Badge>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-2 border-l border-border/60 text-muted-foreground text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
            <span className="text-[11px] text-muted-foreground/80">
              Your JSON never leaves your browser
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                onClick={onLoadSample}
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="hidden md:inline">Sample</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Load sample JSON data</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                onClick={onOpenHistory}
                className="gap-1.5 text-muted-foreground hover:text-foreground relative"
              >
                <History className="w-3 h-3" />
                <span>History</span>
                {historyCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-mono flex items-center justify-center -ml-0.5">
                    {historyCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>View recent JSON history (stored locally)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="iconXs"
                onClick={handleDownload}
                disabled={!isValidJson && !rawJson.trim()}
                className="text-muted-foreground hover:text-foreground"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download as .json</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center h-6 w-6 text-muted-foreground hover:text-foreground rounded transition-colors hover:bg-accent"
              >
                <Github className="w-3.5 h-3.5" />
              </a>
            </TooltipTrigger>
            <TooltipContent>GitHub Repository</TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
};
