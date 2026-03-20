import type { NextRequest } from "next/server";
import { proxyApiRequest } from "@/lib/api-proxy";

async function handle(request: NextRequest) {
  return proxyApiRequest(request, "/api/logs");
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE, handle as OPTIONS };
