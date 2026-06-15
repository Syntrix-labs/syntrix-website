"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiGet } from "@/lib/api";

type Ad = { _id: string; title: string; imageUrl: string; projectUrl: string; appUrl?: string };

const reveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
};

const directions: [string, string][] = [
  ["Startup Website", "Landing page"],
  ["Client Dashboard", "Business portal"],
  ["Admin Panel", "Operations control"],
  ["Booking System", "Meeting workflow"],
  ["Mobile App UI", "Product design"],
  ["Payment Flow", "Client billing"],
];

export default function OurWork({ scheduleHref = "/schedule" }: { scheduleHref?: string }) {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    apiGet<Ad[]>("/api/advertisements", []).then(setAds);
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <motion.div {...reveal} className="mb-14 text-center">
        <p className="mb-4 font-mono text-xs tracking-[0.4em]" style={{ color: "#a9ba9d" }}>OUR WORK</p>
        <h2 className="text-3xl font-light tracking-wide md:text-5xl">
          {ads.length ? "Real products we've shipped" : "Work directions we ship for clients"}
        </h2>
      </motion.div>

      {ads.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map((a, i) => (
            <motion.div
              key={a._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
              whileHover={{ y: -6 }}
              className="group overflow-hidden rounded-2xl border border-emerald-200/15 bg-emerald-950/20 backdrop-blur-sm transition hover:border-emerald-300/40"
            >
              <a href={a.projectUrl || a.appUrl || "#"} target="_blank" className="block">
                <div className="aspect-video overflow-hidden border-b border-emerald-200/10 bg-emerald-950/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.imageUrl} alt={a.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
              </a>
              <div className="flex items-center gap-2 p-5">
                <h3 className="flex-1 truncate text-lg font-light">{a.title}</h3>
                {a.projectUrl && (
                  <a href={a.projectUrl} target="_blank" className="rounded-lg border border-emerald-200/20 px-3 py-1.5 text-xs text-emerald-100/80 transition hover:border-emerald-300/50">Site</a>
                )}
                {a.appUrl && (
                  <a href={a.appUrl} target="_blank" className="rounded-lg border border-emerald-200/20 px-3 py-1.5 text-xs text-emerald-100/80 transition hover:border-emerald-300/50">App</a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {directions.map(([title, type], i) => (
            <motion.a
              key={title}
              href={scheduleHref}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
              whileHover={{ y: -6 }}
              className="group rounded-2xl border border-emerald-200/15 bg-emerald-950/20 p-7 backdrop-blur-sm transition hover:border-emerald-300/40 hover:bg-emerald-900/20"
            >
              <p className="text-sm tracking-wide" style={{ color: "#a9ba9d" }}>{type}</p>
              <h3 className="mt-3 text-2xl font-light">{title}</h3>
              <p className="mt-6 text-sm font-light text-emerald-100/50 transition group-hover:text-emerald-100/80">Start a project →</p>
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
}
