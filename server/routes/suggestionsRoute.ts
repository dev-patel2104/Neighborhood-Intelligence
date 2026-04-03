/**
 * Suggestions route — HTTP layer only.
 * Extracts the query param, delegates to the service,
 * and maps results to HTTP responses. Fails silently (returns [])
 * so that autocomplete never breaks the UI.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAddressSuggestions } from "@server/services/suggestionsService";
import type { ApiResponse } from "@/lib/types";

export async function suggestionsRoute(
  req: NextRequest
): Promise<NextResponse<ApiResponse<string[]>>> {
  const query = req.nextUrl.searchParams.get("q") ?? "";

  try {
    const data = await getAddressSuggestions(query);
    return NextResponse.json(
      { ok: true, data },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch (err) {
    console.error("[suggestionsRoute]", err);
    return NextResponse.json({ ok: true, data: [] });
  }
}
