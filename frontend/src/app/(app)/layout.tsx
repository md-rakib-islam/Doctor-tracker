"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/providers/auth-provider";

/** Client-side gate behind the proxy.ts cookie check: only renders once /auth/me confirms a valid session. */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !admin) router.replace("/login");
  }, [admin, isLoading, router]);

  if (isLoading || !admin) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground" role="status" aria-label="Checking session">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }
  return <AppShell>{children}</AppShell>;
}
