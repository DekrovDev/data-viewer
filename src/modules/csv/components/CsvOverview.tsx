import React from 'react';
import {
  FileText,
  AlertTriangle,
  Table as TableIcon,
  Layers,
} from 'lucide-react';
import { CsvOverviewInfo, CsvColumn } from '../types/csv';
import { Badge } from '../../../shared/components/ui/badge';

interface CsvOverviewProps {
  overview: CsvOverviewInfo;
  columns: CsvColumn[];
  onInspectColumn: (columnId: string) => void;
  onOpenTableView: () => void;
}

export const CsvOverview: React.FC<CsvOverviewProps> = ({
  overview,
  columns,
  onInspectColumn,
  onOpenTableView,
}) => {
  return (
    <div className="flex-1 h-full overflow-y-auto p-6 space-y-6 select-none bg-editor-bg text-foreground">
      {/* Header Info Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card/40 border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground font-mono">
                {overview.filename}
              </h2>
              <Badge variant="outline" className="text-[10px] font-mono">
                CSV Dataset
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Client-side parsed in {overview.parseDurationMs} ms • Encoding: {overview.encoding}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenTableView}
          className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Open Table Grid</span>
        </button>
      </div>

      {/* Warnings & Inconsistencies Alert */}
      {(overview.warnings.length > 0 || overview.inconsistentRowCount > 0) && (
        <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Parser Notice:</span>
          </div>
          {overview.inconsistentRowCount > 0 && (
            <p className="text-xs text-amber-200/90 pl-6">
              {overview.inconsistentRowCount.toLocaleString()} row(s) contained a different number of fields than the header. Cells were normalized automatically.
            </p>
          )}
          {overview.warnings.length > 0 && (
            <ul className="list-disc pl-10 text-[11px] text-amber-200/80 space-y-0.5">
              {overview.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-lg bg-card/30 border border-border/80">
          <div className="text-xs text-muted-foreground">Size</div>
          <div className="text-base font-bold font-mono text-foreground mt-1">
            {overview.fileSizeFormatted}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-card/30 border border-border/80">
          <div className="text-xs text-muted-foreground">Rows</div>
          <div className="text-base font-bold font-mono text-emerald-400 mt-1">
            {overview.totalRows.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-card/30 border border-border/80">
          <div className="text-xs text-muted-foreground">Columns</div>
          <div className="text-base font-bold font-mono text-blue-400 mt-1">
            {overview.columnCount}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-card/30 border border-border/80">
          <div className="text-xs text-muted-foreground">Delimiter</div>
          <div className="text-base font-bold font-mono text-purple-400 mt-1 truncate">
            {overview.delimiterName}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-card/30 border border-border/80">
          <div className="text-xs text-muted-foreground">Header Row</div>
          <div className="text-base font-bold font-mono text-amber-400 mt-1">
            {overview.hasHeader ? 'Yes' : 'No'}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-card/30 border border-border/80">
          <div className="text-xs text-muted-foreground">Parsed In</div>
          <div className="text-base font-bold font-mono text-foreground mt-1">
            {overview.parseDurationMs} ms
          </div>
        </div>
      </div>

      {/* Columns Schema Breakdown */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span>Detected Columns ({columns.length})</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {columns.map((col) => (
            <div
              key={col.id}
              onClick={() => onInspectColumn(col.id)}
              className="p-3 rounded-lg bg-card/40 border border-border hover:border-primary/40 hover:bg-card/70 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-mono text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {col.name}
                </div>
                <Badge variant="outline" className="text-[10px] font-mono capitalize shrink-0">
                  {col.inferredType}
                </Badge>
              </div>

              {col.sampleValues.length > 0 && (
                <div className="mt-2 text-[11px] text-muted-foreground truncate font-mono bg-muted/40 px-2 py-1 rounded">
                  eg: {col.sampleValues.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
