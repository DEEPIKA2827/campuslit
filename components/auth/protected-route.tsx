/**
 * @file components/auth/protected-route.tsx
 * @description Client-side route protection guard component.
 * @purpose Renders a loading state while session initializes, redirects unauthenticated users to /login.
 */

"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08090e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
          <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
            Loading CampusLit...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
