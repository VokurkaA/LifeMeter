import { cookies } from "next/headers";
import { cache } from "react";
import {
  AdminOverview,
  AdminUserSummary,
  LogEntry,
  MealListItem,
  PaginatedResponse,
  SessionPayload,
  SleepEntry,
  UserProfileBundle,
  WorkoutListItem,
  WorkoutTemplateListItem,
} from "@/lib/types";

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

export type ApiAvailability =
  | { ok: true }
  | {
      ok: false;
      kind: "invalid-config" | "unreachable" | "invalid-response";
      message: string;
    };

export class AdminApiError extends Error {
  status: number;
  path: string;
  baseUrl: string;

  constructor(message: string, status: number, path: string, baseUrl: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.path = path;
    this.baseUrl = baseUrl;
  }
}

type ApiConfig =
  | {
      ok: true;
      baseUrl: string;
    }
  | {
      ok: false;
      message: string;
    };

function resolveApiConfig(): ApiConfig {
  const rawValue = API_URL.trim();

  try {
    const url = new URL(rawValue);

    if (!["http:", "https:"].includes(url.protocol)) {
      return {
        ok: false,
        message:
          "API_URL or NEXT_PUBLIC_API_URL must use http:// or https://.",
      };
    }

    return {
      ok: true,
      baseUrl: url.toString().replace(/\/$/, ""),
    };
  } catch {
    return {
      ok: false,
      message:
        `API_URL or NEXT_PUBLIC_API_URL must be an absolute URL. Received "${rawValue}". ` +
        'Example: "http://localhost:3001" for local development.',
    };
  }
}

function normalizeApiPath(path: string) {
  return path.split("?")[0] || path;
}

function isUserScopedAdminPath(path: string) {
  return /^\/api\/admin\/users\/[^/]+(?:\/(?:profile|meals|sleep|workouts|workout-templates))?$/.test(
    path,
  );
}

export function getApiBaseUrl() {
  const config = resolveApiConfig();

  if (!config.ok) {
    throw new Error(config.message);
  }

  return config.baseUrl;
}

export function tryGetApiBaseUrl() {
  const config = resolveApiConfig();
  return config.ok ? config.baseUrl : null;
}

export function getAdminApiErrorMessage(error: unknown) {
  if (error instanceof AdminApiError) {
    const normalizedPath = normalizeApiPath(error.path);

    if (error.status === 404) {
      if (isUserScopedAdminPath(normalizedPath)) {
        return "The requested user record could not be found on the backend.";
      }

      return `The deployed backend at ${error.baseUrl} does not expose ${normalizedPath}.`;
    }

    if (error.status === 401 || error.status === 403) {
      return `The deployed backend rejected admin access for ${normalizedPath} with ${error.status}.`;
    }

    if ([502, 503, 504].includes(error.status)) {
      return `The deployed backend at ${error.baseUrl} could not be reached for ${normalizedPath}.`;
    }

    if (error.status === 508) {
      return `The configured API origin ${error.baseUrl} points back to the web app, so the local proxy is calling itself.`;
    }

    return `The deployed backend returned ${error.status} for ${normalizedPath}.`;
  }

  return error instanceof Error ? error.message : "Admin data could not be loaded.";
}

