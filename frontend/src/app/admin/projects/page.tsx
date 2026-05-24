"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

const trackingStages = ["Created", "Coding Starting", "Frontend Review", "Test", "Final Review", "Publish"];
const statuses = ["Pending", "Planning", "In Progress", "In Review", "Completed"];

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

        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Add Project</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Project name" className="bg-black border border-white/10 rounded-2xl px-4 py-3" />
            <input value={form.clientEmail} onChange={(event) => setForm({ ...form, clientEmail: event.target.value })} placeholder="Client email" className="bg-black border border-white/10 rounded-2xl px-4 py-3" />
            <input value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} type="date" className="bg-black border border-white/10 rounded-2xl px-4 py-3" />
            <button onClick={add} className="bg-blue-500 hover:bg-blue-600 rounded-2xl px-6 py-3 font-semibold">Assign Project</button>
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Project description" className="md:col-span-4 bg-black border border-white/10 rounded-2xl px-4 py-3 min-h-24" />
          </div>
        </div>

        <div className="space-y-5">
          {projects.map((project) => {
            const projectDocuments = documents.filter((document) => document.project?._id === project._id || document.project?.title === project.title);
            return (
              <div key={project._id} className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
                  <div>
                    <h2 className="text-2xl font-bold">{project.title}</h2>
                    <p className="text-gray-400 mt-1">Client: {project.client?.name || "Unassigned"} {project.client?.email ? `(${project.client.email})` : ""}</p>
                    <p className="text-gray-500 mt-2">{project.description}</p>
                    <p className="text-blue-300 mt-3">Deadline: {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "Not set"}</p>
                  </div>

                  <div className="space-y-3">
                    <select value={project.status || "Planning"} onChange={(event) => updateProject(project._id, { status: event.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3">
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <select value={project.trackingStage || "Created"} onChange={(event) => updateProject(project._id, { trackingStage: event.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3">
                      {trackingStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                    </select>
                    <input type="date" onChange={(event) => updateProject(project._id, { dueDate: event.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3" />
                  </div>
                </div>

                <div className="mt-6 bg-black border border-white/10 rounded-3xl p-5">
                  <h3 className="font-bold text-xl mb-4">Client Uploaded Documents</h3>
                  {projectDocuments.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {projectDocuments.map((document) => (
                        <a key={document._id} href={document.driveViewLink || document.publicUrl} target="_blank" className="border border-white/10 hover:border-blue-500/50 rounded-2xl p-4 text-blue-300">
                          {document.originalName}
                          <span className="block text-gray-500 text-sm mt-1">{document.storage}</span>
                        </a>
                      ))}
                    </div>
                  ) : <p className="text-gray-500">No documents uploaded for this project yet.</p>}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
