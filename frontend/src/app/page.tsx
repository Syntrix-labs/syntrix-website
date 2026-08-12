"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/navbar/Navbar";
import ImmersiveScene from "@/components/ImmersiveScene";
import ParticleFigure from "@/components/ParticleFigure";
import ServiceSections from "@/components/ServiceSections";
import OurWork from "@/components/OurWork";
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useInView,
} from "framer-motion";

const scheduleHref = "/schedule";

const stats: [number, string, string][] = [
  [100, "%", "Custom-built — never templates"],
  [24, "/7", "Client support & updates"],
  [10, "+", "Project types we ship"],
  [2, "", "Founders, fully hands-on"],
];

const reasons: [string, string][] = [
  ["Direct with the builders", "You talk to Soham and Tahir — the people writing the code. No account managers, no telephone game."],
  ["A modern, scalable stack", "Next.js, Node, and MongoDB — the same tools used by serious product teams, built to grow with you."],
  ["End-to-end ownership", "Design, build, launch, and iterate. One team accountable from the first call to post-launch growth."],
  ["Live project tracking", "Your own client dashboard shows project stages, meetings, documents, and payments in real time."],
];

const steps: [string, string, string][] = [
  ["01", "Discovery call", "We map your goal, scope, timeline, and platform needs — before you commit to anything."],
  ["02", "Scope & design", "A clear plan and the look & feel, so you know exactly what you're getting."],
  ["03", "Build & track", "We build in the open. You follow every stage live from your client dashboard."],
  ["04", "Launch & grow", "Clean handoff, deployment, and ongoing iteration as your business scales."],
];

const tech = ["Next.js", "React", "TypeScript", "Node.js", "Express", "MongoDB", "Razorpay", "Tailwind", "Vercel", "Render"];

const faqs: [string, string][] = [
  ["How long does a project take?", "Most marketing sites ship in 1–2 weeks; full web apps with dashboards and payments typically take 3–6 weeks depending on scope. We give you a firm timeline after the discovery call."],
  ["How much does it cost?", "It depends on scope — a landing site and a full platform are very different. We quote a fixed scope and price up front, so there are no surprises."],
  ["Can I track progress?", "Yes. Every client gets a dashboard showing project stages, meetings, uploaded documents, and payments — updated live as we build."],
  ["What happens after launch?", "We hand off cleanly and offer ongoing support, performance tuning, and iteration. You're never left stranded."],
  ["Do you handle payments and booking?", "Yes — we build secure booking flows and online payments (including Razorpay) directly into your platform."],
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);
  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-emerald-200/10">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-6 py-6 text-left"
      >
        <span className="text-lg font-light text-white md:text-xl">{q}</span>
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-200/30 text-emerald-100 transition-transform duration-300"
          style={{ transform: open ? "rotate(45deg)" : "none" }}
        >
          +
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-6 font-light leading-relaxed text-emerald-50/70">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-90px" },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
};

