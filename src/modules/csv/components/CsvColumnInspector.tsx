import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../shared/components/ui/dialog';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { BarChart3, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { CsvColumnStats } from '../types/csv';

interface CsvColumnInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  stats: CsvColumnStats | null;
  isLoading: boolean;
}

export const CsvColumnInspector: React.FC<CsvColumnInspectorProps> = ({
  isOpen,
  onClose,
  stats,
  isLoading,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-5">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <DialogTitle className="text-sm font-semibold text-foreground truncate">
                Column: {stats?.columnName || 'Statistics'}
              </DialogTitle>
            </div>
            {stats && (
              <Badge variant="outline" className="text-[10px] font-mono capitalize">
                {stats.type}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Calculating column statistics...</span>
          </div>
        ) : !stats ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No statistics available for this column.
          </div>
        ) : (
          <div className="space-y-4 pt-1 text-xs">
            {stats.isSampled && (
              <div className="p-2 rounded bg-amber-950/30 border border-amber-800/40 text-amber-300 text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>Computed on sample of 50,000 rows for high performance.</span>
              </div>
            )}

            {/* Counts Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                <div className="text-base font-bold font-mono text-foreground">
                  {stats.totalCount.toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Total Rows</div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30">
                <div className="text-base font-bold font-mono text-emerald-400 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {stats.nonEmptyCount.toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Non-Empty</div>
              </div>

              <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-800/30">
                <div className="text-base font-bold font-mono text-red-400 flex items-center justify-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  {stats.emptyCount.toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Empty</div>
              </div>
            </div>

            {/* Inferred Type Details */}
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block font-mono">
                Distribution & Metrics
              </span>

              {stats.uniqueCount !== undefined && (
                <div className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-muted-foreground">Unique values (est.):</span>
                  <span className="font-mono font-medium text-foreground">
                    {stats.uniqueCount >= 5000 ? '5,000+' : stats.uniqueCount.toLocaleString()}
                  </span>
                </div>
              )}

              {stats.type === 'number' && (
                <>
                  <div className="flex items-center justify-between text-xs py-0.5 border-t border-border/40 pt-1">
                    <span className="text-muted-foreground">Minimum:</span>
                    <span className="font-mono font-medium text-foreground">{stats.min}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-0.5">
                    <span className="text-muted-foreground">Maximum:</span>
                    <span className="font-mono font-medium text-foreground">{stats.max}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-0.5">
                    <span className="text-muted-foreground">Average:</span>
                    <span className="font-mono font-medium text-foreground">{stats.avg}</span>
                  </div>
                </>
              )}

              {stats.type !== 'number' && stats.minLength !== undefined && (
                <>
                  <div className="flex items-center justify-between text-xs py-0.5 border-t border-border/40 pt-1">
                    <span className="text-muted-foreground">Min character length:</span>
                    <span className="font-mono font-medium text-foreground">{stats.minLength}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-0.5">
                    <span className="text-muted-foreground">Max character length:</span>
                    <span className="font-mono font-medium text-foreground">{stats.maxLength}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="secondary" size="xs" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
