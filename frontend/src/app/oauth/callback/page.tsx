"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";

/** Lands here after the backend completes a social sign-in and redirects with
 *  ?token=... — store it, figure out the role, and route to the dashboard. */
export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      router.replace("/login?error=oauth_error");
      return;
    }
    localStorage.setItem("token", token);
    apiGet<{ isAdmin?: boolean; isTeam?: boolean }>("/api/auth/me", {}).then((u) => {
      router.replace(u.isAdmin ? "/admin" : u.isTeam ? "/admin/my-projects" : "/dashboard");
    });
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#04140d] text-emerald-50/80">
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/15 bg-emerald-950/40 px-6 py-5 text-sm backdrop-blur-sm">
        <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
        Signing you in…
      </div>
    </main>
  );
}
