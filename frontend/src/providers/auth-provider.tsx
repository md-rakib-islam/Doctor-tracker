"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { setUnauthorizedHandler } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { authService } from "@/services/auth.service";
import type { Admin } from "@/types";

interface AuthContextValue {
  admin: Admin | null;
  isLoading: boolean;
  login: (values: { email: string; password: string }) => Promise<Admin>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const { data: admin, isLoading } = useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => authService.me(signal),
    retry: false,
    staleTime: 5 * 60_000,
  });

  const login = useCallback(
    async (values: { email: string; password: string }) => {
      const a = await authService.login(values);
      qc.setQueryData(queryKeys.me, a);
      return a;
    },
    [qc],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      qc.clear();
      router.replace("/login");
    }
  }, [qc, router]);

  // Any 401 from a data request means the session is gone: clear caches and return to login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      qc.clear();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    });
    return () => setUnauthorizedHandler(null);
  }, [qc, router, pathname]);

  const value = useMemo(() => ({ admin: admin ?? null, isLoading, login, logout }), [admin, isLoading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
