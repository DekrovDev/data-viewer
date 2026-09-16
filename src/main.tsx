import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { Toaster } from './shared/components/ui/sonner.tsx';
import { TooltipProvider } from './shared/components/ui/tooltip.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TooltipProvider delayDuration={300}>
      <App />
      <Toaster position="bottom-right" richColors />
    </TooltipProvider>
  </React.StrictMode>,
);
