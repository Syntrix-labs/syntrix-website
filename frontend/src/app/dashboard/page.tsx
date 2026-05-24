"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet } from "@/lib/api";

type User = { name?: string };
type Project = { _id: string; status?: string };
type Message = { _id: string };
type Meeting = { _id: string; status?: string };
type Payment = { _id: string; status?: string };

const cards = [
  { title: "Active Projects", href: "/dashboard/projects", key: "projects" },
  { title: "Consultation Updates", href: "/dashboard/consultation", key: "messages" },
  { title: "Meetings", href: "/dashboard/meetings", key: "meetings" },
  { title: "Upcoming Payments", href: "/dashboard/payments", key: "payments" },
];

export default function DashboardPage() {
  const [name, setName] = useState("Client");
  const [stats, setStats] = useState({ projects: 0, messages: 0, meetings: 0, payments: 0 });

  useEffect(() => {
    apiGet<User>("/api/auth/me", {}).then((user) => setName(user.name || "Client"));
    Promise.all([
      apiGet<Project[]>("/api/projects", []),
      apiGet<Message[]>("/api/consultations", []),
      apiGet<Meeting[]>("/api/meetings", []),
      apiGet<Payment[]>("/api/payments", []),
    ]).then(([projects, messages, meetings, payments]) => {
      setStats({
        projects: projects.filter((project) => project.status !== "Completed").length,
        messages: messages.length,
        meetings: meetings.filter((meeting) => meeting.status !== "Completed" && meeting.status !== "Cancelled").length,
        payments: payments.filter((payment) => payment.status !== "Paid").length,
      });
    });
  }, []);

  return (
    <DashboardShell>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <SectionHeader
          eyebrow="Welcome"
          title={`Welcome back, ${name}`}
          description="Manage projects, consultation messages, meetings, documents, payments, and profile details from one place."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className="bg-zinc-900 border border-white/10 rounded-3xl p-7 hover:border-blue-500/50 hover:-translate-y-1 transition">
              <p className="text-gray-400 mb-5">{card.title}</p>
              <h2 className="text-5xl font-bold text-blue-500">{stats[card.key as keyof typeof stats]}</h2>
            </Link>
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
