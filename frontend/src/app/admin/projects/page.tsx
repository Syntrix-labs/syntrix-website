"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

const trackingStages = ["Created", "Coding Starting", "Frontend Review", "Test", "Final Review", "Publish"];
const statuses = ["Pending", "Planning", "In Progress", "In Review", "Completed"];

const adminInput =
  "rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60";

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

  const load = () => {
    apiGet<Project[]>("/api/projects/admin/all", fallbackProjects).then(setProjects);
    apiGet<DocumentUpload[]>("/api/uploads/admin/all", []).then(setDocuments);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    const response = await fetch(apiPath("/api/projects"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ ...form, status: "Planning", trackingStage: "Created" })
    });

    if (response.ok) {
      setForm({ title: "", clientEmail: "", description: "", dueDate: "" });
      load();
      return;
    }

    const data = await response.json();
    alert(data.message || "Project could not be assigned.");
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    const response = await fetch(apiPath(`/api/projects/${projectId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(updates)
    });
    if (response.ok) load();
  };

  return (
    <DashboardShell type="admin">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          eyebrow="Projects"
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
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
                  <div>
                    <h2 className="text-2xl font-light tracking-wide">{project.title}</h2>
                    <p className="mt-1 font-light text-emerald-50/60">Client: {project.client?.name || "Unassigned"} {project.client?.email ? `(${project.client.email})` : ""}</p>
                    <p className="mt-2 text-sm text-emerald-50/45">{project.description}</p>
                    <p className="mt-3 text-emerald-300">Deadline: {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "Not set"}</p>
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
