"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import StatCard from "@/components/ui/StatCard";
import { apiGet } from "@/lib/api";

type User = { name?: string };
type Project = { _id: string; status?: string };
type Message = { _id: string };
type Meeting = { _id: string; status?: string };
type Payment = { _id: string; status?: string };

const cards = [
  { title: "Active Projects", href: "/dashboard/projects", key: "projects", caption: "In progress" },
  { title: "Consultation Updates", href: "/dashboard/consultation", key: "messages", caption: "Messages" },
  { title: "Meetings", href: "/dashboard/meetings", key: "meetings", caption: "Scheduled & requested" },
  { title: "Upcoming Payments", href: "/dashboard/payments", key: "payments", caption: "Awaiting payment" },
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card, i) => (
            <StatCard
              key={card.href}
              index={i}
              title={card.title}
              value={stats[card.key as keyof typeof stats]}
              caption={card.caption}
              href={card.href}
            />
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
