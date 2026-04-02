/**
 * Neighborhood service — server-side business logic.
 * Validates the address and delegates to the data engine.
 */

import { generateNeighborhoodData } from "@server/data/mockDataEngine";
import type { ApiResponse, NeighborhoodScore } from "@/lib/types";

export interface NeighborhoodRequest {
  address: string | null | undefined;
}

export function getNeighborhoodScore(
  req: NeighborhoodRequest
): { status: number; body: ApiResponse<NeighborhoodScore> } {
  const address = req.address?.trim();

  if (!address || address.length < 5) {
    return {
      status: 400,
      body: { ok: false, error: "A valid address of at least 5 characters is required." },
    };
  }

  if (address.length > 200) {
    return {
      status: 400,
      body: { ok: false, error: "Address exceeds maximum length of 200 characters." },
    };
  }

  const data = generateNeighborhoodData(address);
  return {
    status: 200,
    body: { ok: true, data },
  };
}
