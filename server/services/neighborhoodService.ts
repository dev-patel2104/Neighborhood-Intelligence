/**
 * Neighbourhood service — pure domain logic.
 * Validates the address, geocodes it via Nominatim, then generates a scorecard.
 * Throws AppError for all failure cases; callers handle HTTP mapping.
 */

import { geocodeHrmAddress } from "@server/lib/geocoder";
import { generateNeighborhoodData } from "@server/data/mockDataEngine";
import { AppError } from "@server/lib/errors";
import type { NeighborhoodScore } from "@/lib/types";

export async function getNeighborhoodScore(address: string): Promise<NeighborhoodScore> {
  const trimmed = address.trim();

  if (!trimmed || trimmed.length < 5) {
    throw new AppError("INVALID_INPUT", "A valid address of at least 5 characters is required.");
  }
  if (trimmed.length > 200) {
    throw new AppError("INVALID_INPUT", "Address exceeds maximum length of 200 characters.");
  }

  const geo = await geocodeHrmAddress(trimmed);

  if (!geo.found) throw new AppError("NOT_FOUND", geo.errorMessage);
  if (!geo.inHRM)  throw new AppError("OUTSIDE_HRM", geo.errorMessage);

  return generateNeighborhoodData(trimmed, {
    neighborhood:   geo.data.neighborhood,
    city:           geo.data.city,
    displayAddress: geo.data.displayAddress,
    lat:            geo.data.lat,
    lon:            geo.data.lon,
  });
}
