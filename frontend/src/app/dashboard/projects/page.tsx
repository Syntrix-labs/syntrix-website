"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import LaunchGauge from "@/components/dashboard/LaunchGauge";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

const steps = ["Created", "Coding Starting", "Frontend Review", "Test", "Final Review", "Publish"];
const progressOf = (stage?: string) => {
  const i = Math.max(0, steps.indexOf(stage || "Created"));
  return Math.round((i / (steps.length - 1)) * 100);
};

type Doc = { name: string; url: string; uploadedAt?: string };
type Project = {
  _id: string;
  title: string;
  description?: string;
  status?: string;
  trackingStage?: string;
  dueDate?: string;
  documentLinks?: Doc[];
};

const fallbackProjects: Project[] = [
  {
    _id: "demo",
    title: "Your first Syntrix project",
    description: "When admin assigns a project, the real project name, deadline, documents, and tracking stage appear here.",
    status: "Requested",
    trackingStage: "Created",
    dueDate: "",
  },
];

function fileMeta(name: string): { icon: string; color: string } {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return { icon: "file-type-pdf", color: "#f08a8a" };
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return { icon: "photo", color: "#7fc6f0" };
  if (ext === "zip") return { icon: "file-zip", color: "#f0c98a" };
  if (["doc", "docx"].includes(ext)) return { icon: "file-type-doc", color: "#7fa6f0" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { icon: "file-type-xls", color: "#7fd0a0" };
  if (["ppt", "pptx"].includes(ext)) return { icon: "file-type-ppt", color: "#f0a87f" };
  return { icon: "file", color: "#9fb6a6" };
}

function countdown(due?: string): { text: string; color: string } | null {
  if (!due) return null;
  const ms = new Date(due).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  const days = Math.ceil(ms / 86400000);
  if (days < 0) return { text: `${Math.abs(days)} days overdue`, color: "#f08a8a" };
  if (days === 0) return { text: "due today", color: "#f0c98a" };
  return { text: `${days} days left`, color: days <= 7 ? "#f0c98a" : "#9fb6a6" };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(fallbackProjects);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<Record<string, string>>({});

  const loadProjects = () => apiGet<Project[]>("/api/projects", fallbackProjects).then(setProjects);
  useEffect(() => {
    loadProjects();
  }, []);

  const uploadDocument = async (projectId: string) => {
    const file = files[projectId];
    if (!file) return;
    setBusy(projectId);

    const form = new FormData();
    form.append("clientFile", file);
    if (projectId !== "demo") form.append("projectId", projectId);

    try {
      const response = await fetch(apiPath("/api/uploads"), { method: "POST", headers: authHeaders(), body: form });
      if (response.ok) {
        setFiles({ ...files, [projectId]: null });
        setUploadErr((e) => ({ ...e, [projectId]: "" }));
        loadProjects();
      } else {
        setUploadErr((e) => ({ ...e, [projectId]: "Upload failed. Please try again." }));
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <DashboardShell>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <SectionHeader
          icon="folder"
          eyebrow="Projects"
          title="Active projects"
          description="Live tracking, deadline, documents, and stage updates straight from the Syntrix team."
        />

        <div className="space-y-6">
          {projects.map((project, projectIndex) => {
            const progress = progressOf(project.trackingStage);
            const stageIndex = Math.max(0, steps.indexOf(project.trackingStage || "Created"));
            const cd = countdown(project.dueDate);
            const selected = files[project._id];
            return (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: projectIndex * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-3xl border border-emerald-200/12 bg-emerald-950/30 p-6 backdrop-blur-md md:p-7"
              >
                {/* header */}
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-light tracking-wide text-white">{project.title}</h2>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] text-emerald-200">
                    {project.status || "In progress"}
                  </span>
                  {cd && (
                    <span className="ml-auto text-xs" style={{ color: cd.color }}>
                      <i className="ti ti-clock" aria-hidden /> {cd.text}
                    </span>
                  )}
                </div>
                {project.description && <p className="mt-2 text-sm font-light text-emerald-50/55">{project.description}</p>}
                <p className="mt-1 text-xs text-emerald-50/40">
                  {project.dueDate ? `Due ${new Date(project.dueDate).toLocaleDateString()}` : "Timeline set by your team"}
                </p>

                {/* launch gauge */}
                <div className="my-4">
                  <LaunchGauge value={progress} stageLabel={project.trackingStage || "Created"} />
                </div>

                {/* stage chips */}
                <div className="mb-6 flex flex-wrap justify-center gap-2">
                  {steps.map((s, i) => {
                    const done = i < stageIndex;
                    const current = i === stageIndex;
                    return (
                      <span
                        key={s}
                        className={`rounded-full border px-3 py-1 text-[11px] ${
                          current
                            ? "border-emerald-400 bg-emerald-500/25 text-white"
                            : done
                            ? "border-emerald-500/40 bg-emerald-500/12 text-emerald-200"
                            : "border-emerald-200/15 text-emerald-50/40"
                        }`}
                      >
                        {s}
                      </span>
                    );
                  })}
                </div>

                {/* upload + docs */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragId(project._id);
                    }}
                    onDragLeave={() => setDragId(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragId(null);
                      const f = e.dataTransfer.files?.[0];
                      if (f) setFiles({ ...files, [project._id]: f });
                    }}
                    className={`rounded-2xl border border-dashed p-6 text-center transition ${
                      dragId === project._id ? "border-emerald-300 bg-emerald-400/10" : "border-emerald-500/30 bg-emerald-500/[0.04]"
                    }`}
                  >
                    <i className="ti ti-cloud-upload text-2xl text-emerald-400" aria-hidden />
                    {selected ? (
                      <div className="mt-2">
                        <p className="truncate text-sm text-emerald-50/80">{selected.name}</p>
                        <div className="mt-3 flex justify-center gap-2">
                          <button
                            onClick={() => uploadDocument(project._id)}
                            disabled={busy === project._id}
                            className="rounded-xl bg-emerald-500/90 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:opacity-60"
                          >
                            {busy === project._id ? "Uploading…" : "Upload"}
                          </button>
                          <button
                            onClick={() => setFiles({ ...files, [project._id]: null })}
                            className="rounded-xl border border-emerald-200/15 px-4 py-2 text-sm text-emerald-50/70 transition hover:text-white"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-2 text-sm text-emerald-50/80">
                          Drop a file or{" "}
                          <label htmlFor={`file-${project._id}`} className="cursor-pointer text-emerald-300 underline">
                            browse
                          </label>
                        </p>
                        <p className="mt-0.5 text-xs text-emerald-50/40">PDF, images, docs, zip · up to 25 MB</p>
                      </>
                    )}
                    <input
                      id={`file-${project._id}`}
                      type="file"
                      className="hidden"
                      onChange={(e) => setFiles({ ...files, [project._id]: e.target.files?.[0] || null })}
                    />
                    {uploadErr[project._id] && <p className="mt-2 text-xs text-red-300">{uploadErr[project._id]}</p>}
                  </div>

                  <div className="rounded-2xl border border-emerald-200/10 bg-emerald-950/40 p-4">
                    <p className="mb-3 text-xs text-emerald-100/60">Documents</p>
                    {project.documentLinks?.length ? (
                      <div className="space-y-1">
                        {project.documentLinks.map((doc) => {
                          const m = fileMeta(doc.name);
                          return (
                            <a
                              key={`${doc.name}-${doc.uploadedAt}`}
                              href={doc.url}
                              target="_blank"
                              className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-emerald-50/85 transition hover:bg-emerald-200/5"
                            >
                              <i className={`ti ti-${m.icon}`} style={{ color: m.color }} aria-hidden />
                              <span className="truncate">{doc.name}</span>
                              <span className="ml-auto text-xs text-emerald-50/40">
                                {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ""}
                              </span>
                              <i className="ti ti-download text-emerald-50/40" aria-hidden />
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-emerald-50/40">No documents uploaded yet.</p>
                    )}
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
