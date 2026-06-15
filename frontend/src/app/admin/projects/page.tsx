"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { DashboardSkeleton } from "@/components/dashboard/States";
import LaunchGauge from "@/components/dashboard/LaunchGauge";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

const trackingStages = ["Created", "Coding Starting", "Frontend Review", "Test", "Final Review", "Publish"];
const statuses = ["Pending", "Planning", "In Progress", "In Review", "Completed"];

const adminInput =
  "rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60";

const progressOf = (s?: string) =>
  Math.round((Math.max(0, trackingStages.indexOf(s || "Created")) / (trackingStages.length - 1)) * 100);

type Project = {
  _id: string;
  title: string;
  client?: { name?: string; email?: string };
  description?: string;
  status?: string;
  trackingStage?: string;
  dueDate?: string;
};

type DocumentUpload = {
  _id: string;
  originalName: string;
  publicUrl?: string;
  driveViewLink?: string;
  storage: string;
  client?: { name?: string; email?: string };
  project?: { _id?: string; title?: string };
};

const fallbackProjects: Project[] = [
  { _id: "demo", title: "Syntrix Business Platform", client: { name: "Demo Client" }, description: "Admin can assign and edit projects here.", status: "In Progress", trackingStage: "Frontend Review" }
];

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(fallbackProjects);
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [form, setForm] = useState({ title: "", clientEmail: "", description: "", dueDate: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState("");
  const [editForm, setEditForm] = useState({ title: "", description: "", dueDate: "" });
  const [confirmDel, setConfirmDel] = useState("");

  const load = () =>
    Promise.all([
      apiGet<Project[]>("/api/projects/admin/all", fallbackProjects).then(setProjects),
      apiGet<DocumentUpload[]>("/api/uploads/admin/all", []).then(setDocuments),
    ]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const add = async () => {
    const response = await fetch(apiPath("/api/projects"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ ...form, status: "Planning", trackingStage: "Created" })
    });

    if (response.ok) {
      setForm({ title: "", clientEmail: "", description: "", dueDate: "" });
      setMsg("");
      load();
      return;
    }

    const data = await response.json();
    setMsg(data.message || "Project could not be assigned — check the client email.");
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p._id === projectId ? { ...p, ...updates } : p))); // instant
    await fetch(apiPath(`/api/projects/${projectId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(updates)
    });
  };

  const deleteProject = async (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p._id !== projectId)); // instant
    setConfirmDel("");
    await fetch(apiPath(`/api/projects/${projectId}`), { method: "DELETE", headers: authHeaders() });
  };

  const startEdit = (p: Project) => {
    setEditId(p._id);
    setEditForm({ title: p.title || "", description: p.description || "", dueDate: p.dueDate ? String(p.dueDate).slice(0, 10) : "" });
  };
  const saveEdit = (id: string) => {
    updateProject(id, editForm);
    setEditId("");
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
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          icon="folder" eyebrow="Projects"
          title="Project management"
          description="Assign projects by client account, update deadlines and tracking, and review client uploaded documents."
        />

        <div className="mb-6 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-2xl font-light tracking-wide">Add project</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Project name" className={adminInput} />
            <input value={form.clientEmail} onChange={(event) => setForm({ ...form, clientEmail: event.target.value })} placeholder="Client email" className={adminInput} />
            <input value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} type="date" className={adminInput} />
            <button onClick={add} className="rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98]">Assign project</button>
            {msg && <p className="text-sm text-emerald-200 md:col-span-4">{msg}</p>}
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Project description" className={`${adminInput} min-h-24 md:col-span-4`} />
          </div>
        </div>

        <div className="space-y-5">
          {projects.map((project, i) => {
            const projectDocuments = documents.filter((document) => document.project?._id === project._id || document.project?.title === project.title);
            return (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm"
              >
                <div className="mb-4 flex justify-end gap-2">
                  <button onClick={() => startEdit(project)} aria-label="Edit project" className="rounded-xl border border-emerald-200/15 p-2 text-emerald-50/70 transition hover:border-emerald-300/50 hover:text-white"><i className="ti ti-edit" aria-hidden /></button>
                  {confirmDel === project._id ? (
                    <button onClick={() => deleteProject(project._id)} className="rounded-xl border border-red-400/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">Confirm delete?</button>
                  ) : (
                    <button onClick={() => setConfirmDel(project._id)} aria-label="Delete project" className="rounded-xl border border-emerald-200/15 p-2 text-emerald-50/40 transition hover:border-red-400/50 hover:text-red-300"><i className="ti ti-trash" aria-hidden /></button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
                  <div>
                    {editId === project._id ? (
                      <div className="space-y-3">
                        <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title" className={`${adminInput} w-full`} />
                        <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" className={`${adminInput} min-h-20 w-full`} />
                        <input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} className={`${adminInput} w-full`} />
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(project._id)} className="rounded-xl bg-emerald-500/90 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-400">Save</button>
                          <button onClick={() => setEditId("")} className="rounded-xl border border-emerald-200/15 px-4 py-2.5 text-sm text-emerald-50/70 transition hover:text-white">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-2xl font-light tracking-wide">{project.title}</h2>
                        <p className="mt-1 font-light text-emerald-50/60">Client: {project.client?.name || "Unassigned"} {project.client?.email ? `(${project.client.email})` : ""}</p>
                        <p className="mt-2 text-sm text-emerald-50/45">{project.description}</p>
                        <p className="mt-3 text-emerald-300">Deadline: {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "Not set"}</p>
                        <div className="mt-4 max-w-[280px]">
                          <LaunchGauge value={progressOf(project.trackingStage)} stageLabel={project.trackingStage || "Created"} />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-3">
                    <select value={project.status || "Planning"} onChange={(event) => updateProject(project._id, { status: event.target.value })} className={`${adminInput} w-full`}>
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <select value={project.trackingStage || "Created"} onChange={(event) => updateProject(project._id, { trackingStage: event.target.value })} className={`${adminInput} w-full`}>
                      {trackingStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                    </select>
                    <input type="date" onChange={(event) => updateProject(project._id, { dueDate: event.target.value })} className={`${adminInput} w-full`} />
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-emerald-200/10 bg-emerald-950/40 p-5">
                  <h3 className="mb-4 text-xl font-light">Client uploaded documents</h3>
                  {projectDocuments.length ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {projectDocuments.map((document) => (
                        <a key={document._id} href={document.driveViewLink || document.publicUrl} target="_blank" className="rounded-2xl border border-emerald-200/10 p-4 text-emerald-300 transition hover:border-emerald-300/50">
                          {document.originalName}
                          <span className="mt-1 block text-sm text-emerald-50/40">{document.storage}</span>
                        </a>
                      ))}
                    </div>
                  ) : <p className="text-emerald-50/40">No documents uploaded for this project yet.</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
