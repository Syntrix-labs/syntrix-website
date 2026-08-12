"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight ambient backdrop for the dashboard: a slow drifting green glow
 * and floating particles on a transparent canvas (the shell provides the dark
 * base). No cursor hijack, no heavy geometry. Respects reduced-motion and
 * pauses when the tab is hidden. Sits fixed behind the dashboard content.
 */
export default function DashboardAura() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let W = 0,
      H = 0,
      DPR = 1;
    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: reduce ? 18 : 40 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.7 + 0.3,
      vx: (Math.random() - 0.5) * 0.0005,
      vy: (Math.random() - 0.5) * 0.0005,
    }));

    let raf = 0;
    let running = true;
    let t = 0;

    const frame = () => {
      t += 0.004;
      ctx.clearRect(0, 0, W, H);

      // drifting glow
      const lx = W * (0.7 + Math.sin(t) * 0.15);
      const ly = H * (0.25 + Math.cos(t * 0.8) * 0.12);
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.max(W, H) * 0.55);
      g.addColorStop(0, "rgba(40,120,80,0.16)");
      g.addColorStop(1, "rgba(40,120,80,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
        ctx.globalAlpha = p.z * 0.35;
        ctx.fillStyle = "rgba(190,235,200,1)";
        ctx.fillRect(p.x * W, p.y * H, 1.4, 1.4);
      }
      ctx.globalAlpha = 1;

      if (running && !reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onVis = () => {
      running = document.visibilityState === "visible";
      if (running && !reduce) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
