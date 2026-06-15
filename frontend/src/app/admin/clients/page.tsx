"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { DashboardSkeleton, EmptyState } from "@/components/dashboard/States";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type ClientProject = { _id: string; title: string; status?: string; trackingStage?: string; dueDate?: string };
type Client = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  activeProjects?: number;
  pendingProjects?: number;
  upcomingPayments?: number;
  projects?: ClientProject[];
};

const fallback: Client[] = [
  { _id: "1", name: "Demo Client", email: "client@example.com", activeProjects: 1, pendingProjects: 0, upcomingPayments: 0, projects: [{ _id: "demo", title: "Demo Website", status: "In Progress", trackingStage: "Frontend Review" }] },
];

const inputCls = "w-full rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-50/85 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(fallback);
  const [query, setQuery] = useState("");
  const [openClient, setOpenClient] = useState("");
  const [editId, setEditId] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [confirmDel, setConfirmDel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Client[]>("/api/admin/clients", fallback).then(setClients).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => (
    clients
      .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
  ), [clients, query]);

  const startEdit = (c: Client) => {
    setEditId(c._id);
    setForm({ name: c.name || "", email: c.email || "", phone: c.phone || "", company: c.company || "" });
  };

  const saveEdit = async (id: string) => {
    setClients((prev) => prev.map((c) => (c._id === id ? { ...c, ...form } : c))); // instant
    setEditId("");
    await fetch(apiPath(`/api/admin/clients/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(form),
    });
  };

  const removeClient = async (id: string) => {
    setClients((prev) => prev.filter((c) => c._id !== id)); // instant
    setConfirmDel("");
    await fetch(apiPath(`/api/admin/clients/${id}`), { method: "DELETE", headers: authHeaders() });
  };

  if (loading) {
    return (
      <DashboardShell type="admin">
        <DashboardSkeleton />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell type="admin">
      <SectionHeader icon="users" eyebrow="Clients" title="Client management" description="Search clients, edit their details, review projects, or remove an account." />
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by client name or email" className="mb-6 w-full rounded-2xl border border-emerald-200/15 bg-emerald-950/40 px-5 py-4 text-emerald-50/80 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60 focus:bg-emerald-950/60" />
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <EmptyState icon="users" title="No clients found" hint="Clients who sign up will appear here." />
        ) : filtered.map((client, i) => {
          const open = openClient === client._id;
          const editing = editId === client._id;
          return (
            <motion.div
              key={client._id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <button onClick={() => setOpenClient(open ? "" : client._id)} className="flex flex-1 items-center gap-3 text-left">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-400/22 text-lg font-light text-emerald-100">
                    {(client.name || "?").charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h2 className="text-xl font-light tracking-wide">{client.name}</h2>
                    <p className="mt-0.5 font-light text-emerald-50/55">{client.email}</p>
                  </div>
                </button>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">Active {client.activeProjects || 0}</span>
                  <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">Pending {client.pendingProjects || 0}</span>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200">Due {client.upcomingPayments || 0}</span>
                  <button onClick={() => startEdit(client)} aria-label="Edit client" className="rounded-xl border border-emerald-200/15 p-2 text-emerald-50/70 transition hover:border-emerald-300/50 hover:text-white"><i className="ti ti-edit" aria-hidden /></button>
                  {confirmDel === client._id ? (
                    <button onClick={() => removeClient(client._id)} className="rounded-xl border border-red-400/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">Confirm?</button>
                  ) : (
                    <button onClick={() => setConfirmDel(client._id)} aria-label="Delete client" className="rounded-xl border border-emerald-200/15 p-2 text-emerald-50/40 transition hover:border-red-400/50 hover:text-red-300"><i className="ti ti-trash" aria-hidden /></button>
                  )}
                </div>
              </div>

              {editing && (
                <div className="mt-5 grid grid-cols-1 gap-3 border-t border-emerald-200/10 pt-5 md:grid-cols-2">
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className={inputCls} />
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className={inputCls} />
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className={inputCls} />
                  <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company" className={inputCls} />
                  <div className="flex gap-2 md:col-span-2">
                    <button onClick={() => saveEdit(client._id)} className="rounded-xl bg-emerald-500/90 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-400">Save</button>
                    <button onClick={() => setEditId("")} className="rounded-xl border border-emerald-200/15 px-4 py-2.5 text-sm text-emerald-50/70 transition hover:text-white">Cancel</button>
                  </div>
                </div>
              )}

              {open && !editing && (
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
    </DashboardShell>
  );
}
