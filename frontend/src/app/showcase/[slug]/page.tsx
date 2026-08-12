"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { getVertical, type Vertical } from "../verticals";

function MockUI({ v }: { v: Vertical }) {
  const c = v.colors;
  const chip = (label: string, active = false) => (
    <span
      key={label}
      className="rounded-lg px-3 py-1.5 text-xs font-medium"
      style={{
        background: active ? `linear-gradient(135deg, ${c.from}, ${c.to})` : "rgba(255,255,255,0.06)",
        color: active ? "#0a0a0a" : "rgba(255,255,255,0.7)",
      }}
    >
      {label}
    </span>
  );
  const cta = (label: string) => (
    <button className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-black" style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>
      {label}
    </button>
  );

  const body: Record<string, React.ReactNode> = {
    "real-estate": (
      <>
        <div className="h-32 w-full rounded-xl" style={{ background: `linear-gradient(135deg, ${c.from}33, ${c.to}55)` }} />
        <div className="mt-3 flex items-baseline justify-between">
          <p className="text-lg font-semibold text-white">₹1.85 Cr</p>
          <span className="text-xs text-white/50">For sale</span>
        </div>
        <p className="text-sm text-white/70">3 BHK Sky Villa · Newtown</p>
        <div className="mt-3 flex gap-2 text-xs text-white/60">
          <span>🛏 3 Beds</span><span>🛁 3 Bath</span><span>📐 1,850 sqft</span>
        </div>
        {cta("Book a visit")}
      </>
    ),
    restaurant: (
      <>
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 rounded-xl" style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }} />
          <div className="flex-1">
            <p className="font-semibold text-white">Truffle Wood-fire Pizza</p>
            <p className="text-xs text-white/50">Chef&apos;s special · 🌶 medium</p>
          </div>
          <p className="font-semibold text-white">₹499</p>
        </div>
        <div className="mt-3 flex gap-2">{["Regular", "Large", "Party"].map((s, i) => chip(s, i === 1))}</div>
        {cta("Add to order · ₹499")}
      </>
    ),
    ecommerce: (
      <>
        <div className="h-28 w-full rounded-xl" style={{ background: `linear-gradient(135deg, ${c.from}44, ${c.to}66)` }} />
        <p className="mt-3 font-semibold text-white">Aurora Hoodie</p>
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/60">Limited drop</p>
          <p className="font-semibold text-white">₹2,199</p>
        </div>
        <div className="mt-3 flex gap-2">{["S", "M", "L", "XL"].map((s, i) => chip(s, i === 1))}</div>
        {cta("Add to cart")}
      </>
    ),
    clinic: (
      <>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full text-lg" style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>👩‍⚕️</div>
          <div>
            <p className="font-semibold text-white">Dr. Meera Rao</p>
            <p className="text-xs text-white/50">Cardiologist · 4.9★</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-white/50">Today · pick a slot</p>
        <div className="mt-2 flex gap-2">{["10:30", "11:15", "12:00"].map((s, i) => chip(s, i === 0))}</div>
        {cta("Confirm appointment")}
      </>
    ),
    gym: (
      <>
        {[
          ["HIIT Burn", "6:00 AM", true],
          ["Power Yoga", "8:00 AM", false],
          ["Strength 101", "6:30 PM", false],
        ].map(([name, time, active]) => (
          <div key={name as string} className="mb-2 flex items-center justify-between rounded-xl px-3 py-2" style={{ background: (active as boolean) ? `linear-gradient(135deg, ${c.from}22, ${c.to}22)` : "rgba(255,255,255,0.05)" }}>
            <div>
              <p className="text-sm font-semibold text-white">{name as string}</p>
              <p className="text-xs text-white/50">{time as string}</p>
            </div>
            {chip("Book", active as boolean)}
          </div>
        ))}
      </>
    ),
    edtech: (
      <>
        <p className="font-semibold text-white">Full-Stack Web Dev</p>
        <p className="text-xs text-white/50">Module 4 of 8 · 12h left</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full" style={{ width: "52%", background: `linear-gradient(90deg, ${c.from}, ${c.to})` }} />
        </div>
        <div className="mt-3 flex gap-2">{["Videos", "Quiz", "Project"].map((s, i) => chip(s, i === 0))}</div>
        {cta("Continue learning")}
      </>
    ),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="w-full max-w-sm rounded-3xl border border-white/10 p-5 backdrop-blur-xl"
      style={{ background: "rgba(255,255,255,0.04)", boxShadow: `0 30px 80px -20px ${c.glow}55` }}
    >
      {body[v.slug]}
    </motion.div>
  );
}

