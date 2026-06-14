"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const items = type === "admin" ? adminItems : clientItems;

  useEffect(() => {
    if (type !== "admin") {
      setAdminReady(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    apiGet<{ isAdmin?: boolean }>("/api/auth/me", { isAdmin: false }).then((user) => {
      if (cancelled) return;
      if (user.isAdmin) {
        setAdminReady(true);
      } else {
        router.replace("/dashboard");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router, type]);

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

  return (
    <main
      className="min-h-screen bg-[#04140d] text-white md:flex"
      style={{ backgroundImage: "radial-gradient(120% 80% at 80% -10%, rgba(40,120,80,0.18), transparent 60%)" }}
    >
      <aside
        className={`${collapsed ? "md:w-24" : "md:w-72"} sticky top-0 z-40 border-r border-emerald-200/10 bg-emerald-950/30 p-5 backdrop-blur-md transition-all duration-300 md:min-h-screen md:p-7`}
      >
        <div className="mb-8 flex items-center justify-between gap-3">
          <BrandLogo href={type === "admin" ? "/admin" : "/dashboard"} compact={collapsed} />
          <button
            onClick={() => setCollapsed((value) => !value)}
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
                className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm tracking-wide transition ${
                  active
                    ? "bg-gradient-to-r from-emerald-500/90 to-emerald-600/70 text-white shadow-lg shadow-emerald-500/25"
                    : "text-emerald-50/55 hover:bg-emerald-200/5 hover:text-white"
                }`}
              >
                {collapsed ? item.label.charAt(0) : item.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-8 hidden font-mono text-[10px] tracking-[0.3em] text-emerald-100/30 md:block">
          {type === "admin" ? "ADMIN PANEL" : "CLIENT PORTAL"}
        </p>
      </aside>
      <section className="flex-1 p-6 md:p-10 xl:p-12">{children}</section>
    </main>
  );
}
