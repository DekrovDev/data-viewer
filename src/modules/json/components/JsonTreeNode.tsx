import React, { useState, useEffect, useMemo } from 'react';
import { JsonValue, JsonPathSegment } from '../types/json';
import { formatJsonPath } from '../lib/jsonPath';
import { useTreeContext } from './TreeContext';
import { 
  ChevronRight, 
  ChevronDown, 
  Copy, 
  Link2, 
  FileCode2, 
  Brackets, 
  Braces 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../shared/components/ui/tooltip';

interface JsonTreeNodeProps {
  keyName?: string | number;
  value: JsonValue;
  path: JsonPathSegment[];
  isLast?: boolean;
  depth?: number;
}

const CHUNK_SIZE = 100;

// Memoized highlighted text for search queries
const HighlightedText: React.FC<{ text: string; query?: string }> = React.memo(({ text, query }) => {
  if (!query || !query.trim()) {
    return <span>{text}</span>;
  }

  const cleanQuery = query.trim().toLowerCase();
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(cleanQuery);

  if (index === -1) {
    return <span>{text}</span>;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + cleanQuery.length);
  const after = text.slice(index + cleanQuery.length);

  return (
    <span>
      {before}
      <mark className="bg-amber-500/30 text-amber-200 ring-1 ring-amber-500/50 rounded-xs px-0.5 font-semibold">
        {match}
      </mark>
      <HighlightedText text={after} query={query} />
    </span>
  );
});

export const JsonTreeNode: React.FC<JsonTreeNodeProps> = React.memo(({
  keyName,
  value,
  path,
  isLast = true,
  depth = 0,
}) => {
  const {
    sortKeys,
    searchQuery,
    activeMatchPath,
    ancestorPaths,
    expandDepth,
    expandSignal,
    collapseSignal,
    onCopyPath,
    onCopyValue,
    onCopySubtree,
  } = useTreeContext();

  // Lazy expansion: ONLY root (depth 0) is expanded by default!
  // All nested collections are collapsed by default.
  const [isExpanded, setIsExpanded] = useState<boolean>(depth === 0);

  // Chunk rendering for large arrays (renders in batches of 100)
  const [visibleCount, setVisibleCount] = useState<number>(CHUNK_SIZE);

  const formattedPath = useMemo(() => formatJsonPath(path), [path]);
  const isActiveMatch = activeMatchPath === formattedPath;

  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isCollection = isObject || isArray;

  // Listen to collapse all signal
  useEffect(() => {
    if (collapseSignal > 0) {
      setIsExpanded(depth === 0);
    }
  }, [collapseSignal, depth]);

  // Listen to expand to specific level signal
  useEffect(() => {
    if (expandSignal > 0) {
      if (depth <= expandDepth) {
        setIsExpanded(true);
      } else {
        setIsExpanded(false);
      }
    }
  }, [expandSignal, depth, expandDepth]);

  // Auto-expand if this node is an ancestor of the active search match
  useEffect(() => {
    if (ancestorPaths.has(formattedPath)) {
      setIsExpanded(true);
    }
  }, [ancestorPaths, formattedPath]);

  // Object keys optionally sorted
  const objectEntries = useMemo(() => {
    if (!isObject) return [];
    const entries = Object.entries(value as Record<string, JsonValue>);
    if (sortKeys) {
      return [...entries].sort(([a], [b]) => a.localeCompare(b));
    }
    return entries;
  }, [isObject, value, sortKeys]);

  const arrayItems = isArray ? (value as JsonValue[]) : [];
  const collectionSize = isArray ? arrayItems.length : isObject ? objectEntries.length : 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCollection) {
      setIsExpanded((prev) => !prev);
    }
  };

  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyPath(formattedPath);
  };

  const handleCopyValue = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyValue(value);
  };

  const handleCopySubtree = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopySubtree(value);
  };

  return (
    <div className="font-mono text-[11.5px] leading-5 select-text">
      {/* Node Row */}
      <div 
        className={`group flex items-center gap-1 hover:bg-muted/40 py-0.5 px-1 rounded transition-colors ${
          isActiveMatch ? 'bg-primary/20 ring-1 ring-primary/50' : ''
        }`}
      >
        {/* Toggle Arrow */}
        {isCollection ? (
          <button
            type="button"
            onClick={handleToggle}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            className="w-3.5 h-3.5 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        {/* Key name */}
        {keyName !== undefined && (
          <div className="flex items-center gap-0.5 shrink-0">
            <span 
              onClick={handleToggle}
              className={`cursor-pointer select-none ${
                typeof keyName === 'number' 
                  ? 'text-muted-foreground text-[11px]' 
                  : 'text-sky-300 font-medium'
              }`}
            >
              {typeof keyName === 'number' ? (
                `${keyName}`
              ) : (
                <>
                  <span className="text-zinc-500">"</span>
                  <HighlightedText text={String(keyName)} query={searchQuery} />
                  <span className="text-zinc-500">"</span>
                </>
              )}
            </span>
            <span className="text-zinc-500 mr-1">:</span>
          </div>
        )}

        {/* Value Display */}
        {isCollection ? (
          <div 
            onClick={handleToggle}
            className="flex items-center gap-1.5 cursor-pointer text-muted-foreground select-none"
          >
            {isArray ? (
              <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
                <Brackets className="w-3 h-3 text-sky-400/80" />
                <span>Array({collectionSize})</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
                <Braces className="w-3 h-3 text-amber-400/80" />
                <span>Object({collectionSize})</span>
              </span>
            )}

            {!isExpanded && (
              <span className="text-zinc-500 text-[10.5px]">
                {isArray ? '[...]' : '{...}'}
              </span>
            )}
          </div>
        ) : (
          /* Primitive Values */
          <div className="truncate">
            {value === null && (
              <span className="text-zinc-500 italic">
                <HighlightedText text="null" query={searchQuery} />
              </span>
            )}
            {typeof value === 'boolean' && (
              <span className="text-purple-400 font-semibold">
                <HighlightedText text={String(value)} query={searchQuery} />
              </span>
            )}
            {typeof value === 'number' && (
              <span className="text-emerald-400 font-medium">
                <HighlightedText text={String(value)} query={searchQuery} />
              </span>
            )}
            {typeof value === 'string' && (
              <span className="text-amber-300/95">
                <span className="text-zinc-500">"</span>
                <HighlightedText text={value} query={searchQuery} />
                <span className="text-zinc-500">"</span>
              </span>
            )}
          </div>
        )}

        {/* Trailing comma */}
        {!isLast && <span className="text-zinc-600 select-none">,</span>}

        {/* Compact Hover Action Icon Buttons */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto pl-2 shrink-0 transition-opacity">
          {/* Copy Value */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCopyValue}
                aria-label="Copy Value"
                className="w-4 h-4 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center justify-center transition-colors"
              >
                <Copy className="w-2.5 h-2.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Copy value</TooltipContent>
          </Tooltip>

          {/* Copy Path */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCopyPath}
                aria-label="Copy Path"
                className="w-4 h-4 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center justify-center transition-colors"
              >
                <Link2 className="w-2.5 h-2.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Copy path: <span className="font-mono font-semibold">{formattedPath}</span>
            </TooltipContent>
          </Tooltip>

          {/* Copy JSON Subtree (for collections) */}
          {isCollection && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleCopySubtree}
                  aria-label="Copy Subtree JSON"
                  className="w-4 h-4 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center justify-center transition-colors"
                >
                  <FileCode2 className="w-2.5 h-2.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Copy JSON subtree</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Lazy Rendered Children: created in DOM ONLY when isExpanded is true! */}
      {isCollection && isExpanded && (
        <div className="pl-3.5 ml-1.5 border-l border-border/40 hover:border-border/80 transition-colors">
          {isArray ? (
            <>
              {/* Chunk rendering: render up to visibleCount items */}
              {arrayItems.slice(0, visibleCount).map((childVal, index) => (
                <JsonTreeNode
                  key={index}
                  keyName={index}
                  value={childVal}
                  path={[...path, index]}
                  isLast={index === arrayItems.length - 1}
                  depth={depth + 1}
                />
              ))}

              {/* Pagination controls for large arrays */}
              {arrayItems.length > visibleCount && (
                <div className="flex items-center gap-2 py-1 my-0.5 px-2 text-[11px] text-muted-foreground bg-muted/20 border border-border/40 rounded">
                  <span>
                    Showing {visibleCount} of {arrayItems.length} items
                  </span>
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + CHUNK_SIZE)}
                    className="text-primary hover:underline font-medium ml-1"
                  >
                    Show next {Math.min(CHUNK_SIZE, arrayItems.length - visibleCount)}
                  </button>
                  {arrayItems.length - visibleCount > CHUNK_SIZE && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount(arrayItems.length)}
                      className="text-muted-foreground hover:text-foreground hover:underline ml-2"
                    >
                      Show all ({arrayItems.length})
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            objectEntries.map(([k, childVal], index, arr) => (
              <JsonTreeNode
                key={k}
                keyName={k}
                value={childVal}
                path={[...path, k]}
                isLast={index === arr.length - 1}
                depth={depth + 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
});

JsonTreeNode.displayName = 'JsonTreeNode';
