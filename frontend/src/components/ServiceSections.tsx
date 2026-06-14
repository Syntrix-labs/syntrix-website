"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  type Variants,
} from "framer-motion";
import type { ReactNode } from "react";

/**
 * The Services section of the landing page. Each service is a full-height,
 * two-column "proof" block: convincing copy + concrete deliverables on one
 * side, and a premium UI mock of the actual thing on the other. The mocks
 * animate as they scroll into view (bars grow, API rows type in, the growth
 * line draws itself, the pipeline cascades) and tilt toward the cursor on
 * hover. Pure CSS/SVG mocks — no images, no heavy deps.
 */

const ease = [0.16, 1, 0.3, 1] as const;

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-90px" },
  transition: { duration: 0.8, ease },
};

const accent = "#a9ba9d";

// shared stagger helpers
const stagger = (gap = 0.1, delay = 0.1): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});
const itemUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};
const itemLeft: Variants = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease } },
};

type Point = { title: string; text: string };
type Service = {
  num: string;
  title: string;
  text: string;
  badge: string;
  points: Point[];
  tags: string[];
  visual: ReactNode;
};

/* ---------------- premium UI mocks ---------------- */

/** Glass card that tilts toward the cursor (subtle, premium). */
function GlassFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 7);
    rx.set(-py * 7);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      className="relative w-full overflow-hidden rounded-3xl border border-emerald-200/12 bg-emerald-950/30 p-5 backdrop-blur-md"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

function WindowChrome({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-200/30" />
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-200/30" />
      <span className="ml-3 flex-1 truncate rounded-md bg-emerald-950/60 px-3 py-1 font-mono text-[10px] text-emerald-100/50">
        {label}
      </span>
    </div>
  );
}

function WebsiteMock() {
  return (
    <GlassFrame>
      <WindowChrome label="https://yourbrand.com" />
      <motion.div
        variants={stagger(0.12)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="rounded-xl border border-emerald-200/10 bg-emerald-950/40 p-5"
      >
        <motion.div variants={itemUp} className="mx-auto h-2.5 w-1/3 rounded-full bg-emerald-300/60" />
        <motion.div variants={itemUp} className="mx-auto mt-3 h-4 w-2/3 rounded-full bg-emerald-100/80" />
        <motion.div variants={itemUp} className="mx-auto mt-2 h-4 w-1/2 rounded-full bg-emerald-100/40" />
        <motion.div variants={itemUp} className="mx-auto mt-5 flex justify-center gap-2">
          <div className="h-7 w-24 rounded-full bg-emerald-400/80" />
          <div className="h-7 w-20 rounded-full border border-emerald-200/30" />
        </motion.div>
        <motion.div variants={stagger(0.08, 0.1)} className="mt-6 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} variants={itemUp} className="h-16 rounded-lg border border-emerald-200/10 bg-emerald-900/30" />
          ))}
        </motion.div>
      </motion.div>
      <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-emerald-100/50">
        <span>Lighthouse 98</span>
        <span>SEO ready</span>
        <span>0.9s load</span>
      </div>
    </GlassFrame>
  );
}

