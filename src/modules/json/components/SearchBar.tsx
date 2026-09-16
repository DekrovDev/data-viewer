import React, { forwardRef } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../shared/components/ui/tooltip';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalMatches: number;
  currentMatchIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClear: () => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({
  searchQuery,
  onSearchChange,
  totalMatches,
  currentMatchIndex,
  onNext,
  onPrev,
  onClear,
}, ref) => {
  const hasQuery = searchQuery.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrev();
      } else {
        onNext();
      }
    } else if (e.key === 'Escape') {
      onClear();
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/70 bg-card/40">
        <div className="relative flex-1 flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2 text-muted-foreground pointer-events-none" />
          <input
            ref={ref}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search keys and values... (Ctrl+F)"
            className="w-full h-7 pl-7 pr-7 rounded bg-background/70 border border-input text-xs placeholder:text-muted-foreground/60 text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {hasQuery && (
          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant={totalMatches > 0 ? 'info' : 'muted'}
              className="font-mono text-[10px] h-6 px-1.5 font-normal"
            >
              {totalMatches > 0
                ? `${currentMatchIndex + 1} of ${totalMatches}`
                : '0 matches'}
            </Badge>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="iconXs"
                  onClick={onPrev}
                  disabled={totalMatches === 0}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous match (Shift+Enter)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="iconXs"
                  onClick={onNext}
                  disabled={totalMatches === 0}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next match (Enter)</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
});

SearchBar.displayName = 'SearchBar';
