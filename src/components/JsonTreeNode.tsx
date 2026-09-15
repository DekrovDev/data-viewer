import React, { useMemo } from 'react';
import { JsonValue, JsonPathSegment } from '../types/json';
import { formatJsonPath } from '../lib/jsonPath';
import { 
  ChevronRight, 
  ChevronDown, 
  Copy, 
  Brackets, 
  Braces 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface JsonTreeNodeProps {
  keyName?: string | number;
  value: JsonValue;
  path: JsonPathSegment[];
  isLast?: boolean;
  depth?: number;
  expandedPaths: Set<string>;
  onTogglePath: (pathStr: string) => void;
  onCopyPath: (pathStr: string) => void;
  onCopyValue: (val: JsonValue) => void;
  sortKeys: boolean;
  activeMatchPath?: string;
  searchQuery?: string;
}

// Highlights matching substring within text
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
  expandedPaths,
  onTogglePath,
  onCopyPath,
  onCopyValue,
  sortKeys,
  activeMatchPath,
  searchQuery,
}) => {
  const formattedPath = useMemo(() => formatJsonPath(path), [path]);
  const isExpanded = expandedPaths.has(formattedPath);
  const isActiveMatch = activeMatchPath === formattedPath;

  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isCollection = isObject || isArray;

  // Object keys optionally sorted
  const objectEntries = useMemo(() => {
    if (!isObject) return [];
    const entries = Object.entries(value as Record<string, JsonValue>);
    if (sortKeys) {
      return [...entries].sort(([a], [b]) => a.localeCompare(b));
    }
    return entries;
  }, [isObject, value, sortKeys]);

  const collectionSize = isArray 
    ? (value as unknown[]).length 
    : isObject 
      ? objectEntries.length 
      : 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCollection) {
      onTogglePath(formattedPath);
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

  return (
    <div className="font-mono text-[12px] leading-5 select-text">
      {/* Node Row */}
      <div 
        className={`group flex items-center gap-1 hover:bg-muted/40 py-0.5 px-1 rounded transition-colors ${
          isActiveMatch ? 'bg-primary/15 ring-1 ring-primary/40' : ''
        }`}
      >
        {/* Toggle Arrow */}
        {isCollection ? (
          <button
            type="button"
            onClick={handleToggle}
            className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Key name */}
        {keyName !== undefined && (
          <div className="flex items-center gap-0.5 shrink-0">
            <span 
              onClick={handleToggle}
              className={`cursor-pointer ${
                typeof keyName === 'number' 
                  ? 'text-muted-foreground text-[11px]' 
                  : 'text-sky-300/90 font-medium'
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
              <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-semibold">
                <Brackets className="w-3 h-3 text-sky-400" />
                <span>Array({collectionSize})</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-semibold">
                <Braces className="w-3 h-3 text-amber-400" />
                <span>Object({collectionSize})</span>
              </span>
            )}

            {!isExpanded && (
              <span className="text-zinc-500 text-[11px]">
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
              <span className="text-emerald-400">
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
        {!isLast && <span className="text-zinc-600">,</span>}

        {/* Hover Action Buttons */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-auto pl-2 shrink-0 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCopyPath}
                className="h-5 px-1.5 rounded text-[10px] bg-muted hover:bg-accent text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Copy className="w-2.5 h-2.5" />
                <span>Path</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Copy path: <span className="font-mono font-semibold">{formattedPath}</span>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCopyValue}
                className="h-5 px-1.5 rounded text-[10px] bg-muted hover:bg-accent text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Copy className="w-2.5 h-2.5" />
                <span>Value</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Copy value</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Expanded Children */}
      {isCollection && isExpanded && (
        <div className="pl-4 ml-2 border-l border-border/60">
          {isArray ? (
            (value as JsonValue[]).map((childVal, index, arr) => (
              <JsonTreeNode
                key={index}
                keyName={index}
                value={childVal}
                path={[...path, index]}
                isLast={index === arr.length - 1}
                depth={depth + 1}
                expandedPaths={expandedPaths}
                onTogglePath={onTogglePath}
                onCopyPath={onCopyPath}
                onCopyValue={onCopyValue}
                sortKeys={sortKeys}
                activeMatchPath={activeMatchPath}
                searchQuery={searchQuery}
              />
            ))
          ) : (
            objectEntries.map(([k, childVal], index, arr) => (
              <JsonTreeNode
                key={k}
                keyName={k}
                value={childVal}
                path={[...path, k]}
                isLast={index === arr.length - 1}
                depth={depth + 1}
                expandedPaths={expandedPaths}
                onTogglePath={onTogglePath}
                onCopyPath={onCopyPath}
                onCopyValue={onCopyValue}
                sortKeys={sortKeys}
                activeMatchPath={activeMatchPath}
                searchQuery={searchQuery}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
});

JsonTreeNode.displayName = 'JsonTreeNode';
