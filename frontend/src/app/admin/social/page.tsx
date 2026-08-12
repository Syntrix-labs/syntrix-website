"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/dashboard/States";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type PlatformResult = {
  platform: string;
  status: "pending" | "published" | "failed" | "skipped";
  content: string;
  permalink?: string;
  error?: string;
};
type Post = {
  _id: string;
  topic: string;
  prompt?: string;
  platforms: string[];
  imageUrl?: string;
  status: "draft" | "approved" | "scheduled" | "publishing" | "published" | "failed";
  autoPublish: boolean;
  scheduleAt?: string;
  results: PlatformResult[];
  createdBy?: string;
  createdAt?: string;
};

const ALL_PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: "brand-linkedin" },
  { id: "twitter", label: "X / Twitter", icon: "brand-x" },
  { id: "instagram", label: "Instagram", icon: "brand-instagram" },
] as const;

const input =
  "rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-50/85 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60";

const statusStyle: Record<Post["status"], string> = {
  draft: "border-emerald-200/20 bg-emerald-500/10 text-emerald-200",
  approved: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  scheduled: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  publishing: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  published: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
  failed: "border-red-400/40 bg-red-500/10 text-red-200",
};

export default function SocialPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Compose form
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["linkedin", "twitter"]);
  const [autoPublish, setAutoPublish] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");

  const load = () => apiGet<Post[]>("/api/social", []).then(setPosts);
  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const togglePlatform = (id: string) =>
    setPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const send = (path: string, init: RequestInit) =>
    fetch(apiPath(path), { ...init, headers: { "Content-Type": "application/json", ...authHeaders(), ...(init.headers || {}) } });

  const generate = async () => {
    if (!topic.trim() && !prompt.trim()) { setMsg("Add a topic or a direction for the AI."); return; }
    if (platforms.length === 0) { setMsg("Pick at least one platform."); return; }
    if (platforms.includes("instagram") && !imageUrl.trim()) { setMsg("Instagram needs a public image URL."); return; }
    setBusy(true); setMsg("");
    const res = await send("/api/social/generate", {
      method: "POST",
      body: JSON.stringify({
        topic: topic.trim(),
        prompt: prompt.trim(),
        platforms,
        imageUrl: imageUrl.trim() || undefined,
        autoPublish,
        scheduleAt: scheduleAt || undefined,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setTopic(""); setPrompt(""); setImageUrl(""); setScheduleAt(""); setAutoPublish(false);
      setMsg("Draft generated below.");
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      setMsg(body.message || "Could not generate (check ANTHROPIC_API_KEY).");
    }
  };

  const editCopy = (id: string, platform: string, content: string) =>
    setPosts((prev) => prev.map((p) =>
      p._id === id ? { ...p, results: p.results.map((r) => (r.platform === platform ? { ...r, content } : r)) } : p));

  const saveCopy = async (post: Post) => {
    await send(`/api/social/${post._id}`, {
      method: "PUT",
      body: JSON.stringify({ results: post.results.map((r) => ({ platform: r.platform, content: r.content })) }),
    });
    setMsg("Saved.");
  };

  const act = async (id: string, action: "approve" | "publish") => {
    setBusy(true);
    const res = await send(`/api/social/${id}/${action}`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMsg(body.message || `Could not ${action}.`);
    }
    load();
  };

  const remove = async (id: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== id));
    await send(`/api/social/${id}`, { method: "DELETE" }).catch(() => {});
  };

  return (
    <DashboardShell type="admin">
      <SectionHeader
        icon="speakerphone"
        eyebrow="Social automation"
        title="Create & post"
        description="Let AI draft posts for LinkedIn, X, and Instagram. Auto-publish, schedule, or approve with one click."
      />

      {/* Compose */}
      <div className="mb-8 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic (e.g. We just shipped a new AI feature)" className={`${input} md:col-span-2`} />
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Extra direction for the AI (optional)" rows={2} className={`${input} md:col-span-2 resize-none`} />
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (required for Instagram)" className={`${input} md:col-span-2`} />

          {/* platforms */}
          <div className="md:col-span-2 flex flex-wrap gap-2">
            {ALL_PLATFORMS.map((p) => {
              const on = platforms.includes(p.id);
              return (
                <button key={p.id} onClick={() => togglePlatform(p.id)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${on ? "border-emerald-400/60 bg-emerald-500/15 text-[#0a1020]" : "border-emerald-200/15 text-emerald-50/55 hover:text-[#0a1020]"}`}>
                  <i className={`ti ti-${p.icon}`} aria-hidden /> {p.label}
                </button>
              );
            })}
          </div>

          {/* options */}
          <label className="flex items-center gap-3 text-sm text-emerald-50/75">
            <input type="checkbox" checked={autoPublish} onChange={(e) => setAutoPublish(e.target.checked)} className="h-4 w-4 accent-emerald-400" />
            Auto-publish (skip approval)
          </label>
          <div className="flex items-center gap-2 text-sm text-emerald-50/75">
            <span className="whitespace-nowrap">Schedule:</span>
            <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className={`${input} py-2`} />
          </div>

          <button onClick={generate} disabled={busy}
            className="md:col-span-2 rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-[#0a1020] transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50">
            <i className="ti ti-sparkles" aria-hidden /> {busy ? "Working…" : "Generate draft"}
          </button>
          {msg && <p className="md:col-span-2 text-sm text-emerald-200">{msg}</p>}
        </div>
        <p className="mt-3 text-xs text-emerald-50/40">AI generates copy via Claude. Posting requires the platform tokens in backend/.env.</p>
      </div>

      {/* Posts */}
      {loading ? (
        <p className="text-sm text-emerald-50/50">Loading…</p>
      ) : posts.length === 0 ? (
        <EmptyState icon="speakerphone" title="No posts yet" hint="Generate your first draft above." />
      ) : (
        <div className="space-y-5">
          {posts.map((post, i) => (
            <motion.div key={post._id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-5 backdrop-blur-sm">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-wider ${statusStyle[post.status]}`}>{post.status}</span>
                {post.autoPublish && <span className="rounded-full border border-emerald-200/20 px-3 py-1 text-[11px] text-emerald-200/70">auto</span>}
                {post.createdBy === "ai-autopilot" && <span className="rounded-full border border-emerald-200/20 px-3 py-1 text-[11px] text-emerald-200/70">autopilot</span>}
                <span className="flex-1 truncate text-sm font-light text-white">{post.topic || "(no topic)"}</span>
                {post.scheduleAt && <span className="text-[11px] text-emerald-50/45">{new Date(post.scheduleAt).toLocaleString()}</span>}
                <button onClick={() => remove(post._id)} aria-label="Delete" className="rounded-lg border border-emerald-200/15 p-2 text-emerald-50/40 transition hover:text-red-300"><i className="ti ti-trash" aria-hidden /></button>
              </div>

              {/* per-platform copy */}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {post.results.map((r) => {
                  const meta = ALL_PLATFORMS.find((p) => p.id === r.platform);
                  const editable = !["published", "publishing"].includes(post.status);
                  return (
                    <div key={r.platform} className="rounded-2xl border border-emerald-200/10 bg-emerald-950/40 p-3">
                      <div className="mb-2 flex items-center gap-2 text-xs text-emerald-100/70">
                        <i className={`ti ti-${meta?.icon || "world"}`} aria-hidden /> {meta?.label || r.platform}
                        {r.status === "published" && <span className="text-emerald-300">· posted</span>}
                        {r.status === "failed" && <span className="text-red-300" title={r.error}>· failed</span>}
                        {r.permalink && <a href={r.permalink} target="_blank" className="ml-auto text-emerald-300 hover:underline">view ↗</a>}
                      </div>
                      <textarea value={r.content} disabled={!editable} rows={4}
                        onChange={(e) => editCopy(post._id, r.platform, e.target.value)}
                        className={`w-full resize-none rounded-xl border border-emerald-200/10 bg-emerald-950/60 p-2 text-sm text-emerald-50/85 outline-none focus:border-emerald-400/50 disabled:opacity-60`} />
                      {r.status === "failed" && r.error && <p className="mt-1 text-[11px] text-red-300/80">{r.error}</p>}
                    </div>
                  );
                })}
              </div>

              {/* actions */}
              {!["published"].includes(post.status) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => saveCopy(post)} className="rounded-xl border border-emerald-200/15 px-4 py-2 text-sm text-emerald-50/75 transition hover:text-white"><i className="ti ti-device-floppy" aria-hidden /> Save edits</button>
                  {post.status === "draft" && (
                    <button onClick={() => act(post._id, "approve")} disabled={busy} className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-500/20 disabled:opacity-50"><i className="ti ti-check" aria-hidden /> Approve</button>
                  )}
                  <button onClick={() => act(post._id, "publish")} disabled={busy} className="rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-medium text-[#0a1020] transition hover:bg-emerald-400 disabled:opacity-50"><i className="ti ti-send" aria-hidden /> Publish now</button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
