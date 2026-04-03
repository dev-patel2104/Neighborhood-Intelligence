/**
 * Neighbourhood route — HTTP layer only.
 * Extracts input from the request, delegates to the service,
 * and maps results / AppErrors to HTTP responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { getNeighborhoodScore } from "@server/services/neighborhoodService";
import { AppError, httpStatusForError } from "@server/lib/errors";
import type { ApiResponse, NeighborhoodScore } from "@/lib/types";

export async function neighborhoodRoute(
  req: NextRequest
): Promise<NextResponse<ApiResponse<NeighborhoodScore>>> {
  const address = req.nextUrl.searchParams.get("address") ?? "";

  try {
    const data = await getNeighborhoodScore(address);
    return NextResponse.json(
      { ok: true, data },
      { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } }
    );
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: httpStatusForError(err.code) }
      );
    }
    console.error("[neighborhoodRoute]", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
