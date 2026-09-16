import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Database, ShieldCheck, Globe, Github, ExternalLink } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[420px] p-5">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                  Data Viewer
                </DialogTitle>
                <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 text-muted-foreground border-border/80">
                  v1.0
                </Badge>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80">
                ABOUT
              </span>
            </div>
          </div>

          <DialogDescription className="text-xs text-foreground/90 font-medium leading-relaxed pt-1">
            A fast, private data inspection tool built by DekrovDev.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 text-xs text-muted-foreground pt-1">
          <p className="leading-relaxed">
            Part of the <span className="font-semibold text-foreground">Dekrov ecosystem</span> — a collection of developer tools, AI resources and experimental projects.
          </p>

          {/* Privacy Highlight Card */}
          <div className="flex items-start gap-2.5 p-3 rounded-md bg-muted/40 border border-border/70 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-snug">
              <span className="font-medium text-foreground block">Client-Side Privacy</span>
              <span>Everything runs locally in your browser. Your files never leave your device.</span>
            </div>
          </div>

          {/* Links Section */}
          <div className="pt-2 border-t border-border/60">
            <span className="text-[10px] font-semibold text-foreground/80 uppercase tracking-wider block mb-2 font-mono">
              Links
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              <a
                href="https://dekrov.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-md hover:bg-accent/60 text-foreground transition-colors group border border-border/40"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-medium text-xs">dekrov.com</span>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>

              <a
                href="https://github.com/DekrovDev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-md hover:bg-accent/60 text-foreground transition-colors group border border-border/40"
              >
                <div className="flex items-center gap-2">
                  <Github className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-medium text-xs">GitHub: https://github.com/DekrovDev</span>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="secondary" size="xs" onClick={onClose} className="h-7 text-xs px-3">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
