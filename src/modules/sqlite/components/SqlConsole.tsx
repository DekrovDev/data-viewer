import React, { useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { Play, Square, History, Shield, Trash2, Sparkles } from 'lucide-react';
import { useSqlQuery } from '../hooks/useSqlQuery';
import { QueryResults } from './QueryResults';
import { DatabaseSchema } from '../types/sqlite';

interface SqlConsoleProps {
  schema: DatabaseSchema | null;
  initialSql?: string;
}

export const SqlConsole: React.FC<SqlConsoleProps> = ({ schema, initialSql }) => {
  const defaultQuery = useMemo(() => {
    if (initialSql) return initialSql;
    if (schema && schema.tables.length > 0) {
      return `SELECT * FROM "${schema.tables[0].name.replace(/"/g, '""')}" LIMIT 50;`;
    }
    return 'SELECT sqlite_version(), 1 + 1;';
  }, [schema, initialSql]);

  const {
    sql: sqlText,
    setSql,
    isExecuting,
    result,
    error,
    history,
    runQuery,
    cancelQuery,
    clearHistory,
  } = useSqlQuery(defaultQuery);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runQuery();
      }
    },
    [runQuery]
  );

  const handleSelectTemplate = (templateSql: string) => {
    setSql(templateSql);
  };

  const handleSelectHistory = (historySql: string) => {
    setSql(historySql);
  };

  return (
    <div className="flex flex-col h-full bg-editor-bg overflow-hidden" onKeyDown={handleKeyDown}>
      {/* Console Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-editor-border bg-gray-900/90 text-xs">
        <div className="flex items-center gap-2">
          {isExecuting ? (
            <button
              onClick={cancelQuery}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-medium shadow-sm transition-all text-xs"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Cancel</span>
            </button>
          ) : (
            <button
              onClick={() => runQuery()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm shadow-emerald-900/30 transition-all text-xs"
              title="Run query (Ctrl+Enter)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run</span>
              <kbd className="ml-1 text-[10px] bg-emerald-700/60 px-1 py-0.2 rounded font-mono">
                Ctrl+↵
              </kbd>
            </button>
          )}

          {/* Quick Query Templates */}
          {schema && schema.tables.length > 0 && (
            <div className="flex items-center gap-1 ml-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <select
                aria-label="Insert template query"
                onChange={(e) => {
                  if (e.target.value) handleSelectTemplate(e.target.value);
                  e.target.value = '';
                }}
                defaultValue=""
                className="bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="" disabled>
                  Insert template...
                </option>
                {schema.tables.slice(0, 8).map((tbl) => (
                  <option
                    key={tbl.name}
                    value={`SELECT * FROM "${tbl.name.replace(/"/g, '""')}" LIMIT 50;`}
                  >
                    SELECT * FROM {tbl.name}
                  </option>
                ))}
                {schema.tables.slice(0, 8).map((tbl) => (
                  <option
                    key={`count-${tbl.name}`}
                    value={`SELECT count(*) AS total_count FROM "${tbl.name.replace(/"/g, '""')}";`}
                  >
                    COUNT(*) FROM {tbl.name}
                  </option>
                ))}
                <option value="PRAGMA database_list;">PRAGMA database_list</option>
              </select>
            </div>
          )}

          {/* Query History Dropdown */}
          {history.length > 0 && (
            <div className="flex items-center gap-1 ml-1">
              <History className="w-3.5 h-3.5 text-blue-400" />
              <select
                aria-label="Query history"
                onChange={(e) => {
                  if (e.target.value) handleSelectHistory(e.target.value);
                  e.target.value = '';
                }}
                defaultValue=""
                className="bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 max-w-[180px] truncate"
              >
                <option value="" disabled>
                  Recent Queries ({history.length})
                </option>
                {history.map((q, idx) => (
                  <option key={idx} value={q}>
                    {q.slice(0, 45)}...
                  </option>
                ))}
              </select>

              <button
                onClick={clearHistory}
                className="p-1 text-gray-500 hover:text-red-400 rounded transition-colors"
                title="Clear history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Read-Only Safety Pill */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-800/80 px-2 py-1 rounded border border-gray-700/60 font-medium">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>Read-only Mode Protected</span>
        </div>
      </div>

      {/* Code Editor */}
      <div className="h-44 shrink-0 border-b border-editor-border bg-gray-950 font-mono text-sm overflow-hidden">
        <CodeMirror
          value={sqlText}
          height="176px"
          theme="dark"
          extensions={[sql()]}
          onChange={(value) => setSql(value)}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: true,
            autocompletion: true,
          }}
          className="h-full text-xs"
        />
      </div>

      {/* Results Container */}
      <div className="flex-1 overflow-hidden">
        <QueryResults result={result} error={error} isExecuting={isExecuting} />
      </div>
    </div>
  );
};
