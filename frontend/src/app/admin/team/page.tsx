"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type TeamMember = { _id: string; name: string; role: string; status: string };
const fallback = [
  { _id: "soham", name: "Soham", role: "Backend Developer", status: "Active" },
  { _id: "tahir", name: "Tahir", role: "Frontend Developer", status: "Online" },
];

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>(fallback);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  const loadTeam = () => apiGet<TeamMember[]>("/api/team", fallback).then(setTeam);
  useEffect(() => {
    loadTeam();
  }, []);

  const addMember = async () => {
    if (!name || !role) return alert("Add member name and role.");
    const response = await fetch(apiPath("/api/team"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ name, role, status: "Active" })
    });
    if (response.ok) {
      setName("");
      setRole("");
      loadTeam();
    }
  };

  return (
    <DashboardShell type="admin">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader icon="users-group" eyebrow="Team" title="Team management" description="Add team members by role and position for Syntrix operations." />
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm md:grid-cols-3">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Member name" className="rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60" />
          <input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Role / position" className="rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60" />
          <button onClick={addMember} className="rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98]">Add team member</button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {team.map((member, i) => (
            <motion.div
              key={member._id || member.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="flex justify-between gap-5 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm"
            >
              <div>
                <h2 className="text-2xl font-light tracking-wide">{member.name}</h2>
                <p className="mt-1 font-light text-emerald-50/60">{member.role}</p>
              </div>
              <span className="h-fit rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">{member.status}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
