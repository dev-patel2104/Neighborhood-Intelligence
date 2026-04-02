/**
 * Suggestions service — server-side business logic.
 * Filters the address bank by the user's query string.
 */

import { ADDRESS_BANK } from "@server/data/addressBank";
import type { ApiResponse } from "@/lib/types";

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 6;

export interface SuggestionsRequest {
  query: string | null | undefined;
}

export function getAddressSuggestions(
  req: SuggestionsRequest
): { status: number; body: ApiResponse<string[]> } {
  const query = req.query?.trim().toLowerCase() ?? "";

  if (query.length < MIN_QUERY_LENGTH) {
    return { status: 200, body: { ok: true, data: [] } };
  }

  const matches = ADDRESS_BANK.filter((addr) =>
    addr.toLowerCase().includes(query)
  ).slice(0, MAX_RESULTS);

  return { status: 200, body: { ok: true, data: matches } };
}