function DashboardMock() {
  const bars = [40, 62, 50, 78, 66, 90, 72];
  return (
    <GlassFrame>
      <WindowChrome label="app.yourbrand.com/dashboard" />
      <div className="flex gap-3">
        <div className="hidden w-20 shrink-0 flex-col gap-2 sm:flex">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-6 rounded-md ${i === 0 ? "bg-emerald-400/30" : "bg-emerald-900/40"}`}
            />
          ))}
        </div>
        <div className="flex-1">
          <motion.div
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-3 gap-2"
          >
            {[
              ["Revenue", "+38%"],
              ["Clients", "+24%"],
              ["Active", "+12%"],
            ].map(([l, v]) => (
              <motion.div key={l} variants={itemUp} className="rounded-lg border border-emerald-200/10 bg-emerald-900/30 p-2">
                <p className="font-mono text-[8px] uppercase tracking-wide text-emerald-100/50">{l}</p>
                <p className="mt-1 text-sm font-light text-white">{v}</p>
              </motion.div>
            ))}
          </motion.div>
          <div className="mt-3 flex h-28 items-end gap-1.5 rounded-lg border border-emerald-200/10 bg-emerald-950/40 p-3">
            {bars.map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: "0%" }}
                whileInView={{ height: `${h}%` }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: 0.1 + i * 0.08, ease }}
                className="flex-1 rounded-t bg-gradient-to-t from-emerald-500/40 to-emerald-300/90"
              />
            ))}
          </div>
        </div>
      </div>
    </GlassFrame>
  );
}

function PhoneMock() {
  return (
    <GlassFrame>
      <div className="mx-auto w-44 rounded-[2rem] border border-emerald-200/20 bg-emerald-950/50 p-3 shadow-xl shadow-emerald-500/10">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-emerald-200/30" />
        <div className="rounded-2xl border border-emerald-200/10 bg-emerald-900/30 p-3">
          <div className="h-3 w-2/3 rounded-full bg-emerald-100/80" />
          <div className="mt-1.5 h-2 w-1/2 rounded-full bg-emerald-100/35" />
          <motion.div
            variants={stagger(0.14, 0.2)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-4 space-y-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div key={i} variants={itemLeft} className="flex items-center gap-2 rounded-lg border border-emerald-200/10 bg-emerald-950/40 p-2">
                <div className="h-7 w-7 rounded-full bg-emerald-400/40" />
                <div className="flex-1">
                  <div className="h-2 w-3/4 rounded-full bg-emerald-100/60" />
                  <div className="mt-1 h-2 w-1/2 rounded-full bg-emerald-100/25" />
                </div>
              </motion.div>
            ))}
          </motion.div>
          <div className="mt-4 flex justify-between rounded-full bg-emerald-950/60 px-4 py-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-emerald-300" : "bg-emerald-200/25"}`} />
            ))}
          </div>
        </div>
      </div>
    </GlassFrame>
  );
}

