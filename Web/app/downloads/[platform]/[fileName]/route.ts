import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import {
  ReleaseLookupError,
  parseRoutePlatform,
  readReleaseFile,
} from "@/lib/releases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ platform: string; fileName: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { platform, fileName } = await context.params;

  try {
    const releaseFile = await readReleaseFile(parseRoutePlatform(platform), fileName);
    const stream = Readable.toWeb(
      createReadStream(releaseFile.filePath),
    ) as ReadableStream<Uint8Array>;

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `attachment; filename="${releaseFile.fileName}"`,
        "Content-Length": String(releaseFile.size),
        "Content-Type": releaseFile.mimeType,
      },
    });
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
