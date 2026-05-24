"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

const steps = ["Created", "Coding Starting", "Frontend Review", "Test", "Final Review", "Publish"];
const fallbackProjects = [
  {
    _id: "demo",
    title: "Your first Syntrix project",
    description: "When admin assigns a project, the real project name, deadline, documents, and tracking stage appear here.",
    status: "Requested",
    trackingStage: "Created",
    dueDate: ""
  }
];

type Project = {
  _id: string;
  title: string;
  description?: string;
  status?: string;
  trackingStage?: string;
  dueDate?: string;
  documentLinks?: { name: string; url: string; uploadedAt?: string }[];
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(fallbackProjects);
  const [files, setFiles] = useState<Record<string, File | null>>({});

  const loadProjects = () => apiGet<Project[]>("/api/projects", fallbackProjects).then(setProjects);
  useEffect(() => {
    loadProjects();
  }, []);

  const uploadDocument = async (projectId: string) => {
    const file = files[projectId];
    if (!file) return alert("Choose a document first");

    const form = new FormData();
    form.append("clientFile", file);
    if (projectId !== "demo") {
      form.append("projectId", projectId);
    }

    const response = await fetch(apiPath("/api/uploads"), {
      method: "POST",
      headers: authHeaders(),
      body: form
    });

    if (response.ok) {
      alert("Document uploaded. Admin can review it from the projects area.");
      setFiles({ ...files, [projectId]: null });
      loadProjects();
    } else {
      alert("Document upload failed. Please try again.");
    }
  };

  return (
    <DashboardShell>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <SectionHeader
          eyebrow="Projects"
          title="Active projects"
          description="Project name, deadline, uploaded documents, and tracking stage update from the admin panel."
        />

        <div className="space-y-6">
          {projects.map((project) => {
            const index = Math.max(0, steps.indexOf(project.trackingStage || "Created"));
            return (
              <div key={project._id} className="bg-zinc-900 border border-white/10 rounded-3xl p-7">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 mb-7">
                  <div>
                    <h2 className="text-3xl font-bold">{project.title}</h2>
                    <p className="text-gray-400 mt-3">{project.description}</p>
                  </div>
                  <div className="text-sm text-gray-300 bg-black border border-white/10 rounded-2xl px-4 py-3">
                    Deadline: {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "Admin will set"}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
                  {steps.map((step, stepIndex) => (
                    <div key={step} className={`rounded-2xl p-3 text-sm border ${stepIndex <= index ? "bg-blue-500/20 border-blue-500/40 text-blue-200" : "bg-black border-white/10 text-gray-500"}`}>
                      {step}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-black border border-white/10 rounded-3xl p-5">
                    <h3 className="text-xl font-bold mb-4">Documents Upload</h3>
                    <div className="flex flex-col md:flex-row gap-4">
                      <input
                        type="file"
                        onChange={(event) => setFiles({ ...files, [project._id]: event.target.files?.[0] || null })}
                        className="flex-1 bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3"
                      />
                      <button onClick={() => uploadDocument(project._id)} className="bg-blue-500 hover:bg-blue-600 rounded-2xl px-6 py-3 font-semibold transition">Add File</button>
                    </div>
                  </div>

                  <div className="bg-black border border-white/10 rounded-3xl p-5">
                    <h3 className="text-xl font-bold mb-4">Documents</h3>
                    <div className="space-y-2">
                      {project.documentLinks?.length ? project.documentLinks.map((document) => (
                        <a key={`${document.name}-${document.uploadedAt}`} href={document.url} target="_blank" className="block text-blue-300 hover:text-blue-200">
                          {document.name}
                        </a>
                      )) : <p className="text-gray-500">No documents uploaded yet.</p>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
