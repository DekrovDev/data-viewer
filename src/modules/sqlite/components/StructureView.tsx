import React, { useState } from 'react';
import { TableStructure } from '../types/sqlite';
import { Key, Copy, Check, Hash, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface StructureViewProps {
  tableName: string;
  structure: TableStructure | null;
}

export const StructureView: React.FC<StructureViewProps> = ({ tableName, structure }) => {
  const [copiedSql, setCopiedSql] = useState(false);

  if (!structure) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Loading schema structure...
      </div>
    );
  }

  const handleCopySql = () => {
    if (!structure.sql) return;
    navigator.clipboard.writeText(structure.sql);
    setCopiedSql(true);
    toast.success('CREATE TABLE SQL copied to clipboard');
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="h-full overflow-auto p-4 space-y-6 bg-editor-bg text-gray-200">
      {/* Table Columns Section */}
      <section className="border border-editor-border rounded-lg bg-gray-900/40 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-editor-border bg-gray-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-200">Columns ({structure.columns.length})</h3>
          </div>
          <span className="text-xs text-gray-400 font-mono">Table: {tableName}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800 text-xs">
            <thead className="bg-gray-900/60 text-gray-400 font-mono">
              <tr>
                <th className="px-3 py-2 text-left w-12">#</th>
                <th className="px-3 py-2 text-left">Column Name</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Nullable</th>
                <th className="px-3 py-2 text-left">Default Value</th>
                <th className="px-3 py-2 text-left">Key</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {structure.columns.map((col) => (
                <tr key={col.cid} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-3 py-2 font-mono text-gray-500">{col.cid}</td>
                  <td className="px-3 py-2 font-mono font-medium text-white flex items-center gap-1.5">
                    {col.pk > 0 && <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    <span>{col.name}</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-blue-400">{col.type || 'BLOB / ANY'}</td>
                  <td className="px-3 py-2">
                    {col.notnull === 1 ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-950/40 text-red-300 border border-red-800/40">
                        NOT NULL
                      </span>
                    ) : (
                      <span className="text-gray-500 font-mono text-xs">NULL</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-400">
                    {col.dflt_value !== null ? String(col.dflt_value) : <span className="text-gray-600 italic">none</span>}
                  </td>
                  <td className="px-3 py-2">
                    {col.pk > 0 ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-950/40 text-amber-300 border border-amber-800/40">
                        <Key className="w-2.5 h-2.5" />
                        PK{col.pk > 1 ? ` (#${col.pk})` : ''}
                      </span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Foreign Keys Section */}
      <section className="border border-editor-border rounded-lg bg-gray-900/40 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-editor-border bg-gray-900/80 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-gray-200">
            Foreign Keys ({structure.foreignKeys.length})
          </h3>
        </div>

        {structure.foreignKeys.length === 0 ? (
          <div className="p-4 text-xs text-gray-500 italic">No foreign keys defined for this table.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800 text-xs">
              <thead className="bg-gray-900/60 text-gray-400 font-mono">
                <tr>
                  <th className="px-3 py-2 text-left">From Column</th>
                  <th className="px-3 py-2 text-left">To Table</th>
                  <th className="px-3 py-2 text-left">To Column</th>
                  <th className="px-3 py-2 text-left">On Update</th>
                  <th className="px-3 py-2 text-left">On Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {structure.foreignKeys.map((fk, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/30">
                    <td className="px-3 py-2 font-mono text-amber-300">{fk.from}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-blue-300">{fk.table}</td>
                    <td className="px-3 py-2 font-mono text-emerald-300">{fk.to}</td>
                    <td className="px-3 py-2 font-mono text-gray-400">{fk.on_update}</td>
                    <td className="px-3 py-2 font-mono text-gray-400">{fk.on_delete}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Indexes Section */}
      <section className="border border-editor-border rounded-lg bg-gray-900/40 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-editor-border bg-gray-900/80 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-gray-200">
            Indexes ({structure.indexes.length})
          </h3>
        </div>

        {structure.indexes.length === 0 ? (
          <div className="p-4 text-xs text-gray-500 italic">No custom indexes created for this table.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800 text-xs">
              <thead className="bg-gray-900/60 text-gray-400 font-mono">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Unique</th>
                  <th className="px-3 py-2 text-left">Origin</th>
                  <th className="px-3 py-2 text-left">Partial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {structure.indexes.map((idx, i) => (
                  <tr key={i} className="hover:bg-gray-800/30">
                    <td className="px-3 py-2 font-mono text-emerald-300">{idx.name}</td>
                    <td className="px-3 py-2">
                      {idx.unique === 1 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                          UNIQUE
                        </span>
                      ) : (
                        <span className="text-gray-500 font-mono text-xs">NO</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-400">{idx.origin}</td>
                    <td className="px-3 py-2 font-mono text-gray-400">{idx.partial === 1 ? 'YES' : 'NO'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SQL DDL Definition */}
      {structure.sql && (
        <section className="border border-editor-border rounded-lg bg-gray-900/40 overflow-hidden">
          <div className="px-4 py-2 border-b border-editor-border bg-gray-900/80 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              SQL Schema Definition (DDL)
            </h3>
            <button
              onClick={handleCopySql}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied' : 'Copy DDL'}</span>
            </button>
          </div>
          <div className="p-3 bg-gray-950 overflow-x-auto">
            <pre className="font-mono text-xs text-blue-300 whitespace-pre-wrap">{structure.sql}</pre>
          </div>
        </section>
      )}
    </div>
  );
};
