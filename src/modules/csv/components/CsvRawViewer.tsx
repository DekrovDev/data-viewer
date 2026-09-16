import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { Copy, Check } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { toast } from 'sonner';

interface CsvRawViewerProps {
  rawText: string;
  filename: string;
}

export const CsvRawViewer: React.FC<CsvRawViewerProps> = ({ rawText, filename }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    toast.success('Raw content copied to clipboard');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-editor-bg">
      <div className="h-8 border-b border-border bg-card/30 px-3 flex items-center justify-between text-xs text-muted-foreground select-none">
        <span className="font-mono">{filename} (Raw Text)</span>
        <Button
          variant="ghost"
          size="xs"
          onClick={handleCopy}
          className="gap-1 text-muted-foreground hover:text-foreground h-6 text-[11px]"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy All'}</span>
        </Button>
      </div>

      <div className="flex-1 overflow-hidden font-mono text-xs">
        <CodeMirror
          value={rawText}
          height="100%"
          theme="dark"
          editable={false}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: false,
          }}
          className="h-full"
        />
      </div>
    </div>
  );
};
