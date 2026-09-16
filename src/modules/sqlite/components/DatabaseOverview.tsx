import React from 'react';
import { DatabaseOverviewInfo, DatabaseSchema } from '../types/sqlite';
import { Database, Table, Layers, ShieldCheck, Zap, Terminal, CheckCircle2 } from 'lucide-react';

interface DatabaseOverviewProps {
  overview: DatabaseOverviewInfo | null;
  schema: DatabaseSchema | null;
  onSelectTable: (tableName: string, isView?: boolean) => void;
  onOpenSql: () => void;
}

export const DatabaseOverview: React.FC<DatabaseOverviewProps> = ({
  overview,
  schema,
  onSelectTable,
  onOpenSql,
}) => {
  if (!overview || !schema) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Loading database overview...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-editor-bg text-gray-200">
      {/* Hero Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-blue-950/40 via-gray-900 to-gray-900 border border-blue-900/30">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Database className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white font-mono">{overview.fileName}</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-800/50">
                <CheckCircle2 className="w-3 h-3" />
                Loaded in-memory
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              SQLite 3 database · Read-only safe session · WebAssembly Engine
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSql}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-900/20 transition-all"
        >
          <Terminal className="w-4 h-4" />
          <span>Open SQL Console</span>
        </button>
      </div>

      {/* Database Engine & File Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-gray-900/60 border border-editor-border flex flex-col justify-between">
          <span className="text-xs text-gray-400 font-medium">File Size</span>
          <span className="text-lg font-bold font-mono text-white mt-1">
            {overview.fileSizeFormatted}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5 font-mono">
            {overview.fileSizeBytes.toLocaleString()} bytes
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-gray-900/60 border border-editor-border flex flex-col justify-between">
          <span className="text-xs text-gray-400 font-medium">SQLite Version</span>
          <span className="text-lg font-bold font-mono text-blue-400 mt-1">
            {overview.sqliteVersion}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5 font-mono">
            {overview.encoding}
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-gray-900/60 border border-editor-border flex flex-col justify-between">
          <span className="text-xs text-gray-400 font-medium">Page Size</span>
          <span className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {overview.pageSize.toLocaleString()} B
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5 font-mono">
            B-Tree leaf size
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-gray-900/60 border border-editor-border flex flex-col justify-between">
          <span className="text-xs text-gray-400 font-medium">Total Pages</span>
          <span className="text-lg font-bold font-mono text-amber-400 mt-1">
            {overview.pageCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5 font-mono">
            Allocated pages
          </span>
        </div>
      </div>

      {/* Schema Entity Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-gray-900/40 border border-editor-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-950/50 text-blue-400 border border-blue-800/40">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-white">{overview.tableCount}</div>
            <div className="text-xs text-gray-400">Tables</div>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-gray-900/40 border border-editor-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-950/50 text-indigo-400 border border-indigo-800/40">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-white">{overview.viewCount}</div>
            <div className="text-xs text-gray-400">Views</div>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-gray-900/40 border border-editor-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-white">{overview.indexCount}</div>
            <div className="text-xs text-gray-400">Indexes</div>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-gray-900/40 border border-editor-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-950/50 text-amber-400 border border-amber-800/40">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-white">{overview.triggerCount}</div>
            <div className="text-xs text-gray-400">Triggers</div>
          </div>
        </div>
      </div>

      {/* Tables List Quick Navigator */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <Table className="w-4 h-4 text-blue-400" />
          <span>Tables in this Database ({schema.tables.length})</span>
        </h2>

        {schema.tables.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-xs italic border border-dashed border-gray-800 rounded-lg">
            This database contains no user tables.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {schema.tables.map((tbl) => (
              <div
                key={tbl.name}
                onClick={() => onSelectTable(tbl.name, false)}
                className="p-3.5 rounded-lg bg-gray-900/60 border border-editor-border hover:border-blue-500/50 hover:bg-gray-900 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <Table className="w-4 h-4 text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="font-mono font-semibold text-sm text-white truncate">
                      {tbl.name}
                    </span>
                  </div>
                  {tbl.rowCount !== undefined && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-blue-300">
                      {tbl.rowCount.toLocaleString()} rows
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Click to view data & structure</span>
                  <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Views List Quick Navigator (if any) */}
      {schema.views.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Views ({schema.views.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {schema.views.map((vw) => (
              <div
                key={vw.name}
                onClick={() => onSelectTable(vw.name, true)}
                className="p-3.5 rounded-lg bg-gray-900/60 border border-editor-border hover:border-indigo-500/50 hover:bg-gray-900 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center gap-2 truncate">
                  <Layers className="w-4 h-4 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="font-mono font-semibold text-sm text-white truncate">
                    {vw.name}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Virtual view</span>
                  <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
