"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

type Props = {
  /** The client's name to render in particles. */
  name: string;
  /** Called once the burst finishes (route away here). */
  onComplete: () => void;
};

/**
 * Full-screen login hand-off: the client's name assembles out of green
 * particles, holds for a beat, then bursts outward and fades — at which point
 * we navigate into the dashboard. Pure canvas. Honors reduced-motion by
 * completing almost immediately.
 */
export default function NameParticleTransition({ name, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onCompleteRef.current();
    };

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    if (reduce) {
      const id = window.setTimeout(finish, 500);
      return () => window.clearTimeout(id);
    }

    type P = { sx: number; sy: number; tx: number; ty: number; ang: number; r: number; g: number; b: number };
    const parts: P[] = [];

    // Render the name to an offscreen canvas, then sample filled pixels.
    const text = (name || "Welcome").trim().split(" ")[0].toUpperCase();
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const o = off.getContext("2d");
    if (!o) return;
    let fontSize = Math.min((W / Math.max(text.length, 5)) * 1.5, H * 0.24, 180);
    fontSize = Math.max(fontSize, 42);
    o.fillStyle = "#fff";
    o.textAlign = "center";
    o.textBaseline = "middle";
    o.font = `300 ${fontSize}px Inter, ui-sans-serif, sans-serif`;
    o.fillText(text, W / 2, H / 2);

    const data = o.getImageData(0, 0, W, H).data;
    const step = Math.max(4, Math.round(fontSize / 24));
    const rad = Math.max(W, H);
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 128) {
          const a = Math.random() * Math.PI * 2;
          parts.push({
            sx: W / 2 + Math.cos(a) * rad,
            sy: H / 2 + Math.sin(a) * rad,
            tx: x,
            ty: y,
            ang: Math.atan2(y - H / 2, x - W / 2),
            r: 140 + Math.random() * 70,
            g: 205 + Math.random() * 45,
            b: 150 + Math.random() * 55,
          });
        }
      }
    }

    const T_ASSEMBLE = 1100;
    const T_HOLD = 650;
    const T_BURST = 900;
    const TOTAL = T_ASSEMBLE + T_HOLD + T_BURST;
    const t0 = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const t = now - t0;
      ctx.clearRect(0, 0, W, H);

      if (t < T_ASSEMBLE) {
        const p = t / T_ASSEMBLE;
        const e = 1 - Math.pow(1 - p, 3);
        ctx.globalAlpha = Math.min(1, e + 0.15);
        for (const pt of parts) {
          const x = pt.sx + (pt.tx - pt.sx) * e;
          const y = pt.sy + (pt.ty - pt.sy) * e;
          ctx.fillStyle = `rgb(${pt.r | 0},${pt.g | 0},${pt.b | 0})`;
          ctx.fillRect(x, y, 2, 2);
        }
      } else if (t < T_ASSEMBLE + T_HOLD) {
        ctx.globalAlpha = 1;
        for (const pt of parts) {
          const j = (Math.random() - 0.5) * 0.7;
          ctx.fillStyle = `rgb(${pt.r | 0},${pt.g | 0},${pt.b | 0})`;
          ctx.fillRect(pt.tx + j, pt.ty + j, 2, 2);
        }
      } else if (t < TOTAL) {
        const bt = (t - T_ASSEMBLE - T_HOLD) / T_BURST;
        const push = bt * bt * 460;
        ctx.globalAlpha = Math.max(0, 1 - bt);
        for (const pt of parts) {
          const x = pt.tx + Math.cos(pt.ang) * push;
          const y = pt.ty + Math.sin(pt.ang) * push - bt * 40;
          ctx.fillStyle = `rgb(${pt.r | 0},${pt.g | 0},${pt.b | 0})`;
          ctx.fillRect(x, y, 2, 2);
        }
      } else {
        finish();
        return;
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const safety = window.setTimeout(finish, TOTAL + 900);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(safety);
    };
  }, [name]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "radial-gradient(circle at 50% 45%, #0c2a1d, #04140d 72%)" }}
    >
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.4, times: [0, 0.2, 0.7, 1] }}
        className="absolute left-0 right-0 top-[28%] text-center font-mono text-xs tracking-[0.6em] text-emerald-200/70"
      >
        WELCOME BACK
      </motion.p>
      <span className="sr-only">Signing you in, {name}</span>
    </motion.div>
  );
}
