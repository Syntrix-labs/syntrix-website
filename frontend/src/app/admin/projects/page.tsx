"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { DashboardSkeleton } from "@/components/dashboard/States";
import LaunchGauge from "@/components/dashboard/LaunchGauge";
import Countdown, { formatDeadline, fromLocalInput, toLocalInput } from "@/components/projects/Countdown";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

const trackingStages = ["Created", "Coding Starting", "Frontend Review", "Test", "Final Review", "Publish"];
const statuses = ["Pending", "Planning", "In Progress", "In Review", "Completed"];

const adminInput =
  "rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60";
const smallBtn = "rounded-xl px-4 py-2 text-sm transition";

const progressOf = (s?: string) =>
  Math.round((Math.max(0, trackingStages.indexOf(s || "Created")) / (trackingStages.length - 1)) * 100);

type Assignee = { member?: string; name?: string; role?: string; email?: string; assignedAt?: string };
type HistoryEntry = Assignee & { endedAt?: string; outcome?: "reassigned" | "disapproved"; reason?: string };
type Handover = { status?: "none" | "submitted" | "approved" | "changes"; by?: string; note?: string; submittedAt?: string; respondedAt?: string; clientNote?: string };

type Project = {
  _id: string;
  title: string;
  client?: { name?: string; email?: string };
  description?: string;
  status?: string;
  trackingStage?: string;
  dueDate?: string;
  assignee?: Assignee;
  assignmentHistory?: HistoryEntry[];
  handover?: Handover;
};

type TeamMember = { _id: string; name: string; role: string; email?: string; isAdmin?: boolean };

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

const shortDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "");

