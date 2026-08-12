"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { DashboardSkeleton } from "@/components/dashboard/States";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type Meeting = {
  _id: string;
  title: string;
  date: string;
  time: string;
  timezone?: string;
  status: "Requested" | "Confirmed" | "Completed" | "Cancelled";
  meetingLink?: string;
  notes?: string;
};

const fallback: Meeting[] = [
  {
    _id: "demo",
    title: "Project consultation",
    date: "Admin will confirm",
    time: "Requested",
    timezone: "Your timezone",
    status: "Requested",
    notes: "Your meeting requests and confirmed calls will appear here.",
  },
];

const input =
  "w-full rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-50/85 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60";

const parse = (m: Meeting) => {
  const d = new Date(`${m.date}T${(m.time || "00:00").length === 5 ? m.time : "00:00"}`);
  return Number.isNaN(d.getTime()) ? null : d;
};
const badge = (m: Meeting) => {
  const d = parse(m);
  return d ? { mon: d.toLocaleString(undefined, { month: "short" }).toUpperCase(), day: d.getDate() } : { mon: "—", day: "" as number | string };
};
const countdown = (m: Meeting) => {
  const d = parse(m);
  if (!d) return "";
  const ms = d.getTime() - Date.now();
  if (ms < 0) return "in progress / past";
  const days = Math.floor(ms / 86400000);
  if (days >= 1) return `in ${days} day${days > 1 ? "s" : ""}`;
  const hrs = Math.round(ms / 3600000);
  return hrs <= 1 ? "starting soon" : `in ${hrs} hours`;
};
const chip = (s: string) =>
  s === "Confirmed"
    ? "bg-emerald-500/20 text-emerald-200"
    : s === "Requested"
    ? "bg-amber-500/14 text-amber-200"
    : s === "Cancelled"
    ? "bg-red-500/12 text-red-200"
    : "border border-emerald-200/15 text-emerald-50/50";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(fallback);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadMeetings = () => apiGet<Meeting[]>("/api/meetings", fallback).then(setMeetings);
  useEffect(() => {
    loadMeetings().finally(() => setLoading(false));
  }, []);

  const book = async () => {
    if (!date || !time) {
      setMsg("Choose a date and time first.");
      return;
    }
    setBusy(true);
    setMsg("");
    const payload = { title: "Client consultation", date, time, timezone, notes };
    const temp: Meeting = { _id: `temp-${Date.now()}`, status: "Requested", ...payload };
    setMeetings((prev) => [...prev.filter((m) => m._id !== "demo"), temp]); // instant
    setDate("");
    setTime("");
    setNotes("");
    try {
      const res = await fetch(apiPath("/api/meetings/book"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMsg("Request sent — we'll confirm it shortly.");
        loadMeetings();
      } else {
        setMsg("Could not send the request. Please try again.");
        setMeetings((prev) => prev.filter((m) => m._id !== temp._id));
      }
    } catch {
      setMsg("Server error. Please try again in a moment.");
      setMeetings((prev) => prev.filter((m) => m._id !== temp._id));
    } finally {
      setBusy(false);
    }
  };

  const byTime = (a: Meeting, b: Meeting) => (parse(a)?.getTime() || 0) - (parse(b)?.getTime() || 0);
  const upcoming = meetings.filter((m) => m.status === "Confirmed").sort(byTime);
  const pending = meetings.filter((m) => m.status === "Requested");
  const past = meetings.filter((m) => m.status === "Completed" || m.status === "Cancelled");
  const next = upcoming[0];
  const restUpcoming = upcoming.slice(1);

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
          icon="calendar"
          eyebrow="Meetings"
          title="Your calls & scheduling"
          description="Request a meeting in your timezone. Once Syntrix confirms it, your call and join link appear here automatically."
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* agenda */}
          <div className="space-y-6 xl:col-span-2">
            {next ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6 backdrop-blur-md"
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-[11px] ${chip("Confirmed")}`}>Confirmed</span>
                  <span className="ml-auto text-xs text-emerald-100/70">{countdown(next)}</span>
                </div>
                <p className="text-xl font-light text-white">{next.title}</p>
                <p className="mt-1 text-sm text-emerald-50/65">
                  <i className="ti ti-calendar" aria-hidden /> {next.date} · {next.time} ({next.timezone || "Asia/Kolkata"})
                </p>
                {next.notes && <p className="mt-1 text-xs text-emerald-50/45">{next.notes}</p>}
                {next.meetingLink && next.meetingLink.startsWith("http") ? (
                  <a
                    href={next.meetingLink}
                    target="_blank"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500/90 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-400"
                  >
                    <i className="ti ti-video" aria-hidden /> Join meeting
                  </a>
                ) : (
                  <p className="mt-4 text-xs text-emerald-100/55">The join link will appear here once your team adds it.</p>
                )}
              </motion.div>
            ) : (
              <div className="rounded-3xl border border-emerald-200/12 bg-emerald-950/30 p-6 text-sm font-light text-emerald-50/60 backdrop-blur-md">
                No confirmed calls yet — request one from the panel and we'll lock it in.
              </div>
            )}

            <MeetingList title="Pending approval" items={pending} />
            {restUpcoming.length > 0 && <MeetingList title="More upcoming" items={restUpcoming} />}
            <MeetingList title="Past" items={past} muted />
          </div>

          {/* booking */}
          <div className="h-fit rounded-3xl border border-emerald-200/12 bg-emerald-950/30 p-6 backdrop-blur-md">
            <h2 className="mb-5 text-xl font-light tracking-wide">Book a call</h2>
            <label className="mb-1 block text-xs text-emerald-50/55">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${input} mb-4`} />
            <label className="mb-1 block text-xs text-emerald-50/55">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${input} mb-4`} />
            <label className="mb-1 block text-xs text-emerald-50/55">Timezone</label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={`${input} mb-4`}>
              <option value="Asia/Kolkata">India · IST</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">New York</option>
              <option value="Europe/London">London</option>
              <option value="Asia/Dubai">Dubai</option>
              <option value="Asia/Singapore">Singapore</option>
            </select>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What do you want to discuss?" className={`${input} mb-4 min-h-24`} />
            <button
              onClick={book}
              disabled={busy}
              className="w-full rounded-2xl bg-emerald-500/90 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? "Sending…" : "Request schedule"}
            </button>
            {msg && <p className="mt-3 text-center text-xs text-emerald-200">{msg}</p>}
          </div>
        </div>
      </motion.div>
    </DashboardShell>
  );
}

function MeetingList({ title, items, muted }: { title: string; items: Meeting[]; muted?: boolean }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-100/45">{title}</p>
      <div className="space-y-3">
        {items.map((m, i) => {
          const b = badge(m);
          return (
            <motion.div
              key={m._id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className={`flex items-center gap-4 rounded-2xl border border-emerald-200/10 bg-emerald-950/40 p-3.5 ${muted ? "opacity-70" : ""}`}
            >
              <div className="w-12 shrink-0 rounded-xl bg-emerald-900/50 py-1.5 text-center">
                <span className="block font-mono text-[9px] tracking-wide text-emerald-100/50">{b.mon}</span>
                <span className="block text-lg font-light text-white">{b.day}</span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-light text-white">{m.title}</p>
                <p className="truncate text-xs text-emerald-50/50">{m.time} · {m.timezone || "Asia/Kolkata"}</p>
              </div>
              <span className={`ml-auto shrink-0 rounded-full px-3 py-1 text-[10.5px] ${chip(m.status)}`}>{m.status}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
