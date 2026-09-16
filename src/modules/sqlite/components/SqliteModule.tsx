import React, { useState, useEffect } from 'react';
import { useSqliteDatabase } from '../hooks/useSqliteDatabase';
import { DatabaseSidebar } from './DatabaseSidebar';
import { DatabaseOverview } from './DatabaseOverview';
import { TableView } from './TableView';
import { SqlConsole } from './SqlConsole';
import { Download, X, Database, AlertTriangle } from 'lucide-react';
import { downloadFile } from '../../../core/files/file';

interface SqliteModuleProps {
  fileBytes: Uint8Array | null;
  fileName: string | null;
  onCloseFile: () => void;
}

export const SqliteModule: React.FC<SqliteModuleProps> = ({
  fileBytes,
  fileName,
  onCloseFile,
}) => {
  const {
    isOpen,
    isLoading,
    error,
    overview,
    schema,
    loadDatabase,
    closeDatabase,
  } = useSqliteDatabase();

  const [selectedView, setSelectedView] = useState<{
    type: 'overview' | 'table' | 'sql';
    name?: string;
    isView?: boolean;
  }>({ type: 'overview' });

  // Load database when fileBytes changes
  useEffect(() => {
    if (fileBytes && fileName) {
      loadDatabase(fileBytes, fileName).then(() => {
        setSelectedView({ type: 'overview' });
      });
    }
  }, [fileBytes, fileName, loadDatabase]);

  const handleDownloadOriginal = () => {
    if (!fileBytes || !fileName) return;
    downloadFile(fileBytes, fileName, 'application/x-sqlite3');
  };

  const handleClose = () => {
    closeDatabase();
    onCloseFile();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-editor-bg text-gray-300">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-base font-semibold text-white">Opening SQLite Database</h3>
        <p className="text-xs text-gray-400 mt-1">
          Initializing WebAssembly runtime & parsing database schema...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-editor-bg text-gray-300">
        <div className="max-w-md w-full p-5 rounded-lg bg-red-950/40 border border-red-800/50 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-red-200">Failed to Open Database</h3>
          <p className="text-xs text-red-300/80 mt-2 whitespace-pre-wrap">{error}</p>
          <button
            onClick={handleClose}
            className="mt-4 px-4 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-medium transition-colors"
          >
            Close & Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm bg-editor-bg">
        No SQLite database currently open.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-editor-bg">
      {/* Top Header Controls / Sub-Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-editor-border bg-gray-900/90 text-xs">
        <div className="flex items-center gap-2 truncate">
          <Database className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="font-mono font-semibold text-white truncate">
            {overview?.fileName || fileName}
          </span>

          <span className="text-gray-600">/</span>

          <span className="text-gray-400 capitalize font-medium">
            {selectedView.type === 'overview' && 'Database Overview'}
            {selectedView.type === 'sql' && 'SQL Console'}
            {selectedView.type === 'table' && `${selectedView.isView ? 'View' : 'Table'}: ${selectedView.name}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDownloadOriginal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors text-xs"
            title="Download SQLite database file"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download .db</span>
          </button>

          <button
            onClick={handleClose}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-gray-800 hover:bg-red-950/60 hover:text-red-300 text-gray-400 border border-gray-700 transition-colors text-xs"
            title="Close database"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Split: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <DatabaseSidebar
          overview={overview}
          schema={schema}
          selectedItem={{
            type: selectedView.type,
            name: selectedView.name,
          }}
          onSelectItem={(item) => setSelectedView(item)}
        />

        <main className="flex-1 overflow-hidden">
          {selectedView.type === 'overview' && (
            <DatabaseOverview
              overview={overview}
              schema={schema}
              onSelectTable={(tblName, isView) =>
                setSelectedView({ type: 'table', name: tblName, isView })
              }
              onOpenSql={() => setSelectedView({ type: 'sql' })}
            />
          )}

          {selectedView.type === 'table' && selectedView.name && (
            <TableView
              key={selectedView.name}
              tableName={selectedView.name}
              isView={selectedView.isView}
            />
          )}

          {selectedView.type === 'sql' && (
            <SqlConsole schema={schema} />
          )}
        </main>
      </div>
    </div>
  );
};
