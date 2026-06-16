"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type TeamMember = { _id: string; name: string; role: string; status: string; email?: string };
type TeamMeeting = { _id: string; title: string; date: string; time: string; agenda?: string; link?: string };

const fallback: TeamMember[] = [
  { _id: "soham", name: "Soham", role: "Backend Developer", status: "Active" },
  { _id: "tahir", name: "Tahir", role: "Frontend Developer", status: "Online" },
];

const inputCls = "rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-50/85 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60";

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>(fallback);
  const [meetings, setMeetings] = useState<TeamMeeting[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [meet, setMeet] = useState({ title: "", date: "", time: "", agenda: "", link: "" });
  const [meetMsg, setMeetMsg] = useState("");

  const loadTeam = () => apiGet<TeamMember[]>("/api/team", fallback).then(setTeam);
  const loadMeetings = () => apiGet<TeamMeeting[]>("/api/team-meetings", []).then(setMeetings);
  useEffect(() => {
    loadTeam();
    loadMeetings();
  }, []);

  const addMember = async () => {
    if (!name || !role) {
      setMsg("Add a member name and role.");
      return;
    }
    setMsg("");
    const temp: TeamMember = { _id: `temp-${Date.now()}`, name, role, email, status: "Active" };
    setTeam((prev) => [...prev, temp]);
    setName("");
    setRole("");
    setEmail("");
    const res = await fetch(apiPath("/api/team"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ name: temp.name, role: temp.role, email: temp.email, status: "Active" }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      setMsg(data.emailed ? "Member added — welcome email sent ✉️" : temp.email ? "Member added. (Email not configured, so no welcome email was sent.)" : "Member added.");
      loadTeam();
    } else {
      setMsg("Could not add the member. Please try again.");
    }
  };

  const removeMember = async (id: string) => {
    setTeam((prev) => prev.filter((m) => m._id !== id));
    await fetch(apiPath(`/api/team/${id}`), { method: "DELETE", headers: authHeaders() });
  };

  const scheduleMeeting = async () => {
    if (!meet.title || !meet.date || !meet.time) {
      setMeetMsg("Add a title, date and time.");
      return;
    }
    setMeetMsg("");
    const temp: TeamMeeting = { _id: `temp-${Date.now()}`, ...meet };
    setMeetings((prev) => [...prev, temp]); // instant
    setMeet({ title: "", date: "", time: "", agenda: "", link: "" });
    const res = await fetch(apiPath("/api/team-meetings"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(temp),
    });
    if (res.ok) loadMeetings();
    else setMeetMsg("Could not schedule. Please try again.");
  };

  const removeMeeting = async (id: string) => {
    setMeetings((prev) => prev.filter((m) => m._id !== id));
    await fetch(apiPath(`/api/team-meetings/${id}`), { method: "DELETE", headers: authHeaders() });
  };

  const upcoming = [...meetings].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  return (
    <DashboardShell type="admin">
      <SectionHeader icon="users-group" eyebrow="Team" title="Team & meetings" description="Manage team members and schedule internal team meetings." />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* add member */}
        <div className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm">
          <p className="mb-4 flex items-center gap-2 text-sm text-emerald-100/70"><i className="ti ti-user-plus" aria-hidden /> Add team member</p>
          <div className="grid grid-cols-1 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Member name" className={inputCls} />
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role / position" className={inputCls} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email (sends a welcome message)" className={inputCls} />
            <button onClick={addMember} className="rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98]">Add member</button>
            {msg && <p className="text-sm text-emerald-200">{msg}</p>}
          </div>
        </div>

        {/* schedule team meeting */}
        <div className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm">
          <p className="mb-4 flex items-center gap-2 text-sm text-emerald-100/70"><i className="ti ti-calendar-plus" aria-hidden /> Schedule a team meeting</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input value={meet.title} onChange={(e) => setMeet({ ...meet, title: e.target.value })} placeholder="Meeting title (e.g. Sprint sync)" className={`${inputCls} sm:col-span-2`} />
            <input type="date" value={meet.date} onChange={(e) => setMeet({ ...meet, date: e.target.value })} className={inputCls} />
            <input type="time" value={meet.time} onChange={(e) => setMeet({ ...meet, time: e.target.value })} className={inputCls} />
            <input value={meet.agenda} onChange={(e) => setMeet({ ...meet, agenda: e.target.value })} placeholder="Agenda (optional)" className={`${inputCls} sm:col-span-2`} />
            <input value={meet.link} onChange={(e) => setMeet({ ...meet, link: e.target.value })} placeholder="Meeting link (optional)" className={`${inputCls} sm:col-span-2`} />
            <button onClick={scheduleMeeting} className="rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98] sm:col-span-2">Schedule team meeting</button>
            {meetMsg && <p className="text-sm text-emerald-200 sm:col-span-2">{meetMsg}</p>}
          </div>
        </div>
      </div>

      {/* upcoming team meetings */}
      {upcoming.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-100/45">Team meetings</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {upcoming.map((m, i) => (
              <motion.div
                key={m._id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                className="flex items-start gap-3 rounded-2xl border border-emerald-200/10 bg-emerald-950/40 p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200"><i className="ti ti-calendar-event" aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-light text-white">{m.title}</p>
                  <p className="mt-0.5 text-xs text-emerald-50/55">{m.date} · {m.time}{m.agenda ? ` · ${m.agenda}` : ""}</p>
                  {m.link && <a href={m.link} target="_blank" className="mt-1 inline-block text-xs text-emerald-300 hover:text-emerald-200">Join link</a>}
                </div>
                {!m._id.startsWith("temp-") && (
                  <button onClick={() => removeMeeting(m._id)} aria-label="Remove meeting" className="text-emerald-50/30 transition hover:text-red-300"><i className="ti ti-trash" aria-hidden /></button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* team members */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {team.map((member, i) => (
          <motion.div
            key={member._id || member.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="flex items-center gap-4 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-5 backdrop-blur-sm"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-400/22 text-lg font-light text-emerald-100">
              {(member.name || "?").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-light tracking-wide">{member.name}</h2>
              <p className="mt-0.5 truncate font-light text-emerald-50/55">{member.role}</p>
              {member.email && <p className="truncate text-xs text-emerald-50/40">{member.email}</p>}
            </div>
            <span className="ml-auto h-fit rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">{member.status}</span>
            {member._id && !["soham", "tahir"].includes(member._id) && !member._id.startsWith("temp-") && (
              <button onClick={() => removeMember(member._id)} aria-label={`Remove ${member.name}`} className="text-emerald-50/30 transition hover:text-red-300">
                <i className="ti ti-trash" aria-hidden />
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </DashboardShell>
  );
}
