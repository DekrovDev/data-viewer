import React, { useMemo } from 'react';
import { JsonValue } from '../types/json';
import { sortJsonKeys } from '../lib/json';
import { Copy } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { toast } from 'sonner';

interface PrettyViewProps {
  data: JsonValue;
  sortKeys: boolean;
}

export const PrettyView: React.FC<PrettyViewProps> = ({ data, sortKeys }) => {
  const formattedText = useMemo(() => {
    try {
      const target = sortKeys ? sortJsonKeys(data) : data;
      return JSON.stringify(target, null, 2);
    } catch {
      return '';
    }
  }, [data, sortKeys]);

  const lines = useMemo(() => formattedText.split('\n'), [formattedText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedText)
      .then(() => {
        toast.success('Formatted JSON copied');
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
          {lines.length} lines · 2 spaces indent
        </span>
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

      {/* Code with Line Numbers */}
      <div className="flex-1 overflow-auto p-2 font-mono text-[12px] leading-5">
        <div className="flex">
          {/* Line Numbers */}
          <div className="select-none pr-3 text-right text-zinc-600 border-r border-border/40 shrink-0 min-w-[2.5rem]">
            {lines.map((_, i) => (
              <div key={i} className="h-5">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Formatted Code */}
          <pre className="pl-3 text-foreground whitespace-pre overflow-x-auto flex-1 font-mono">
            {formattedText}
          </pre>
        </div>
      </div>
    </div>
  );
};
