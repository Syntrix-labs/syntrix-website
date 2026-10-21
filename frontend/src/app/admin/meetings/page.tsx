"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { DashboardSkeleton, EmptyState } from "@/components/dashboard/States";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type Meeting = {
  _id: string;
  title: string;
  date: string;
  time: string;
  timezone?: string;
  status: "Requested" | "Confirmed" | "Completed" | "Cancelled";
  meetingLink?: string;
  meetingPlatform?: string;
  notes?: string;
  client?: { name?: string; email?: string };
  assignees?: string[];
};

type TeamMember = { _id: string; name: string; email?: string; role?: string };
type Client = { _id: string; name?: string; email?: string };

const platforms = ["Google Meet", "Zoom", "Phone", "Other"];
const emptyForm = { client: "", title: "Project discussion", date: "", time: "", meetingPlatform: "Google Meet", meetingLink: "", notes: "", assignees: [] as string[] };
const fieldClass =
  "w-full rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/85 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60";
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const fallbackMeetings: Meeting[] = [
  {
    _id: "demo",
    title: "Website discovery call",
    date: "2026-05-28",
    time: "19:00",
    timezone: "Asia/Kolkata",
    status: "Requested",
    client: { name: "Demo Client", email: "client@example.com" },
    notes: "Client wants custom website and app consultation."
  }
];

