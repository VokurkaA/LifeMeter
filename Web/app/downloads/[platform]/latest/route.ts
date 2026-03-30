import { type NextRequest, NextResponse } from "next/server";
import {
  ReleaseLookupError,
  getLatestRelease,
  parseRoutePlatform,
} from "@/lib/releases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ platform: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { platform } = await context.params;

  try {
    const release = await getLatestRelease(parseRoutePlatform(platform));
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || request.url;
    const targetUrl = new URL(release.downloadPath, baseUrl);
    const response = NextResponse.redirect(targetUrl, 307);

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    if (error instanceof ReleaseLookupError) {
      return NextResponse.json(
        { error: error.message },
        {
          status: error.status,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    throw error;
  }
}
