"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BrandLoader from "@/components/BrandLoader";

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
          className="fixed inset-0 z-[100]"
        >
          <BrandLoader />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
