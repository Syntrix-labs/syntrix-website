"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import ImmersiveScene from "@/components/ImmersiveScene";

const ease = [0.16, 1, 0.3, 1] as const;

/** Stagger helpers shared by every auth form. */
export const authStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};
export const authItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

/** Shared input styling (focus glow + background lift). */
export const authInputClass =
  "w-full rounded-2xl border border-emerald-200/15 bg-emerald-950/40 px-5 py-4 outline-none transition-all duration-300 focus:border-emerald-400/60 focus:bg-emerald-950/60 focus:shadow-[0_0_0_4px_rgba(52,211,153,0.10)] disabled:cursor-not-allowed disabled:opacity-60";

type Perk = [string, string];

const defaultPerks: Perk[] = [
  ["Live project tracking", "Follow every stage, meeting, and payment in real time."],
  ["Secure by design", "JWT sessions, hardened APIs, your data protected."],
  ["Direct line to your builders", "You talk to the people writing the code — no middlemen."],
];

type AuthShellProps = {
  /** Left showcase panel (desktop only). */
  heading?: string;
  tagline?: string;
  perks?: Perk[];
  /** Right card header. */
  cardTitle: string;
  cardSubtitle: string;
  /** Form + footer content rendered inside the glass card. */
  children: ReactNode;
};

/**
 * Premium split-screen layout shared by all auth pages: immersive background,
 * an animated brand/showcase panel on the left (desktop), and the form card
 * on the right. Collapses to a single centered card on mobile.
 */
export default function AuthShell({
  heading = "Welcome back to your build.",
  tagline = "Your projects, meetings, documents, and payments — all in one place, updated live as we build.",
  perks = defaultPerks,
  cardTitle,
  cardSubtitle,
  children,
}: AuthShellProps) {
  return (
    <>
      <ImmersiveScene />
      <main className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left — brand showcase (desktop only) */}
        <motion.section
          variants={authStagger}
          initial="hidden"
          animate="show"
          className="relative hidden flex-col justify-between p-14 text-white lg:flex"
        >
          <motion.div variants={authItem}>
            <BrandLogo />
          </motion.div>

          <div>
            <motion.h1
              variants={authItem}
              className="max-w-md text-5xl font-extralight leading-[1.05] tracking-wide"
              style={{ textShadow: "0 0 40px rgba(40,80,55,0.7)" }}
            >
              {heading}
            </motion.h1>
            <motion.p variants={authItem} className="mt-6 max-w-sm font-light leading-relaxed text-emerald-50/60">
              {tagline}
            </motion.p>

            <motion.ul variants={authStagger} className="mt-10 space-y-5">
              {perks.map(([title, text]) => (
                <motion.li key={title} variants={authItem} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-400/10 text-xs text-emerald-200">
                    ✓
                  </span>
                  <div>
                    <p className="font-light text-white">{title}</p>
                    <p className="text-sm font-light leading-relaxed text-emerald-50/55">{text}</p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <motion.p variants={authItem} className="font-mono text-[11px] tracking-[0.3em] text-emerald-100/40">
            SYNTRIX LABS · syntrixlabs.in
          </motion.p>
        </motion.section>

        {/* Right — form card */}
        <section className="flex items-center justify-center px-6 py-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease }}
            className="w-full max-w-md rounded-3xl border border-emerald-200/15 bg-emerald-950/30 p-8 backdrop-blur-xl sm:p-10"
          >
            <div className="mb-8 text-center lg:text-left">
              <BrandLogo className="mb-7 justify-center lg:hidden" />
              <h1 className="text-3xl font-light tracking-wide md:text-4xl" style={{ textShadow: "0 0 30px rgba(40,80,55,0.6)" }}>
                {cardTitle}
              </h1>
              <p className="mt-3 font-light text-emerald-50/60">{cardSubtitle}</p>
            </div>
            {children}
          </motion.div>
        </section>
      </main>
    </>
  );
}
