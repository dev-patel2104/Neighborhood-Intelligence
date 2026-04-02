/**
 * Suggestions service — pure domain logic.
 * Returns HRM address autocomplete results via Nominatim.
 * Returns an empty array for short queries; callers handle HTTP mapping.
 */

import { getHrmSuggestions } from "@server/lib/geocoder";

export async function getAddressSuggestions(query: string): Promise<string[]> {
  const trimmed = query.trim();
  // Nominatim needs at least 3 characters to return meaningful results
  if (trimmed.length < 3) return [];
  return getHrmSuggestions(trimmed);
}
