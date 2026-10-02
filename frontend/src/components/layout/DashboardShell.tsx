"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BrandLogo from "@/components/brand/BrandLogo";
import DashboardAura from "@/components/dashboard/DashboardAura";
import NotifyPrompt from "@/components/notify/NotifyPrompt";
import { apiGet } from "@/lib/api";
import { unlinkThisDevice } from "@/lib/push";

/** Short two-note chime for new messages (no audio file needed). */
function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.38);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch {
    /* audio not available — the pop-up still shows */
  }
}

const clientItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Projects", href: "/dashboard/projects" },
  { label: "Consultation", href: "/dashboard/consultation" },
  { label: "Meetings", href: "/dashboard/meetings" },
  { label: "Payments", href: "/dashboard/payments" },
  { label: "Profile", href: "/dashboard/profile" },
];

const adminItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Clients", href: "/admin/clients" },
  { label: "Projects", href: "/admin/projects" },
  { label: "Pending projects", href: "/admin/pending-projects" },
  { label: "Consultation", href: "/admin/consultation" },
  { label: "Meetings", href: "/admin/meetings" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Team", href: "/admin/team" },
  { label: "Team meetings", href: "/admin/team-meetings" },
  { label: "Contracts", href: "/admin/contracts" },
  { label: "Advertisement", href: "/admin/advertisements" },
];

// Pages a team member is allowed to use.
const teamItems = [
  { label: "Consultation", href: "/admin/consultation" },
  { label: "Client meetings", href: "/admin/meetings" },
  { label: "Team meetings", href: "/admin/team-meetings" },
];
const teamPaths = teamItems.map((i) => i.href);

