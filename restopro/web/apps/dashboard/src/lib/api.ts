"use client";

import { createApi, type TokenStore } from "@restopro/api-client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const safe = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* xususiy rejimda localStorage bo'lmasligi mumkin */
    }
  },
  del: (k: string) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* e'tiborsiz */
    }
  },
};

export const tokenStore: TokenStore = {
  get: () => ({ access: safe.get("rp_access"), refresh: safe.get("rp_refresh") }),
  set: (a, r) => {
    safe.set("rp_access", a);
    safe.set("rp_refresh", r);
  },
  clear: () => {
    safe.del("rp_access");
    safe.del("rp_refresh");
  },
  branchId: () => safe.get("rp_branch"),
};

export const setBranchId = (id: string) => safe.set("rp_branch", id);

export const api = createApi(API_URL, tokenStore, () => {
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
});
