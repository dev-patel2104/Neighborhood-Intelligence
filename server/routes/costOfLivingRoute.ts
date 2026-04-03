/**
 * Cost of living route — HTTP layer only.
 * Extracts neighbourhood / address from the request, delegates to the service,
 * and maps results / AppErrors to HTTP responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCostOfLivingScore } from "@server/services/costOfLivingService";
import { AppError, httpStatusForError } from "@server/lib/errors";
import type { ApiResponse } from "@/lib/types";
import type { CostOfLivingResult } from "@server/lib/costOfLivingLoader";

export async function costOfLivingRoute(
  req: NextRequest
): Promise<NextResponse<ApiResponse<CostOfLivingResult>>> {
  const neighborhood = req.nextUrl.searchParams.get("neighborhood") ?? "";
  const address      = req.nextUrl.searchParams.get("address") ?? "";

  try {
    const data = getCostOfLivingScore(neighborhood, address);
    return NextResponse.json(
      { ok: true, data },
      { headers: { "Cache-Control": "public, max-age=86400" } }
    );
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: httpStatusForError(err.code) }
      );
    }
    console.error("[costOfLivingRoute]", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
