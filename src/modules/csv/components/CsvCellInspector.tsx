import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../shared/components/ui/dialog';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Copy, Check, FileText } from 'lucide-react';
import { InferredColumnType } from '../types/csv';
import { toast } from 'sonner';

interface CsvCellInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  columnName: string;
  rowNumber: number;
  value: string;
  inferredType: InferredColumnType;
}

export const CsvCellInspector: React.FC<CsvCellInspectorProps> = ({
  isOpen,
  onClose,
  columnName,
  rowNumber,
  value,
  inferredType,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success('Cell value copied to clipboard');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-5">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <DialogTitle className="text-sm font-semibold text-foreground">
                Cell Inspector
              </DialogTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono capitalize">
              {inferredType}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <span>Column: <strong className="text-foreground font-mono">{columnName}</strong></span>
            <span>•</span>
            <span>Row: <strong className="text-foreground font-mono">{rowNumber}</strong></span>
            <span>•</span>
            <span>Length: <strong className="text-foreground font-mono">{value.length}</strong> chars</span>
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="mt-2 space-y-3">
          <div className="relative">
            <textarea
              readOnly
              value={value}
              rows={Math.min(12, Math.max(4, value.split('\n').length))}
              className="w-full rounded-md border border-border bg-muted/40 p-3 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted-foreground">
              {value === '' ? '(Empty cell)' : `${value.length} characters`}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={handleCopy}
                className="gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Value'}</span>
              </Button>
              <Button variant="secondary" size="xs" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
