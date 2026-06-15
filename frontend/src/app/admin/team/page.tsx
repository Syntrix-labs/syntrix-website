"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type TeamMember = { _id: string; name: string; role: string; status: string };
type Client = { _id: string; name: string; email: string };

const fallback: TeamMember[] = [
  { _id: "soham", name: "Soham", role: "Backend Developer", status: "Active" },
  { _id: "tahir", name: "Tahir", role: "Frontend Developer", status: "Online" },
];

const inputCls = "rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-50/85 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60";

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>(fallback);
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [msg, setMsg] = useState("");
  const [meet, setMeet] = useState({ client: "", date: "", time: "", link: "" });
  const [meetMsg, setMeetMsg] = useState("");

  const loadTeam = () => apiGet<TeamMember[]>("/api/team", fallback).then(setTeam);
  useEffect(() => {
    loadTeam();
    apiGet<Client[]>("/api/admin/clients", []).then(setClients);
  }, []);

  const addMember = async () => {
    if (!name || !role) {
      setMsg("Add a member name and role.");
      return;
    }
    setMsg("");
    const temp: TeamMember = { _id: `temp-${Date.now()}`, name, role, status: "Active" };
    setTeam((prev) => [...prev, temp]); // instant
    setName("");
    setRole("");
    const res = await fetch(apiPath("/api/team"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ name: temp.name, role: temp.role, status: "Active" }),
    });
    if (res.ok) loadTeam();
    else setMsg("Could not add the member. Please try again.");
  };

  const removeMember = async (id: string) => {
    setTeam((prev) => prev.filter((m) => m._id !== id)); // instant
    await fetch(apiPath(`/api/team/${id}`), { method: "DELETE", headers: authHeaders() });
  };

  const scheduleMeeting = async () => {
    if (!meet.client || !meet.date || !meet.time) {
      setMeetMsg("Pick a client, date and time.");
      return;
    }
    setMeetMsg("Scheduling…");
    const res = await fetch(apiPath("/api/meetings"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        client: meet.client,
        title: "Consultation call",
        date: meet.date,
        time: meet.time,
        status: "Confirmed",
        meetingLink: meet.link || undefined,
      }),
    });
    if (res.ok) {
      setMeet({ client: "", date: "", time: "", link: "" });
      setMeetMsg("Meeting scheduled and confirmed ✓");
    } else {
      setMeetMsg("Could not schedule the meeting. Try again.");
    }
  };

  return (
    <DashboardShell type="admin">
      <SectionHeader icon="users-group" eyebrow="Team" title="Team & scheduling" description="Manage team members and schedule meetings with clients." />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* add member */}
        <div className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm">
          <p className="mb-4 flex items-center gap-2 text-sm text-emerald-100/70"><i className="ti ti-user-plus" aria-hidden /> Add team member</p>
          <div className="grid grid-cols-1 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Member name" className={inputCls} />
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role / position" className={inputCls} />
            <button onClick={addMember} className="rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98]">Add member</button>
            {msg && <p className="text-sm text-emerald-200">{msg}</p>}
          </div>
        </div>

        {/* schedule meeting */}
        <div className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm">
          <p className="mb-4 flex items-center gap-2 text-sm text-emerald-100/70"><i className="ti ti-calendar-plus" aria-hidden /> Schedule a meeting</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select value={meet.client} onChange={(e) => setMeet({ ...meet, client: e.target.value })} className={`${inputCls} sm:col-span-2`}>
              <option value="">Select client</option>
              {clients.map((c) => <option key={c._id} value={c._id}>{c.name} — {c.email}</option>)}
            </select>
            <input type="date" value={meet.date} onChange={(e) => setMeet({ ...meet, date: e.target.value })} className={inputCls} />
            <input type="time" value={meet.time} onChange={(e) => setMeet({ ...meet, time: e.target.value })} className={inputCls} />
            <input value={meet.link} onChange={(e) => setMeet({ ...meet, link: e.target.value })} placeholder="Meeting link (optional)" className={`${inputCls} sm:col-span-2`} />
            <button onClick={scheduleMeeting} className="rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98] sm:col-span-2">Schedule &amp; confirm</button>
            {meetMsg && <p className="text-sm text-emerald-200 sm:col-span-2">{meetMsg}</p>}
          </div>
        </div>
      </div>

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
