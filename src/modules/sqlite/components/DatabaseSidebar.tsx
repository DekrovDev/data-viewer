import React, { useState, useMemo } from 'react';
import {
  Database,
  Table,
  Layers,
  Terminal,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Info,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DatabaseOverviewInfo, DatabaseSchema } from '../types/sqlite';

interface DatabaseSidebarProps {
  overview: DatabaseOverviewInfo | null;
  schema: DatabaseSchema | null;
  selectedItem: { type: 'overview' | 'table' | 'sql'; name?: string };
  onSelectItem: (item: { type: 'overview' | 'table' | 'sql'; name?: string; isView?: boolean }) => void;
}

export const DatabaseSidebar: React.FC<DatabaseSidebarProps> = ({
  overview,
  schema,
  selectedItem,
  onSelectItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openSections, setOpenSections] = useState<{
    tables: boolean;
    views: boolean;
    indexes: boolean;
    triggers: boolean;
  }>({
    tables: true,
    views: true,
    indexes: false,
    triggers: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev [section] }));
  };

  const term = searchTerm.trim().toLowerCase();

  const filteredTables = useMemo(() => {
    if (!schema) return [];
    if (!term) return schema.tables;
    return schema.tables.filter((t) => t.name.toLowerCase().includes(term));
  }, [schema, term]);

  const filteredViews = useMemo(() => {
    if (!schema) return [];
    if (!term) return schema.views;
    return schema.views.filter((v) => v.name.toLowerCase().includes(term));
  }, [schema, term]);

  const filteredIndexes = useMemo(() => {
    if (!schema) return [];
    if (!term) return schema.indexes;
    return schema.indexes.filter((i) => i.name.toLowerCase().includes(term));
  }, [schema, term]);

  const filteredTriggers = useMemo(() => {
    if (!schema) return [];
    if (!term) return schema.triggers;
    return schema.triggers.filter((tr) => tr.name.toLowerCase().includes(term));
  }, [schema, term]);

  return (
    <aside className="w-64 border-r border-editor-border bg-gray-950 flex flex-col h-full select-none shrink-0">
      {/* Search Input */}
      <div className="p-2 border-b border-editor-border">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search schema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded pl-8 pr-7 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Items */}
      <div className="p-2 space-y-1 border-b border-editor-border">
        <button
          onClick={() => onSelectItem({ type: 'overview' })}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            selectedItem.type === 'overview'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-300 hover:bg-gray-900'
          }`}
        >
          <Info className="w-4 h-4 text-blue-400" />
          <span className="truncate">Overview</span>
        </button>

        <button
          onClick={() => onSelectItem({ type: 'sql' })}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            selectedItem.type === 'sql'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-300 hover:bg-gray-900'
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="truncate">SQL Console</span>
        </button>
      </div>

      {/* Accordion Lists */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
        {/* Tables Section */}
        <div>
          <button
            onClick={() => toggleSection('tables')}
            className="w-full flex items-center justify-between text-gray-400 hover:text-gray-200 py-1 text-[11px] font-semibold uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5">
              {openSections.tables ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <span>Tables</span>
            </div>
            <span className="bg-gray-800 text-gray-400 font-mono text-[10px] px-1.5 py-0.5 rounded">
              {schema ? schema.tables.length : 0}
            </span>
          </button>

          {openSections.tables && (
            <div className="mt-1 space-y-0.5 pl-2">
              {filteredTables.length === 0 ? (
                <div className="text-[11px] text-gray-600 py-1 pl-2 italic">
                  {schema ? 'No tables found' : 'Loading...'}
                </div>
              ) : (
                filteredTables.map((tbl) => {
                  const isSelected = selectedItem.type === 'table' && selectedItem.name === tbl.name;
                  return (
                    <button
                      key={tbl.name}
                      onClick={() => onSelectItem({ type: 'table', name: tbl.name, isView: false })}
                      className={`w-full flex items-center justify-between px-2 py-1 rounded text-left font-mono text-xs transition-colors truncate ${
                        isSelected
                          ? 'bg-blue-900/40 text-blue-300 border border-blue-800/40'
                          : 'text-gray-300 hover:bg-gray-900'
                      }`}
                      title={tbl.name}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Table className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{tbl.name}</span>
                      </div>
                      {tbl.rowCount !== undefined && (
                        <span className="text-[10px] text-gray-500 shrink-0 ml-1">
                          {tbl.rowCount.toLocaleString()}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Views Section */}
        <div>
          <button
            onClick={() => toggleSection('views')}
            className="w-full flex items-center justify-between text-gray-400 hover:text-gray-200 py-1 text-[11px] font-semibold uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5">
              {openSections.views ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <span>Views</span>
            </div>
            <span className="bg-gray-800 text-gray-400 font-mono text-[10px] px-1.5 py-0.5 rounded">
              {schema ? schema.views.length : 0}
            </span>
          </button>

          {openSections.views && (
            <div className="mt-1 space-y-0.5 pl-2">
              {filteredViews.length === 0 ? (
                <div className="text-[11px] text-gray-600 py-1 pl-2 italic">
                  {schema ? 'No views defined' : 'Loading...'}
                </div>
              ) : (
                filteredViews.map((vw) => {
                  const isSelected = selectedItem.type === 'table' && selectedItem.name === vw.name;
                  return (
                    <button
                      key={vw.name}
                      onClick={() => onSelectItem({ type: 'table', name: vw.name, isView: true })}
                      className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-left font-mono text-xs transition-colors truncate ${
                        isSelected
                          ? 'bg-blue-900/40 text-blue-300 border border-blue-800/40'
                          : 'text-gray-300 hover:bg-gray-900'
                      }`}
                      title={vw.name}
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{vw.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Indexes Section */}
        <div>
          <button
            onClick={() => toggleSection('indexes')}
            className="w-full flex items-center justify-between text-gray-400 hover:text-gray-200 py-1 text-[11px] font-semibold uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5">
              {openSections.indexes ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <span>Indexes</span>
            </div>
            <span className="bg-gray-800 text-gray-400 font-mono text-[10px] px-1.5 py-0.5 rounded">
              {schema ? schema.indexes.length : 0}
            </span>
          </button>

          {openSections.indexes && (
            <div className="mt-1 space-y-0.5 pl-2">
              {filteredIndexes.length === 0 ? (
                <div className="text-[11px] text-gray-600 py-1 pl-2 italic">
                  No indexes found
                </div>
              ) : (
                filteredIndexes.map((idx) => (
                  <div
                    key={idx.name}
                    className="px-2 py-1 text-[11px] font-mono text-gray-400 flex items-center gap-1.5 truncate"
                    title={`${idx.name} on ${idx.tbl_name}`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{idx.name}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Triggers Section */}
        <div>
          <button
            onClick={() => toggleSection('triggers')}
            className="w-full flex items-center justify-between text-gray-400 hover:text-gray-200 py-1 text-[11px] font-semibold uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5">
              {openSections.triggers ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <span>Triggers</span>
            </div>
            <span className="bg-gray-800 text-gray-400 font-mono text-[10px] px-1.5 py-0.5 rounded">
              {schema ? schema.triggers.length : 0}
            </span>
          </button>

          {openSections.triggers && (
            <div className="mt-1 space-y-0.5 pl-2">
              {filteredTriggers.length === 0 ? (
                <div className="text-[11px] text-gray-600 py-1 pl-2 italic">
                  No triggers defined
                </div>
              ) : (
                filteredTriggers.map((trg) => (
                  <div
                    key={trg.name}
                    className="px-2 py-1 text-[11px] font-mono text-gray-400 flex items-center gap-1.5 truncate"
                    title={`${trg.name} on ${trg.tbl_name}`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{trg.name}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Database Footer Status */}
      {overview && (
        <div className="p-3 border-t border-editor-border bg-gray-900/50 text-[11px] text-gray-400">
          <div className="flex items-center gap-1.5 truncate font-semibold text-gray-200">
            <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{overview.fileName}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500 font-mono">
            <span>{overview.fileSizeFormatted}</span>
            <span>v{overview.sqliteVersion}</span>
          </div>
        </div>
      )}
    </aside>
  );
};
