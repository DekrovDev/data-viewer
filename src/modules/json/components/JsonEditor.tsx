import React, { useState, useRef } from 'react';
import { 
  AlignLeft, 
  Minimize2, 
  Copy, 
  Trash2, 
  FolderOpen, 
  UploadCloud 
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../shared/components/ui/tooltip';
import { readTextFile } from '../../../core/files/file';
import { toast } from 'sonner';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onFormat: () => boolean;
  onMinify: () => boolean;
  onClear: () => void;
  isValid: boolean;
  errorLine?: number;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  onFormat,
  onMinify,
  onClear,
  isValid,
  errorLine,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = value ? value.split('\n') : [''];
  const lineCount = lines.length;

  // Synchronize vertical scroll between textarea and line numbers gutter
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleFormat = () => {
    const ok = onFormat();
    if (ok) {
      toast.success('JSON formatted (2 spaces)');
    } else {
      toast.error('Cannot format invalid JSON');
    }
  };

  const handleMinify = () => {
    const ok = onMinify();
    if (ok) {
      toast.success('JSON minified');
    } else {
      toast.error('Cannot minify invalid JSON');
    }
  };

  const handleCopy = () => {
    if (!value.trim()) {
      toast.error('Editor is empty');
      return;
    }
    navigator.clipboard.writeText(value)
      .then(() => {
        toast.success('JSON copied');
      })
      .catch(() => {
        toast.error('Failed to copy');
      });
  };

  const handleClear = () => {
    onClear();
    toast.success('Editor cleared');
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await readTextFile(file);
      onChange(result.content);
      toast.success(`Loaded "${result.filename}"`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reading file';
      toast.error(msg);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    try {
      const result = await readTextFile(file);
      onChange(result.content);
      toast.success(`Loaded "${result.filename}"`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reading file';
      toast.error(msg);
    }
  };

  // Allow Tab key to indent with 2 spaces instead of moving focus away
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);

      // Restore cursor position after state updates
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      });
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div 
        className="relative h-full flex flex-col bg-background select-none"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Hidden file picker input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json,text/plain"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Input Toolbar */}
        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground/90 pl-1">
              JSON Input
            </span>
            {value.trim() && (
              <span
                className={`w-2 h-2 rounded-full ${
                  isValid ? 'bg-emerald-500' : 'bg-destructive'
                }`}
                title={isValid ? 'Valid JSON' : 'Invalid JSON'}
              />
            )}
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={handleFormat}
                  className="gap-1 h-6 text-[11px]"
                >
                  <AlignLeft className="w-3 h-3 text-sky-400" />
                  <span>Format</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Format JSON with 2 spaces (Ctrl+Enter)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleMinify}
                  className="gap-1 h-6 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <Minimize2 className="w-3 h-3 text-emerald-400" />
                  <span>Minify</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Minify JSON (compact without spaces)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleCopy}
                  className="gap-1 h-6 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-3 h-3" />
                  <span className="hidden sm:inline">Copy</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy JSON (Ctrl+Shift+C)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleClear}
                  className="gap-1 h-6 text-[11px] text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear editor</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleOpenFilePicker}
                  className="gap-1 h-6 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <FolderOpen className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Load File</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open .json file</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Editor Area: Line Numbers + Textarea */}
        <div className="relative flex-1 flex overflow-hidden font-mono text-[12px] select-text">
          {/* Line Numbers Gutter */}
          <div
            ref={lineNumbersRef}
            className="w-10 shrink-0 select-none overflow-hidden bg-muted/15 border-r border-border/40 py-2 text-right pr-2 text-zinc-600 font-mono text-[12px] leading-5"
          >
            {Array.from({ length: lineCount }).map((_, i) => {
              const lineNum = i + 1;
              const isErr = errorLine === lineNum;
              return (
                <div
                  key={i}
                  className={`h-5 ${isErr ? 'text-destructive font-bold bg-destructive/20 rounded-xs' : ''}`}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            placeholder="Paste or type JSON here, or drop a .json file..."
            spellCheck={false}
            className="flex-1 w-full h-full resize-none bg-transparent p-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none font-mono text-[12px] leading-5 whitespace-pre overflow-auto"
          />

          {/* Drag & Drop Visual Overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-primary/15 backdrop-blur-xs border-2 border-dashed border-primary flex flex-col items-center justify-center pointer-events-none z-20">
              <UploadCloud className="w-10 h-10 text-primary animate-bounce mb-2" />
              <span className="text-sm font-semibold text-primary">Drop .json file here</span>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