export default function AdminMeetingsPage() {
  const [role, setRole] = useState<"admin" | "team" | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>(fallbackMeetings);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  // "Arrange a meeting" form
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formMsg, setFormMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await apiGet<{ isAdmin?: boolean; isTeam?: boolean }>("/api/auth/me", {});
      if (cancelled) return;
      const isTeamOnly = !me.isAdmin && Boolean(me.isTeam);
      setRole(isTeamOnly ? "team" : "admin");

      if (isTeamOnly) {
        // Team members only see the client meetings they were invited to join.
        await apiGet<Meeting[]>("/api/meetings/assigned", []).then((m) => !cancelled && setMeetings(m));
      } else {
        await Promise.all([
          apiGet<Meeting[]>("/api/meetings/admin/all", fallbackMeetings).then((m) => !cancelled && setMeetings(m)),
          apiGet<TeamMember[]>("/api/team", []).then((t) => !cancelled && setTeam(t.filter((x) => x.email))),
          apiGet<Client[]>("/api/admin/clients", []).then((c) => !cancelled && setClients(c))
        ]);
        // Opened from a client's "Schedule meeting" button: /admin/meetings?schedule=<clientId>
        const preset = new URLSearchParams(window.location.search).get("schedule");
        if (preset && !cancelled) {
          setForm((f) => ({ ...f, client: preset }));
          setShowForm(true);
        }
      }
    })().finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const updateMeeting = async (id: string, body: Partial<Meeting>) => {
    setMeetings((prev) => prev.map((m) => (m._id === id ? { ...m, ...body } : m))); // instant
    await fetch(apiPath(`/api/meetings/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body)
    });
  };

  const schedule = async () => {
    if (!form.client || !form.date || !form.time) {
      setFormMsg({ text: "Choose a client, a date and a time.", error: true });
      return;
    }
    setSaving(true);
    setFormMsg(null);
    try {
      const res = await fetch(apiPath("/api/meetings"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ ...form, title: form.title.trim() || "Project discussion" })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormMsg({ text: data.message || "Couldn't schedule the meeting — please try again.", error: true });
        return;
      }
      const who = clients.find((c) => c._id === form.client)?.name || "The client";
      setMeetings((prev) => [data.meeting, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
      setFormMsg({ text: `Meeting booked. ${who} has been notified in their chat${data.emailed ? " and by email" : ""}.` });
    } catch {
      setFormMsg({ text: "Couldn't schedule the meeting — please try again.", error: true });
    } finally {
      setSaving(false);
    }
  };

  const toggleFormAssignee = (email: string) =>
    setForm((f) => ({ ...f, assignees: f.assignees.includes(email) ? f.assignees.filter((e) => e !== email) : [...f.assignees, email] }));

  const toggleAssignee = (meeting: Meeting, email: string) => {
    const current = meeting.assignees || [];
    const next = current.includes(email) ? current.filter((e) => e !== email) : [...current, email];
    updateMeeting(meeting._id, { assignees: next });
  };

  const isMissed = (m: Meeting) => {
    if (m.status !== "Requested") return false;
    const d = new Date(`${m.date}T${(m.time || "").length === 5 ? m.time : "00:00"}`);
    return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
  };

  // -------- Team-member view: read-only "meetings I can join" --------
  if (!loading && role === "team") {
    const joinable = meetings
      .filter((m) => m.status === "Confirmed" || m.status === "Requested")
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    return (
      <DashboardShell type="admin">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <SectionHeader
            icon="calendar" eyebrow="Client meetings"
            title="Meetings you're invited to"
            description="These are the client meetings an admin asked you to join. Join at the scheduled time using the link."
          />
          {joinable.length === 0 ? (
            <EmptyState icon="calendar" title="No meetings assigned" hint="When an admin invites you to a client meeting, it shows up here." />
          ) : (
            <div className="space-y-4">
              {joinable.map((meeting, i) => (
                <motion.div
                  key={meeting._id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="flex flex-col justify-between gap-5 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm xl:flex-row xl:items-center"
                >
                  <div>
                    <p className="mb-2 text-sm font-medium text-emerald-300">{meeting.client?.name || "Client"}{meeting.client?.email ? ` • ${meeting.client.email}` : ""}</p>
                    <h2 className="text-2xl font-light tracking-wide">{meeting.title}</h2>
                    <p className="mt-2 font-light text-emerald-50/60">{meeting.date} at {meeting.time} ({meeting.timezone || "Asia/Kolkata"})</p>
                    {meeting.notes && <p className="mt-2 text-sm text-emerald-50/45">{meeting.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs ${meeting.status === "Confirmed" ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-100"}`}>{meeting.status}</span>
                    {meeting.meetingLink && meeting.meetingLink.startsWith("http") ? (
                      <a href={meeting.meetingLink} target="_blank" className="rounded-2xl bg-emerald-500/90 px-5 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98]">Join meeting</a>
                    ) : (
                      <span className="rounded-2xl border border-emerald-200/15 px-5 py-3 text-sm text-emerald-50/40">Link coming soon</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </DashboardShell>
    );
  }

  const pending = meetings.filter((m) => m.status === "Requested");
  const upcoming = meetings.filter((m) => m.status === "Confirmed");
  const past = meetings.filter((m) => m.status === "Completed" || m.status === "Cancelled");

  const renderAssignees = (meeting: Meeting) =>
    team.length === 0 ? null : (
      <div className="rounded-2xl border border-emerald-200/10 bg-emerald-950/30 p-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-100/40">Who joins from the team</p>
        <div className="flex flex-wrap gap-2">
          {team.map((member) => {
            const email = (member.email || "").toLowerCase();
            const on = (meeting.assignees || []).includes(email);
            return (
              <button
                key={member._id}
                onClick={() => toggleAssignee(meeting, email)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${on ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100" : "border-emerald-200/15 text-emerald-50/55 hover:border-emerald-300/40"}`}
              >
                {on ? "✓ " : ""}{member.name}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-emerald-50/35">Selected members see this meeting (with the join link) in their dashboard.</p>
      </div>
    );

  const renderList = (title: string, items: Meeting[]) =>
    items.length === 0 ? null : (
      <div>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-100/45">{title}</p>
        <div className="space-y-4">
          {items.map((meeting, i) => (
            <motion.div
              key={meeting._id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm"
            >
              <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
                <div>
                  <p className="mb-2 text-sm font-medium text-emerald-300">{meeting.client?.name || "Client"} • {meeting.client?.email}</p>
                  <h2 className="text-2xl font-light tracking-wide">{meeting.title}</h2>
                  <p className="mt-2 font-light text-emerald-50/60">{meeting.date} at {meeting.time} ({meeting.timezone || "Asia/Kolkata"})</p>
                  <p className="mt-2 text-sm text-emerald-50/45">{meeting.notes || "No notes added."}</p>
                  {meeting.meetingLink && <a className="mt-3 inline-block text-emerald-300 transition hover:text-emerald-200" href={meeting.meetingLink} target="_blank">Open meeting link</a>}
                </div>

                <div className="min-w-full space-y-3 xl:min-w-[360px]">
                  {isMissed(meeting) ? (
                    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] p-4">
                      <p className="text-sm text-amber-100">Sorry, this request's time passed before it was confirmed.</p>
                      <p className="mt-1 text-xs text-amber-100/70">Ask the client to request another time.</p>
                      <button onClick={() => updateMeeting(meeting._id, { status: "Cancelled" })} className="mt-3 rounded-xl border border-amber-400/40 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-500/10">Dismiss request</button>
                    </div>
                  ) : meeting.status === "Requested" ? (
                    <>
                      <input
                        value={links[meeting._id] ?? meeting.meetingLink ?? ""}
                        onChange={(event) => setLinks({ ...links, [meeting._id]: event.target.value })}
                        placeholder="Paste Google Meet / Zoom link"
                        className="w-full rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => updateMeeting(meeting._id, { status: "Confirmed", meetingLink: links[meeting._id] || meeting.meetingLink })} className="rounded-2xl bg-emerald-500/90 px-4 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98]">Confirm</button>
                        <button onClick={() => updateMeeting(meeting._id, { status: "Cancelled" })} className="rounded-2xl border border-emerald-200/15 px-4 py-3 transition hover:border-red-400/50 hover:text-red-200">Decline</button>
                      </div>
                      {renderAssignees(meeting)}
                    </>
                  ) : meeting.status === "Confirmed" ? (
                    <>
                      <input
                        value={links[meeting._id] ?? meeting.meetingLink ?? ""}
                        onChange={(event) => setLinks({ ...links, [meeting._id]: event.target.value })}
                        placeholder="Update meeting link"
                        className="w-full rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => updateMeeting(meeting._id, { meetingLink: links[meeting._id] || meeting.meetingLink })} className="rounded-2xl border border-emerald-200/15 px-4 py-3 transition hover:border-emerald-300/50">Save link</button>
                        <button onClick={() => updateMeeting(meeting._id, { status: "Completed" })} className="rounded-2xl bg-emerald-500/90 px-4 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98]">Complete</button>
                        <button onClick={() => updateMeeting(meeting._id, { status: "Cancelled" })} className="col-span-2 rounded-2xl border border-emerald-200/15 px-4 py-3 transition hover:border-red-400/50 hover:text-red-200">Cancel meeting</button>
                      </div>
                      {renderAssignees(meeting)}
                    </>
                  ) : (
                    <div className="flex items-center justify-between rounded-2xl border border-emerald-200/10 bg-emerald-950/40 p-4">
                      <span className={`text-sm ${meeting.status === "Completed" ? "text-emerald-300" : "text-red-200"}`}>{meeting.status}</span>
                      <button onClick={() => updateMeeting(meeting._id, { status: "Requested" })} className="rounded-xl border border-emerald-200/15 px-4 py-2 text-sm transition hover:border-amber-400/50 hover:text-amber-200">Reopen</button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );

  if (loading) {
    return (
      <DashboardShell type="admin">
        <DashboardSkeleton />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell type="admin">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          icon="calendar" eyebrow="Meetings"
          title="Meeting requests and schedule"
          description="Arrange a meeting with any client, or confirm the times clients request. Add the link, pick which team members join, and mark finished calls as completed."
        />

        {/* ---------- Arrange a meeting ---------- */}
        <div className="mb-8 rounded-3xl border border-emerald-300/20 bg-gradient-to-br from-emerald-500/10 to-emerald-950/30 p-5 backdrop-blur-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-light tracking-wide">Arrange a meeting</h2>
              <p className="mt-0.5 text-sm text-emerald-50/50">Book a call with a client — they&apos;re notified instantly in their chat and by email.</p>
            </div>
            {!showForm && (
              <button
                onClick={() => { setShowForm(true); setFormMsg(null); }}
                className="flex items-center gap-2 rounded-2xl bg-emerald-500/90 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-400 active:scale-[0.98]"
              >
                <i className="ti ti-calendar-plus" aria-hidden /> Schedule a meeting
              </button>
            )}
          </div>
          {formMsg && <p className={`mt-3 text-sm ${formMsg.error ? "text-red-300" : "text-emerald-200"}`}>{formMsg.text}</p>}

          {showForm && (
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <select value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} className={fieldClass} aria-label="Client">
                <option value="">Choose a client…</option>
                {clients.map((c) => <option key={c._id} value={c._id}>{c.name}{c.email ? ` — ${c.email}` : ""}</option>)}
              </select>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Meeting title" className={fieldClass} aria-label="Meeting title" />
              <label className="block">
                <span className="mb-1 block px-1 text-[11px] uppercase tracking-wider text-emerald-100/45">Date</span>
                <input type="date" min={todayIso()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={fieldClass} />
              </label>
              <label className="block">
                <span className="mb-1 block px-1 text-[11px] uppercase tracking-wider text-emerald-100/45">Time (IST)</span>
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={fieldClass} />
              </label>
              <select value={form.meetingPlatform} onChange={(e) => setForm({ ...form, meetingPlatform: e.target.value })} className={fieldClass} aria-label="Platform">
                {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <input
                value={form.meetingLink}
                onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                placeholder={form.meetingPlatform === "Phone" ? "Phone number (optional)" : "Meeting link — Google Meet / Zoom (optional)"}
                className={fieldClass}
                aria-label="Meeting link"
              />
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Agenda / note for the client (optional)" rows={2} className={`${fieldClass} md:col-span-2`} />
              {team.length > 0 && (
                <div className="md:col-span-2">
                  <p className="mb-2 px-1 text-[11px] uppercase tracking-wider text-emerald-100/45">Who joins from the team</p>
                  <div className="flex flex-wrap gap-2">
                    {team.map((member) => {
                      const email = (member.email || "").toLowerCase();
                      const on = form.assignees.includes(email);
                      return (
                        <button
                          key={member._id}
                          type="button"
                          onClick={() => toggleFormAssignee(email)}
                          className={`rounded-full border px-3 py-1.5 text-xs transition ${on ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100" : "border-emerald-200/15 text-emerald-50/55 hover:border-emerald-300/40"}`}
                        >
                          {on ? "✓ " : ""}{member.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex gap-2 md:col-span-2">
                <button
                  onClick={schedule}
                  disabled={saving}
                  className="flex-1 rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-60 md:flex-none"
                >
                  {saving ? "Scheduling…" : "Schedule meeting"}
                </button>
                <button onClick={() => { setShowForm(false); setForm(emptyForm); }} className="rounded-2xl px-5 py-3 text-sm text-emerald-50/60 transition hover:text-white">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {meetings.length === 0 ? (
          <EmptyState icon="calendar" title="No meetings yet" hint="Client meeting requests will appear here." />
        ) : (
          <div className="space-y-8">
            {renderList("Pending approval", pending)}
            {renderList("Upcoming", upcoming)}
            {renderList("Past", past)}
          </div>
        )}
      </motion.div>
    </DashboardShell>
  );
}
