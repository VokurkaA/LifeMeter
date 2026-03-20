import type { NextRequest } from "next/server";
import { proxyApiRequest } from "@/lib/api-proxy";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyApiRequest(request, `/api/auth/${path.join("/")}`);
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE, handle as OPTIONS };
