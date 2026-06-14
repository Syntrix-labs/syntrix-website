"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet } from "@/lib/api";

type Message = { _id: string; senderRole: string; message: string; createdAt?: string };
const fallback = [{ _id: "1", senderRole: "Admin", message: "Welcome to Syntrix consultation. Admin messages will appear here.", createdAt: new Date().toISOString() }];

export default function ConsultationPage() {
  const [messages, setMessages] = useState<Message[]>(fallback);
  useEffect(() => { apiGet<Message[]>("/api/consultations", fallback).then(setMessages); }, []);
  return (
    <DashboardShell>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <SectionHeader
          icon="message-2"
          eyebrow="Consultation"
          title="Client consultation"
          description="All consultation messages are connected for admin-to-client updates."
        />
        <div className="space-y-4">
          {messages.map((m, i) => (
            <motion.div
              key={m._id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm"
            >
              <p className="mb-2 text-sm font-medium text-emerald-300">{m.senderRole}</p>
              <p className="font-light text-emerald-50/80">{m.message}</p>
              <p className="mt-4 font-mono text-xs text-emerald-50/40">{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
