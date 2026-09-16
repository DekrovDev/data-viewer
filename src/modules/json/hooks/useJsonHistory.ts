import { useState, useEffect, useCallback } from 'react';
import { HistoryItem } from '../types/json';

const PRIMARY_KEY = 'data_viewer_json_history_v1';
const LEGACY_KEY = 'json_viewer_history_v1';
const MAX_HISTORY_ITEMS = 5;
const MAX_HISTORY_BYTES = 1024 * 1024; // 1 MB limit

export function useJsonHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(PRIMARY_KEY) || localStorage.getItem(LEGACY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, MAX_HISTORY_ITEMS);
        }
      }
    } catch {
      // Ignore corrupted localStorage data
    }
    return [];
  });

  // Save history state to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(PRIMARY_KEY, JSON.stringify(history));
    } catch {
      // Storage quota or private mode errors
    }
  }, [history]);

  const saveToHistory = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const sizeBytes = new TextEncoder().encode(trimmed).length;
    if (sizeBytes > MAX_HISTORY_BYTES) {
      return; // Skip JSONs larger than 1MB
    }

    setHistory((prev) => {
      // Don't duplicate if identical to most recent entry
      if (prev.length > 0 && prev[0].content === trimmed) {
        return prev;
      }

      const preview = trimmed.replace(/\s+/g, ' ').slice(0, 90);
      const newItem: HistoryItem = {
        id: Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
        timestamp: Date.now(),
        sizeBytes,
        preview,
        content: trimmed,
      };

      return [newItem, ...prev.filter((item) => item.content !== trimmed)].slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(PRIMARY_KEY);
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    history,
    saveToHistory,
    removeItem,
    clearHistory,
  };
}
