"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import BrandLogo from "@/components/brand/BrandLogo";
import { apiGet } from "@/lib/api";

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
  { label: "Consultation", href: "/admin/consultation" },
  { label: "Meetings", href: "/admin/meetings" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Team", href: "/admin/team" },
  { label: "Tracking", href: "/admin/tracking" },
  { label: "Advertisement", href: "/admin/advertisements" },
];

export default function DashboardShell({ type = "client", children }: { type?: "client" | "admin"; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [adminReady, setAdminReady] = useState(type !== "admin");
  const [userName, setUserName] = useState("");
  const items = type === "admin" ? adminItems : clientItems;

  useEffect(() => {
    if (type !== "admin") {
      setAdminReady(true);
    }

    const token = localStorage.getItem("token");
    if (!token) {
      if (type === "admin") router.replace("/login");
      return;
    }

    let cancelled = false;
    apiGet<{ isAdmin?: boolean; name?: string }>("/api/auth/me", { isAdmin: false }).then((user) => {
      if (cancelled) return;
      setUserName(user.name || "");
      if (type === "admin") {
        if (user.isAdmin) setAdminReady(true);
        else router.replace("/dashboard");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router, type]);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  if (type === "admin" && !adminReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04140d] px-6 text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/15 bg-emerald-950/30 px-6 py-5 text-sm text-emerald-50/80 backdrop-blur-sm">
          <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
          Checking admin access…
        </div>
      </main>
    );
  }

  const initial = (userName || (type === "admin" ? "A" : "C")).charAt(0).toUpperCase();

  return (
    <main
      className="min-h-screen bg-[#04140d] text-white md:flex"
      style={{ backgroundImage: "radial-gradient(120% 80% at 80% -10%, rgba(40,120,80,0.18), transparent 60%)" }}
    >
      <aside
        className={`${collapsed ? "md:w-24" : "md:w-72"} sticky top-0 z-40 flex flex-col border-r border-emerald-200/10 bg-emerald-950/30 p-5 backdrop-blur-md transition-all duration-300 md:min-h-screen md:p-7`}
      >
        <div className="mb-8 flex items-center justify-between gap-3">
          <BrandLogo href={type === "admin" ? "/admin" : "/dashboard"} compact={collapsed} />
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
              </Link>
            );
          })}
        </nav>

        {/* user + logout */}
        <div className="mt-auto hidden pt-8 md:block">
          <div className={`flex items-center gap-3 rounded-2xl border border-emerald-200/10 bg-emerald-950/40 p-3 ${collapsed ? "justify-center" : ""}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/40 to-emerald-600/30 text-sm font-medium text-white ring-1 ring-emerald-200/20">
              {initial}
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-light text-white">{userName || (type === "admin" ? "Admin" : "Client")}</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-100/40">
                  {type === "admin" ? "Admin panel" : "Client portal"}
                </p>
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

      <section className="flex-1 p-6 md:p-10 xl:p-12">{children}</section>
    </main>
  );
}
