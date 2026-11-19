// Same-origin `/api` (rewritten to the Express server by next.config.ts) unless a direct URL is configured.
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly errors?: FieldError[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

type Params = Record<string, string | number | boolean | undefined | null>;

function toQuery(params?: Params) {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

async function request<T>(
  method: string,
  path: string,
  opts: { params?: Params; body?: unknown; signal?: AbortSignal } = {},
): Promise<ApiEnvelope<T>> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}${toQuery(opts.params)}`, {
      method,
      credentials: "include",
      headers: opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiError("Cannot reach the server. Check your connection and try again.", 0, "NETWORK_ERROR");
  }

  const json = (await res.json().catch(() => null)) as (ApiEnvelope<T> & { code?: string; errors?: FieldError[] }) | null;

  if (!res.ok || !json?.success) {
    const err = new ApiError(json?.message ?? `Request failed (${res.status})`, res.status, json?.code, json?.errors);
    // Session expired/revoked mid-use: let the app send the user to /login. Login/me failures are handled by callers.
    if (res.status === 401 && !path.startsWith("/auth/")) onUnauthorized?.();
    throw err;
  }
  return json;
}

export const api = {
  get: <T>(path: string, params?: Params, signal?: AbortSignal) => request<T>("GET", path, { params, signal }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body: body ?? {} }),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, { body }),
  delete: <T>(path: string, params?: Params) => request<T>("DELETE", path, { params }),
};
