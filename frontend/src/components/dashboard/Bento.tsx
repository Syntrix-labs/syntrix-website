"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

/** Responsive bento grid: 1 col on mobile, up to 3 on desktop. */
export function BentoGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 ${className}`}>
      {children}
    </div>
  );
}

/** A single animated bento tile. Pass span classes via `className`. */
export function BentoCard({
  children,
  className = "",
  index = 0,
  accent = false,
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  accent?: boolean;
  hover?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: index * 0.06, ease }}
      whileHover={hover ? { y: -4 } : undefined}
      className={`rounded-2xl border p-5 backdrop-blur-md transition-colors ${
        accent
          ? "border-emerald-400/30 bg-emerald-400/10 hover:border-emerald-300/50"
          : "border-emerald-200/12 bg-emerald-950/30 hover:border-emerald-300/30"
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}
