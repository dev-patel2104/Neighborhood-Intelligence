"use client";

import { useCallback, useRef, useState } from "react";
import type { ApiResponse, NeighborhoodScore, SearchState } from "@/lib/types";

export interface UseNeighborhoodSearch {
  state: SearchState;
  search: (address: string) => Promise<void>;
  reset: () => void;
}

const INITIAL_STATE: SearchState = {
  status: "idle",
  data: null,
  error: null,
};

export function useNeighborhoodSearch(): UseNeighborhoodSearch {
  const [state, setState] = useState<SearchState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (address: string) => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setState({ status: "loading", data: null, error: null });

    try {
      const url = `/api/neighborhood?address=${encodeURIComponent(address)}`;
      const res = await fetch(url, { signal });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        setState({ status: "error", data: null, error: body.error ?? "Request failed" });
        return;
      }

      const json: ApiResponse<NeighborhoodScore> = await res.json();

      if (!json.ok) {
        setState({ status: "error", data: null, error: json.error });
        return;
      }

      setState({ status: "success", data: json.data, error: null });
    } catch (err) {
      if ((err as Error).name === "AbortError") return; // Intentionally cancelled
      setState({
        status: "error",
        data: null,
        error: "Network error — please check your connection and try again.",
      });
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  return { state, search, reset };
}
