import type { ApiResponse } from "@/lib/types";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export async function costOfLivingService(neighborhood: string, address: string, signal?: AbortSignal): Promise<ApiResponse<unknown>> {
  const res = await fetch(
    `${BACKEND}/api/cost-of-living?neighborhood=${encodeURIComponent(neighborhood)}&address=${encodeURIComponent(address)}`,
    { signal }
  );
  return res.json();
}
