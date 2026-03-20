import { NextResponse } from "next/server";
import { APK_MIME_TYPE, ApkLookupError, readApkFile } from "@/lib/apk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ fileName: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { fileName } = await context.params;

  try {
    const apk = await readApkFile(fileName);

    return new NextResponse(apk.buffer, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `attachment; filename="${apk.fileName}"`,
        "Content-Length": String(apk.size),
        "Content-Type": APK_MIME_TYPE,
      },
    });
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
