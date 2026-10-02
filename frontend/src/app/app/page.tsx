"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SyntrixMark from "@/components/brand/SyntrixMark";
import { apiGet } from "@/lib/api";

/**
 * Where the installed app (Home Screen / Android app) opens. Sends people
 * straight to their own dashboard — client, admin or team — or to login.
 * `/app?to=chat` (the "Messages" app shortcut) opens the conversation instead.
 */
export default function AppEntry() {
  const router = useRouter();

  useEffect(() => {
    const toChat = new URLSearchParams(window.location.search).get("to") === "chat";
    if (!localStorage.getItem("token")) {
      router.replace("/login");
      return;
    }
    apiGet<{ _id?: string; isAdmin?: boolean; isTeam?: boolean }>("/api/auth/me", {}).then((me) => {
      if (!me._id) {
        router.replace("/login"); // token expired
        return;
      }
      const staff = me.isAdmin || me.isTeam;
      if (toChat) router.replace(staff ? "/admin/consultation" : "/dashboard/consultation");
      else router.replace(me.isAdmin ? "/admin" : me.isTeam ? "/admin/consultation" : "/dashboard");
    });
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#04140d] text-emerald-50/70">
      <SyntrixMark size={56} className="animate-pulse" />
      <p className="text-sm tracking-[0.3em]">SYNTRIX</p>
    </main>
  );
}
