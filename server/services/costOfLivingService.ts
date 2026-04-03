/**
 * Cost of living service — pure domain logic.
 * Matches the geocoded neighbourhood to bundled CMHC HRM zone data.
 * Callers handle HTTP mapping.
 */

import { getCostOfLivingData, type CostOfLivingResult } from "@server/lib/costOfLivingLoader";
import { AppError } from "@server/lib/errors";

export function getCostOfLivingScore(
  neighborhood: string,
  rawAddress: string
): CostOfLivingResult {
  if (!neighborhood && !rawAddress) {
    throw new AppError("INVALID_INPUT", "A neighbourhood name or address is required.");
  }

  const result = getCostOfLivingData(neighborhood, rawAddress);

  if (!result) {
    throw new AppError("NOT_FOUND", "No cost-of-living data available for this neighbourhood.");
  }

  return result;
}
