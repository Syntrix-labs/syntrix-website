"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import StatCard from "@/components/ui/StatCard";
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

const fallback: Summary = {
  totalClients: 0,
  activeProjects: 0,
  upcomingPayments: 0,
  upcomingMeetings: 0,
  consultationMessages: 0,
  teamMembers: 0,
};

const cards = [
  { title: "Clients", key: "totalClients", value: "Client accounts", href: "/admin/clients" },
  { title: "Projects", key: "activeProjects", value: "Active work", href: "/admin/projects" },
  { title: "Meetings", key: "upcomingMeetings", value: "Requests and calls", href: "/admin/meetings" },
  { title: "Payments", key: "upcomingPayments", value: "Upcoming payments", href: "/admin/payments" },
  { title: "Consultation", key: "consultationMessages", value: "Client messages", href: "/admin/consultation" },
  { title: "Team", key: "teamMembers", value: "Members", href: "/admin/team" },
] as const;

export default function AdminPage() {
  const [summary, setSummary] = useState<Summary>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Summary>("/api/admin/summary", fallback).then(setSummary).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardShell type="admin">
        <DashboardSkeleton />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell type="admin">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          icon="layout-dashboard" eyebrow="Admin Dashboard"
          title="Syntrix Control Panel"
          description="Manage client accounts, projects, meetings, payments, team operations, tracking, and landing page portfolio updates."
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card, i) => (
            <StatCard
              key={card.href}
              index={i}
              title={card.title}
              value={summary[card.key]}
              caption={card.value}
              href={card.href}
            />
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
