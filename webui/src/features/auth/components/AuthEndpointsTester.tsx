"use client";

import { useState, useMemo } from "react";

type Endpoint = {
  method: "GET" | "POST";
  path: string;
  defaultBody?: Record<string, unknown>;
  description?: string;
};

// Basic JSON value type
type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[];

const endpoints: Endpoint[] = [
  { method: "POST", path: "/sign-in/email", defaultBody: { email: "user@example.com", password: "password123" } },
  { method: "POST", path: "/sign-up/email", defaultBody: { email: "new@example.com", password: "password123", name: "New User" } },
  { method: "POST", path: "/sign-out" },
  { method: "GET", path: "/get-session" },
  { method: "POST", path: "/refresh-token" },
  { method: "POST", path: "/get-access-token" },
  { method: "POST", path: "/forget-password", defaultBody: { email: "user@example.com" } },
  { method: "POST", path: "/reset-password", defaultBody: { token: "<paste-token>", password: "newPassword123" } },
  { method: "GET", path: "/verify-email?token=<paste-token>" },
  { method: "POST", path: "/send-verification-email" },
  { method: "POST", path: "/change-email", defaultBody: { newEmail: "new@example.com" } },
  { method: "POST", path: "/change-password", defaultBody: { currentPassword: "password123", newPassword: "newPassword456" } },
  { method: "POST", path: "/update-user", defaultBody: { name: "Updated Name" } },
  { method: "POST", path: "/delete-user" },
  { method: "GET", path: "/list-sessions" },
  { method: "POST", path: "/revoke-session", defaultBody: { sessionId: "<session-id>" } },
  { method: "POST", path: "/revoke-sessions" },
  { method: "POST", path: "/revoke-other-sessions" },
  { method: "POST", path: "/link-social", defaultBody: { provider: "github" } },
  { method: "POST", path: "/unlink-account", defaultBody: { provider: "github" } },
  { method: "GET", path: "/list-accounts" },
  { method: "POST", path: "/account-info" },
  { method: "GET", path: "/ok" },
  { method: "GET", path: "/error" },
  { method: "GET", path: "/reset-password/<token>" }, // raw path variant
];

export default function AuthEndpointsTester() {
  const API_BASE =
    (process.env.NEXT_PUBLIC_SERVER_URL || "https://localhost:3000") + "/api/auth";
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Endpoint>(endpoints[0]);
  const [body, setBody] = useState(
    JSON.stringify(endpoints[0].defaultBody ?? {}, null, 2)
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [response, setResponse] = useState<JSONValue | string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      endpoints.filter((e) =>
        (e.method + " " + e.path).toLowerCase().includes(filter.toLowerCase())
      ),
    [filter]
  );

  function selectEndpoint(e: Endpoint) {
    setSelected(e);
    setBody(
      e.method === "POST" ? JSON.stringify(e.defaultBody ?? {}, null, 2) : ""
    );
    setResponse(null);
    setError(null);
    setStatus(null);
  }

  async function send() {
    setLoading(true);
    setResponse(null);
    setError(null);
    setStatus(null);
    try {
      const url = API_BASE + selected.path;
      const init: RequestInit = {
        method: selected.method,
        credentials: "include",
      };
      if (selected.method !== "GET" && body.trim()) {
        init.headers = { "Content-Type": "application/json" };
        init.body = body;
      }
      const res = await fetch(url, init);
      setStatus(res.status + " " + res.statusText);
      const text = await res.text();
      let data: JSONValue | string;
      try {
        data = JSON.parse(text) as JSONValue;
      } catch {
        data = text;
      }
      if (!res.ok) {
        setError(typeof data === "string" ? data : JSON.stringify(data, null, 2));
      } else {
        setResponse(data);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Request failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full p-4 space-y-4 border rounded-md">
      <h3 className="text-sm font-medium">Better Auth Endpoint Tester</h3>
      <div className="flex flex-col gap-2 md:flex-row">
        <input
          className="w-full px-2 py-1 text-sm border rounded md:w-60"
          placeholder="Filter endpoints..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select
            className="flex-1 px-2 py-1 text-sm border rounded"
            value={selected.path + "|" + selected.method}
            onChange={(e) => {
              const [path, methodRaw] = e.target.value.split("|");
              if (methodRaw === "GET" || methodRaw === "POST") {
                const ep = endpoints.find(
                  (ep) => ep.path === path && ep.method === methodRaw
                );
                if (ep) selectEndpoint(ep);
              }
            }}
          >
          {filtered.map((ep) => (
            <option key={ep.method + ep.path} value={ep.path + "|" + ep.method}>
              {ep.method} {ep.path}
            </option>
          ))}
        </select>
        <button
          onClick={send}
          disabled={loading}
          className="px-3 py-1 text-sm border rounded bg-primary text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
      <div className="text-xs break-all text-muted-foreground">
        <span className="font-mono">{selected.method}</span>{" "}
        <span className="font-mono">{API_BASE + selected.path}</span>
      </div>
      {selected.method !== "GET" && (
        <div className="space-y-1">
          <label className="text-xs font-medium">Request Body (JSON)</label>
          <textarea
            className="w-full p-2 font-mono text-xs border rounded min-h-32"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
      )}
      <div className="space-y-2">
        {status && (
          <div className="text-xs">
            <span className="font-semibold">Status:</span> {status}
          </div>
        )}
        {error && (
          <pre className="p-2 overflow-auto text-xs text-red-600 rounded bg-red-50 dark:bg-red-950/30 dark:text-red-400 max-h-48">
            {error}
          </pre>
        )}
        {response !== null && !error && (
          <pre className="p-2 overflow-auto text-xs rounded bg-muted max-h-64">
            {typeof response === "string"
              ? response
              : JSON.stringify(response, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}