/**
 * RestoPro API mijozi. Tiplar Django OpenAPI sxemasidan generatsiya qilinadi:
 *   cd backend && python manage.py spectacular --file ../openapi.yaml
 *   cd web && pnpm gen:api
 */
import type { components } from "./schema";

export type Schemas = components["schemas"];
export type Me = Schemas["Me"];
export type Branch = Schemas["Branch"];
export type Device = Schemas["Device"];
export type Role = Schemas["Role"];
export type Employee = Schemas["Employee"];
export type AuditLog = Schemas["AuditLog"];
export type Permission = Schemas["Permission"];
export type Subscription = Schemas["Subscription"];
export type Company = Schemas["Company"];
export type Plan = Schemas["Plan"];

export interface AuthResponse {
  access: string;
  refresh: string;
  user: Me;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public fields?: Record<string, string[] | string>,
  ) {
    super(message);
  }
}

export interface TokenStore {
  get(): { access: string | null; refresh: string | null };
  set(access: string, refresh: string): void;
  clear(): void;
  branchId(): string | null;
}

export function createApi(baseUrl: string, tokens: TokenStore, onLogout: () => void) {
  let refreshing: Promise<boolean> | null = null;

  async function refresh(): Promise<boolean> {
    const { refresh } = tokens.get();
    if (!refresh) return false;
    const r = await fetch(`${baseUrl}/api/v1/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!r.ok) return false;
    const data = await r.json();
    tokens.set(data.access, data.refresh ?? refresh);
    return true;
  }

  async function request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const { access } = tokens.get();
    if (access) headers.Authorization = `Bearer ${access}`;
    const branch = tokens.branchId();
    if (branch) headers["X-Branch-ID"] = branch;
    const res = await fetch(`${baseUrl}/api/v1${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 401 && retry && tokens.get().refresh) {
      refreshing ??= refresh().finally(() => (refreshing = null));
      if (await refreshing) return request<T>(method, path, body, false);
      tokens.clear();
      onLogout();
    }
    if (res.status === 204) return undefined as T;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = data?.detail;
      let message = `Xatolik (${res.status})`;
      let fields: Record<string, string[] | string> | undefined;
      if (typeof detail === "string") message = detail;
      else if (detail && typeof detail === "object") {
        fields = detail;
        message = Object.values(detail).flat().join(" ");
      }
      throw new ApiError(message, res.status, data?.error, fields);
    }
    return data as T;
  }

  return {
    get: <T>(p: string) => request<T>("GET", p),
    post: <T>(p: string, b?: unknown) => request<T>("POST", p, b),
    patch: <T>(p: string, b?: unknown) => request<T>("PATCH", p, b),
    del: <T>(p: string) => request<T>("DELETE", p),
  };
}

export type Api = ReturnType<typeof createApi>;