export default function Home() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  return (
    <>
      <Navbar />
      <ImmersiveScene scrollDraw />

      {/* scroll progress bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed left-0 right-0 top-0 z-[55] h-[2px] origin-left bg-gradient-to-r from-emerald-400 via-emerald-300 to-lime-200"
      />

      <main className="relative z-10 text-white">
        {/* Hero */}
        <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.3, ease: "easeOut" }}
            className="relative flex flex-col items-center"
          >
            <div className="absolute top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-emerald-300/20 blur-3xl md:h-[28rem] md:w-[28rem]" />
            <div
              className="absolute top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border border-emerald-200/15 md:h-72 md:w-72"
              style={{ animation: "slowspin 26s linear infinite" }}
            />
            <h1
              className="relative text-6xl font-extralight tracking-[0.28em] text-white md:text-8xl"
              style={{ textShadow: "0 0 50px rgba(120,210,160,0.55)" }}
            >
              SYNTRIX
            </h1>
            <p className="relative mt-4 font-mono text-[11px] tracking-[0.6em] md:text-xs" style={{ color: "#a9ba9d" }}>
              LABS · DIGITAL STUDIO
            </p>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-10 max-w-2xl text-2xl font-light leading-[1.15] tracking-wide text-emerald-50/90 md:text-4xl"
            style={{ textShadow: "0 0 30px rgba(40,80,55,0.6)" }}
          >
            Custom websites, apps &amp; platforms for serious startups
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="mt-6 max-w-xl text-base font-light leading-relaxed text-emerald-50/60 md:text-lg"
          >
            We turn ideas into polished digital products — websites, dashboards, APIs, booking and payment flows.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <a href={scheduleHref} className="rounded-full bg-emerald-500/90 px-8 py-3.5 text-sm font-medium tracking-wide text-white shadow-lg shadow-emerald-500/30 backdrop-blur transition hover:bg-emerald-400">
              Start your journey
            </a>
            <a href="#work" className="rounded-full border border-emerald-200/25 px-8 py-3.5 text-sm font-medium tracking-wide text-emerald-50 transition hover:border-emerald-200/60">
              View work
            </a>
          </motion.div>
          <p className="mt-16 font-mono text-[11px] tracking-[0.3em] text-emerald-100/40">SCROLL TO EXPLORE ↓</p>
        </section>

        {/* Figure */}
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
          <ParticleFigure />
          <motion.div {...reveal} className="pointer-events-none absolute bottom-20 left-0 right-0 px-6 text-center">
            <p className="mb-4 font-mono text-xs tracking-[0.5em]" style={{ color: "#a9ba9d" }}>OUR APPROACH</p>
            <h2 className="mx-auto max-w-2xl text-3xl font-light leading-tight tracking-wide md:text-5xl" style={{ textShadow: "0 0 30px rgba(10,30,20,0.8)" }}>
              Human insight, engineered into systems.
            </h2>
          </motion.div>
        </section>

        {/* Services */}
        <ServiceSections scheduleHref={scheduleHref} />

        {/* Stats */}
        <section className="px-6 py-28">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map(([value, suffix, label], i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="rounded-2xl border border-emerald-200/12 bg-emerald-950/20 p-6 text-center backdrop-blur-sm"
              >
                <div className="text-4xl font-extralight text-white md:text-5xl" style={{ textShadow: "0 0 26px rgba(120,210,160,0.4)" }}>
                  <Counter value={value} suffix={suffix} />
                </div>
                <p className="mt-3 text-xs font-light leading-relaxed text-emerald-50/60 md:text-sm">{label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Why work with us */}
        <section className="px-6 py-28">
          <div className="mx-auto max-w-6xl">
            <motion.div {...reveal} className="mb-14 max-w-2xl">
              <p className="mb-4 font-mono text-xs tracking-[0.4em]" style={{ color: "#a9ba9d" }}>WHY SYNTRIX</p>
              <h2 className="text-3xl font-light leading-tight tracking-wide md:text-5xl">Reasons startups choose to build with us.</h2>
            </motion.div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {reasons.map(([title, text], i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  whileHover={{ y: -6 }}
                  className="rounded-2xl border border-emerald-200/12 bg-emerald-950/20 p-8 backdrop-blur-sm transition-colors hover:border-emerald-300/40"
                >
                  <div className="mb-5 h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400/30 to-lime-300/10 ring-1 ring-emerald-200/20" />
                  <h3 className="text-xl font-light text-white">{title}</h3>
                  <p className="mt-3 font-light leading-relaxed text-emerald-50/65">{text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="px-6 py-28">
          <div className="mx-auto max-w-6xl">
            <motion.div {...reveal} className="mb-14 text-center">
              <p className="mb-4 font-mono text-xs tracking-[0.4em]" style={{ color: "#a9ba9d" }}>HOW WE WORK</p>
              <h2 className="text-3xl font-light tracking-wide md:text-5xl">From first call to launch, in four clear steps.</h2>
            </motion.div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
              {steps.map(([num, title, text], i) => (
                <motion.div
                  key={num}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="relative rounded-2xl border border-emerald-200/12 bg-emerald-950/20 p-7 backdrop-blur-sm"
                >
                  <p className="font-mono text-2xl font-extralight" style={{ color: "#a9ba9d" }}>{num}</p>
                  <h3 className="mt-4 text-lg font-light text-white">{title}</h3>
                  <p className="mt-3 text-sm font-light leading-relaxed text-emerald-50/60">{text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Our work */}
        <section id="work" className="px-6 py-28">
          <OurWork scheduleHref={scheduleHref} />
        </section>

        {/* Tech stack */}
        <section className="px-6 py-28">
          <div className="mx-auto max-w-5xl text-center">
            <motion.p {...reveal} className="mb-10 font-mono text-xs tracking-[0.4em]" style={{ color: "#a9ba9d" }}>BUILT WITH A MODERN STACK</motion.p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {tech.map((t, i) => (
                <motion.span
                  key={t}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="rounded-full border border-emerald-200/15 bg-emerald-950/20 px-5 py-2.5 text-sm font-light tracking-wide text-emerald-50/80 backdrop-blur-sm"
                >
                  {t}
                </motion.span>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 py-28">
          <div className="mx-auto max-w-3xl">
            <motion.div {...reveal} className="mb-10 text-center">
              <p className="mb-4 font-mono text-xs tracking-[0.4em]" style={{ color: "#a9ba9d" }}>QUESTIONS</p>
              <h2 className="text-3xl font-light tracking-wide md:text-5xl">Everything you might be wondering.</h2>
            </motion.div>
            <div>
              {faqs.map(([q, a]) => (
                <FaqItem key={q} q={q} a={a} />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="contact" className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <motion.div {...reveal} className="max-w-2xl">
            <p className="mb-5 font-mono text-xs tracking-[0.4em]" style={{ color: "#a9ba9d" }}>BEGIN</p>
            <h2 className="text-4xl font-light leading-tight tracking-wide md:text-6xl" style={{ textShadow: "0 0 30px rgba(40,80,55,0.6)" }}>
              Ready to build your next digital product?
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base font-light leading-relaxed text-emerald-50/70 md:text-lg">
              Book a discovery call and we&apos;ll map the scope, timeline, and platform needs before you commit.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <a href={scheduleHref} className="rounded-full bg-emerald-500/90 px-8 py-3.5 text-sm font-medium tracking-wide text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400">
                Schedule a free call
              </a>
              <a href="/login" className="rounded-full border border-emerald-200/25 px-8 py-3.5 text-sm font-medium tracking-wide text-emerald-50 transition hover:border-emerald-200/60">
                Client login
              </a>
            </div>
            <p className="mt-10 text-sm font-light text-emerald-50/40">Built hands-on by Soham &amp; Tahir · syntrixlabs.in</p>
          </motion.div>
        </section>
      </main>
    </>
  );
}
