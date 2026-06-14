"use client";

import { motion } from "framer-motion";

/**
 * Runs on every route change (Next.js re-mounts template per navigation).
 * A green panel wipes away from the top to reveal the new page, and the
 * content fades in. Opacity-only on the content wrapper so it never becomes
 * a containing block for the fixed ImmersiveScene background.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[80] bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-950"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.7, ease: [0.83, 0, 0.17, 1] }}
        style={{ transformOrigin: "top" }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {children}
      </motion.div>
    </>
  );
}
