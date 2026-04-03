"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { suggestionsService } from "@/app/services/suggestionsServices/suggestionsServices";

export interface UseAddressSuggestions {
  suggestions: string[];
  isLoading: boolean;
  fetchSuggestions: (query: string) => void;
  clearSuggestions: () => void;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

export function useAddressSuggestions(): UseAddressSuggestions {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback((query: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (abortRef.current) abortRef.current.abort();

    if (query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceTimer.current = setTimeout(async () => {
      abortRef.current = new AbortController();
      try {
        const json = await suggestionsService(query, abortRef.current.signal);
        if (json.ok) setSuggestions(json.data);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  const clearSuggestions = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSuggestions([]);
    setIsLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      abortRef.current?.abort();
    };
  }, []);

  return { suggestions, isLoading, fetchSuggestions, clearSuggestions };
}
