import React from 'react';
import { ViewMode } from '../types/json';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  FolderTree, 
  FileCode, 
  FileText, 
  ArrowDownAZ, 
  ChevronsDownUp, 
  ChevronsUpDown,
  Layers,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface ViewTabsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortKeys: boolean;
  onToggleSortKeys: () => void;
  onExpandLevel: (level: number) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  canExpandAll: boolean;
  isInputHidden: boolean;
  onToggleInputHidden: () => void;
}

export const ViewTabs: React.FC<ViewTabsProps> = ({
  viewMode,
  onViewModeChange,
  sortKeys,
  onToggleSortKeys,
  onExpandLevel,
  onExpandAll,
  onCollapseAll,
  canExpandAll,
  isInputHidden,
  onToggleInputHidden,
}) => {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/80 bg-muted/20 select-none gap-2">
        {/* Left: Input Toggle + View Mode Switcher */}
        <div className="flex items-center gap-1.5">
          {/* Toggle Hide/Show Input Panel */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isInputHidden ? 'secondary' : 'ghost'}
                size="xs"
                onClick={onToggleInputHidden}
                className="gap-1 h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
              >
                {isInputHidden ? (
                  <>
                    <PanelLeftOpen className="w-3.5 h-3.5 text-primary" />
                    <span>Show Input</span>
                  </>
                ) : (
                  <>
                    <PanelLeftClose className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hide Input</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isInputHidden ? 'Show left JSON input panel' : 'Hide left JSON input panel (maximize viewer)'}
            </TooltipContent>
          </Tooltip>

          <div className="h-4 w-[1px] bg-border/80 mx-0.5" />

          {/* Mode Switcher */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-md border border-border/50">
            <button
              type="button"
              onClick={() => onViewModeChange('tree')}
              className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded transition-all ${
                viewMode === 'tree'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-sky-400" />
              <span>Tree</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange('pretty')}
              className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded transition-all ${
                viewMode === 'pretty'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pretty</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange('raw')}
              className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded transition-all ${
                viewMode === 'raw'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>Raw</span>
            </button>
          </div>
        </div>

        {/* Right: Controls specific to Tree View */}
        {viewMode === 'tree' && (
          <div className="flex items-center gap-1 flex-wrap justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={sortKeys ? 'secondary' : 'ghost'}
                  size="xs"
                  onClick={onToggleSortKeys}
                  className={`h-6 text-[11px] gap-1 px-1.5 ${
                    sortKeys ? 'text-sky-400 border border-sky-500/30' : 'text-muted-foreground'
                  }`}
                >
                  <ArrowDownAZ className="w-3 h-3" />
                  <span className="hidden md:inline">Sort Keys</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sort object keys alphabetically in view</TooltipContent>
            </Tooltip>

            {/* Expand 1 Level */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onExpandLevel(1)}
                  className="h-6 text-[11px] gap-1 px-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Layers className="w-3 h-3 text-zinc-400" />
                  <span>+1 Level</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Expand nodes up to 1 level deep</TooltipContent>
            </Tooltip>

            {/* Expand 2 Levels */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onExpandLevel(2)}
                  className="h-6 text-[11px] gap-1 px-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Layers className="w-3 h-3 text-sky-400" />
                  <span>+2 Levels</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Expand nodes up to 2 levels deep</TooltipContent>
            </Tooltip>

            {/* Collapse All */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={onCollapseAll}
                  className="h-6 text-[11px] gap-1 px-1.5 text-muted-foreground hover:text-foreground"
                >
                  <ChevronsDownUp className="w-3 h-3" />
                  <span className="hidden lg:inline">Collapse All</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Collapse all nodes back to root</TooltipContent>
            </Tooltip>

            {/* Expand All (Only enabled for small JSON) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={onExpandAll}
                    disabled={!canExpandAll}
                    className="h-6 text-[11px] gap-1 px-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
                  >
                    <ChevronsUpDown className="w-3 h-3" />
                    <span className="hidden xl:inline">Expand All</span>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {canExpandAll
                  ? 'Expand all nodes'
                  : 'Expand All disabled for large JSON to maintain performance. Use +1 / +2 Levels.'}
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
