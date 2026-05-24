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
  return <DashboardShell><motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}}><SectionHeader eyebrow="Consultation" title="Client consultation" description="All consultation messages are connected for admin-to-client updates." /><div className="space-y-4">{messages.map((m)=><div key={m._id} className="bg-zinc-900 border border-white/10 rounded-3xl p-6"><p className="text-blue-400 text-sm mb-2">{m.senderRole}</p><p className="text-gray-200">{m.message}</p><p className="text-gray-500 text-xs mt-4">{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</p></div>)}</div></motion.div></DashboardShell>;
}
