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
          icon="folder"
          eyebrow="Projects"
          title="Active projects"
          description="Project name, deadline, uploaded documents, and tracking stage update from the admin panel."
        />

        <div className="space-y-6">
          {projects.map((project, projectIndex) => {
            const index = Math.max(0, steps.indexOf(project.trackingStage || "Created"));
            return (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: projectIndex * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-7 backdrop-blur-sm"
              >
                <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div>
                    <h2 className="text-3xl font-light tracking-wide">{project.title}</h2>
                    <p className="mt-3 font-light text-emerald-50/60">{project.description}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200/10 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-50/70">
                    Deadline: {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "Admin will set"}
                  </div>
                </div>

                <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-6">
                  {steps.map((step, stepIndex) => {
                    const reached = stepIndex <= index;
                    return (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: stepIndex * 0.06 }}
                        className={`rounded-2xl border p-3 text-sm transition ${
                          reached
                            ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
                            : "border-emerald-200/10 bg-emerald-950/40 text-emerald-50/40"
                        }`}
                      >
                        {step}
                      </motion.div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div className="rounded-3xl border border-emerald-200/10 bg-emerald-950/40 p-5">
                    <h3 className="mb-4 text-xl font-light">Document upload</h3>
                    <div className="flex flex-col gap-4 md:flex-row">
                      <input
                        type="file"
                        onChange={(event) => setFiles({ ...files, [project._id]: event.target.files?.[0] || null })}
                        className="flex-1 rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-50/80 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500/20 file:px-3 file:py-1.5 file:text-emerald-100"
                      />
                      <button
                        onClick={() => uploadDocument(project._id)}
                        className="rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98]"
                      >
                        Add file
                      </button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-emerald-200/10 bg-emerald-950/40 p-5">
                    <h3 className="mb-4 text-xl font-light">Documents</h3>
                    <div className="space-y-2">
                      {project.documentLinks?.length ? project.documentLinks.map((document) => (
                        <a key={`${document.name}-${document.uploadedAt}`} href={document.url} target="_blank" className="block text-emerald-300 transition hover:text-emerald-200">
                          {document.name}
                        </a>
                      )) : <p className="text-emerald-50/40">No documents uploaded yet.</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
