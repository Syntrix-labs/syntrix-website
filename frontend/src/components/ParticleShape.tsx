"use client";

import { useEffect, useRef } from "react";

type Shape = "team" | "message" | "clock";

type Particle = {
  tx: number;
  ty: number;
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  row: number;
  link: boolean;
};

/** Draw the chosen silhouette onto the offscreen context (300x380). */
function drawShape(o: CanvasRenderingContext2D, shape: Shape) {
  o.fillStyle = "#fff";
  o.strokeStyle = "#fff";

  if (shape === "team") {
    // two overlapping busts (the founders / a team)
    const bust = (cx: number) => {
      o.beginPath();
      o.ellipse(cx, 120, 40, 50, 0, 0, Math.PI * 2);
      o.fill();
      o.fillRect(cx - 16, 158, 32, 44);
      o.beginPath();
      o.moveTo(cx - 78, 380);
      o.quadraticCurveTo(cx - 64, 250, cx - 18, 222);
      o.quadraticCurveTo(cx, 214, cx + 18, 222);
      o.quadraticCurveTo(cx + 64, 250, cx + 78, 380);
      o.closePath();
      o.fill();
    };
    bust(96);
    bust(204);
    return;
  }

  if (shape === "message") {
    // envelope outline
    o.lineWidth = 9;
    o.strokeRect(56, 120, 188, 140);
    o.beginPath();
    o.moveTo(56, 120);
    o.lineTo(150, 200);
    o.lineTo(244, 120);
    o.stroke();
    return;
  }

  // clock
  o.lineWidth = 9;
  o.beginPath();
  o.arc(150, 175, 92, 0, Math.PI * 2);
  o.stroke();
  // ticks
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI / 6) * i;
    const x1 = 150 + Math.cos(a) * 78;
    const y1 = 175 + Math.sin(a) * 78;
    const x2 = 150 + Math.cos(a) * 90;
    const y2 = 175 + Math.sin(a) * 90;
    o.lineWidth = 6;
    o.beginPath();
    o.moveTo(x1, y1);
    o.lineTo(x2, y2);
    o.stroke();
  }
  // hands
  o.lineWidth = 8;
  o.beginPath();
  o.moveTo(150, 175);
  o.lineTo(150, 120);
  o.stroke();
  o.beginPath();
  o.moveTo(150, 175);
  o.lineTo(196, 195);
  o.stroke();
  o.beginPath();
  o.arc(150, 175, 7, 0, Math.PI * 2);
  o.fill();
}

export default function ParticleShape({ shape }: { shape: Shape }) {
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

    const build = () => {
      const SW = 300,
        SH = 380;
      const off = document.createElement("canvas");
      off.width = SW;
      off.height = SH;
      const o = off.getContext("2d");
      if (!o) return;
      drawShape(o, shape);
      const data = o.getImageData(0, 0, SW, SH).data;

      const disp = Math.min(H * 0.9, 440);
      const scale = disp / SH;
      const ox = W / 2 - (SW * scale) / 2;
      const oy = H / 2 - (SH * scale) / 2;

      parts = [];
      const step = 5;
      for (let y = 0; y < SH; y += step) {
        let prev = -1;
        for (let x = 0; x < SW; x += step) {
          const idx = (y * SW + x) * 4;
          if (data[idx + 3] < 128) {
            prev = -1;
            continue;
          }
          const vt = y / SH;
          const light = 0.6 + (x / SW) * 0.5;
          const r = Math.min(255, (90 + (1 - vt) * 90) * light);
          const g = Math.min(255, (150 + (1 - vt) * 80) * light);
          const b = Math.min(255, (110 + (1 - vt) * 60) * light);
          parts.push({
            tx: ox + x * scale,
            ty: oy + y * scale,
            x: Math.random() * W,
            y: Math.random() * H,
            r,
            g,
            b,
            row: y,
            link: prev !== -1,
          });
          prev = y;
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
      build();
    };
    resize();
    window.addEventListener("resize", resize);

    let active = false;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (active = active || e.isIntersecting)),
      { threshold: 0.2 }
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
        const breathe = active ? Math.sin(now * 0.0012 + p.row * 0.05) * 2 : 0;
        let bx = active ? p.tx : p.x + Math.sin(now * 0.0006 + i) * 0.2;
        let by = active ? p.ty + breathe : p.y + Math.cos(now * 0.0007 + i) * 0.2;
        const dx = (active ? p.x : bx) - mx;
        const dy = (active ? p.y : by) - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < 8000) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / 90) * 24;
          bx += (dx / d) * f;
          by += (dy / d) * f;
        }
        p.x += (bx - p.x) * ease;
        p.y += (by - p.y) * ease;
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
  }, [shape]);

  return <canvas ref={canvasRef} aria-hidden className="h-[60vh] w-full" />;
}
