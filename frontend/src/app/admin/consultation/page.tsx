"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { DashboardSkeleton, EmptyState } from "@/components/dashboard/States";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type Message = { _id: string; senderRole: "Admin" | "Client"; message: string; createdAt?: string; client?: { _id?: string; name?: string; email?: string } };
type Client = { _id: string; name: string; email: string };

const time = (iso?: string) => (iso ? new Date(iso).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
const clientIdOf = (m: Message) => (typeof m.client === "object" ? m.client?._id : m.client);

export default function AdminConsultationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () =>
    Promise.all([
      apiGet<Message[]>("/api/consultations/admin/all", []).then(setMessages),
      apiGet<Client[]>("/api/admin/clients", []).then(setClients),
    ]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  // Live updates: poll for new messages while the page is open.
  useEffect(() => {
    const id = setInterval(() => {
      apiGet<Message[]>("/api/consultations/admin/all", []).then((fresh) => {
        setMessages((prev) => {
          const unchanged = prev.length === fresh.length && prev[0]?._id === fresh[0]?._id;
          return unchanged ? prev : fresh;
        });
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const thread = messages
    .filter((m) => clientIdOf(m) === selected)
    .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [selected, messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !selected || sending) return;
    setDraft("");
    setSending(true);
    try {
      await fetch(apiPath("/api/consultations"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ client: selected, message: text }),
      });
      await load();
    } finally {
      setSending(false);
    }
  };

  const lastFor = (id: string) => {
    const ms = messages.filter((m) => clientIdOf(m) === id);
    return ms.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
  };
  const selectedClient = clients.find((c) => c._id === selected);

  if (loading) {
    return (
      <DashboardShell type="admin">
        <DashboardSkeleton />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell type="admin">
      <SectionHeader
        icon="message-2"
        eyebrow="Consultation"
        title="Client messages"
        description="Pick a client and message them directly. Their replies appear here too."
      />

      {clients.length === 0 ? (
        <EmptyState icon="users" title="No clients yet" hint="Once clients sign up, you can message them here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
          {/* client list */}
          <div className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-3 backdrop-blur-md">
            <p className="px-2 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-100/45">Clients</p>
            <div className="max-h-[60vh] space-y-1 overflow-y-auto">
              {clients.map((c) => {
                const last = lastFor(c._id);
                const active = c._id === selected;
                return (
                  <button
                    key={c._id}
                    onClick={() => setSelected(c._id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${active ? "bg-emerald-500/18" : "hover:bg-emerald-200/5"}`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/22 text-sm text-emerald-100">
                      {(c.name || "?").charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-light text-white">{c.name}</p>
                      <p className="truncate text-[11px] text-emerald-50/45">{last ? last.message : c.email}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* thread */}
          <div className="flex min-h-[60vh] flex-col rounded-3xl border border-emerald-200/12 bg-emerald-950/25 backdrop-blur-md">
            {selected ? (
              <>
                <div className="flex items-center gap-3 border-b border-emerald-200/10 px-5 py-3.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/22 text-sm text-emerald-100">
                    {(selectedClient?.name || "?").charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-light text-white">{selectedClient?.name}</p>
                    <p className="text-[11px] text-emerald-50/45">{selectedClient?.email}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
                  {thread.length === 0 && <p className="text-center text-sm text-emerald-50/40">No messages yet — say hello.</p>}
                  {thread.map((m) => {
                    const mine = m.senderRole === "Admin";
                    return (
                      <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[78%]">
                          <div className={`rounded-2xl px-4 py-2.5 text-sm font-light ${mine ? "rounded-br-md bg-emerald-500/22 text-emerald-50" : "rounded-bl-md border border-emerald-200/10 bg-emerald-950/55 text-emerald-50/90"}`}>
                            {m.message}
                          </div>
                          <p className={`mt-1 px-1 text-[10px] text-emerald-100/35 ${mine ? "text-right" : ""}`}>{mine ? "You" : selectedClient?.name} · {time(m.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <div className="flex items-center gap-3 border-t border-emerald-200/10 px-4 py-3">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder={`Message ${selectedClient?.name || ""}…`}
                    className="flex-1 rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-50/90 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60"
                  />
                  <button onClick={send} disabled={!draft.trim() || sending} aria-label="Send" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/90 text-white transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50">
                    <i className="ti ti-send" aria-hidden />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <i className="ti ti-message-2 text-3xl text-emerald-300/50" aria-hidden />
                <p className="mt-3 text-sm font-light text-emerald-50/55">Select a client to view the conversation</p>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
