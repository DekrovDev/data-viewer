import React from 'react';
import { HistoryItem } from '../types/json';
import { formatBytes } from '../lib/jsonStats';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from './ui/dialog';
import { Button } from './ui/button';
import { History, Trash2, ArrowUpRight, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onRestore: (content: string) => void;
  onRemoveItem: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  history,
  onRestore,
  onRemoveItem,
  onClearHistory,
}) => {
  const handleRestore = (item: HistoryItem) => {
    onRestore(item.content);
    onClose();
    toast.success('JSON restored from history');
  };

  const handleClear = () => {
    onClearHistory();
    toast.success('History cleared');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <History className="w-4 h-4 text-primary" />
              <span>Recent JSON History</span>
            </DialogTitle>

            {history.length > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={handleClear}
                className="text-muted-foreground hover:text-destructive gap-1 h-6 text-[11px]"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </Button>
            )}
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Saved locally in your browser (up to 5 recent valid documents under 1 MB).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {history.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No saved history yet. Valid JSONs are automatically recorded as you work.
            </div>
          ) : (
            history.map((item) => {
              const dateStr = new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="group relative border border-border/80 hover:border-primary/50 bg-card rounded-md p-2.5 transition-all flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{dateStr}</span>
                    </span>
                    <span className="font-mono font-medium text-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded text-[10px]">
                      {formatBytes(item.sizeBytes)}
                    </span>
                  </div>

                  {/* Snippet preview */}
                  <div className="bg-muted/40 rounded p-1.5 font-mono text-[11px] text-foreground/80 truncate">
                    {item.preview || '(empty)'}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-muted-foreground hover:text-destructive h-6 text-[10px] px-1.5"
                    >
                      Remove
                    </Button>

                    <Button
                      variant="default"
                      size="xs"
                      onClick={() => handleRestore(item)}
                      className="gap-1 h-6 text-[11px]"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      <span>Restore</span>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