export default function DashboardShell({ type = "client", children }: { type?: "client" | "admin"; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [role, setRole] = useState<"admin" | "team" | null>(null);
  const [userName, setUserName] = useState("");
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const prevUnread = useRef<number | null>(null);
  const pathRef = useRef(pathname);
  const consultHref = type === "admin" ? "/admin/consultation" : "/dashboard/consultation";
  const ready = type === "client" || role !== null;

  // Resolve who the user is for admin-area pages.
  useEffect(() => {
    if (type !== "admin") return;
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    apiGet<{ isAdmin?: boolean; isTeam?: boolean; name?: string }>("/api/auth/me", { isAdmin: false }).then((u) => {
      if (cancelled) return;
      setUserName(u.name || "");
      if (u.isAdmin) setRole("admin");
      else if (u.isTeam) setRole("team");
      else router.replace("/dashboard");
    });
    return () => { cancelled = true; };
  }, [router, type]);

  useEffect(() => {
    if (type === "client") {
      apiGet<{ name?: string }>("/api/auth/me", {}).then((u) => setUserName(u.name || ""));
    }
  }, [type]);

  // Keep team members out of admin-only pages.
  useEffect(() => {
    if (type === "admin" && role === "team" && !teamPaths.includes(pathname)) {
      router.replace("/admin/consultation");
    }
  }, [type, role, pathname, router]);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  // Unread consultation messages: poll gently (30s, only while the tab is
  // visible), plus on demand when a chat page marks messages as read.
  useEffect(() => {
    if (!ready) return;
    let stopped = false;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await apiGet<{ total?: number }>("/api/consultations/unread", {});
      if (stopped || typeof res.total !== "number") return;
      const before = prevUnread.current;
      if (before !== null && res.total > before && pathRef.current !== consultHref) {
        const n = res.total - before;
        setToast(n === 1 ? "You have a new message" : `You have ${n} new messages`);
        chime();
      }
      prevUnread.current = res.total;
      setUnread(res.total);
    };
    check();
    const id = setInterval(check, 30000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("syntrix:unread-refresh", check);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("syntrix:unread-refresh", check);
    };
  }, [ready, consultHref]);

  // "(3) Syntrix…" in the tab title, and the badge on the installed app icon.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = unread ? `(${unread}) ${base}` : base;
    const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    try {
      if (unread) nav.setAppBadge?.(unread)?.catch(() => {});
      else nav.clearAppBadge?.()?.catch(() => {});
    } catch {}
  }, [unread, pathname]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(t);
  }, [toast]);

  const logout = async () => {
    await unlinkThisDevice(); // stop this user's notifications on this device
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  if (type === "admin" && role === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04140d] px-6 text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/15 bg-emerald-950/30 px-6 py-5 text-sm text-emerald-50/80 backdrop-blur-sm">
          <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
          Checking access…
        </div>
      </main>
    );
  }

  const items = type === "admin" ? (role === "team" ? teamItems : adminItems) : clientItems;
  const homeHref = role === "team" ? "/admin/consultation" : type === "admin" ? "/admin" : "/dashboard";
  const initial = (userName || (type === "admin" ? "A" : "C")).charAt(0).toUpperCase();
  const panelLabel = role === "team" ? "Team member" : type === "admin" ? "Admin panel" : "Client portal";

  return (
    <main className="relative min-h-screen bg-[#04140d] text-white md:flex">
      <DashboardAura />
      <aside
        className={`${collapsed ? "md:w-24" : "md:w-72"} sticky top-0 z-40 flex flex-col border-r border-emerald-200/10 bg-emerald-950/40 p-5 backdrop-blur-md transition-all duration-300 md:min-h-screen md:p-7`}
      >
        <div className="mb-8 flex items-center justify-between gap-3">
          <BrandLogo href={homeHref} compact={collapsed} />
          <button
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-xl border border-emerald-200/15 px-3 py-2 text-sm text-emerald-50/70 transition hover:border-emerald-300/50 hover:text-white"
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`relative whitespace-nowrap rounded-xl px-4 py-3 text-sm tracking-wide transition-colors ${
                  active ? "text-white" : "text-emerald-50/55 hover:bg-emerald-200/5 hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-emerald-500/90 to-emerald-600/70 shadow-lg shadow-emerald-500/25"
                  />
                )}
                {collapsed ? item.label.charAt(0) : item.label}
                {item.href === consultHref && unread > 0 &&
                  (collapsed ? (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#04140d]" aria-label={`${unread} unread`} />
                  ) : (
                    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 align-middle text-[10px] font-semibold text-white" aria-label={`${unread} unread`}>
                      {unread > 99 ? "99+" : unread}
                    </span>
                  ))}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden pt-8 md:block">
          <div className={`flex items-center gap-3 rounded-2xl border border-emerald-200/10 bg-emerald-950/40 p-3 ${collapsed ? "justify-center" : ""}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/40 to-emerald-600/30 text-sm font-medium text-white ring-1 ring-emerald-200/20">
              {initial}
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-light text-white">{userName || (type === "admin" ? "Admin" : "Client")}</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-100/40">{panelLabel}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className={`mt-3 w-full rounded-xl border border-emerald-200/15 py-2.5 text-sm text-emerald-50/70 transition hover:border-red-400/40 hover:text-red-200 ${collapsed ? "px-0" : ""}`}
          >
            {collapsed ? "⎋" : "Logout"}
          </button>
        </div>
      </aside>

      <section className="relative z-10 flex-1 p-6 md:p-10 xl:p-12">
        {ready && <NotifyPrompt />}
        {children}
      </section>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-5 right-5 z-[80] flex max-w-sm items-center gap-3 rounded-2xl border border-emerald-300/30 bg-emerald-950/90 px-4 py-3.5 shadow-2xl shadow-black/40 backdrop-blur-md"
            role="status"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/25 text-emerald-100">
              <i className="ti ti-message-2" aria-hidden />
            </span>
            <p className="text-sm text-emerald-50/90">{toast}</p>
            <Link href={consultHref} onClick={() => setToast(null)} className="rounded-xl bg-emerald-500/90 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-400">
              Open
            </Link>
            <button onClick={() => setToast(null)} aria-label="Dismiss" className="text-emerald-50/40 transition hover:text-white">
              <i className="ti ti-x" aria-hidden />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
