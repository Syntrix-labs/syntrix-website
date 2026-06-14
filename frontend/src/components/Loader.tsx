"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const R = 34;
const centers: [number, number][] = [[100, 100]];
for (let i = 0; i < 6; i++) {
  const a = (Math.PI / 180) * (60 * i - 90);
  centers.push([100 + Math.cos(a) * R, 100 + Math.sin(a) * R]);
}

/** First-visit loading screen: a Flower of Life draws in green, then fades. */
export default function Loader() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("syntrix_loaded")) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => {
      setShow(false);
      try {
        sessionStorage.setItem("syntrix_loaded", "1");
      } catch {
        /* ignore */
      }
    }, 2400);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loader"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#04140d]"
        >
          <svg width="180" height="180" viewBox="0 0 200 200" className="drop-shadow-[0_0_24px_rgba(120,210,160,0.45)]">
            {centers.map(([cx, cy], i) => (
              <motion.circle
                key={i}
                cx={cx}
                cy={cy}
                r={R}
                fill="none"
                stroke="#a9ba9d"
                strokeWidth={1}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.9 }}
                transition={{ duration: 1, delay: 0.15 + i * 0.12, ease: "easeInOut" }}
              />
            ))}
          </svg>
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.1em" }}
            animate={{ opacity: 1, letterSpacing: "0.5em" }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-8 text-sm font-light text-emerald-50"
            style={{ paddingLeft: "0.5em" }}
          >
            SYNTRIX
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="mt-6 h-px w-32 origin-left bg-gradient-to-r from-emerald-400 to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
