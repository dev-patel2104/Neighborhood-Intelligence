import { NextRequest, NextResponse } from "next/server";
import { getAddressSuggestions } from "@server/services/suggestionsService";
import type { ApiResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<string[]>>> {
  const query = new URL(request.url).searchParams.get("q");
  const { status, body } = await getAddressSuggestions({ query });

  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
