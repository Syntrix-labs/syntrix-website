"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
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

  useEffect(() => {
    apiGet<Summary>("/api/admin/summary", fallback).then(setSummary);
  }, []);

  return (
    <DashboardShell type="admin">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          eyebrow="Admin Dashboard"
          title="Syntrix Control Panel"
          description="Manage client accounts, projects, meetings, payments, team operations, tracking, and landing page portfolio updates."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className="bg-zinc-900 border border-white/10 rounded-3xl p-8 hover:border-blue-500/50 hover:-translate-y-1 transition">
              <p className="text-gray-400 mb-5">{card.title}</p>
              <h2 className="text-5xl font-bold text-blue-500">{summary[card.key]}</h2>
              <p className="text-gray-500 mt-4">{card.value}</p>
            </Link>
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
