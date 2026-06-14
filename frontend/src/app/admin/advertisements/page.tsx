"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type Ad = { _id: string; title: string; imageUrl: string; projectUrl: string };

const adInput =
  "rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60";

export default function AdvertisementsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [projectUrl, setProjectUrl] = useState("");

  useEffect(() => { apiGet<Ad[]>("/api/advertisements", []).then(setAds); }, []);

  const publish = async () => {
    await fetch(apiPath("/api/advertisements"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ title, imageUrl, projectUrl }),
    });
    setAds([...ads, { _id: String(Date.now()), title, imageUrl, projectUrl }]);
    setTitle("");
    setImageUrl("");
    setProjectUrl("");
  };

  return (
    <DashboardShell type="admin">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <SectionHeader
          icon="photo" eyebrow="Advertisement"
          title="Landing page portfolio uploads"
          description="Upload project image URLs and links so the landing page portfolio can update without code."
        />
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm md:grid-cols-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" className={adInput} />
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className={adInput} />
          <input value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)} placeholder="Project URL" className={adInput} />
          <button onClick={publish} className="rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98]">Publish</button>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {ads.map((a, i) => (
            <motion.a
              key={a._id}
              href={a.projectUrl}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -6 }}
              className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-5 backdrop-blur-sm transition hover:border-emerald-300/40"
            >
              <div className="mb-4 aspect-video overflow-hidden rounded-2xl border border-emerald-200/10 bg-emerald-950/50">
                {a.imageUrl && <img src={a.imageUrl} alt={a.title} className="h-full w-full object-cover" />}
              </div>
              <h2 className="text-xl font-light">{a.title}</h2>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
