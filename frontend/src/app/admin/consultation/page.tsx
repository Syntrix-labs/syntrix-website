"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type Message = { _id: string; senderRole: "Admin" | "Client"; message: string; createdAt?: string; client?: { _id?: string; name?: string; email?: string } };
type Client = { _id: string; name: string; email: string };

export default function AdminConsultationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    apiGet<Message[]>("/api/consultations/admin/all", []).then(setMessages);
    apiGet<Client[]>("/api/admin/clients", []).then(setClients);
  };

  useEffect(() => {
    load();
  }, []);

  const send = async () => {
    if (!clientId || !message) {
      setMsg("Choose a client and write a message.");
      return;
    }
    setMsg("");
    const response = await fetch(apiPath("/api/consultations"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ client: clientId, senderRole: "Admin", message })
    });
    if (response.ok) {
      setMessage("");
      load();
    } else {
      setMsg("Could not send the message. Please try again.");
    }
  };

  return (
    <DashboardShell type="admin">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader icon="message-2" eyebrow="Consultation" title="Client consultation messages" description="Send structured updates and consultation notes to client dashboards." />

        <div className="mb-6 grid grid-cols-1 gap-4 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm md:grid-cols-[260px_1fr_auto]">
          <select value={clientId} onChange={(event) => setClientId(event.target.value)} className="rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition focus:border-emerald-400/60">
            <option value="">Select client</option>
            {clients.map((client) => <option key={client._id} value={client._id}>{client.name} - {client.email}</option>)}
          </select>
          <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write consultation update" className="rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60" />
          <button onClick={send} className="rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98]">Send</button>
          {msg && <p className="text-sm text-emerald-200 md:col-span-3">{msg}</p>}
        </div>

        <div className="space-y-4">
          {messages.map((item, i) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm"
            >
              <p className="mb-2 text-sm font-medium text-emerald-300">{item.client?.name || "Client"} • {item.senderRole}</p>
              <p className="font-light text-emerald-50/80">{item.message}</p>
              <p className="mt-4 font-mono text-xs text-emerald-50/40">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
