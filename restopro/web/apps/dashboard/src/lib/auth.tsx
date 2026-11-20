"use client";

import type { AuthResponse, Me } from "@restopro/api-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { api, setBranchId, tokenStore } from "./api";

interface AuthCtx {
  me: Me | undefined;
  loading: boolean;
  branchId: string | null;
  setBranch: (id: string) => void;
  signIn: (r: AuthResponse) => void;
  signOut: () => Promise<void>;
  can: (perm: string) => boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [branchId, setBranchState] = useState<string | null>(null);

  useEffect(() => {
    setHasToken(!!tokenStore.get().access);
    setBranchState(tokenStore.branchId());
  }, []);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<Me>("/auth/me/"),
    enabled: hasToken === true,
    retry: false,
  });

  const me = meQuery.data;
  useEffect(() => {
    if (me && !branchId && me.branches.length) {
      const first = (me.branches[0] as { id: string }).id;
      setBranchId(first);
      setBranchState(first);
    }
  }, [me, branchId]);

  const setBranch = useCallback(
    (id: string) => {
      setBranchId(id);
      setBranchState(id);
      qc.invalidateQueries();
    },
    [qc],
  );

  const signIn = useCallback(
    (r: AuthResponse) => {
      tokenStore.set(r.access, r.refresh);
      qc.setQueryData(["me"], r.user);
      setHasToken(true);
      router.push("/");
    },
    [qc, router],
  );

  const signOut = useCallback(async () => {
    const { refresh } = tokenStore.get();
    await api.post("/auth/logout/", { refresh }).catch(() => undefined);
    tokenStore.clear();
    qc.clear();
    setHasToken(false);
    router.push("/login");
  }, [qc, router]);

  const can = useCallback((perm: string) => !!me?.permissions.includes(perm), [me]);

  return (
    <Ctx.Provider
      value={{ me, loading: hasToken === null || (hasToken && meQuery.isLoading), branchId, setBranch, signIn, signOut, can }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return v;
}

export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!auth.loading && !auth.me) router.replace("/login");
  }, [auth.loading, auth.me, router]);
  return auth;
}
