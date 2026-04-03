/**
 * Suggestions service — pure domain logic.
 * Returns Atlantic Canada address autocomplete results via Nominatim.
 * Returns an empty array for short queries; callers handle HTTP mapping.
 */

import { getAtlanticSuggestions } from "@server/lib/geocoder";

export async function getAddressSuggestions(query: string): Promise<string[]> {
  const trimmed = query.trim();
  // Nominatim needs at least 3 characters to return meaningful results
  if (trimmed.length < 3) return [];
  return getAtlanticSuggestions(trimmed);
}
