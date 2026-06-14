"use client";

import { useEffect, useRef } from "react";

type Particle = {
  tx: number;
  ty: number;
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  row: number;
  link: boolean; // connects to next particle (same row neighbour)
};

/**
 * A human form (head + shoulders) rendered from glowing green particles and
 * faint horizontal "data" scan-lines. Particles scatter, then assemble when the
 * figure scrolls into view; they breathe gently and repel from the cursor.
 * Pure canvas — no images, no dependencies.
 */
export default function ParticleFigure() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0,
      H = 0,
      DPR = 1;
    let parts: Particle[] = [];

    // Build the silhouette on an offscreen canvas, then sample filled pixels.
    const buildSilhouette = () => {
      const SW = 300,
        SH = 380;
      const off = document.createElement("canvas");
      off.width = SW;
      off.height = SH;
      const o = off.getContext("2d");
      if (!o) return;
      o.fillStyle = "#fff";

      // head
      o.beginPath();
      o.ellipse(150, 104, 56, 70, 0, 0, Math.PI * 2);
      o.fill();
      // neck
      o.fillRect(125, 150, 50, 60);
      // shoulders / bust
      o.beginPath();
      o.moveTo(34, 380);
      o.quadraticCurveTo(48, 250, 110, 224);
      o.quadraticCurveTo(150, 212, 190, 224);
      o.quadraticCurveTo(252, 250, 266, 380);
      o.closePath();
      o.fill();

      const data = o.getImageData(0, 0, SW, SH).data;

      // fit into the live canvas
      const disp = Math.min(H * 0.92, 460);
      const scale = disp / SH;
      const ox = W / 2 - (SW * scale) / 2;
      const oy = H / 2 - (SH * scale) / 2;

      parts = [];
      const step = 5;
      for (let y = 0; y < SH; y += step) {
        let prevInRow = -1;
        for (let x = 0; x < SW; x += step) {
          const idx = (y * SW + x) * 4;
          if (data[idx + 3] < 128) {
            prevInRow = -1;
            continue;
          }
          // green ramp: laurel at top, deep green at bottom; brighter toward right (light)
          const vt = y / SH;
          const light = 0.6 + (x / SW) * 0.5;
          const r = Math.min(255, (90 + (1 - vt) * 90) * light);
          const g = Math.min(255, (150 + (1 - vt) * 80) * light);
          const b = Math.min(255, (110 + (1 - vt) * 60) * light);
          const tx = ox + x * scale;
          const ty = oy + y * scale;
          parts.push({
            tx,
            ty,
            x: Math.random() * W,
            y: Math.random() * H,
            r,
            g,
            b,
            row: y,
            link: prevInRow === y - 0 && parts.length > 0,
          });
          prevInRow = y;
        }
      }
    };

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      buildSilhouette();
    };
    resize();
    window.addEventListener("resize", resize);

    let active = false;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (active = active || e.isIntersecting)),
      { threshold: 0.25 }
    );
    io.observe(canvas);

    let mx = -9999,
      my = -9999;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    const frame = (now: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      const ease = active ? 0.06 : 0.015;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const breathe = active ? Math.sin(now * 0.0012 + p.row * 0.05) * 2.2 : 0;
        let bx = p.tx;
        let by = p.ty + breathe;
        if (!active) {
          // drift gently while waiting
          bx = p.x + Math.sin(now * 0.0006 + i) * 0.2;
          by = p.y + Math.cos(now * 0.0007 + i) * 0.2;
        }
        // cursor repel
        const dx = (active ? p.x : bx) - mx;
        const dy = (active ? p.y : by) - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < 9000) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / 95) * 26;
          bx += (dx / d) * f;
          by += (dy / d) * f;
        }
        p.x += (bx - p.x) * ease;
        p.y += (by - p.y) * ease;

        // scan-line link to previous same-row particle
        if (active && p.link && i > 0) {
          const q = parts[i - 1];
          const ddx = p.x - q.x;
          const ddy = p.y - q.y;
          if (ddx * ddx + ddy * ddy < 360) {
            ctx.strokeStyle = `rgba(${p.r | 0},${p.g | 0},${p.b | 0},0.10)`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(q.x, q.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = `rgba(${p.r | 0},${p.g | 0},${p.b | 0},0.9)`;
        ctx.fillRect(p.x, p.y, 1.6, 1.6);
      }
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      io.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="h-[78vh] w-full"
    />
  );
}
