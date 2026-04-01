/**
 * API base + fetch with session cookie + CSRF (same-origin via Vite proxy: /api -> Django).
 */
const RAW = import.meta.env.VITE_BACKEND_API ?? "/api";
export const API_BASE = RAW.replace(/\/$/, "");

let csrfToken: string | null = null;

/** Strip `/api` prefix so paths work with apiFetch (which prepends API_BASE). */
function stripApiPrefix(pathWithSearch: string): string {
  if (pathWithSearch.startsWith("/api/")) return pathWithSearch.slice(4) || "/";
  if (pathWithSearch === "/api") return "/";
  return pathWithSearch;
}

/** Normalize DRF pagination "next" to a path segment for apiFetch (e.g. `/trips/?page=2`). */
export function normalizeApiUrl(url: string): string {
  if (url.startsWith("/")) return stripApiPrefix(url);
  try {
    const u = new URL(url);
    return stripApiPrefix(`${u.pathname}${u.search}`);
  } catch {
    return url;
  }
}

export async function fetchCsrf(): Promise<string> {
  const r = await fetch(`${API_BASE}/auth/csrf/`, { credentials: "include" });
  const d = (await r.json()) as { csrfToken?: string };
  csrfToken = d.csrfToken ?? null;
  return csrfToken ?? "";
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    if (!csrfToken) {
      await fetchCsrf();
    }
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }
  }
  const url = path.startsWith("http") ? normalizeApiUrl(path) : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  return fetch(url, { ...init, credentials: "include", headers });
}