export default function VerticalShowcase() {
  const params = useParams();
  const slug = String(params?.slug || "");
  const v = getVertical(slug);

  if (!v) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-white">
        <p className="text-white/60">Showcase not found.</p>
        <Link href="/showcase" className="rounded-xl border border-white/20 px-5 py-2.5">← Back to showcases</Link>
      </main>
    );
  }

  const c = v.colors;

  return (
    <main className="relative min-h-screen overflow-hidden text-white" style={{ background: c.base }}>
      {/* ambient glows */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full blur-[120px]" style={{ background: `${c.from}30` }} />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full blur-[120px]" style={{ background: `${c.to}30` }} />

      {/* top bar */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/showcase" className="text-sm text-white/60 transition hover:text-white">← All showcases</Link>
        <span className="flex items-center gap-2 text-sm">
          <span>{v.emoji}</span>
          <span className="font-medium">{v.name}</span>
        </span>
        <span className="hidden rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/60 sm:inline">Built by Syntrix Labs</span>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-2 lg:py-20">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-block rounded-full px-4 py-1.5 text-xs font-medium" style={{ background: `linear-gradient(135deg, ${c.from}22, ${c.to}22)`, color: c.from }}>
            {v.tagline}
          </span>
          <h1 className="mt-5 text-5xl font-light leading-[1.05] tracking-tight sm:text-6xl">{v.headline}</h1>
          <p className="mt-5 max-w-md text-lg font-light text-white/60">{v.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-2xl px-6 py-3 font-semibold text-black transition active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>{v.ctaLabel}</button>
            <a href="https://syntrixlabs.in" target="_blank" className="rounded-2xl border border-white/15 px-6 py-3 font-medium text-white/80 transition hover:border-white/40">Get this site</a>
          </div>
        </motion.div>
        <div className="flex justify-center lg:justify-end" style={{ perspective: 1000 }}>
          <MockUI v={v} />
        </div>
      </section>

      {/* features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-5 md:grid-cols-3">
          {v.features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-3xl border border-white/10 p-6 backdrop-blur-sm"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: `linear-gradient(135deg, ${c.from}22, ${c.to}22)` }}>{f.icon}</div>
              <h3 className="text-xl font-light">{f.title}</h3>
              <p className="mt-2 text-sm font-light text-white/55">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* stats */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 rounded-3xl border border-white/10 p-8 sm:grid-cols-3" style={{ background: `linear-gradient(135deg, ${c.from}0d, ${c.to}0d)` }}>
          {v.stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-light" style={{ color: c.from }}>{s.value}</p>
              <p className="mt-1 text-sm text-white/50">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16 text-center">
        <h2 className="text-3xl font-light sm:text-4xl">Want a {v.name.toLowerCase()} site like this?</h2>
        <p className="mx-auto mt-3 max-w-md font-light text-white/55">Syntrix Labs designs and ships it — fast, premium, and yours.</p>
        <a href="https://syntrixlabs.in" target="_blank" className="mt-7 inline-block rounded-2xl px-8 py-3.5 font-semibold text-black transition active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>
          Build with Syntrix →
        </a>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-white/30">
        A Syntrix Labs showcase · syntrixlabs.in
      </footer>
    </main>
  );
}
