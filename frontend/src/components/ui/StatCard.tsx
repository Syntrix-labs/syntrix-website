"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) {
      setN(to);
      return;
    }
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{n}</>;
}

type StatCardProps = {
  title: string;
  value: number;
  caption?: string;
  href?: string;
  index?: number;
};

/** Animated, theme-matched dashboard stat card with a count-up number. */
export default function StatCard({ title, value, caption, href, index = 0 }: StatCardProps) {
  const inner = (
    <>
      <p className="text-sm font-light tracking-wide text-emerald-50/60">{title}</p>
      <h2 className="mt-4 text-5xl font-extralight text-white" style={{ textShadow: "0 0 26px rgba(120,210,160,0.4)" }}>
        <CountUp value={value} />
      </h2>
      {caption && <p className="mt-3 text-sm font-light text-emerald-50/45">{caption}</p>}
      {href && (
        <p className="mt-5 text-sm font-light text-emerald-300/70 transition group-hover:text-emerald-200">View →</p>
      )}
    </>
  );

  const className =
    "group block rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-7 backdrop-blur-sm transition-colors hover:border-emerald-300/40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: index * 0.07, ease }}
      whileHover={{ y: -6 }}
    >
      {href ? (
        <Link href={href} className={className}>
          {inner}
        </Link>
      ) : (
        <div className={className}>{inner}</div>
      )}
    </motion.div>
  );
}
