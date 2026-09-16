import React, { useMemo } from 'react';
import { CellData } from '../types/sqlite';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '../../../shared/components/ui/dialog';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { downloadFile } from '../../../core/files/file';
import { Copy, Download, Binary, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface CellInspectorProps {
  columnName: string;
  value: CellData;
  declaredType?: string;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getSqliteTypeName(value: CellData): string {
  if (value === null || value === undefined) return 'NULL';
  if (value instanceof Uint8Array) return 'BLOB';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'INTEGER' : 'REAL';
  }
  return 'TEXT';
}

export const CellInspector: React.FC<CellInspectorProps> = ({
  columnName,
  value,
  declaredType,
  onClose,
}) => {
  const isBlob   = value instanceof Uint8Array;
  const isNull   = value === null || value === undefined;
  const isNumber = typeof value === 'number';

  const sqliteType = getSqliteTypeName(value);

  // Hex preview for BLOB (first 64 bytes)
  const hexPreview = useMemo(() => {
    if (!isBlob) return '';
    const bytes = value as Uint8Array;
    const slice = bytes.slice(0, 64);
    let hex = '';
    for (let i = 0; i < slice.length; i++) {
      hex += slice[i].toString(16).padStart(2, '0') + ' ';
      if ((i + 1) % 16 === 0) hex += '\n';
    }
    return hex.trim();
  }, [value, isBlob]);

  const handleCopy = () => {
    const text = isBlob
      ? hexPreview
      : isNull
      ? 'NULL'
      : String(value);
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Value copied to clipboard'))
      .catch(() => toast.error('Failed to copy'));
  };

  const handleDownloadBlob = () => {
    if (!isBlob) return;
    const bytes = value as Uint8Array;
    downloadFile(bytes, `${columnName}_blob.bin`, 'application/octet-stream');
    toast.success('BLOB downloaded');
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <Binary className="w-4 h-4 text-sky-400" />
              <span>Cell Inspector</span>
            </DialogTitle>
            <Badge variant="secondary" className="font-mono text-[10px] uppercase">
              {sqliteType}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground font-mono">
            Column: <strong className="text-foreground">{columnName}</strong>
            {declaredType && ` (${declaredType})`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2 font-mono text-xs">
          {/* NULL case */}
          {isNull && (
            <div className="p-4 bg-muted/30 border border-border/50 rounded text-center text-muted-foreground italic">
              NULL (no value)
            </div>
          )}

          {/* Number case */}
          {isNumber && (
            <div className="flex flex-col gap-2">
              <div className="bg-muted/40 p-2.5 rounded border border-border/60 text-sm font-semibold text-emerald-400">
                {String(value)}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {Number.isSafeInteger(value) ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Safe JavaScript integer (within ±2^53 - 1)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Floating point / large numeric value</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* String / Text case */}
          {!isNull && !isNumber && !isBlob && (
            <div className="flex flex-col gap-2">
              <div className="max-h-60 overflow-y-auto bg-muted/40 p-2.5 rounded border border-border/60 whitespace-pre-wrap break-all text-xs">
                {String(value)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Length: {String(value).length} characters</span>
                <span>{new TextEncoder().encode(String(value)).length} bytes</span>
              </div>
            </div>
          )}

          {/* BLOB case */}
          {isBlob && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Binary Data</span>
                <span className="font-semibold text-foreground">
                  {formatBytes((value as Uint8Array).byteLength)}
                </span>
              </div>
              <div className="bg-muted/40 p-2.5 rounded border border-border/60">
                <div className="text-[10px] text-muted-foreground mb-1">
                  Hex Preview (first {Math.min(64, (value as Uint8Array).byteLength)} bytes):
                </div>
                <div className="font-mono text-[11px] text-sky-300 tracking-wider whitespace-pre">
                  {hexPreview || '(empty)'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
          <Button variant="ghost" size="xs" onClick={onClose} className="h-7 text-xs">
            Close
          </Button>
          {!isNull && (
            <Button variant="secondary" size="xs" onClick={handleCopy} className="gap-1.5 h-7 text-xs">
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </Button>
          )}
          {isBlob && (
            <Button variant="default" size="xs" onClick={handleDownloadBlob} className="gap-1.5 h-7 text-xs">
              <Download className="w-3 h-3" />
              <span>Download BLOB</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
