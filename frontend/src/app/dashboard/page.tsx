"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import { BentoGrid, BentoCard } from "@/components/dashboard/Bento";
import CountUp from "@/components/ui/CountUp";
import ProgressRing from "@/components/ui/ProgressRing";
import { apiGet } from "@/lib/api";

type User = { name?: string };
type Project = { _id: string; title?: string; status?: string; trackingStage?: string; dueDate?: string };
type Item = { _id: string };

const stages = ["Created", "Coding Starting", "Frontend Review", "Test", "Final Review", "Publish"];
const progressOf = (stage?: string) => {
  const i = Math.max(0, stages.indexOf(stage || "Created"));
  return Math.round((i / (stages.length - 1)) * 100);
};

export default function DashboardPage() {
  const [name, setName] = useState("Client");
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({ projects: 0, messages: 0, meetings: 0, payments: 0 });

  useEffect(() => {
    apiGet<User>("/api/auth/me", {}).then((u) => setName(u.name || "Client"));
    Promise.all([
      apiGet<Project[]>("/api/projects", []),
      apiGet<Item[]>("/api/consultations", []),
      apiGet<(Project & { status?: string })[]>("/api/meetings", []),
      apiGet<(Project & { status?: string })[]>("/api/payments", []),
    ]).then(([prj, msgs, mtgs, pays]) => {
      setProjects(prj);
      setStats({
        projects: prj.filter((p) => p.status !== "Completed").length,
        messages: msgs.length,
        meetings: mtgs.filter((m) => m.status !== "Completed" && m.status !== "Cancelled").length,
        payments: pays.filter((p) => p.status !== "Paid").length,
      });
    });
  }, []);

  const active = projects.filter((p) => p.status !== "Completed");
  const featured = active[0] || projects[0];
  const overall = active.length
    ? Math.round(active.reduce((s, p) => s + progressOf(p.trackingStage), 0) / active.length)
    : 0;

  return (
    <DashboardShell>
      <BentoGrid>
        {/* greeting */}
        <BentoCard index={0} accent className="xl:col-span-2">
          <p className="font-mono text-[11px] tracking-[0.4em] text-emerald-100/50">WELCOME BACK</p>
          <h1 className="mt-3 text-3xl font-light tracking-wide text-white md:text-4xl" style={{ textShadow: "0 0 30px rgba(40,80,55,0.6)" }}>
            Hello, {name}
          </h1>
          <p className="mt-3 text-sm font-light text-emerald-50/70">
            {stats.projects} active {stats.projects === 1 ? "project" : "projects"} · {stats.meetings} upcoming{" "}
            {stats.meetings === 1 ? "meeting" : "meetings"} · {stats.payments} payment{stats.payments === 1 ? "" : "s"} due
          </p>
        </BentoCard>

        {/* overall progress ring */}
        <BentoCard index={1} className="flex flex-col items-center justify-center">
          <ProgressRing value={overall} label="overall" />
          <p className="mt-3 text-sm font-light text-emerald-50/60">Across active projects</p>
        </BentoCard>

        {/* stat tiles */}
        <StatTile index={2} icon="folder" label="Active projects" value={stats.projects} href="/dashboard/projects" />
        <StatTile index={3} icon="message-2" label="Consultation" value={stats.messages} href="/dashboard/consultation" />
        <StatTile index={4} icon="calendar" label="Meetings" value={stats.meetings} href="/dashboard/meetings" />

        {/* featured project */}
        <BentoCard index={5} className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-emerald-100/70">Featured project</p>
            {featured && (
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] text-emerald-200">
                {featured.trackingStage || "Created"}
              </span>
            )}
          </div>
          {featured ? (
            <>
              <p className="text-2xl font-light text-white">{featured.title || "Your project"}</p>
              <p className="mt-1 text-xs text-emerald-50/50">
                {featured.dueDate ? `Due ${new Date(featured.dueDate).toLocaleDateString()}` : "Timeline set by admin"}
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-emerald-950/60">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${progressOf(featured.trackingStage)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
                  className="h-2 rounded-full bg-emerald-400"
                />
              </div>
              <p className="mt-2 text-right text-xs text-emerald-100/50">{progressOf(featured.trackingStage)}%</p>
            </>
          ) : (
            <p className="text-sm font-light text-emerald-50/50">No projects assigned yet.</p>
          )}
        </BentoCard>

        {/* payment due accent */}
        <BentoCard index={6} accent className="flex flex-col justify-center">
          <p className="text-sm text-emerald-100/70">Payments due</p>
          <p className="mt-2 text-4xl font-extralight text-white">
            <CountUp value={stats.payments} />
          </p>
          <a href="/dashboard/payments" className="mt-3 text-xs font-light text-emerald-200 transition hover:text-emerald-100">
            View payments →
          </a>
        </BentoCard>

        {/* activity / projects list */}
        <BentoCard index={7} className="xl:col-span-3" hover={false}>
          <p className="mb-4 text-sm text-emerald-100/70">Your projects</p>
          {projects.length ? (
            <div className="space-y-2">
              {projects.slice(0, 5).map((p) => (
                <div key={p._id} className="flex items-center gap-3 rounded-xl border border-emerald-200/10 bg-emerald-950/40 px-4 py-3">
                  <i className="ti ti-circle-check text-emerald-400" aria-hidden />
                  <span className="text-sm font-light text-white">{p.title || "Project"}</span>
                  <span className="text-xs text-emerald-50/45">{p.trackingStage || "Created"}</span>
                  <span className="ml-auto text-xs text-emerald-100/50">{progressOf(p.trackingStage)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-light text-emerald-50/50">Projects assigned by your team will appear here.</p>
          )}
        </BentoCard>
      </BentoGrid>
    </DashboardShell>
  );
}

function StatTile({ index, icon, label, value, href }: { index: number; icon: string; label: string; value: number; href: string }) {
  return (
    <BentoCard index={index}>
      <a href={href} className="block">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200">
          <i className={`ti ti-${icon}`} aria-hidden />
        </div>
        <p className="text-sm text-emerald-100/60">{label}</p>
        <p className="mt-1 text-4xl font-extralight text-white" style={{ textShadow: "0 0 26px rgba(120,210,160,0.35)" }}>
          <CountUp value={value} />
        </p>
      </a>
    </BentoCard>
  );
}
