/**
 * Amenities route — HTTP layer only.
 * Extracts lat/lon from the request, delegates to the service,
 * and maps results / AppErrors to HTTP responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { getNearbyAmenities } from "@server/services/amenitiesService";
import { AppError, httpStatusForError } from "@server/lib/errors";
import type { ApiResponse } from "@/lib/types";
import type { AmenityResult } from "@server/lib/amenityLoader";

export async function amenitiesRoute(
  req: NextRequest
): Promise<NextResponse<ApiResponse<AmenityResult>>> {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lon = parseFloat(req.nextUrl.searchParams.get("lon") ?? "");

  try {
    const data = await getNearbyAmenities(lat, lon);
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
    console.error("[amenitiesRoute]", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