async function send(path: string, method: string, body?: unknown) {
  try {
    const res = await fetch(apiPath(path), {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { message: "Network error — please try again." } };
  }
}

/** Where the hand-over stands, for the admin. */
function HandoverStatus({ handover, status }: { handover?: Handover; status?: string }) {
  const h = handover?.status;
  if (h === "submitted")
    return (
      <p className="flex items-start gap-2 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
        <i className="ti ti-hourglass mt-0.5" aria-hidden />
        <span>Handed over{handover?.by ? ` by ${handover.by}` : ""} {shortDate(handover?.submittedAt)} — waiting for the client to approve.</span>
      </p>
    );
  if (h === "changes")
    return (
      <p className="flex items-start gap-2 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
        <i className="ti ti-pencil mt-0.5" aria-hidden />
        <span>Client asked for changes{handover?.clientNote ? `: “${handover.clientNote}”` : "."}</span>
      </p>
    );
  if (h === "approved" || status === "Completed")
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
        <i className="ti ti-circle-check" aria-hidden />
        <span>{h === "approved" ? `Client approved ${shortDate(handover?.respondedAt)} — work done.` : "Completed."}</span>
      </p>
    );
  return null;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(fallbackProjects);
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [form, setForm] = useState({ title: "", clientEmail: "", description: "", dueDate: "", memberId: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState("");
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [confirmDel, setConfirmDel] = useState("");
  // per-project UI state
  const [deadlineEdit, setDeadlineEdit] = useState<{ id: string; value: string } | null>(null);
  const [disapprove, setDisapprove] = useState<{ id: string; reason: string; memberId: string } | null>(null);
  const [cardMsg, setCardMsg] = useState<Record<string, string>>({});

  const load = () =>
    Promise.all([
      apiGet<Project[]>("/api/projects/admin/all", fallbackProjects).then(setProjects),
      apiGet<DocumentUpload[]>("/api/uploads/admin/all", []).then(setDocuments),
      apiGet<TeamMember[]>("/api/team", []).then((all) => setTeam(all.filter((m) => !m.isAdmin && m.email))),
    ]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const replaceProject = (p?: Project) => p && setProjects((prev) => prev.map((x) => (x._id === p._id ? { ...x, ...p } : x)));
  const note = (id: string, text: string) => setCardMsg((m) => ({ ...m, [id]: text }));

  const add = async () => {
    const { ok, data } = await send("/api/projects", "POST", {
      ...form,
      dueDate: fromLocalInput(form.dueDate) || undefined,
      memberId: form.memberId || undefined,
      status: "Planning",
      trackingStage: "Created",
    });
    if (ok) {
      setForm({ title: "", clientEmail: "", description: "", dueDate: "", memberId: "" });
      setMsg(form.memberId ? "Project created — the team member has been emailed." : "");
      load();
      return;
    }
    setMsg(data.message || "Project could not be assigned — check the client email.");
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p._id === projectId ? { ...p, ...updates } : p))); // instant
    await send(`/api/projects/${projectId}`, "PUT", updates);
  };

  const saveDeadline = async (project: Project) => {
    if (!deadlineEdit) return;
    const iso = fromLocalInput(deadlineEdit.value);
    setDeadlineEdit(null);
    await updateProject(project._id, { dueDate: iso });
    note(project._id, project.assignee?.email ? `Deadline updated — ${project.assignee.name} has been emailed.` : "Deadline updated.");
  };

  const assign = async (project: Project, memberId: string) => {
    if (!memberId) return;
    const { ok, data } = await send(`/api/projects/${project._id}/assign`, "PUT", { memberId });
    if (ok) {
      replaceProject(data.project);
      note(project._id, `Assigned to ${data.project?.assignee?.name} — they've been emailed.`);
    } else note(project._id, data.message || "Couldn't assign.");
  };

  const confirmDisapprove = async (project: Project) => {
    if (!disapprove) return;
    const { ok, data } = await send(`/api/projects/${project._id}/disapprove`, "POST", {
      reason: disapprove.reason,
      memberId: disapprove.memberId || undefined,
    });
    if (ok) {
      replaceProject(data.project);
      setDisapprove(null);
      note(
        project._id,
        data.project?.assignee?.name
          ? `${project.assignee?.name} removed. Now assigned to ${data.project.assignee.name} — they've been emailed.`
          : `${project.assignee?.name} removed. Pick a new team member below.`
      );
    } else note(project._id, data.message || "Couldn't disapprove.");
  };

  const deleteProject = async (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p._id !== projectId)); // instant
    setConfirmDel("");
    await fetch(apiPath(`/api/projects/${projectId}`), { method: "DELETE", headers: authHeaders() });
  };

  const startEdit = (p: Project) => {
    setEditId(p._id);
    setEditForm({ title: p.title || "", description: p.description || "" });
  };
  const saveEdit = (id: string) => {
    updateProject(id, editForm);
    setEditId("");
  };

  const memberLabel = (m: TeamMember) => `${m.name} — ${m.role}`;

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
          description="Assign each project to a team member with a deadline, follow the countdown, and see when the client approves the work."
        />

        <div className="mb-6 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-5 backdrop-blur-sm md:p-6">
          <h2 className="mb-4 text-xl font-light tracking-wide md:text-2xl">Add project</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Project name" className={adminInput} />
            <input value={form.clientEmail} onChange={(event) => setForm({ ...form, clientEmail: event.target.value })} placeholder="Client email" className={adminInput} />
            <select value={form.memberId} onChange={(event) => setForm({ ...form, memberId: event.target.value })} className={adminInput} aria-label="Team member">
              <option value="">Team member (optional)</option>
              {team.map((m) => <option key={m._id} value={m._id}>{memberLabel(m)}</option>)}
            </select>
            <label className="relative">
              <span className="pointer-events-none absolute -top-2 left-3 bg-[#062117] px-1 text-[10px] uppercase tracking-wider text-emerald-100/50">Deadline</span>
              <input value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} type="datetime-local" className={`${adminInput} w-full`} />
            </label>
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Project description" className={`${adminInput} min-h-24 md:col-span-2 xl:col-span-3`} />
            <button onClick={add} className="rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98]">Assign project</button>
            {msg && <p className="text-sm text-emerald-200 md:col-span-2 xl:col-span-4">{msg}</p>}
          </div>
        </div>

        <div className="space-y-5">
          {projects.map((project, i) => {
            const projectDocuments = documents.filter((document) => document.project?._id === project._id || document.project?.title === project.title);
            const done = project.status === "Completed";
            const others = team.filter((m) => m._id !== project.assignee?.member);
            return (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: Math.min(i, 6) * 0.06 }}
                className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-5 backdrop-blur-sm md:p-6"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    {editId === project._id ? (
                      <div className="space-y-3">
                        <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title" className={`${adminInput} w-full`} />
                        <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" className={`${adminInput} min-h-20 w-full`} />
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(project._id)} className={`${smallBtn} bg-emerald-500/90 font-medium text-white hover:bg-emerald-400`}>Save</button>
                          <button onClick={() => setEditId("")} className={`${smallBtn} border border-emerald-200/15 text-emerald-50/70 hover:text-white`}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-light tracking-wide md:text-2xl">{project.title}</h2>
                          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] text-emerald-200">{project.status || "Planning"}</span>
                        </div>
                        <p className="mt-1 text-sm font-light text-emerald-50/60">Client: {project.client?.name || "Unassigned"} {project.client?.email ? `(${project.client.email})` : ""}</p>
                        {project.description && <p className="mt-1.5 text-sm text-emerald-50/45">{project.description}</p>}
                      </>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => startEdit(project)} aria-label="Edit project" className="rounded-xl border border-emerald-200/15 p-2 text-emerald-50/70 transition hover:border-emerald-300/50 hover:text-white"><i className="ti ti-edit" aria-hidden /></button>
                    {confirmDel === project._id ? (
                      <button onClick={() => deleteProject(project._id)} className="rounded-xl border border-red-400/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">Confirm delete?</button>
                    ) : (
                      <button onClick={() => setConfirmDel(project._id)} aria-label="Delete project" className="rounded-xl border border-emerald-200/15 p-2 text-emerald-50/40 transition hover:border-red-400/50 hover:text-red-300"><i className="ti ti-trash" aria-hidden /></button>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* ---------- deadline + countdown ---------- */}
                  <div className="rounded-2xl border border-emerald-200/10 bg-emerald-950/40 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/50">Deadline</p>
                      {deadlineEdit?.id !== project._id && (
                        <button
                          onClick={() => setDeadlineEdit({ id: project._id, value: toLocalInput(project.dueDate) })}
                          className="text-xs text-emerald-300 transition hover:text-emerald-200"
                        >
                          <i className="ti ti-calendar-time" aria-hidden /> {project.dueDate ? "Change" : "Set deadline"}
                        </button>
                      )}
                    </div>
                    {deadlineEdit?.id === project._id ? (
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="datetime-local"
                          value={deadlineEdit.value}
                          onChange={(e) => setDeadlineEdit({ id: project._id, value: e.target.value })}
                          className={`${adminInput} min-w-0 flex-1 py-2`}
                          aria-label="New deadline"
                        />
                        <button onClick={() => saveDeadline(project)} className={`${smallBtn} bg-emerald-500/90 font-medium text-white hover:bg-emerald-400`}>Save</button>
                        <button onClick={() => setDeadlineEdit(null)} className={`${smallBtn} text-emerald-50/60 hover:text-white`}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <Countdown due={project.dueDate} done={done} size="lg" />
                        {project.dueDate && <p className="mt-2 text-xs text-emerald-50/45">Due {formatDeadline(project.dueDate)}</p>}
                      </>
                    )}
                  </div>

                  {/* ---------- team member ---------- */}
                  <div className="rounded-2xl border border-emerald-200/10 bg-emerald-950/40 p-4">
                    <p className="mb-3 text-xs uppercase tracking-[0.2em] text-emerald-100/50">Team member</p>
                    {project.assignee?.email ? (
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-400/22 text-emerald-100">
                          {(project.assignee.name || "?").charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-white">{project.assignee.name}</p>
                          <p className="truncate text-xs text-emerald-50/50">{project.assignee.role} · since {shortDate(project.assignee.assignedAt)}</p>
                        </div>
                        {!done && disapprove?.id !== project._id && (
                          <button
                            onClick={() => setDisapprove({ id: project._id, reason: "", memberId: "" })}
                            className="shrink-0 rounded-xl border border-red-400/30 px-3 py-1.5 text-xs text-red-200 transition hover:bg-red-500/10"
                          >
                            Disapprove
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-emerald-50/45">Nobody assigned yet.</p>
                    )}

                    {disapprove?.id === project._id && (
                      <div className="mt-3 space-y-2 rounded-2xl border border-red-400/25 bg-red-500/[0.06] p-3">
                        <p className="text-xs text-red-100/80">Remove {project.assignee?.name} from this project and hand it to someone else.</p>
                        <input
                          value={disapprove.reason}
                          onChange={(e) => setDisapprove({ ...disapprove, reason: e.target.value })}
                          placeholder="Reason (only admins see this)"
                          className={`${adminInput} w-full py-2 text-sm`}
                        />
                        <select
                          value={disapprove.memberId}
                          onChange={(e) => setDisapprove({ ...disapprove, memberId: e.target.value })}
                          className={`${adminInput} w-full py-2 text-sm`}
                          aria-label="New team member"
                        >
                          <option value="">Choose the new team member…</option>
                          {others.map((m) => <option key={m._id} value={m._id}>{memberLabel(m)}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <button onClick={() => confirmDisapprove(project)} className={`${smallBtn} bg-red-500/80 font-medium text-white hover:bg-red-500`}>
                            {disapprove.memberId ? "Disapprove & reassign" : "Disapprove"}
                          </button>
                          <button onClick={() => setDisapprove(null)} className={`${smallBtn} text-emerald-50/60 hover:text-white`}>Cancel</button>
                        </div>
                      </div>
                    )}

                    {!done && disapprove?.id !== project._id && (
                      <select
                        value=""
                        onChange={(e) => assign(project, e.target.value)}
                        className={`${adminInput} mt-3 w-full py-2 text-sm`}
                        aria-label={project.assignee?.email ? "Change team member" : "Assign team member"}
                      >
                        <option value="">{project.assignee?.email ? "Change team member…" : "Assign a team member…"}</option>
                        {others.map((m) => <option key={m._id} value={m._id}>{memberLabel(m)}</option>)}
                      </select>
                    )}

                    <div className="mt-3">
                      <HandoverStatus handover={project.handover} status={project.status} />
                    </div>

                    {!!project.assignmentHistory?.length && (
                      <div className="mt-3 border-t border-emerald-200/10 pt-3">
                        <p className="mb-1.5 text-[11px] uppercase tracking-wider text-emerald-100/40">Previously</p>
                        <ul className="space-y-1">
                          {project.assignmentHistory.slice().reverse().map((h, idx) => (
                            <li key={`${h.email}-${idx}`} className="text-xs text-emerald-50/55">
                              <span className="text-emerald-50/80">{h.name}</span> ({h.role}) —{" "}
                              {h.outcome === "disapproved" ? <span className="text-red-300">disapproved</span> : "reassigned"} {shortDate(h.endedAt)}
                              {h.reason ? `: “${h.reason}”` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {cardMsg[project._id] && <p className="mt-3 text-xs text-emerald-200">{cardMsg[project._id]}</p>}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_280px]">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <select value={project.status || "Planning"} onChange={(event) => updateProject(project._id, { status: event.target.value })} className={`${adminInput} w-full`} aria-label="Status">
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <select value={project.trackingStage || "Created"} onChange={(event) => updateProject(project._id, { trackingStage: event.target.value })} className={`${adminInput} w-full`} aria-label="Tracking stage">
                      {trackingStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                    </select>
                  </div>
                  <div className="max-w-[280px]">
                    <LaunchGauge value={progressOf(project.trackingStage)} stageLabel={project.trackingStage || "Created"} />
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-emerald-200/10 bg-emerald-950/40 p-4 md:p-5">
                  <h3 className="mb-3 text-base font-light md:text-lg">Client uploaded documents</h3>
                  {projectDocuments.length ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {projectDocuments.map((document) => (
                        <a key={document._id} href={document.driveViewLink || document.publicUrl} target="_blank" className="rounded-2xl border border-emerald-200/10 p-4 text-emerald-300 transition hover:border-emerald-300/50">
                          {document.originalName}
                          <span className="mt-1 block text-sm text-emerald-50/40">{document.storage}</span>
                        </a>
                      ))}
                    </div>
                  ) : <p className="text-sm text-emerald-50/40">No documents uploaded for this project yet.</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
