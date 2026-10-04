"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SyntrixMark from "@/components/brand/SyntrixMark";

const links = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "About", href: "/about" },
  { label: "Portfolio", href: "/#work" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // Solid bar once the page scrolls, so text never runs underneath the logo.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Phone menu: lock the page behind it and close on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-[70] flex w-full items-center justify-between px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] transition-colors duration-300 md:h-20 md:px-10 md:pb-0 md:pt-0 ${
          scrolled || open
            ? "border-b border-emerald-200/10 bg-[#04140d]/80 backdrop-blur-xl"
            : "border-b border-transparent bg-gradient-to-b from-black/50 to-transparent"
        }`}
      >
        <a
          href="/"
          aria-label="Syntrix Labs home"
          className="flex items-center gap-2.5 text-[13px] font-light tracking-[0.28em] text-white transition hover:opacity-80 md:gap-3 md:text-sm md:tracking-[0.32em]"
          style={{ textShadow: "0 0 18px rgba(240,236,226,0.3)" }}
        >
          <SyntrixMark size={28} className="drop-shadow-[0_0_12px_rgba(240,236,226,0.3)]" />
          <span>SYNTRIX<span style={{ color: "#d8d3c6" }}>&nbsp;LABS</span></span>
        </a>
        <div className="hidden gap-8 text-sm tracking-wide text-emerald-50/80 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition hover:text-white">{l.label}</a>
          ))}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/login"
            className="rounded-full border border-emerald-200/25 px-5 py-2 text-sm tracking-wide text-emerald-50/80 backdrop-blur-sm transition hover:border-emerald-300/50 hover:text-white"
          >
            Login
          </a>
          <a
            href="/schedule"
            className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-5 py-2 text-sm tracking-wide text-emerald-50 backdrop-blur-sm transition hover:bg-emerald-500/40"
          >
            Schedule
          </a>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-2xl text-emerald-50 active:bg-emerald-200/10 md:hidden"
        >
          <i className={`ti ${open ? "ti-x" : "ti-menu-2"}`} aria-hidden />
        </button>
      </nav>

      {/* ---------- Phone menu ---------- */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[65] flex flex-col bg-[#04140d]/95 px-6 backdrop-blur-xl md:hidden"
            style={{ paddingTop: "calc(5rem + env(safe-area-inset-top))", paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <nav className="flex flex-col" aria-label="Site">
              {links.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.04 * i }}
                  className="flex items-center justify-between border-b border-emerald-200/10 py-4 text-2xl font-light tracking-wide text-white active:text-emerald-200"
                >
                  {l.label}
                  <i className="ti ti-arrow-up-right text-lg text-emerald-100/40" aria-hidden />
                </motion.a>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3">
              <a
                href="/schedule"
                className="rounded-full bg-emerald-500/90 py-3.5 text-center text-sm font-medium tracking-wide text-white shadow-lg shadow-emerald-500/30 active:bg-emerald-400"
              >
                Schedule a free call
              </a>
              <a
                href="/login"
                className="rounded-full border border-emerald-200/25 py-3.5 text-center text-sm font-medium tracking-wide text-emerald-50 active:bg-emerald-200/10"
              >
                Client login
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
