import type { NextRequest } from "next/server";
import { getApiBaseUrl } from "@/lib/api";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);
const PROXY_HOP_HEADER = "x-lifemeter-proxy-hop";

function isLocalHost(host: string | null) {
  if (!host) return false;
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

function rewriteCookieNameForLocal(value: string) {
  return value
    .replace(/^__Secure-/, "")
    .replace(/^__Host-/, "");
}

function rewriteSetCookieHeader(value: string, shouldStripSecure: boolean) {
  let nextValue = value.replace(/;\s*Domain=[^;]+/gi, "");

  if (shouldStripSecure) {
    const parts = nextValue.split(";");
    const [cookiePair, ...attrs] = parts;
    const separatorIndex = cookiePair.indexOf("=");

    if (separatorIndex >= 0) {
      const name = cookiePair.slice(0, separatorIndex).trim();
      const rawValue = cookiePair.slice(separatorIndex + 1);
      nextValue = [
        `${rewriteCookieNameForLocal(name)}=${rawValue}`,
        ...attrs,
      ].join(";");
    }
  }

  if (shouldStripSecure) {
    nextValue = nextValue.replace(/;\s*Secure/gi, "");
    nextValue = nextValue.replace(/;\s*SameSite=None/gi, "; SameSite=Lax");
  }

  return nextValue;
}

function splitSetCookieHeader(value: string) {
  const cookies: string[] = [];
  let current = "";
  let inExpires = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const nextSlice = value.slice(index, index + 8).toLowerCase();

    if (nextSlice === "expires=") {
      inExpires = true;
    }

    if (char === "," && !inExpires) {
      cookies.push(current.trim());
      current = "";
      continue;
    }

    if (inExpires && char === ";") {
      inExpires = false;
    }

    current += char;
  }

  if (current.trim()) {
    cookies.push(current.trim());
  }

  return cookies.filter(Boolean);
}

function rewriteRequestCookieHeader(value: string) {
  return value
    .split(/;\s*/)
    .filter(Boolean)
    .map((cookie) => {
      const separatorIndex = cookie.indexOf("=");

      if (separatorIndex < 0) {
        return cookie;
      }

      const name = cookie.slice(0, separatorIndex).trim();
      const rawValue = cookie.slice(separatorIndex + 1);

      if (
        name === "better-auth.session_token" ||
        name.startsWith("better-auth.session_token_multi-")
      ) {
        return `__Secure-${name}=${rawValue}`;
      }

      return cookie;
    })
    .join("; ");
}

function copyResponseHeaders(
  upstreamHeaders: Headers,
  shouldStripSecureCookies: boolean,
) {
  const headers = new Headers();

  upstreamHeaders.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      return;
    }

    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      return;
    }

    headers.append(key, value);
  });

  const setCookies =
    typeof (upstreamHeaders as Headers & { getSetCookie?: () => string[] }).getSetCookie ===
    "function"
      ? (
          upstreamHeaders as Headers & {
            getSetCookie: () => string[];
          }
        ).getSetCookie()
      : upstreamHeaders.get("set-cookie")
        ? splitSetCookieHeader(upstreamHeaders.get("set-cookie") as string)
        : [];

  headers.set("x-lifemeter-proxy-set-cookie-count", String(setCookies.length));

  for (const cookie of setCookies) {
    headers.append(
      "set-cookie",
      rewriteSetCookieHeader(cookie, shouldStripSecureCookies),
    );
  }

  return headers;
}

export async function proxyApiRequest(request: NextRequest, path: string) {
  if (request.headers.has(PROXY_HOP_HEADER)) {
    return Response.json(
      {
        error:
          "The configured API origin points back to the web app, so the local proxy is calling itself. Check API_URL or NEXT_PUBLIC_API_URL.",
      },
      { status: 508 },
    );
  }

  let upstreamUrl: URL;

  try {
    upstreamUrl = new URL(`${path}${request.nextUrl.search}`, getApiBaseUrl());
  } catch (error: any) {
    return Response.json(
      {
        error: error?.message || "API proxy is not configured correctly.",
      },
      { status: 500 },
    );
  }

  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  const authorization = request.headers.get("authorization");
  const userAgent = request.headers.get("user-agent");

  if (cookie) headers.set("cookie", rewriteRequestCookieHeader(cookie));
  if (contentType) headers.set("content-type", contentType);
  if (accept) headers.set("accept", accept);
  if (authorization) headers.set("authorization", authorization);
  if (userAgent) headers.set("user-agent", userAgent);

  headers.set("origin", upstreamUrl.origin);
  headers.set(PROXY_HOP_HEADER, "1");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(upstreamUrl, init);
  } catch {
    return Response.json(
      {
        error: `Could not reach upstream API at ${upstreamUrl.origin}.`,
      },
      { status: 502 },
    );
  }

  const responseHeaders = copyResponseHeaders(
    upstreamResponse.headers,
    isLocalHost(request.headers.get("host")) &&
      request.nextUrl.protocol === "http:",
  );

  if (
    request.method === "POST" &&
    path === "/api/auth/sign-in/email" &&
    upstreamResponse.ok
  ) {
    const text = await upstreamResponse.text();
    const rawSetCookies =
      typeof (upstreamResponse.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie ===
      "function"
        ? (
            upstreamResponse.headers as Headers & {
              getSetCookie: () => string[];
            }
          ).getSetCookie()
        : upstreamResponse.headers.get("set-cookie")
          ? splitSetCookieHeader(upstreamResponse.headers.get("set-cookie") as string)
          : [];

    console.log("[auth-proxy] sign-in/email response", {
      status: upstreamResponse.status,
      setCookieCount: responseHeaders.get("x-lifemeter-proxy-set-cookie-count"),
      cookieNames: rawSetCookies.map((cookie) => cookie.split("=")[0]?.trim()),
      cookieAttrs: rawSetCookies.map((cookie) =>
        cookie
          .split(";")
          .slice(1)
          .map((part) => part.trim())
          .filter((part) => !part.toLowerCase().startsWith("expires=")),
      ),
    });

    return new Response(text, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}
