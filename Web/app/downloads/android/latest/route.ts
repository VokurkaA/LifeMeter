import { NextResponse } from "next/server";
import { ApkLookupError, getLatestApkMetadata } from "@/lib/apk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { metadata } = await getLatestApkMetadata();
    const targetPath = `/downloads/android/${encodeURIComponent(metadata.fileName)}`;
    const response = new NextResponse(null, {
      status: 307,
      headers: {
        Location: targetPath,
      },
    });

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
