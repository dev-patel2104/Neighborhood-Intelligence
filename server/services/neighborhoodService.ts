/**
 * Neighbourhood service — pure domain logic.
 * Validates the address, geocodes it via Nominatim, fetches real data
 * from all external services in parallel, then generates a scorecard.
 * Throws AppError for all failure cases; callers handle HTTP mapping.
 *
 * Scoped to Atlantic Canada (NS, NB, PE, NL).
 */

import { geocodeAddress } from "@server/lib/geocoder";
import { generateNeighborhoodData } from "@server/data/mockDataEngine";
import { getNearbyAmenities } from "@server/services/amenitiesService";
import { getEnvironmentScore } from "@server/services/environmentService";
import { getCostOfLivingScore } from "@server/services/costOfLivingService";
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

  const geo = await geocodeAddress(trimmed);

  if (!geo.found)    throw new AppError("NOT_FOUND", geo.errorMessage);
  if (!geo.inRegion) throw new AppError("OUTSIDE_REGION", geo.errorMessage);

  const { lat, lon, neighborhood, city, province, displayAddress } = geo.data;

  // Fetch real data from all external services in parallel.
  // Each call catches its own errors so one failure doesn't block the rest.
  const [amenity, environment] = await Promise.all([
    getNearbyAmenities(lat, lon).catch(() => null),
    getEnvironmentScore(lat, lon).catch(() => null),
  ]);

  // Cost of living is synchronous (bundled data), but can still return null.
  const costOfLiving = (() => {
    try { return getCostOfLivingScore(neighborhood, trimmed); }
    catch { return null; }
  })();

  return generateNeighborhoodData(
    trimmed,
    { neighborhood, city, province, displayAddress, lat, lon },
    { amenity, environment, costOfLiving },
  );
}
