import type { paths } from './api-types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/v1';
const TENANT = import.meta.env.VITE_TENANT_SLUG ?? 'demo';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public body?: unknown,
  ) {
    super(message);
  }
}

// in-memory access token (refresh lives in an httpOnly cookie)
let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => {
  accessToken = t;
};
export const getAccessToken = () => accessToken;

let refreshing: Promise<boolean> | null = null;
async function tryRefresh(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-tenant-slug': TENANT },
      });
      if (!res.ok) return false;
      const body = await res.json();
      accessToken = body.accessToken ?? null;
      return !!accessToken;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export interface RequestOpts {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  auth?: boolean; // default true
  _retry?: boolean;
}

export async function apiRequest<T = unknown>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true } = opts;
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      'x-tenant-slug': TENANT,
      ...(auth && accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401 && auth && !opts._retry && (await tryRefresh())) {
    return apiRequest<T>(path, { ...opts, _retry: true });
  }

  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = data as { code?: string; message?: string };
    throw new ApiError(res.status, e?.code ?? 'ERROR', e?.message ?? res.statusText, data);
  }
  return data as T;
}

/** Response body type for a given OpenAPI path + method (200/201). */
export type ApiResponse<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends {
  responses: { 200: { content: { 'application/json': infer J } } };
}
  ? J
  : paths[P][M] extends { responses: { 201: { content: { 'application/json': infer K } } } }
    ? K
    : unknown;

export const api = {
  get: <T = unknown>(path: string, query?: RequestOpts['query'], o?: RequestOpts) =>
    apiRequest<T>(path, { ...o, method: 'GET', query }),
  post: <T = unknown>(path: string, body?: unknown, o?: RequestOpts) =>
    apiRequest<T>(path, { ...o, method: 'POST', body }),
  patch: <T = unknown>(path: string, body?: unknown, o?: RequestOpts) =>
    apiRequest<T>(path, { ...o, method: 'PATCH', body }),
  put: <T = unknown>(path: string, body?: unknown, o?: RequestOpts) =>
    apiRequest<T>(path, { ...o, method: 'PUT', body }),
  del: <T = unknown>(path: string, o?: RequestOpts) =>
    apiRequest<T>(path, { ...o, method: 'DELETE' }),
};
