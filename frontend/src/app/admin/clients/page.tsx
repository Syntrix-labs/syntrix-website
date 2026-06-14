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
        <SectionHeader icon="users" eyebrow="Clients" title="Client management" description="Search, sort, and open each client to see active and pending project status." />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by client name or email" className="mb-6 w-full rounded-2xl border border-emerald-200/15 bg-emerald-950/40 px-5 py-4 text-emerald-50/80 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60 focus:bg-emerald-950/60" />
        <div className="space-y-4">
          {filtered.map((client, i) => {
            const open = openClient === client._id;
            return (
              <motion.div
                key={client._id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm"
              >
                <button onClick={() => setOpenClient(open ? "" : client._id)} className="flex w-full flex-col justify-between gap-4 text-left md:flex-row">
                  <div>
                    <h2 className="text-2xl font-light tracking-wide">{client.name}</h2>
                    <p className="mt-1 font-light text-emerald-50/60">{client.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">Active: {client.activeProjects || 0}</span>
                    <span className="rounded-full bg-amber-500/10 px-4 py-2 text-sm text-amber-200">Pending: {client.pendingProjects || 0}</span>
                    <span className="rounded-full bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">Payments: {client.upcomingPayments || 0}</span>
                  </div>
                </button>
                {open && (
                  <div className="mt-5 border-t border-emerald-200/10 pt-5">
                    <h3 className="mb-3 font-light text-emerald-50/80">Projects</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {client.projects?.length ? client.projects.map((project) => (
                        <div key={project._id} className="rounded-2xl border border-emerald-200/10 bg-emerald-950/40 p-4">
                          <p className="font-light">{project.title}</p>
                          <p className="mt-1 text-sm text-emerald-50/50">{project.status} • {project.trackingStage || "Created"}</p>
                        </div>
                      )) : <p className="text-emerald-50/40">No projects assigned yet.</p>}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
