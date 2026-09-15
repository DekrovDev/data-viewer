import React from 'react';
import { ViewMode } from '../types/json';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { FolderTree, FileCode, FileText, ArrowDownAZ, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';

interface ViewTabsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortKeys: boolean;
  onToggleSortKeys: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export const ViewTabs: React.FC<ViewTabsProps> = ({
  viewMode,
  onViewModeChange,
  sortKeys,
  onToggleSortKeys,
  onExpandAll,
  onCollapseAll,
}) => {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/80 bg-muted/20 select-none">
        {/* View Mode Switcher */}
        <div className="flex items-center bg-muted/60 p-0.5 rounded-md border border-border/50">
          <button
            type="button"
            onClick={() => onViewModeChange('tree')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-all ${
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
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-all ${
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
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-all ${
              viewMode === 'raw'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>Raw</span>
          </button>
        </div>

        {/* Controls specific to Tree View */}
        {viewMode === 'tree' && (
          <div className="flex items-center gap-1">
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
                  <span className="hidden sm:inline">Sort Keys</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sort object keys alphabetically in view</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={onExpandAll}
                  className="h-6 text-[11px] gap-1 px-1.5 text-muted-foreground hover:text-foreground"
                >
                  <ChevronsUpDown className="w-3 h-3" />
                  <span className="hidden sm:inline">Expand All</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Expand all nodes</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={onCollapseAll}
                  className="h-6 text-[11px] gap-1 px-1.5 text-muted-foreground hover:text-foreground"
                >
                  <ChevronsDownUp className="w-3 h-3" />
                  <span className="hidden sm:inline">Collapse All</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Collapse all nodes to root</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
