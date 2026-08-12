"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/dashboard/States";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type TeamMeeting = { _id: string; title: string; date: string; time: string; agenda?: string; link?: string };

const inputCls = "rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-50/85 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60";

export default function TeamMeetingsPage() {
  const [meetings, setMeetings] = useState<TeamMeeting[]>([]);
  const [meet, setMeet] = useState({ title: "", date: "", time: "", agenda: "", link: "" });
  const [msg, setMsg] = useState("");

  const load = () => apiGet<TeamMeeting[]>("/api/team-meetings", []).then(setMeetings);
  useEffect(() => { load(); }, []);

  const schedule = async () => {
    if (!meet.title || !meet.date || !meet.time) {
      setMsg("Add a title, date and time.");
      return;
    }
    setMsg("");
    const temp: TeamMeeting = { _id: `temp-${Date.now()}`, ...meet };
    setMeetings((prev) => [...prev, temp]); // instant
    setMeet({ title: "", date: "", time: "", agenda: "", link: "" });
    const res = await fetch(apiPath("/api/team-meetings"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(temp),
    });
    if (res.ok) load();
    else setMsg("Could not schedule. Please try again.");
  };

  const remove = async (id: string) => {
    setMeetings((prev) => prev.filter((m) => m._id !== id));
    await fetch(apiPath(`/api/team-meetings/${id}`), { method: "DELETE", headers: authHeaders() });
  };

  const upcoming = [...meetings].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  return (
    <DashboardShell type="admin">
      <SectionHeader icon="calendar-event" eyebrow="Team meetings" title="Internal team meetings" description="Schedule and track internal meetings for the Syntrix team." />

      <div className="mb-6 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm">
        <p className="mb-4 flex items-center gap-2 text-sm text-emerald-100/70"><i className="ti ti-calendar-plus" aria-hidden /> Schedule a team meeting</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input value={meet.title} onChange={(e) => setMeet({ ...meet, title: e.target.value })} placeholder="Meeting title (e.g. Sprint sync)" className={`${inputCls} sm:col-span-2`} />
          <input type="date" value={meet.date} onChange={(e) => setMeet({ ...meet, date: e.target.value })} className={inputCls} />
          <input type="time" value={meet.time} onChange={(e) => setMeet({ ...meet, time: e.target.value })} className={inputCls} />
          <input value={meet.agenda} onChange={(e) => setMeet({ ...meet, agenda: e.target.value })} placeholder="Agenda (optional)" className={`${inputCls} sm:col-span-2`} />
          <input value={meet.link} onChange={(e) => setMeet({ ...meet, link: e.target.value })} placeholder="Meeting link (optional)" className={`${inputCls} sm:col-span-2`} />
          <button onClick={schedule} className="rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98] sm:col-span-2">Schedule team meeting</button>
          {msg && <p className="text-sm text-emerald-200 sm:col-span-2">{msg}</p>}
        </div>
      </div>

      {upcoming.length === 0 ? (
        <EmptyState icon="calendar" title="No team meetings yet" hint="Schedule one above to keep the team in sync." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {upcoming.map((m, i) => (
            <motion.div
              key={m._id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="flex items-start gap-3 rounded-2xl border border-emerald-200/12 bg-emerald-950/25 p-4 backdrop-blur-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200"><i className="ti ti-calendar-event" aria-hidden /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-light text-white">{m.title}</p>
                <p className="mt-0.5 text-xs text-emerald-50/55">{m.date} · {m.time}{m.agenda ? ` · ${m.agenda}` : ""}</p>
                {m.link && <a href={m.link} target="_blank" className="mt-1 inline-block text-xs text-emerald-300 hover:text-emerald-200">Join link</a>}
              </div>
              {!m._id.startsWith("temp-") && (
                <button onClick={() => remove(m._id)} aria-label="Remove meeting" className="text-emerald-50/30 transition hover:text-red-300"><i className="ti ti-trash" aria-hidden /></button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
