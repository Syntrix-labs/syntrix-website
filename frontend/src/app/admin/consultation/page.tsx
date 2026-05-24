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

  const load = () => {
    apiGet<Message[]>("/api/consultations/admin/all", []).then(setMessages);
    apiGet<Client[]>("/api/admin/clients", []).then(setClients);
  };

  useEffect(() => {
    load();
  }, []);

  const send = async () => {
    if (!clientId || !message) return alert("Choose client and write a message.");
    const response = await fetch(apiPath("/api/consultations"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ client: clientId, senderRole: "Admin", message })
    });
    if (response.ok) {
      setMessage("");
      load();
    }
  };

  return (
    <DashboardShell type="admin">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader eyebrow="Consultation" title="Client consultation messages" description="Send structured updates and consultation notes to client dashboards." />

        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 mb-6 grid grid-cols-1 md:grid-cols-[260px_1fr_auto] gap-4">
          <select value={clientId} onChange={(event) => setClientId(event.target.value)} className="bg-black border border-white/10 rounded-2xl px-4 py-3">
            <option value="">Select client</option>
            {clients.map((client) => <option key={client._id} value={client._id}>{client.name} - {client.email}</option>)}
          </select>
          <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write consultation update" className="bg-black border border-white/10 rounded-2xl px-4 py-3" />
          <button onClick={send} className="bg-blue-500 hover:bg-blue-600 rounded-2xl px-6 py-3 font-semibold">Send</button>
        </div>

        <div className="space-y-4">
          {messages.map((item) => (
            <div key={item._id} className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
              <p className="text-blue-400 text-sm mb-2">{item.client?.name || "Client"} • {item.senderRole}</p>
              <p className="text-gray-200">{item.message}</p>
              <p className="text-gray-500 text-xs mt-4">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
