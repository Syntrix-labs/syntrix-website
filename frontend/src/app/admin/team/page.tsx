"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type TeamMember = { _id: string; name: string; role: string; status: string; email?: string; isAdmin?: boolean };

const fallback: TeamMember[] = [
  { _id: "admin:tahir", name: "Tahir", role: "Founder", status: "Active", isAdmin: true },
  { _id: "admin:soham", name: "Soham", role: "Co-Founder", status: "Active", isAdmin: true },
];

const inputCls = "rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-50/85 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60";

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>(fallback);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const loadTeam = () => apiGet<TeamMember[]>("/api/team", fallback).then(setTeam);
  useEffect(() => { loadTeam(); }, []);

  const addMember = async () => {
    if (!name || !role) {
      setMsg("Add a member name and role.");
      return;
    }
    setMsg("");
    const temp: TeamMember = { _id: `temp-${Date.now()}`, name, role, email, status: "Active" };
    setTeam((prev) => [...prev, temp]); // instant
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
      setMsg(
        data.emailed
          ? data.accountCreated
            ? "Member added — account created & welcome email sent ✉️"
            : "Member added — welcome email sent ✉️"
          : temp.email
          ? "Member added. (Email not configured, so no welcome email was sent.)"
          : "Member added."
      );
      loadTeam();
    } else {
      setMsg("Could not add the member. Please try again.");
    }
  };

  const removeMember = async (id: string) => {
    setTeam((prev) => prev.filter((m) => m._id !== id));
    await fetch(apiPath(`/api/team/${id}`), { method: "DELETE", headers: authHeaders() });
  };

  return (
    <DashboardShell type="admin">
      <SectionHeader icon="users-group" eyebrow="Team" title="Team management" description="Add team members. Adding an email creates their account and emails a welcome with login details." />

      <div className="mb-6 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm">
        <p className="mb-4 flex items-center gap-2 text-sm text-emerald-100/70"><i className="ti ti-user-plus" aria-hidden /> Add team member</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Member name" className={inputCls} />
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role / position" className={inputCls} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email (creates their account)" className={inputCls} />
          <button onClick={addMember} className="rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98] md:col-span-3">Add member</button>
          {msg && <p className="text-sm text-emerald-200 md:col-span-3">{msg}</p>}
        </div>
        <p className="mt-3 text-xs text-emerald-50/40">New members get a team account (consultation, client meetings, and team meetings) with a temporary password.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {team.map((member, i) => (
          <motion.div
            key={member._id || member.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className={`flex items-center gap-4 rounded-3xl border p-5 backdrop-blur-sm ${member.isAdmin ? "border-amber-300/25 bg-amber-400/[0.04]" : "border-emerald-200/12 bg-emerald-950/25"}`}
          >
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-light ${member.isAdmin ? "bg-amber-300/20 text-amber-100 ring-1 ring-amber-300/40" : "bg-emerald-400/22 text-emerald-100"}`}>
              {(member.name || "?").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 truncate text-xl font-light tracking-wide">
                {member.name}
                {member.isAdmin && <i className="ti ti-crown text-sm text-amber-300" aria-label="Admin" />}
              </h2>
              <p className={`mt-0.5 truncate font-light ${member.isAdmin ? "text-amber-200/80" : "text-emerald-50/55"}`}>{member.role}</p>
              {member.email && <p className="truncate text-xs text-emerald-50/40">{member.email}</p>}
            </div>
            <span className={`ml-auto h-fit rounded-full px-3 py-1.5 text-xs ${member.isAdmin ? "bg-amber-400/10 text-amber-200" : "bg-emerald-500/10 text-emerald-300"}`}>{member.isAdmin ? "Admin" : member.status}</span>
            {member._id && !member.isAdmin && !member._id.startsWith("admin:") && !member._id.startsWith("temp-") && (
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
