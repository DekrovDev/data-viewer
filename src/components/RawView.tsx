import React, { useState } from 'react';
import { Copy, WrapText } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface RawViewProps {
  rawText: string;
}

export const RawView: React.FC<RawViewProps> = ({ rawText }) => {
  const [wrap, setWrap] = useState<boolean>(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText)
      .then(() => {
        toast.success('Raw JSON copied');
      })
      .catch(() => {
        toast.error('Failed to copy');
      });
  };

  return (
    <div className="relative h-full flex flex-col bg-card/20 overflow-hidden select-text">
      {/* Action Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/60 bg-muted/20 text-xs">
        <span className="text-muted-foreground text-[11px] font-mono">
          {new TextEncoder().encode(rawText).length} bytes
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant={wrap ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setWrap(!wrap)}
            className="gap-1 h-6 text-[11px]"
          >
            <WrapText className="w-3 h-3" />
            <span>Wrap</span>
          </Button>

          <Button
            variant="secondary"
            size="xs"
            onClick={handleCopy}
            className="gap-1 h-6 text-[11px]"
          >
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </Button>
        </div>
      </div>

      {/* Raw text container */}
      <div className="flex-1 overflow-auto p-3 font-mono text-[12px] leading-relaxed">
        <pre className={`text-foreground font-mono ${wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}>
          {rawText}
        </pre>
      </div>
    </div>
  );
};
