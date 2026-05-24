"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet } from "@/lib/api";

type ClientProject = { _id: string; title: string; status?: string; trackingStage?: string; dueDate?: string };
type Client = {
  _id: string;
  name: string;
  email: string;
  activeProjects?: number;
  pendingProjects?: number;
  upcomingPayments?: number;
  projects?: ClientProject[];
};

const fallback: Client[] = [
  { _id: "1", name: "Demo Client", email: "client@example.com", activeProjects: 1, pendingProjects: 0, upcomingPayments: 0, projects: [{ _id: "demo", title: "Demo Website", status: "In Progress", trackingStage: "Frontend Review" }] },
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(fallback);
  const [query, setQuery] = useState("");
  const [openClient, setOpenClient] = useState("");

  useEffect(() => {
    apiGet<Client[]>("/api/admin/clients", fallback).then(setClients);
  }, []);

  const filtered = useMemo(() => (
    clients
      .filter((client) => client.name.toLowerCase().includes(query.toLowerCase()) || client.email.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
  ), [clients, query]);

  return (
    <DashboardShell type="admin">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader eyebrow="Clients" title="Client management" description="Search, sort, and open each client to see active and pending project status." />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by client name or email" className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 mb-6 outline-none focus:border-blue-500" />
        <div className="space-y-4">
          {filtered.map((client) => {
            const open = openClient === client._id;
            return (
              <div key={client._id} className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
                <button onClick={() => setOpenClient(open ? "" : client._id)} className="w-full text-left flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">{client.name}</h2>
                    <p className="text-gray-400 mt-1">{client.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-green-500/10 text-green-300 px-4 py-2 rounded-full">Active: {client.activeProjects || 0}</span>
                    <span className="bg-yellow-500/10 text-yellow-300 px-4 py-2 rounded-full">Pending: {client.pendingProjects || 0}</span>
                    <span className="bg-blue-500/10 text-blue-300 px-4 py-2 rounded-full">Payments: {client.upcomingPayments || 0}</span>
                  </div>
                </button>
                {open && (
                  <div className="mt-5 border-t border-white/10 pt-5">
                    <h3 className="font-bold mb-3">Projects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {client.projects?.length ? client.projects.map((project) => (
                        <div key={project._id} className="bg-black border border-white/10 rounded-2xl p-4">
                          <p className="font-semibold">{project.title}</p>
                          <p className="text-gray-400 text-sm mt-1">{project.status} • {project.trackingStage || "Created"}</p>
                        </div>
                      )) : <p className="text-gray-500">No projects assigned yet.</p>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
