"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { DashboardSkeleton, EmptyState } from "@/components/dashboard/States";
import { apiGet, apiPath, authHeaders } from "@/lib/api";
import { connectSocket, type Socket } from "@/lib/socket";
import ChatAttachment, { type Attachment } from "@/components/chat/ChatAttachment";
import AttachFileButton from "@/components/chat/AttachFileButton";

type Message = { _id: string; senderRole: "Admin" | "Client"; senderName?: string; message: string; createdAt?: string; readAt?: string | null; attachment?: Attachment; client?: { _id?: string; name?: string; email?: string } };
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
  const [name, setName] = useState("");
  const [fileStatus, setFileStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    apiGet<{ name?: string }>("/api/auth/me", {}).then((u) => u.name && setName(u.name));
  }, []);

  const load = () =>
    Promise.all([
      apiGet<Message[]>("/api/consultations/admin/all", []).then(setMessages),
      apiGet<Client[]>("/api/admin/clients", []).then(setClients),
    ]);

  useEffect(() => {
    load().finally(() => setLoading(false));
    // Opened from a notification/email link: /admin/consultation?client=<id>
    const fromLink = new URLSearchParams(window.location.search).get("client");
    if (fromLink) setSelected(fromLink);
  }, []);

  // Real-time: socket pushes new messages instantly (falls back to polling).
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;
    socketRef.current = socket;
    socket.on("consultation:new", (msg: Message) => {
      setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [msg, ...prev]));
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, []);

  // Join the selected client's room so their replies arrive live.
  useEffect(() => {
    if (selected) socketRef.current?.emit("join", selected);
    setFileStatus(null);
  }, [selected]);

  // Fallback: poll for new messages while the page is open.
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

  // Mark the open client's messages as read while the conversation is on screen.
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  const unreadFor = (id: string) => messages.filter((m) => clientIdOf(m) === id && m.senderRole === "Client" && !m.readAt).length;
  const selectedUnread = selected ? unreadFor(selected) : 0;
  useEffect(() => {
    if (!visible || !selected || !selectedUnread) return;
    fetch(apiPath("/api/consultations/read"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ client: selected }),
    })
      .then(() => {
        const now = new Date().toISOString();
        setMessages((prev) => prev.map((m) => (clientIdOf(m) === selected && m.senderRole === "Client" && !m.readAt ? { ...m, readAt: now } : m)));
        window.dispatchEvent(new Event("syntrix:unread-refresh"));
      })
      .catch(() => {});
  }, [visible, selected, selectedUnread]);

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
  // Phones show either the client list or one conversation; "back" returns to the list.
  const closeThread = () => {
    setSelected("");
    window.history.replaceState(null, "", "/admin/consultation");
  };
  // Clients with unread messages first, then most recent conversation.
  const lastAt = (id: string) => new Date(lastFor(id)?.createdAt || 0).getTime();
  const sortedClients = [...clients].sort((a, b) => (unreadFor(b._id) > 0 ? 1 : 0) - (unreadFor(a._id) > 0 ? 1 : 0) || lastAt(b._id) - lastAt(a._id));

  if (loading) {
    return (
      <DashboardShell type="admin">
        <DashboardSkeleton />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell type="admin">
      <div className={selected ? "hidden md:block" : ""}>
        <SectionHeader
          icon="message-2"
          eyebrow="Consultation"
          title={name ? `Welcome back, ${name.split(" ")[0]}` : "Client messages"}
          description="Pick a client and message them directly. Their replies appear here too."
        />
      </div>

      {clients.length === 0 ? (
        <EmptyState icon="users" title="No clients yet" hint="Once clients sign up, you can message them here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
          {/* client list */}
          <div className={`${selected ? "hidden md:block" : ""} rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-3 backdrop-blur-md`}>
            <p className="px-2 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-100/45">Clients</p>
            <div className="space-y-1 md:max-h-[60vh] md:overflow-y-auto">
              {sortedClients.map((c) => {
                const last = lastFor(c._id);
                const unreadCount = unreadFor(c._id);
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
                      <p className={`truncate text-sm ${unreadCount ? "font-medium text-white" : "font-light text-white"}`}>{c.name}</p>
                      <p className="truncate text-[11px] text-emerald-50/45">{last ? last.message || (last.attachment?.name ? `📎 ${last.attachment.name}` : "") : c.email}</p>
                    </div>
                    {unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white" aria-label={`${unreadCount} unread`}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* thread */}
          <div className={`${selected ? "flex" : "hidden md:flex"} h-[var(--chat-h)] min-h-[420px] flex-col overflow-hidden rounded-3xl border border-emerald-200/12 bg-emerald-950/25 backdrop-blur-md md:h-auto md:min-h-[60vh]`}>
            {selected ? (
              <>
                <div className="flex shrink-0 items-center gap-3 border-b border-emerald-200/10 px-3 py-3 md:px-5 md:py-3.5">
                  <button onClick={closeThread} aria-label="Back to clients" className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-emerald-50/80 active:bg-emerald-200/10 md:hidden">
                    <i className="ti ti-arrow-left text-xl" aria-hidden />
                  </button>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/22 text-sm text-emerald-100">
                    {(selectedClient?.name || "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-light text-white">{selectedClient?.name}</p>
                    <p className="truncate text-[11px] text-emerald-50/45">{selectedClient?.email}</p>
                  </div>
                </div>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 md:px-5 md:py-5">
                  {thread.length === 0 && <p className="text-center text-sm text-emerald-50/40">No messages yet — say hello.</p>}
                  {thread.map((m) => {
                    const mine = m.senderRole === "Admin";
                    return (
                      <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[78%]">
                          {m.attachment?.fileId && (
                            <div className={`w-72 max-w-full ${mine ? "ml-auto" : ""} ${m.message ? "mb-1.5" : ""}`}>
                              <ChatAttachment attachment={m.attachment} mine={mine} />
                            </div>
                          )}
                          {m.message && (
                            <div className={`rounded-2xl px-4 py-2.5 text-sm font-light ${mine ? "rounded-br-md bg-emerald-500/22 text-emerald-50" : "rounded-bl-md border border-emerald-200/10 bg-emerald-950/55 text-emerald-50/90"}`}>
                              {m.message}
                            </div>
                          )}
                          <p className={`mt-1 px-1 text-[10px] text-emerald-100/35 ${mine ? "text-right" : ""}`}>{mine ? (m.senderName && m.senderName !== name ? m.senderName : "You") : selectedClient?.name} · {time(m.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                {fileStatus && (
                  <p className={`border-t border-emerald-200/10 px-5 pt-2.5 text-xs ${fileStatus.error ? "text-red-300" : "text-emerald-100/60"}`}>{fileStatus.text}</p>
                )}
                <div className="flex shrink-0 items-center gap-2 border-t border-emerald-200/10 px-3 py-2.5 md:gap-3 md:px-4 md:py-3">
                  <AttachFileButton
                    clientId={selected}
                    caption={draft}
                    onStatus={(text, error) => setFileStatus(text ? { text, error } : null)}
                    onSent={async () => {
                      setDraft("");
                      await load();
                    }}
                  />
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
