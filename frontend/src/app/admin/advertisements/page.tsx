"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/dashboard/States";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type Ad = { _id: string; title: string; imageUrl: string; projectUrl: string; appUrl?: string };

const adInput =
  "rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-50/85 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60";

/** Auto screenshot of a live URL (WordPress mShots — free, no key). */
const shotOf = (url: string) => `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1200&h=800`;

export default function AdvertisementsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [title, setTitle] = useState("");
  const [website, setWebsite] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [confirmDel, setConfirmDel] = useState("");

  useEffect(() => { apiGet<Ad[]>("/api/advertisements", []).then(setAds); }, []);

  const publish = async () => {
    const primary = website.trim() || appUrl.trim();
    if (!title.trim() || !primary) {
      setMsg("Add a title and at least one link (website or app).");
      return;
    }
    setMsg("");
    const imageUrl = shotOf(primary);
    const body = { title: title.trim(), imageUrl, projectUrl: website.trim() || appUrl.trim(), appUrl: appUrl.trim() || undefined };
    // instant
    setAds((prev) => [...prev, { _id: `temp-${Date.now()}`, ...body }]);
    setTitle("");
    setWebsite("");
    setAppUrl("");
    const res = await fetch(apiPath("/api/advertisements"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    });
    if (res.ok) apiGet<Ad[]>("/api/advertisements", []).then(setAds);
  };

  const removeAd = async (id: string) => {
    setAds((prev) => prev.filter((a) => a._id !== id));
    setConfirmDel("");
    // best-effort; if a delete endpoint isn't present this just updates the UI
    await fetch(apiPath(`/api/advertisements/${id}`), { method: "DELETE", headers: authHeaders() }).catch(() => {});
  };

  return (
    <DashboardShell type="admin">
      <SectionHeader
        icon="photo"
        eyebrow="Our work"
        title="Portfolio & showcase"
        description="Paste a client's website or app link. We auto-capture a screenshot and feature it in the 'Our work' section of the landing page."
      />

      <div className="mb-6 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title (e.g. Acme Marketing Site)" className={`${adInput} md:col-span-2`} />
          <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website link (https://…)" className={adInput} />
          <input value={appUrl} onChange={(e) => setAppUrl(e.target.value)} placeholder="App link (optional)" className={adInput} />
          <button onClick={publish} className="rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98] md:col-span-2">
            <i className="ti ti-camera" aria-hidden /> Capture &amp; publish
          </button>
          {msg && <p className="text-sm text-emerald-200 md:col-span-2">{msg}</p>}
        </div>
        <p className="mt-3 text-xs text-emerald-50/40">Screenshots are generated automatically from the live link — they may take a few seconds to appear the first time.</p>
      </div>

      {ads.length === 0 && (
        <EmptyState icon="photo" title="No showcase items yet" hint="Paste a client link above to feature your work." />
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {ads.map((a, i) => (
          <motion.div
            key={a._id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="group overflow-hidden rounded-3xl border border-emerald-200/12 bg-emerald-950/25 backdrop-blur-sm transition hover:border-emerald-300/40"
          >
            <div className="aspect-video overflow-hidden border-b border-emerald-200/10 bg-emerald-950/50">
              {a.imageUrl && <img src={a.imageUrl} alt={a.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
            </div>
            <div className="flex items-center gap-2 p-4">
              <h2 className="flex-1 truncate text-lg font-light">{a.title}</h2>
              {a.projectUrl && <a href={a.projectUrl} target="_blank" aria-label="Open site" className="rounded-lg border border-emerald-200/15 p-2 text-emerald-50/70 transition hover:text-white"><i className="ti ti-world" aria-hidden /></a>}
              {a.appUrl && <a href={a.appUrl} target="_blank" aria-label="Open app" className="rounded-lg border border-emerald-200/15 p-2 text-emerald-50/70 transition hover:text-white"><i className="ti ti-device-mobile" aria-hidden /></a>}
              {confirmDel === a._id ? (
                <button onClick={() => removeAd(a._id)} className="rounded-lg border border-red-400/50 bg-red-500/10 px-2 py-1 text-[11px] text-red-200">Sure?</button>
              ) : (
                <button onClick={() => setConfirmDel(a._id)} aria-label="Remove" className="rounded-lg border border-emerald-200/15 p-2 text-emerald-50/40 transition hover:text-red-300"><i className="ti ti-trash" aria-hidden /></button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardShell>
  );
}
