import React, { createContext, useContext } from 'react';
import { JsonValue } from '../types/json';

export interface TreeContextValue {
  sortKeys: boolean;
  searchQuery: string;
  activeMatchPath?: string;
  ancestorPaths: Set<string>;
  expandDepth: number;
  expandSignal: number;
  collapseSignal: number;
  onCopyPath: (pathStr: string) => void;
  onCopyValue: (val: JsonValue) => void;
  onCopySubtree: (val: JsonValue) => void;
}

const TreeContext = createContext<TreeContextValue | null>(null);

export const TreeContextProvider: React.FC<{
  value: TreeContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return <TreeContext.Provider value={value}>{children}</TreeContext.Provider>;
};

export function useTreeContext(): TreeContextValue {
  const ctx = useContext(TreeContext);
  if (!ctx) {
    throw new Error('useTreeContext must be used within a TreeContextProvider');
  }
  return ctx;
}
