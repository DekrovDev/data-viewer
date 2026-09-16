import React from 'react';
import { 
  Database,
  ShieldCheck, 
  History, 
  Download, 
  Sparkles,
  Github,
  FileJson,
  Info
} from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { AboutModal } from './AboutModal';
import { downloadFile } from '../../core/files/file';
import { DataFormat } from '../../core/detection/types';
import { toast } from 'sonner';

interface HeaderProps {
  activeFormat: DataFormat;
  onSelectFormat: (format: DataFormat) => void;
  onOpenHistory?: () => void;
  historyCount?: number;
  onLoadSample: () => void;
  currentDataText?: string;
  isValidData?: boolean;
  onDownload?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeFormat,
  onSelectFormat,
  onOpenHistory,
  historyCount = 0,
  onLoadSample,
  currentDataText,
  isValidData,
  onDownload,
}) => {
  const [isAboutOpen, setIsAboutOpen] = React.useState(false);

  const handleDefaultDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    if (!currentDataText || !currentDataText.trim()) {
      toast.error('Nothing to download');
      return;
    }
    downloadFile(currentDataText, 'data.json', 'application/json;charset=utf-8');
    toast.success('File downloaded');
  };

  return (
    <TooltipProvider delayDuration={300}>
      <header className="h-11 border-b border-border bg-card/70 backdrop-blur px-3 flex items-center justify-between select-none">
        {/* Left: Brand / Title & Format Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Database className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-xs tracking-tight text-foreground">
              Data Viewer
            </span>
          </div>

          {/* Format Switcher: JSON / SQLite */}
          <div className="flex items-center gap-1 bg-muted/70 p-0.5 rounded-md border border-border/60">
            <button
              onClick={() => onSelectFormat('json')}
              className={`flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium rounded transition-all font-mono ${
                activeFormat === 'json'
                  ? 'bg-background text-foreground shadow-xs border border-border/40 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileJson className="w-3 h-3 text-sky-400" />
              <span>JSON</span>
            </button>

            <button
              onClick={() => onSelectFormat('sqlite')}
              className={`flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium rounded transition-all font-mono ${
                activeFormat === 'sqlite'
                  ? 'bg-background text-foreground shadow-xs border border-border/40 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>SQLite</span>
            </button>
          </div>

          {/* Tagline */}
          <div className="hidden xl:flex items-center text-[11px] text-muted-foreground/80 pl-2 border-l border-border/60">
            <span>Fast, private, local data inspection.</span>
          </div>

          {/* Privacy Badge */}
          <div className="hidden md:flex items-center gap-1.5 text-muted-foreground text-[11px] pl-2 border-l border-border/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80 shrink-0" />
            <span className="text-[11px] text-muted-foreground/80 truncate">
              Your data never leaves your browser
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
                <span className="hidden sm:inline">
                  Sample {activeFormat === 'sqlite' ? 'DB' : 'JSON'}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Load sample {activeFormat === 'sqlite' ? 'SQLite database' : 'JSON dataset'}
            </TooltipContent>
          </Tooltip>

          {activeFormat === 'json' && onOpenHistory && (
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
              <TooltipContent>View recent document history (stored locally)</TooltipContent>
            </Tooltip>
          )}

          {activeFormat === 'json' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="iconXs"
                  onClick={handleDefaultDownload}
                  disabled={!isValidData && (!currentDataText || !currentDataText.trim())}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download current JSON</TooltipContent>
            </Tooltip>
          )}

          {/* Compact About Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setIsAboutOpen(true)}
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <Info className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">About</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>About Data Viewer</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href="https://github.com/DekrovDev/data-viewer"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-6 w-6 text-muted-foreground hover:text-foreground rounded transition-colors hover:bg-accent"
              >
                <Github className="w-3.5 h-3.5" />
              </a>
            </TooltipTrigger>
            <TooltipContent>GitHub Repository (DekrovDev/data-viewer)</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </TooltipProvider>
  );
};
