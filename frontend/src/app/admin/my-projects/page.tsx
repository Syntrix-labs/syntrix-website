"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { DashboardSkeleton, EmptyState } from "@/components/dashboard/States";
import Countdown, { formatDeadline } from "@/components/projects/Countdown";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type Project = {
  _id: string;
  title: string;
  description?: string;
  status?: string;
  dueDate?: string;
  client?: { name?: string };
  assignee?: { name?: string; role?: string };
  handover?: { status?: "none" | "submitted" | "approved" | "changes"; submittedAt?: string; respondedAt?: string; clientNote?: string };
};

/** A team member's assigned work: deadlines counting down, and "Finish job" to hand it to the client. */
export default function MyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [finishing, setFinishing] = useState<{ id: string; note: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Record<string, string>>({});

  const load = () => apiGet<Project[]>("/api/projects/assigned", []).then(setProjects);
  useEffect(() => {
    load().finally(() => setLoading(false));
    apiGet<{ isAdmin?: boolean }>("/api/auth/me", {}).then((u) => setIsAdmin(Boolean(u.isAdmin)));
  }, []);

  const handOver = async (project: Project) => {
    if (!finishing || busy) return;
    setBusy(true);
    try {
      const res = await fetch(apiPath(`/api/projects/${project._id}/handover`), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ note: finishing.note }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setFinishing(null);
        await load();
      } else {
        setError((e) => ({ ...e, [project._id]: data.message || "Couldn't hand over — please try again." }));
      }
    } catch {
      setError((e) => ({ ...e, [project._id]: "Couldn't hand over — please try again." }));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell type="admin">
        <DashboardSkeleton />
      </DashboardShell>
    );
  }

  const open = projects.filter((p) => p.status !== "Completed");
  const done = projects.filter((p) => p.status === "Completed");

  return (
    <DashboardShell type="admin">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          icon="briefcase"
          eyebrow="My projects"
          title={isAdmin ? "Assigned projects" : "Your projects"}
          description="Every project assigned to you, with a live countdown to its deadline. When the work is ready, tap Finish job — the client approves it in chat."
        />

        {projects.length === 0 ? (
          <EmptyState icon="briefcase" title="No projects assigned yet" hint="When the admin assigns you a project, it shows up here and you'll get an email." />
        ) : (
          <div className="space-y-4">
            {[...open, ...done].map((project) => {
              const h = project.handover?.status || "none";
              const completed = project.status === "Completed";
              const canFinish = !completed && (h === "none" || h === "changes");
              return (
                <div key={project._id} className="rounded-3xl border border-emerald-200/12 bg-emerald-950/30 p-5 backdrop-blur-md md:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-light tracking-wide text-white md:text-2xl">{project.title}</h2>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] text-emerald-200">{project.status || "Planning"}</span>
                  </div>
                  <p className="mt-1 text-sm text-emerald-50/55">
                    For {project.client?.name || "a client"}
                    {isAdmin && project.assignee?.name ? ` · assigned to ${project.assignee.name} (${project.assignee.role})` : ""}
                  </p>
                  {project.description && <p className="mt-2 text-sm font-light text-emerald-50/50">{project.description}</p>}

                  <div className="mt-4">
                    <Countdown due={project.dueDate} done={completed} size="lg" />
                    {project.dueDate && !completed && <p className="mt-2 text-xs text-emerald-50/45">Due {formatDeadline(project.dueDate)}</p>}
                  </div>

                  {h === "changes" && (
                    <p className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-3 py-2.5 text-sm text-amber-100">
                      <i className="ti ti-pencil mt-0.5" aria-hidden />
                      <span>The client asked for changes{project.handover?.clientNote ? `: “${project.handover.clientNote}”` : "."} Hand it over again when it&apos;s ready.</span>
                    </p>
                  )}
                  {h === "submitted" && (
                    <p className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-3 py-2.5 text-sm text-amber-100">
                      <i className="ti ti-hourglass" aria-hidden /> Handed over — waiting for the client to approve.
                    </p>
                  )}
                  {completed && (
                    <p className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-100">
                      <i className="ti ti-circle-check" aria-hidden /> {h === "approved" ? "The client approved this — great work!" : "Completed."}
                    </p>
                  )}

                  {canFinish && finishing?.id !== project._id && (
                    <button
                      onClick={() => setFinishing({ id: project._id, note: "" })}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/90 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-400 active:scale-[0.98] sm:w-auto"
                    >
                      <i className="ti ti-package" aria-hidden /> Finish job — hand over
                    </button>
                  )}
                  {canFinish && finishing?.id === project._id && (
                    <div className="mt-4 space-y-2 rounded-2xl border border-emerald-300/25 bg-emerald-500/[0.06] p-4">
                      <p className="text-sm text-emerald-50/80">
                        This sends a card to {project.client?.name || "the client"}&apos;s chat so they can mark the work as done.
                      </p>
                      <textarea
                        value={finishing.note}
                        onChange={(e) => setFinishing({ id: project._id, note: e.target.value })}
                        placeholder="Note for the client (optional) — e.g. where to find the files"
                        rows={3}
                        className="w-full rounded-xl border border-emerald-200/15 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50/90 outline-none placeholder:text-emerald-50/30 focus:border-emerald-400/60"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handOver(project)}
                          disabled={busy}
                          className="flex-1 rounded-xl bg-emerald-500/90 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:opacity-60 sm:flex-none"
                        >
                          {busy ? "Handing over…" : "Hand over to client"}
                        </button>
                        <button onClick={() => setFinishing(null)} className="rounded-xl px-4 py-2.5 text-sm text-emerald-50/60 transition hover:text-white">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {error[project._id] && <p className="mt-2 text-xs text-red-300">{error[project._id]}</p>}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </DashboardShell>
  );
}
