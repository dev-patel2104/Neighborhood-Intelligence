"use client";

import { useCallback, useState } from "react";
import type { NeighborhoodScore } from "@/lib/types";

export const MAX_COMPARISONS = 4;

export interface UseComparison {
  items: NeighborhoodScore[];
  isComparing: boolean;
  addItem: (score: NeighborhoodScore) => void;
  removeItem: (address: string) => void;
  clearAll: () => void;
  startCompare: () => void;
  stopCompare: () => void;
  isAdded: (address: string) => boolean;
  canAdd: boolean;
}

export function useComparison(): UseComparison {
  const [items, setItems] = useState<NeighborhoodScore[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  const addItem = useCallback((score: NeighborhoodScore) => {
    setItems((prev) => {
      if (prev.some((i) => i.address === score.address)) return prev;
      if (prev.length >= MAX_COMPARISONS) return prev;
      return [...prev, score];
    });
  }, []);

  const removeItem = useCallback((address: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.address !== address);
      // If we drop below 2, exit comparison mode automatically
      if (next.length < 2) setIsComparing(false);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    setIsComparing(false);
  }, []);

  const startCompare = useCallback(() => setIsComparing(true), []);
  const stopCompare = useCallback(() => setIsComparing(false), []);

  const isAdded = useCallback(
    (address: string) => items.some((i) => i.address === address),
    [items]
  );

  return {
    items,
    isComparing,
    addItem,
    removeItem,
    clearAll,
    startCompare,
    stopCompare,
    isAdded,
    canAdd: items.length < MAX_COMPARISONS,
  };
}