async function getCookieHeader() {
  const store = await cookies();
  return store
    .toString()
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

export function isAdminRole(role?: string | null) {
  return (role || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .includes("admin");
}

export async function checkAuthApiAvailability(): Promise<ApiAvailability> {
  const config = resolveApiConfig();

  if (!config.ok) {
    return {
      ok: false,
      kind: "invalid-config",
      message: config.message,
    };
  }

  const url = `${config.baseUrl}/api/auth/get-session`;

  let response: Response;

  try {
    response = await fetch(url, {
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      kind: "unreachable",
      message:
        `Could not reach the auth API at ${config.baseUrl}. ` +
        "Start the backend server and point NEXT_PUBLIC_API_URL or API_URL to that origin.",
    };
  }

  const contentType = response.headers.get("content-type");

  if (response.status === 200 || response.status === 401) {
    return { ok: true };
  }

  if (response.status === 508) {
    return {
      ok: false,
      kind: "invalid-response",
      message:
        `The configured API origin ${config.baseUrl} points back to the web app, so the local auth proxy is calling itself. ` +
        "Point NEXT_PUBLIC_API_URL or API_URL to the backend origin instead.",
    };
  }

  if ([502, 503, 504].includes(response.status)) {
    return {
      ok: false,
      kind: "unreachable",
      message:
        `Could not reach the auth API at ${config.baseUrl}. ` +
        "Start the backend server and point NEXT_PUBLIC_API_URL or API_URL to that origin.",
    };
  }

  if (
    response.status === 404 ||
    contentType?.includes("text/html")
  ) {
    return {
      ok: false,
      kind: "invalid-response",
      message:
        `The configured API origin ${config.baseUrl} responded with HTML or a 404 for /api/auth/get-session. ` +
        "That usually means it points to the Next.js app instead of the backend API server.",
    };
  }

  return {
    ok: false,
    kind: "invalid-response",
    message:
      `The auth API at ${config.baseUrl} returned an unexpected response (${response.status}). ` +
      "Expected a Better Auth JSON response from /api/auth/get-session.",
  };
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export const getSessionFromApi = cache(async function getSessionFromApi() {
  const config = resolveApiConfig();

  if (!config.ok) {
    return null;
  }

  const cookie = await getCookieHeader();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response: Response;

    try {
      response = await fetch(`${config.baseUrl}/api/auth/get-session`, {
        headers: cookie ? { cookie } : {},
        cache: "no-store",
      });
    } catch {
      return null;
    }

    if (response.status === 401) {
      return null;
    }

    if (response.status === 429) {
      if (attempt < 2) {
        await sleep(250 * (attempt + 1));
        continue;
      }

      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get session (${response.status})`);
    }

    return (await response.json()) as SessionPayload;
  }

  return null;
});

async function adminFetch<T>(path: string) {
  const config = resolveApiConfig();

  if (!config.ok) {
    throw new Error(config.message);
  }

  const cookie = await getCookieHeader();
  const response = await fetch(`${config.baseUrl}${path}`, {
    headers: cookie ? { cookie } : {},
    cache: "no-store",
  });

  if (!response.ok) {
    throw new AdminApiError(
      `Admin fetch failed (${response.status})`,
      response.status,
      path,
      config.baseUrl,
    );
  }

  return (await response.json()) as T;
}

export async function getAdminOverview() {
  return adminFetch<AdminOverview>("/api/admin/overview");
}

export async function getAdminUsers(search = "") {
  return adminFetch<PaginatedResponse<AdminUserSummary>>(
    `/api/admin/users${search}`,
  );
}

export async function getAdminUser(userId: string) {
  return adminFetch<AdminUserSummary>(`/api/admin/users/${userId}`);
}

export async function getAdminUserProfile(userId: string) {
  return adminFetch<UserProfileBundle>(`/api/admin/users/${userId}/profile`);
}

export async function getAdminUserMeals(userId: string, search = "") {
  return adminFetch<PaginatedResponse<MealListItem>>(
    `/api/admin/users/${userId}/meals${search}`,
  );
}

export async function getAdminUserSleep(userId: string, search = "") {
  return adminFetch<PaginatedResponse<SleepEntry>>(
    `/api/admin/users/${userId}/sleep${search}`,
  );
}

export async function getAdminUserWorkouts(userId: string, search = "") {
  return adminFetch<PaginatedResponse<WorkoutListItem>>(
    `/api/admin/users/${userId}/workouts${search}`,
  );
}

export async function getAdminUserWorkoutTemplates(
  userId: string,
  search = "",
) {
  return adminFetch<PaginatedResponse<WorkoutTemplateListItem>>(
    `/api/admin/users/${userId}/workout-templates${search}`,
  );
}

export async function getAdminLogs(search = "") {
  return adminFetch<PaginatedResponse<LogEntry>>(`/api/logs${search}`);
}
