import type { ApiResponse } from "@/lib/types";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export async function environmentService(lat: number, lon: number, signal?: AbortSignal): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BACKEND}/api/environment?lat=${lat}&lon=${lon}`, { signal });
  return res.json();
}
