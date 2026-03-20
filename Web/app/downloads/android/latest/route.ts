import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ApkLookupError, getLatestApkMetadata } from "@/lib/apk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { metadata } = await getLatestApkMetadata();
    const targetUrl = new URL(
      `/downloads/android/${encodeURIComponent(metadata.fileName)}`,
      request.url,
    );
    const response = NextResponse.redirect(targetUrl, 307);

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    if (error instanceof ApkLookupError) {
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
