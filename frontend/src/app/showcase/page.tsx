"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { verticals } from "./verticals";

export default function ShowcaseGallery() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#04140d] text-white">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-emerald-500/20 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-emerald-400/10 blur-[130px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <a href="https://syntrixlabs.in" className="text-sm font-medium tracking-wide text-emerald-100/80 transition hover:text-white">SYNTRIX LABS</a>
        <a href="https://syntrixlabs.in" target="_blank" className="rounded-full border border-emerald-200/20 px-4 py-2 text-xs text-emerald-100/70 transition hover:border-emerald-300/50">Work with us →</a>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-8 pt-10 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-block rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300">Portfolio · Live demos</span>
          <h1 className="mx-auto mt-5 max-w-3xl text-5xl font-light leading-[1.08] tracking-tight sm:text-6xl">
            One studio. Every kind of site your business needs.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg font-light text-emerald-50/55">
            Tap any industry to open a live demo — each one designed and built by Syntrix Labs.
          </p>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {verticals.map((v, i) => (
            <motion.div
              key={v.slug}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
            >
              <Link
                href={`/showcase/${v.slug}`}
                className="group block overflow-hidden rounded-3xl border border-white/10 transition hover:border-white/25"
                style={{ background: v.colors.base }}
              >
                <div className="relative h-40 overflow-hidden" style={{ background: `linear-gradient(135deg, ${v.colors.from}55, ${v.colors.to}55)` }}>
                  <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-90 transition group-hover:scale-110">{v.emoji}</div>
                </div>
                <div className="p-6">
                  <p className="text-xs font-medium" style={{ color: v.colors.from }}>{v.tagline}</p>
                  <h2 className="mt-1 text-2xl font-light tracking-wide">{v.name}</h2>
                  <p className="mt-2 text-sm font-light text-white/55">{v.sub}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white/80 transition group-hover:gap-2">
                    Open live demo →
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-emerald-50/30">
        Built by Syntrix Labs · syntrixlabs.in
      </footer>
    </main>
  );
}
