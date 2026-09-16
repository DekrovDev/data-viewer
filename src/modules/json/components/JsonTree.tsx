import React, { useCallback, useMemo } from 'react';
import { JsonValue } from '../types/json';
import { JsonTreeNode } from './JsonTreeNode';
import { TreeContextProvider, TreeContextValue } from './TreeContext';
import { toast } from 'sonner';

interface JsonTreeProps {
  data: JsonValue;
  sortKeys: boolean;
  activeAncestors: Set<string>;
  activeMatchPath?: string;
  searchQuery?: string;
  expandDepth?: number;
  expandSignal?: number;
  collapseSignal?: number;
}

export const JsonTree: React.FC<JsonTreeProps> = ({
  data,
  sortKeys,
  activeAncestors,
  activeMatchPath,
  searchQuery = '',
  expandDepth = 0,
  expandSignal = 0,
  collapseSignal = 0,
}) => {
  const handleCopyPath = useCallback((pathStr: string) => {
    navigator.clipboard.writeText(pathStr)
      .then(() => {
        toast.success('Path copied');
      })
      .catch(() => {
        toast.error('Failed to copy path');
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

  const handleCopySubtree = useCallback((val: JsonValue) => {
    const text = JSON.stringify(val, null, 2);
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success('Subtree JSON copied');
      })
      .catch(() => {
        toast.error('Failed to copy JSON subtree');
      });
  }, []);

  const contextValue = useMemo<TreeContextValue>(() => ({
    sortKeys,
    searchQuery,
    activeMatchPath,
    ancestorPaths: activeAncestors,
    expandDepth,
    expandSignal,
    collapseSignal,
    onCopyPath: handleCopyPath,
    onCopyValue: handleCopyValue,
    onCopySubtree: handleCopySubtree,
  }), [
    sortKeys,
    searchQuery,
    activeMatchPath,
    activeAncestors,
    expandDepth,
    expandSignal,
    collapseSignal,
    handleCopyPath,
    handleCopyValue,
    handleCopySubtree,
  ]);

  return (
    <TreeContextProvider value={contextValue}>
      <div className="p-2.5 select-text overflow-auto h-full text-xs">
        <JsonTreeNode
          value={data}
          path={[]}
          depth={0}
        />
      </div>
    </TreeContextProvider>
  );
};
