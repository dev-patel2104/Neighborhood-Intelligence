import type { ApiResponse } from "@/lib/types";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export async function suggestionsService(query: string, signal?: AbortSignal): Promise<ApiResponse<string[]>> {
  const res = await fetch(`${BACKEND}/api/suggestions?q=${encodeURIComponent(query)}`, { signal });
  return res.json();
}
