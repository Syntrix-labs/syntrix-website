"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { DashboardSkeleton, EmptyState } from "@/components/dashboard/States";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

// "Not active yet" = projects that haven't started moving.
const PENDING_STATUSES = ["Pending", "Planning"];
const statuses = ["Pending", "Planning", "In Progress", "In Review", "Completed"];

const adminInput =
  "rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition focus:border-emerald-400/60";

type Project = {
  _id: string;
  title: string;
  client?: { name?: string; email?: string };
  description?: string;
  status?: string;
  dueDate?: string;
};

const daysLeft = (due?: string) => {
  if (!due) return null;
  const ms = new Date(due).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

export default function PendingProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => apiGet<Project[]>("/api/projects/admin/all", []).then(setProjects);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const updateProject = async (id: string, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p._id === id ? { ...p, ...updates } : p))); // instant
    await fetch(apiPath(`/api/projects/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(updates)
    });
  };

  // Backend already sorts by soonest deadline first; just filter to pending ones.
  const pending = projects.filter((p) => PENDING_STATUSES.includes(p.status || "Planning"));

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
          icon="hourglass" eyebrow="Pending projects"
          title="Projects not active yet"
          description="Projects still in Pending or Planning — they haven't started moving. Soonest deadline is on top. Activate one when work begins."
        />

        {pending.length === 0 ? (
          <EmptyState icon="circle-check" title="Nothing pending" hint="Every project is active or completed. New unstarted projects show up here." />
        ) : (
          <div className="space-y-4">
            {pending.map((project, i) => {
              const left = daysLeft(project.dueDate);
              const urgent = left !== null && left <= 7;
              return (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="flex flex-col justify-between gap-5 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm xl:flex-row xl:items-center"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-light tracking-wide">{project.title}</h2>
                      <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-100">{project.status || "Planning"}</span>
                    </div>
                    <p className="mt-1 font-light text-emerald-50/60">Client: {project.client?.name || "Unassigned"} {project.client?.email ? `(${project.client.email})` : ""}</p>
                    {project.description && <p className="mt-2 text-sm text-emerald-50/45">{project.description}</p>}
                    <p className="mt-3 text-sm">
                      <span className="text-emerald-300">Deadline: {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "Not set"}</span>
                      {left !== null && (
                        <span className={`ml-2 ${urgent ? "text-amber-300" : "text-emerald-50/50"}`}>
                          {left < 0 ? `${Math.abs(left)} days overdue` : `${left} days left`}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select value={project.status || "Planning"} onChange={(e) => updateProject(project._id, { status: e.target.value })} className={`${adminInput} w-40`}>
                      {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => updateProject(project._id, { status: "In Progress" })} className="rounded-2xl bg-emerald-500/90 px-5 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98]">Activate</button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </DashboardShell>
  );
}
