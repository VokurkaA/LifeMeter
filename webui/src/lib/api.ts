// Small fetch wrapper targeting our Next.js /api proxy (rewritten to the hosted server)
import type {
  FoodDetail,
  FullUserMeal,
  ListResponse,
  SleepEntry,
  UserMeal,
} from "@/types/server";

export type ApiError = { error: string };

type Parser<T> = (r: Response) => Promise<T>;

async function fetchJSON<T>(
  path: string,
  init?: RequestInit & { parse?: Parser<T> }
): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });

  const parse: Parser<T> =
    init?.parse ?? (async (r: Response) => (await r.json()) as T);

  // Attempt to parse JSON for both ok and error responses
  let payload: unknown = null;
  try {
    payload = await parse(res);
  } catch {
    // ignore body parsing errors for non-JSON responses
  }

  if (!res.ok) {
    const message =
      (payload &&
        typeof payload === "object" &&
        payload !== null &&
        (payload as Record<string, unknown>).error) ||
      res.statusText;
    const msg = typeof message === "string" ? message : String(message ?? "Request failed");
    throw new Error(msg);
  }
  return payload as T;
}

// Health and routes (no auth required)
export const api = {
  health: () =>
    fetchJSON<{ status: string; timestamp: string; message: string }>("/api"),
  routes: () => fetchJSON<Record<string, unknown>>("/api/routes"),

  // Auth helpers (Better-Auth, endpoints proxied via /api/auth/*)
  // NOTE: Exact endpoints depend on server auth setup. These are optional examples.
  signInWithEmail: (email: string, password: string) =>
    fetchJSON<{ user: Record<string, unknown>; session: Record<string, unknown> }>(
      "/api/auth/sign-in/email",
      {
      method: "POST",
      body: JSON.stringify({ email, password }),
      }
    ),
  signOut: () =>
    fetchJSON<{ success: boolean }>("/api/auth/sign-out", { method: "POST" }),

  // Food (require auth)
  listFood: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return fetchJSON<ListResponse<FoodDetail>>(
      `/api/food${qs ? `?${qs}` : ""}`
    );
  },
  searchFoodByName: (name: string, params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams({ name: encodeURIComponent(name) });
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return fetchJSON<ListResponse<FoodDetail>>(
      `/api/food/search?${q.toString()}`
    );
  },
  getFoodById: (id: number) => fetchJSON<{ data: FoodDetail }>(`/api/food/${id}`),

  // User (require auth)
  me: () => fetchJSON<Record<string, unknown>>("/api/user"),

  // User meals (require auth)
  listMeals: () => fetchJSON<FullUserMeal[]>("/api/user/food"),
  getMeal: (id: string) => fetchJSON<FullUserMeal>(`/api/user/food/${id}`),
  createMeal: (payload: {
    name?: string;
    eaten_at?: string;
    items: Array<{
      food_id: number;
      total_grams: number;
      quantity?: number;
      portion_id?: number | null;
      description?: string | null;
    }>;
  }) =>
    fetchJSON<{ meal: UserMeal; food: unknown[] }>("/api/user/food", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateMeal: (
    id: string,
    payload: Partial<{
      name: string;
      eaten_at: string;
      items: Array<Record<string, unknown>>;
    }>
  ) =>
    fetchJSON<FullUserMeal>(`/api/user/food/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteMeal: (id: string) => fetchJSON<void>(`/api/user/food/${id}`, { method: "DELETE" }),

  // Sleep (require auth)
  listSleep: () => fetchJSON<SleepEntry[]>("/api/user/sleep"),
  startSleep: (note?: string | null, startAt?: string) =>
    fetchJSON<SleepEntry>("/api/user/sleep/start", {
      method: "POST",
      body: JSON.stringify({ note, startAt }),
    }),
  endSleep: (endAt?: string) =>
    fetchJSON<SleepEntry>("/api/user/sleep/end", {
      method: "POST",
      body: JSON.stringify({ endAt }),
    }),
  createSleepEntry: (payload: {
    startAt?: string;
    endAt?: string | null;
    note?: string | null;
  }) => fetchJSON<SleepEntry>("/api/user/sleep/new", { method: "POST", body: JSON.stringify(payload) }),
  updateSleepEntry: (
    id: string,
    payload: { startAt?: string; endAt?: string | null; note?: string | null }
  ) =>
    fetchJSON<SleepEntry>(`/api/user/sleep/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteSleepEntry: (id: string) => fetchJSON<void>(`/api/user/sleep/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

export type ApiClient = typeof api;
