import { NextRequest, NextResponse } from "next/server";
import { getNeighborhoodScore } from "@server/services/neighborhoodService";
import type { ApiResponse, NeighborhoodScore } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<NeighborhoodScore>>> {
  const address = new URL(request.url).searchParams.get("address");
  const { status, body } = await getNeighborhoodScore({ address });

  return NextResponse.json(body, {
    status,
    headers:
      status === 200
        ? { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" }
        : undefined,
  });
}
