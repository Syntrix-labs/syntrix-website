"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SyntrixMark from "@/components/brand/SyntrixMark";
import { goToLogin, loadMe } from "@/lib/api";

/**
 * Where the installed app (Home Screen / Android app) opens. Sends people
 * straight to their own dashboard — client, admin or team — or to login.
 * `/app?to=chat` (the "Messages" app shortcut) opens the conversation instead.
 * A sleeping server only shows "waking up"; it never logs anyone out.
 */
export default function AppEntry() {
  const router = useRouter();
  const [waking, setWaking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const toChat = new URLSearchParams(window.location.search).get("to") === "chat";
    const hadToken = Boolean(localStorage.getItem("token"));
    let cancelled = false;
    setFailed(false);
    loadMe(() => setWaking(true)).then((r) => {
      if (cancelled) return;
      if (r.status === "signed-out") return goToLogin(hadToken);
      if (r.status === "offline") return setFailed(true);
      const me = r.user;
      const staff = me.isAdmin || me.isTeam;
      if (toChat) router.replace(staff ? "/admin/consultation" : "/dashboard/consultation");
      else router.replace(me.isAdmin ? "/admin" : me.isTeam ? "/admin/my-projects" : "/dashboard");
    });
    return () => {
      cancelled = true;
    };
  }, [router, attempt]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#04140d] px-6 text-center text-emerald-50/70">
      <SyntrixMark size={56} className={failed ? "" : "animate-pulse"} />
      <p className="text-sm tracking-[0.3em]">SYNTRIX</p>
      {failed ? (
        <>
          <p className="max-w-xs text-sm text-emerald-50/60">Can&apos;t reach Syntrix right now. Check your internet connection and try again.</p>
          <button
            onClick={() => setAttempt((n) => n + 1)}
            className="rounded-2xl bg-emerald-500/90 px-6 py-2.5 text-sm font-medium text-white active:scale-[0.98]"
          >
            Try again
          </button>
        </>
      ) : (
        waking && <p className="max-w-xs text-xs text-emerald-50/45">Waking up the server — this can take up to a minute…</p>
      )}
    </main>
  );
}
