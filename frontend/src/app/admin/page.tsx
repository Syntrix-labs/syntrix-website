"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import StatCard from "@/components/ui/StatCard";
import { BentoGrid, BentoCard } from "@/components/dashboard/Bento";
import { DashboardSkeleton } from "@/components/dashboard/States";
import { apiGet } from "@/lib/api";

type Summary = {
  totalClients: number;
  activeProjects: number;
  upcomingPayments: number;
  upcomingMeetings: number;
  consultationMessages: number;
  teamMembers: number;
};
type Project = { trackingStage?: string };
type Meeting = { status?: string };
type Payment = { status?: string };

const fallback: Summary = {
  totalClients: 0,
  activeProjects: 0,
  upcomingPayments: 0,
  upcomingMeetings: 0,
  consultationMessages: 0,
  teamMembers: 0,
};

const stages = ["Created", "Coding Starting", "Frontend Review", "Test", "Final Review", "Publish"];
const stageShort = ["Created", "Coding", "Frontend", "Test", "Final", "Publish"];

const cards = [
  { title: "Clients", key: "totalClients", value: "Client accounts", href: "/admin/clients" },
  { title: "Active projects", key: "activeProjects", value: "In progress", href: "/admin/projects" },
  { title: "Payments due", key: "upcomingPayments", value: "Awaiting payment", href: "/admin/payments" },
  { title: "Meetings", key: "upcomingMeetings", value: "Upcoming calls", href: "/admin/meetings" },
  { title: "Consultations", key: "consultationMessages", value: "Messages", href: "/admin/consultation" },
  { title: "Team", key: "teamMembers", value: "Members", href: "/admin/team" },
] as const;

export default function AdminPage() {
  const [summary, setSummary] = useState<Summary>(fallback);
  const [stageCounts, setStageCounts] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [attention, setAttention] = useState({ requests: 0, due: 0, docs: 0 });
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ name?: string }>("/api/auth/me", {}).then((u) => u.name && setName(u.name));
    Promise.all([
      apiGet<Summary>("/api/admin/summary", fallback),
      apiGet<Project[]>("/api/projects/admin/all", []),
      apiGet<Meeting[]>("/api/meetings/admin/all", []),
      apiGet<Payment[]>("/api/payments/admin/all", []),
      apiGet<unknown[]>("/api/uploads/admin/all", []),
    ])
      .then(([sum, projects, meetings, payments, uploads]) => {
        setSummary(sum);
        setStageCounts(stages.map((s) => projects.filter((p) => (p.trackingStage || "Created") === s).length));
        setAttention({
          requests: meetings.filter((m) => m.status === "Requested").length,
          due: payments.filter((p) => p.status !== "Paid").length,
          docs: uploads.length,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardShell type="admin">
        <DashboardSkeleton />
      </DashboardShell>
    );
  }

  const maxStage = Math.max(1, ...stageCounts);

  return (
    <DashboardShell type="admin">
      <SectionHeader
        icon="layout-dashboard"
        eyebrow="Control panel"
        title={name ? `Welcome back, ${name}` : "Syntrix control panel"}
        description="Manage clients, projects, meetings, payments, team, tracking, and the landing page portfolio."
      />

      <BentoGrid>
        {/* greeting */}
        <BentoCard index={0} accent className="xl:col-span-2">
          <p className="font-mono text-[11px] tracking-[0.4em] text-emerald-100/50">OVERVIEW</p>
          <h2 className="mt-3 text-2xl font-light tracking-wide text-white md:text-3xl">Everything across Syntrix</h2>
          <p className="mt-3 text-sm font-light text-emerald-50/70">
            {summary.totalClients} clients · {summary.activeProjects} active projects · {summary.teamMembers} team members
          </p>
        </BentoCard>

        {/* needs attention */}
        <BentoCard index={1}>
          <p className="mb-3 flex items-center gap-2 text-sm text-emerald-100/70">
            <i className="ti ti-alert-triangle text-amber-300" aria-hidden /> Needs attention
          </p>
          <div className="space-y-2">
            <a href="/admin/meetings" className="flex items-center justify-between rounded-xl border border-emerald-200/10 bg-emerald-950/40 px-3 py-2 text-sm transition hover:border-emerald-300/30">
              <span className="text-emerald-50/70">Meeting requests</span>
              <span className="font-medium text-emerald-200">{attention.requests}</span>
            </a>
            <a href="/admin/payments" className="flex items-center justify-between rounded-xl border border-amber-500/15 bg-amber-500/[0.06] px-3 py-2 text-sm transition hover:border-amber-400/30">
              <span className="text-amber-100/80">Payments due</span>
              <span className="font-medium text-amber-200">{attention.due}</span>
            </a>
            <a href="/admin/projects" className="flex items-center justify-between rounded-xl border border-emerald-200/10 bg-emerald-950/40 px-3 py-2 text-sm transition hover:border-emerald-300/30">
              <span className="text-emerald-50/70">Documents uploaded</span>
              <span className="font-medium text-emerald-200">{attention.docs}</span>
            </a>
          </div>
        </BentoCard>

        {/* stat tiles */}
        {cards.map((card, i) => (
          <StatCard key={card.href} index={i + 2} title={card.title} value={summary[card.key]} caption={card.value} href={card.href} />
        ))}

        {/* projects by stage */}
        <BentoCard index={8} className="xl:col-span-3" hover={false}>
          <p className="mb-4 text-sm text-emerald-100/70">Projects by stage</p>
          <div className="flex h-28 items-end gap-3">
            {stageCounts.map((c, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-xs text-emerald-100/60">{c}</span>
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: `${(c / maxStage) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full rounded-t-md bg-gradient-to-t from-emerald-600/50 to-emerald-300"
                  style={{ minHeight: 4 }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3">
            {stageShort.map((s) => (
              <span key={s} className="flex-1 text-center text-[10px] text-emerald-50/45">{s}</span>
            ))}
          </div>
        </BentoCard>
      </BentoGrid>
    </DashboardShell>
  );
}
