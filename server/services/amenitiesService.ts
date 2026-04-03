/**
 * Amenities service — pure domain logic.
 * Validates coordinates and delegates to the Overpass amenity loader.
 * Callers handle HTTP mapping.
 */

import { getAmenityScore, type AmenityResult } from "@server/lib/amenityLoader";
import { AppError } from "@server/lib/errors";

export async function getNearbyAmenities(lat: number, lon: number): Promise<AmenityResult> {
  if (isNaN(lat) || isNaN(lon)) {
    throw new AppError("INVALID_INPUT", "Valid lat and lon coordinates are required.");
  }

  const result = await getAmenityScore(lat, lon);

  if (!result) {
    throw new AppError("UNAVAILABLE", "Amenity data is temporarily unavailable. Please try again shortly.");
  }

  return result;
}