function ApiMock() {
  const rows: [string, string, string][] = [
    ["POST", "/api/auth/login", "200"],
    ["GET", "/api/projects", "200"],
    ["POST", "/api/payments/order", "201"],
    ["POST", "/api/uploads", "200"],
    ["GET", "/api/meetings", "200"],
  ];
  const color = (m: string) =>
    m === "GET" ? "text-emerald-300" : m === "POST" ? "text-lime-300" : "text-emerald-200";
  return (
    <GlassFrame>
      <WindowChrome label="api.yourbrand.com" />
      <div className="rounded-xl border border-emerald-200/10 bg-emerald-950/60 p-4 font-mono text-[11px]">
        <motion.div
          variants={stagger(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {rows.map(([m, path, code]) => (
            <motion.div key={path} variants={itemLeft} className="flex items-center gap-3 py-1.5">
              <span className={`w-12 shrink-0 font-semibold ${color(m)}`}>{m}</span>
              <span className="flex-1 truncate text-emerald-100/70">{path}</span>
              <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-emerald-300">{code}</span>
            </motion.div>
          ))}
        </motion.div>
        <div className="mt-2 flex items-center gap-2 border-t border-emerald-200/10 pt-2 text-emerald-100/40">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          rate-limited · JWT · validated
        </div>
      </div>
    </GlassFrame>
  );
}

function FlowMock() {
  const steps = ["Request received", "Stage updated", "Client notified", "Reminder scheduled", "Marked complete"];
  return (
    <GlassFrame>
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-100/50">automated pipeline</p>
      <motion.div
        variants={stagger(0.13)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="relative pl-6"
      >
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease, delay: 0.1 }}
          style={{ originY: 0 }}
          className="absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-emerald-300/60 to-emerald-500/10"
        />
        {steps.map((s, i) => (
          <motion.div key={s} variants={itemLeft} className="relative mb-3 last:mb-0">
            <span className="absolute -left-6 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-emerald-300/60 bg-emerald-950">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            </span>
            <div className="rounded-lg border border-emerald-200/10 bg-emerald-900/30 px-3 py-2 text-sm font-light text-emerald-50/80">
              {s}
              {i < steps.length - 1 && <span className="ml-2 font-mono text-[10px] text-emerald-300/70">auto →</span>}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </GlassFrame>
  );
}

function GrowthMock() {
  return (
    <GlassFrame>
      <motion.div
        variants={stagger(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="grid grid-cols-3 gap-2"
      >
        {[
          ["99.9%", "Uptime"],
          ["98", "Lighthouse"],
          ["0.8s", "Load time"],
        ].map(([v, l]) => (
          <motion.div key={l} variants={itemUp} className="rounded-lg border border-emerald-200/10 bg-emerald-900/30 p-3 text-center">
            <p className="text-lg font-extralight text-white">{v}</p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-wide text-emerald-100/50">{l}</p>
          </motion.div>
        ))}
      </motion.div>
      <div className="mt-3 rounded-xl border border-emerald-200/10 bg-emerald-950/40 p-3">
        <svg viewBox="0 0 300 110" className="h-28 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(110,231,183,0.45)" />
              <stop offset="100%" stopColor="rgba(110,231,183,0)" />
            </linearGradient>
          </defs>
          <motion.path
            d="M0,95 L40,82 L80,86 L120,60 L160,64 L200,38 L240,30 L300,8 L300,110 L0,110 Z"
            fill="url(#growthFill)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          <motion.path
            d="M0,95 L40,82 L80,86 L120,60 L160,64 L200,38 L240,30 L300,8"
            fill="none"
            stroke="rgba(167,243,208,0.9)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
        <p className="mt-1 text-center font-mono text-[10px] text-emerald-100/50">traffic &amp; conversions, post-launch</p>
      </div>
    </GlassFrame>
  );
}

/* ---------------- data ---------------- */

const services: Service[] = [
  {
    num: "01",
    title: "Custom Websites",
    text: "Fast, premium business websites for startups, agencies, creators, and service brands — designed around your funnel, never a template.",
    badge: "Ships in 1–2 weeks",
    points: [
      { title: "Conversion-first design", text: "Built around your offer and your audience, not a generic theme." },
      { title: "SEO & performance baked in", text: "Lighthouse 95+, fast on every device, indexable from day one." },
      { title: "Edit it yourself", text: "Optional CMS so updating content never needs a developer." },
    ],
    tags: ["Next.js", "SEO", "CMS", "Responsive"],
    visual: <WebsiteMock />,
  },
  {
    num: "02",
    title: "Web Applications",
    text: "Client portals, dashboards, booking flows, admin panels, and internal platforms — the same tools serious product teams ship.",
    badge: "Built to scale",
    points: [
      { title: "Portals & dashboards", text: "Live data, roles, and access control your clients can actually use." },
      { title: "Secure auth", text: "JWT sessions, password reset, and admin gating out of the box." },
      { title: "Payments & billing", text: "Razorpay / Stripe flows wired end-to-end into your platform." },
    ],
    tags: ["Dashboards", "Auth", "Realtime", "SaaS"],
    visual: <DashboardMock />,
  },
  {
    num: "03",
    title: "Mobile Experiences",
    text: "Modern app interfaces, product flows, authentication, and API-ready foundations that feel native on every screen.",
    badge: "Pixel-perfect",
    points: [
      { title: "App-grade UI flows", text: "Onboarding, auth, and product journeys designed to convert." },
      { title: "Responsive & PWA-ready", text: "Installable, offline-aware, and smooth on any device." },
      { title: "API-ready foundation", text: "Plugs straight into your backend from day one." },
    ],
    tags: ["App UI", "Flows", "API-ready"],
    visual: <PhoneMock />,
  },
  {
    num: "04",
    title: "Backend & APIs",
    text: "Secure logic for users, projects, uploads, meetings, payments, and admin operations — production-grade from the first commit.",
    badge: "Production-ready",
    points: [
      { title: "Secure REST APIs", text: "Validated, rate-limited, and hardened against the common attacks." },
      { title: "Data modeled right", text: "MongoDB schemas that won't fight you as you grow." },
      { title: "Integrations & webhooks", text: "Payments, email, Google Drive, and third-party services." },
    ],
    tags: ["Node", "MongoDB", "Payments", "Webhooks"],
    visual: <ApiMock />,
  },
  {
    num: "05",
    title: "Automation & Ops",
    text: "Tracking stages, reminders, client updates, document workflows, and dashboards — so the busywork runs itself.",
    badge: "Less busywork",
    points: [
      { title: "Live project tracking", text: "Every stage visible to your client in real time." },
      { title: "Automated reminders", text: "Meetings, payments, and follow-ups handled without you." },
      { title: "Document workflows", text: "Uploads, approvals, and notifications wired together." },
    ],
    tags: ["Workflows", "Reminders", "Tracking"],
    visual: <FlowMock />,
  },
  {
    num: "06",
    title: "Launch & Growth",
    text: "Deployment, performance tuning, portfolio presentation, and ongoing iteration — we don't disappear after launch.",
    badge: "We don't disappear",
    points: [
      { title: "One-click deploys", text: "Vercel + Render, CI-ready, with zero-downtime releases." },
      { title: "Performance tuned", text: "Fast loads and high Lighthouse scores that stay high." },
      { title: "Measure & iterate", text: "Analytics and ongoing improvements as you scale." },
    ],
    tags: ["Deploy", "Performance", "Analytics"],
    visual: <GrowthMock />,
  },
];

export default function ServiceSections({ scheduleHref = "/schedule" }: { scheduleHref?: string }) {
  return (
    <section id="services">
      {services.map((s, idx) => {
        const flip = idx % 2 === 1;
        return (
          <div key={s.num} className="flex min-h-screen items-center px-6 py-20">
            <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
              {/* copy */}
              <motion.div {...reveal} className={flip ? "lg:order-2" : ""}>
                <div className="mb-5 inline-flex items-center gap-3">
                  <span className="font-mono text-xs tracking-[0.5em]" style={{ color: accent }}>{s.num}</span>
                  <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium tracking-wide text-emerald-200">
                    {s.badge}
                  </span>
                </div>
                <h2 className="text-4xl font-light leading-tight tracking-wide md:text-5xl" style={{ textShadow: "0 0 30px rgba(40,80,55,0.6)" }}>
                  {s.title}
                </h2>
                <p className="mt-5 max-w-md text-base font-light leading-relaxed text-emerald-50/70 md:text-lg">{s.text}</p>

                <motion.ul
                  variants={stagger(0.1, 0.15)}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-90px" }}
                  className="mt-8 space-y-4"
                >
                  {s.points.map((p) => (
                    <motion.li key={p.title} variants={itemUp} className="flex gap-3">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-400/10 text-[11px] text-emerald-200">
                        ✓
                      </span>
                      <div>
                        <p className="font-light text-white">{p.title}</p>
                        <p className="text-sm font-light leading-relaxed text-emerald-50/55">{p.text}</p>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>

                <div className="mt-8 flex flex-wrap gap-2">
                  {s.tags.map((t) => (
                    <span key={t} className="rounded-full border border-emerald-200/20 px-4 py-1.5 text-xs tracking-wide text-emerald-100/80 backdrop-blur-sm">
                      {t}
                    </span>
                  ))}
                </div>

                <a href={scheduleHref} className="mt-8 inline-block text-sm font-light text-emerald-200 transition hover:text-emerald-100">
                  Start a {s.title.toLowerCase()} project →
                </a>
              </motion.div>

              {/* visual */}
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-90px" }}
                transition={{ duration: 0.9, ease }}
                className={flip ? "lg:order-1" : ""}
                style={{ transformStyle: "preserve-3d" }}
              >
                {s.visual}
              </motion.div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
