/**
 * Environment route — HTTP layer only.
 * Extracts lat/lon from the request, delegates to the service,
 * and maps results / AppErrors to HTTP responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEnvironmentScore } from "@server/services/environmentService";
import { AppError, httpStatusForError } from "@server/lib/errors";
import type { ApiResponse } from "@/lib/types";
import type { EnvironmentResult } from "@server/lib/environmentLoader";

export async function environmentRoute(
  req: NextRequest
): Promise<NextResponse<ApiResponse<EnvironmentResult>>> {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lon = parseFloat(req.nextUrl.searchParams.get("lon") ?? "");

  try {
    const data = await getEnvironmentScore(lat, lon);
    return NextResponse.json(
      { ok: true, data },
      { headers: { "Cache-Control": "public, max-age=1800" } }
    );
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: httpStatusForError(err.code) }
      );
    }
    console.error("[environmentRoute]", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
