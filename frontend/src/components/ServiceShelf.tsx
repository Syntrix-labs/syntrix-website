"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionStyle,
} from "framer-motion";

type Product = {
  sku: string;
  spec: string;
  name: string;
  contains: string;
  glow: string; // tailwind/text color value for the accent
  ring: string; // border color
};

const products: Product[] = [
  {
    sku: "#01",
    spec: "NET · 1 SITE",
    name: "Custom Website",
    contains: "next.js · seo · cms · zero bloat",
    glow: "#22d3ee",
    ring: "rgba(34,211,238,0.45)",
  },
  {
    sku: "#02",
    spec: "2YR WARRANTY",
    name: "Client Dashboard",
    contains: "auth · tracking · uploads · live status",
    glow: "#34d399",
    ring: "rgba(52,211,153,0.45)",
  },
  {
    sku: "#03",
    spec: "HIGH POTENCY",
    name: "API & Backend",
    contains: "node · mongo · payments · webhooks",
    glow: "#a855f7",
    ring: "rgba(168,85,247,0.45)",
  },
  {
    sku: "#04",
    spec: "ORIGINAL",
    name: "Admin Panel",
    contains: "clients · meetings · billing · content",
    glow: "#fbbf24",
    ring: "rgba(251,191,36,0.45)",
  },
  {
    sku: "#05",
    spec: "AUTO REFILL",
    name: "Automation & Ops",
    contains: "reminders · stages · workflows · alerts",
    glow: "#60a5fa",
    ring: "rgba(96,165,250,0.45)",
  },
  {
    sku: "#06",
    spec: "GROWTH FORMULA",
    name: "Launch & Growth",
    contains: "deploy · perf · analytics · iteration",
    glow: "#f472b6",
    ring: "rgba(244,114,182,0.45)",
  },
];

function ProductCard({ p, index }: { p: Product; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 200, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 200, damping: 18 });
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(0);
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 20 });

  const rotateX = useTransform(rx, (v) => `${v}deg`);
  const rotateY = useTransform(ry, (v) => `${v}deg`);
  const glareBg = useTransform(
    [glareX, glareY],
    ([x, y]) =>
      `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.18), transparent 45%)`
  );

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 18);
    rx.set(-py * 18);
    glareX.set((px + 0.5) * 100);
    glareY.set((py + 0.5) * 100);
    glareOpacity.set(1);
  }

  function handleLeave() {
    rx.set(0);
    ry.set(0);
    glareOpacity.set(0);
  }

  const cardStyle: MotionStyle = {
    rotateX,
    rotateY,
    transformPerspective: 800,
    transformStyle: "preserve-3d",
    background: `linear-gradient(160deg, ${p.glow}22, #06080f 78%)`,
    border: `1px solid ${p.ring}`,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.5,
        }}
      >
        <motion.div
          ref={ref}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          whileHover={{ scale: 1.04 }}
          style={cardStyle}
          className="relative h-72 overflow-hidden rounded-2xl p-6"
        >
          {/* moving glare */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: glareBg, opacity: glareOpacity }}
          />

          <div style={{ transform: "translateZ(40px)" }} className="relative z-10">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-white/60">
              <span>{p.sku}</span>
              <span>{p.spec}</span>
            </div>

            <div
              className="mt-6 mb-5 text-3xl"
              style={{ color: p.glow, textShadow: `0 0 18px ${p.glow}` }}
              aria-hidden
            >
              {"■"}
            </div>

            <h3 className="text-2xl font-bold leading-tight text-white">
              {p.name}
            </h3>
          </div>

          <div className="absolute bottom-9 left-6 right-6 font-mono text-[9px] uppercase tracking-wide text-white/45">
            contains: {p.contains}
          </div>

          {/* barcode */}
          <div
            aria-hidden
            className="absolute bottom-5 left-6 right-6 h-3 rounded-sm opacity-50"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg,#fff 0 2px,transparent 2px 4px)",
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function ServiceShelf({
  scheduleHref = "/schedule",
}: {
  scheduleHref?: string;
}) {
  return (
    <section
      id="services"
      className="relative scroll-mt-24 overflow-hidden bg-black px-6 py-24"
    >
      {/* ambient neon backdrop */}
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-3 font-mono text-xs tracking-[0.25em] text-cyan-400">
              SYNTRIX LABS · AISLE 01
            </p>
            <h2 className="text-4xl font-bold leading-[1.05] md:text-6xl">
              Software,
              <br />
              packaged.
            </h2>
            <p className="mt-4 max-w-md text-gray-400">
              Pick your build. Add to cart. Launch. Every service is a product —
              specced, labelled, and ready to ship.
            </p>
          </div>
          <div className="text-right font-mono text-[10px] leading-relaxed tracking-wide text-gray-600">
            EST. 2026
            <br />
            DEPLOY RESPONSIBLY
            <br />
            NO RETURN POLICY
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <ProductCard key={p.sku} p={p} index={i} />
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="font-mono text-[10px] uppercase tracking-wide text-gray-600">
            Original satisfaction · Batch 2026 · Made with code
          </p>
          <a
            href={scheduleHref}
            className="rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:brightness-110"
          >
            Add to cart — Let&apos;s talk
          </a>
        </div>
      </div>
    </section>
  );
}
