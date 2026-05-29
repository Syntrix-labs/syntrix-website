"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="rounded-2xl border border-white/10 bg-zinc-950 px-6 py-5 text-sm text-gray-300">
          Checking admin access...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white md:flex">
      <aside className={`${collapsed ? "md:w-24" : "md:w-72"} border-r border-white/10 bg-zinc-950 p-5 md:p-7 transition-all duration-300 md:min-h-screen sticky top-0 z-40`}>
        <div className="flex items-center justify-between gap-3 mb-8">
          <Link href={type === "admin" ? "/admin" : "/dashboard"} className="font-bold tracking-tight">
            <span className="text-blue-500 text-2xl">S</span>{!collapsed && <span className="text-2xl">YNTRIX</span>}
          </Link>
          <button onClick={() => setCollapsed((value) => !value)} className="border border-white/10 hover:border-blue-500/50 rounded-xl px-3 py-2 text-sm text-gray-300 transition">
            {collapsed ? "→" : "←"}
          </button>
        </div>
        <nav className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} title={item.label} className={`rounded-2xl px-4 py-3 transition whitespace-nowrap ${active ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
                {collapsed ? item.label.charAt(0) : item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="flex-1 p-6 md:p-10 xl:p-12">{children}</section>
    </main>
  );
}
