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
        <SectionHeader eyebrow="Team" title="Team management" description="Add team members by role and position for Syntrix operations." />
        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Member name" className="bg-black border border-white/10 rounded-2xl px-4 py-3" />
          <input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Role / position" className="bg-black border border-white/10 rounded-2xl px-4 py-3" />
          <button onClick={addMember} className="bg-blue-500 hover:bg-blue-600 rounded-2xl px-6 py-3 font-semibold">Add Team Member</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {team.map((member) => (
            <div key={member._id || member.name} className="bg-zinc-900 border border-white/10 rounded-3xl p-6 flex justify-between gap-5">
              <div>
                <h2 className="text-2xl font-bold">{member.name}</h2>
                <p className="text-gray-400 mt-1">{member.role}</p>
              </div>
              <span className="text-blue-300 bg-blue-500/10 px-4 py-2 rounded-full h-fit">{member.status}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
