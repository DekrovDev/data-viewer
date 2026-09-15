import React, { useState, useEffect, useCallback } from 'react';
import { JsonValue } from '../types/json';
import { JsonTreeNode } from './JsonTreeNode';
import { toast } from 'sonner';
import { formatJsonPath } from '../lib/jsonPath';

interface JsonTreeProps {
  data: JsonValue;
  sortKeys: boolean;
  activeAncestors: Set<string>;
  activeMatchPath?: string;
  searchQuery?: string;
  expandAllTrigger?: number;
  collapseAllTrigger?: number;
}

const MAX_SAFE_EXPAND_NODES = 1500;

export const JsonTree: React.FC<JsonTreeProps> = ({
  data,
  sortKeys,
  activeAncestors,
  activeMatchPath,
  searchQuery,
  expandAllTrigger,
  collapseAllTrigger,
}) => {
  // Set of formatted path strings that are currently expanded
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    // Initial expansion: expand root and 1st level
    const initial = new Set<string>();
    initial.add('$');

    if (data && typeof data === 'object') {
      if (Array.isArray(data)) {
        for (let i = 0; i < Math.min(data.length, 10); i++) {
          initial.add(formatJsonPath([i]));
        }
      } else {
        for (const key of Object.keys(data)) {
          initial.add(formatJsonPath([key]));
        }
      }
    }

    return initial;
  });

  // When search match changes, auto-expand all ancestor nodes so the match is revealed
  useEffect(() => {
    if (activeAncestors.size > 0) {
      setExpandedPaths((prev) => {
        let changed = false;
        const next = new Set(prev);
        for (const ancestor of activeAncestors) {
          if (!next.has(ancestor)) {
            next.add(ancestor);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [activeAncestors]);

  // Handle Expand All with safety limit
  useEffect(() => {
    if (expandAllTrigger === undefined || expandAllTrigger === 0) return;

    // Collect all collection paths
    const allPaths = new Set<string>();
    let collectionCount = 0;
    let hitLimit = false;

    function collectPaths(val: JsonValue, currentPath: (string | number)[]) {
      if (collectionCount > MAX_SAFE_EXPAND_NODES) {
        hitLimit = true;
        return;
      }

      if (val !== null && typeof val === 'object') {
        collectionCount++;
        allPaths.add(formatJsonPath(currentPath));

        if (Array.isArray(val)) {
          for (let i = 0; i < val.length; i++) {
            collectPaths(val[i], [...currentPath, i]);
          }
        } else {
          for (const key of Object.keys(val)) {
            collectPaths(val[key], [...currentPath, key]);
          }
        }
      }
    }

    collectPaths(data, []);

    setExpandedPaths(allPaths);

    if (hitLimit) {
      toast.warning(`Expanded the first ${MAX_SAFE_EXPAND_NODES} collections to prevent freezing.`);
    } else {
      toast.success('All nodes expanded');
    }
  }, [expandAllTrigger, data]);

  // Handle Collapse All
  useEffect(() => {
    if (collapseAllTrigger === undefined || collapseAllTrigger === 0) return;
    setExpandedPaths(new Set<string>());
    toast.success('All nodes collapsed');
  }, [collapseAllTrigger]);

  const handleTogglePath = useCallback((pathStr: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(pathStr)) {
        next.delete(pathStr);
      } else {
        next.add(pathStr);
      }
      return next;
    });
  }, []);

  const handleCopyPath = useCallback((pathStr: string) => {
    navigator.clipboard.writeText(pathStr)
      .then(() => {
        toast.success('Path copied');
      })
      .catch(() => {
        toast.error('Failed to copy path to clipboard');
      });
  }, []);

  const handleCopyValue = useCallback((val: JsonValue) => {
    const text = typeof val === 'string' ? val : JSON.stringify(val, null, 2);
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success('Value copied');
      })
      .catch(() => {
        toast.error('Failed to copy value');
      });
  }, []);

  return (
    <div className="p-3 select-text overflow-auto h-full text-xs">
      <JsonTreeNode
        value={data}
        path={[]}
        depth={0}
        expandedPaths={expandedPaths}
        onTogglePath={handleTogglePath}
        onCopyPath={handleCopyPath}
        onCopyValue={handleCopyValue}
        sortKeys={sortKeys}
        activeMatchPath={activeMatchPath}
        searchQuery={searchQuery}
      />
    </div>
  );
};
