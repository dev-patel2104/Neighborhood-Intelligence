import type { ApiResponse, NeighborhoodScore } from "@/lib/types";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export async function neighborhoodService(address: string, signal?: AbortSignal): Promise<ApiResponse<NeighborhoodScore>> {
  const res = await fetch(`${BACKEND}/api/neighborhood?address=${encodeURIComponent(address)}`, { signal });
  return res.json();
}
