/**
 * Environment service — pure domain logic.
 * Validates coordinates and delegates to the Open-Meteo air quality loader.
 * Callers handle HTTP mapping.
 */

import { getEnvironmentData, type EnvironmentResult } from "@server/lib/environmentLoader";
import { AppError } from "@server/lib/errors";

export async function getEnvironmentScore(lat: number, lon: number): Promise<EnvironmentResult> {
  if (isNaN(lat) || isNaN(lon)) {
    throw new AppError("INVALID_INPUT", "Valid lat and lon coordinates are required.");
  }

  const result = await getEnvironmentData(lat, lon);

  if (!result) {
    throw new AppError("UNAVAILABLE", "Air quality data is temporarily unavailable. Please try again shortly.");
  }

  return result;
}
