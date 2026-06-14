"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { DashboardSkeleton } from "@/components/dashboard/States";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type Message = { _id: string; senderRole: string; message: string; createdAt?: string };

const fallback: Message[] = [
  {
    _id: "1",
    senderRole: "Admin",
    message: "Welcome to Syntrix consultation 👋 Your team posts project updates and answers here. Drop us a message anytime.",
    createdAt: new Date().toISOString(),
  },
];

const dayLabel = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};
const timeLabel = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

export default function ConsultationPage() {
  const [messages, setMessages] = useState<Message[]>(fallback);
  const [name, setName] = useState("You");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiGet<Message[]>("/api/consultations", fallback)
      .then((m) => setMessages(m.length ? m : fallback))
      .finally(() => setLoading(false));
    apiGet<{ name?: string }>("/api/auth/me", {}).then((u) => u.name && setName(u.name));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    setSending(true);
    const optimistic: Message = {
      _id: `local-${Date.now()}`,
      senderRole: "Client",
      message: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    try {
      const res = await fetch(apiPath("/api/consultations"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const fresh = await apiGet<Message[]>("/api/consultations", []);
        if (fresh.length) setMessages(fresh);
      }
    } catch {
      /* message stays shown optimistically if the request failed */
    } finally {
      setSending(false);
    }
  };

  let lastDay = "";

  if (loading) {
    return (
      <DashboardShell>
        <DashboardSkeleton />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <SectionHeader
          icon="message-2"
          eyebrow="Consultation"
          title="Talk to your team"
          description="A direct line to Soham and Tahir. Project updates, answers, and consultation notes live here."
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden rounded-3xl border border-emerald-200/12 bg-emerald-950/30 backdrop-blur-md"
        >
          {/* thread header */}
          <div className="flex items-center gap-3 border-b border-emerald-200/10 px-5 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/40 to-emerald-600/30 text-sm font-medium text-white ring-1 ring-emerald-200/20">
              S
            </span>
            <div>
              <p className="text-sm font-light text-white">Syntrix team</p>
              <p className="flex items-center gap-1.5 text-[11px] text-emerald-100/50">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online · usually replies within a day
              </p>
            </div>
          </div>

          {/* thread */}
          <div className="max-h-[58vh] space-y-1 overflow-y-auto px-4 py-5 md:px-6">
            {messages.map((m, i) => {
              const mine = m.senderRole === "Client";
              const d = dayLabel(m.createdAt);
              const showDay = d && d !== lastDay;
              lastDay = d || lastDay;
              return (
                <div key={m._id}>
                  {showDay && (
                    <div className="my-4 flex justify-center">
                      <span className="rounded-full bg-emerald-950/60 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-100/45">
                        {d}
                      </span>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.03 }}
                    className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
                  >
                    {!mine && (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/25 text-[11px] text-emerald-100">
                        S
                      </span>
                    )}
                    <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm font-light leading-relaxed ${
                          mine
                            ? "rounded-br-md bg-emerald-500/22 text-emerald-50"
                            : "rounded-bl-md border border-emerald-200/10 bg-emerald-950/55 text-emerald-50/90"
                        }`}
                      >
                        {m.message}
                      </div>
                      <span className="mt-1 px-1 text-[10px] text-emerald-100/35">
                        {mine ? name : "Syntrix"} · {timeLabel(m.createdAt)}
                      </span>
                    </div>
                    {mine && (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400/30 text-[11px] text-emerald-100">
                        {(name || "Y").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </motion.div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* composer */}
          <div className="flex items-center gap-3 border-t border-emerald-200/10 px-4 py-3 md:px-5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Write a message…"
              className="flex-1 rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-50/90 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60"
            />
            <button
              onClick={send}
              disabled={!draft.trim() || sending}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/90 text-white transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
            >
              <i className="ti ti-send" aria-hidden />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </DashboardShell>
  );
}
