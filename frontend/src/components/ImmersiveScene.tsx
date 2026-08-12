"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** When true, the sacred-geometry draws as you scroll the first part of the page.
   *  When false (ambient), it draws once on load and then holds. */
  scrollDraw?: boolean;
};

/**
 * Full-screen immersive background for the Syntrix landing page, tuned for a
 * premium "high-end studio" feel (think Linear / Apple): a deep green -> laurel
 * gradient, a cursor-following volumetric light, a "Flower of Life" that draws
 * line-by-line, a depth-parallaxed particle constellation that links and
 * brightens near the cursor, plus filmic grain + vignette and a smooth dual
 * cursor (dot + lagging ring). Pure canvas, no dependencies.
 *
 * Respects `prefers-reduced-motion`, pauses when the tab is hidden, and only
 * hijacks the cursor on real pointer devices (never breaks touch / phones).
 */
export default function ImmersiveScene({ scrollDraw = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const cursorEl = cursorRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const finePointer =
      typeof window !== "undefined" &&
      window.matchMedia?.("(pointer: fine)").matches;

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

    // Custom cursor only on real mouse devices; never hide it on touch.
    const prevCursor = document.body.style.cursor;
    if (finePointer) {
      document.body.style.cursor = "none";
      cursorEl?.style.removeProperty("display");
    } else if (cursorEl) {
      cursorEl.style.display = "none";
    }

    // --- Flower of Life centers (unit vectors * R) ---
    const cen: [number, number][] = [[0, 0]];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 90);
      cen.push([Math.cos(a), Math.sin(a)]);
    }
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 90);
      cen.push([2 * Math.cos(a), 2 * Math.sin(a)]);
    }
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 60);
      cen.push([1.732 * Math.cos(a), 1.732 * Math.sin(a)]);
    }
    const N = cen.length;

    // --- Depth-parallaxed particle field (constellation) ---
    const COUNT = reduceMotion ? 28 : 64;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.8 + 0.2, // depth: 0.2 (far) .. 1 (near)
      vx: (Math.random() - 0.5) * 0.00045,
      vy: (Math.random() - 0.5) * 0.00045,
    }));

    // --- Filmic grain: a small noise tile stamped each frame for texture ---
    const grain = document.createElement("canvas");
    grain.width = grain.height = 140;
    const gctx = grain.getContext("2d");
    let grainPattern: CanvasPattern | null = null;
    if (gctx) {
      const img = gctx.createImageData(140, 140);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      gctx.putImageData(img, 0, 0);
      grainPattern = ctx.createPattern(grain, "repeat");
    }

    let mx = 0.5,
      my = 0.5,
      // smoothed mouse for buttery parallax / light
      smx = 0.5,
      smy = 0.5,
      cxp = W / 2,
      cyp = H / 2,
      dxp = W / 2,
      dyp = H / 2,
      prog = 0,
      progT = 0;
    const t0 = performance.now();

    const onMove = (e: MouseEvent) => {
      mx = e.clientX / W;
      my = e.clientY / H;
    };
    if (finePointer) window.addEventListener("mousemove", onMove);

    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      const interactive = !!el?.closest("a,button,input,textarea,select,[role=button]");
      ringRef.current?.classList.toggle("grow", interactive);
    };
    if (finePointer) document.addEventListener("mouseover", onOver);

    const L = (a: number, b: number, t: number) => a + (b - a) * t;
    let raf = 0;
    let running = true;

    const draw = (now: number) => {
      // smooth scroll progress + mouse
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progT = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      prog += (progT - prog) * 0.08;
      smx += (mx - smx) * 0.06;
      smy += (my - smy) * 0.06;

      // background gradient: deep green -> laurel (keeps text readable)
      const k = prog * 0.65;
      const top = [L(9, 18, k), L(36, 58, k), L(26, 44, k)];
      const bot = [L(7, 38, k), L(28, 92, k), L(20, 70, k)];
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `rgb(${top[0] | 0},${top[1] | 0},${top[2] | 0})`);
      g.addColorStop(1, `rgb(${bot[0] | 0},${bot[1] | 0},${bot[2] | 0})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // volumetric laurel-green light that drifts toward the cursor
      const lx = W * (L(0.5, 0.68, prog) + (smx - 0.5) * 0.12);
      const ly = H * (0.45 + (smy - 0.5) * 0.1);
      const vl = ctx.createRadialGradient(lx, ly, 0, lx, ly, W * 0.62);
      vl.addColorStop(0, `rgba(169,186,157,${0.05 + prog * 0.22})`);
      vl.addColorStop(1, "rgba(169,186,157,0)");
      ctx.fillStyle = vl;
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2 + (smx - 0.5) * 40;
      const cy = H * 0.46 + (smy - 0.5) * 40;
      const R = Math.min(W, H) * 0.14;

      // how much of the geometry is drawn
      const drawAmt = reduceMotion
        ? 1
        : scrollDraw
        ? Math.max(0, Math.min(1, prog / 0.22))
        : Math.max(0, Math.min(1, (now - t0) / 3200));

      for (let i = 0; i < N; i++) {
        const delay = (i / N) * 0.85;
        const dur = (0.85 / N) * 2.4;
        const p = Math.max(0, Math.min(1, (drawAmt - delay) / dur));
        if (p <= 0) continue;
        const xi = cx + cen[i][0] * R;
        const yi = cy + cen[i][1] * R;
        const end = -Math.PI / 2 + p * Math.PI * 2;
        const active = p < 1;
        ctx.beginPath();
        ctx.arc(xi, yi, R, -Math.PI / 2, end);
        ctx.strokeStyle = `rgba(232,245,228,${active ? 0.6 : 0.16})`;
        ctx.lineWidth = active ? 1.1 : 0.7;
        if (active) {
          ctx.shadowColor = "rgba(190,220,180,0.55)";
          ctx.shadowBlur = 8;
        } else ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.shadowBlur = 0;
        if (active) {
          const ex = xi + R * Math.cos(end);
          const ey = yi + R * Math.sin(end);
          ctx.beginPath();
          ctx.arc(ex, ey, 1.8, 0, 7);
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fill();
        }
      }

      // a slow looping "pen" arc on the center circle for life
      if (drawAmt >= 1 && !reduceMotion) {
        const a0 = now * 0.0006;
        ctx.beginPath();
        ctx.arc(cx, cy, R, a0, a0 + 0.9);
        ctx.strokeStyle = "rgba(200,235,195,0.5)";
        ctx.lineWidth = 1.2;
        ctx.shadowColor = "rgba(150,220,160,0.6)";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // particle constellation with depth parallax + cursor-reactive links
      const mxpx = smx * W;
      const mypx = smy * H;
      const px: number[] = [];
      const py: number[] = [];
      const pz: number[] = [];
      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];
        if (!reduceMotion) {
          pt.x += pt.vx;
          pt.y += pt.vy;
          if (pt.x < 0 || pt.x > 1) pt.vx *= -1;
          if (pt.y < 0 || pt.y > 1) pt.vy *= -1;
        }
        // depth parallax: nearer particles shift more with the mouse
        const par = (smx - 0.5) * pt.z * 46;
        const parY = (smy - 0.5) * pt.z * 46;
        const sx = pt.x * W + par;
        const sy = pt.y * H + parY;
        px.push(sx);
        py.push(sy);
        pz.push(pt.z);
      }

      // links: connect nearby particles; brighten the pair near the cursor
      const linkDist = 132;
      for (let i = 0; i < px.length; i++) {
        for (let j = i + 1; j < px.length; j++) {
          const dx = px[i] - px[j];
          const dy = py[i] - py[j];
          const d2 = dx * dx + dy * dy;
          if (d2 > linkDist * linkDist) continue;
          const d = Math.sqrt(d2);
          // proximity of the link midpoint to the cursor -> extra glow
          const midx = (px[i] + px[j]) * 0.5;
          const midy = (py[i] + py[j]) * 0.5;
          const cd = Math.hypot(midx - mxpx, midy - mypx);
          const near = Math.max(0, 1 - cd / 240);
          const base = (1 - d / linkDist) * 0.16;
          const alpha = base + near * 0.5 * (1 - d / linkDist);
          ctx.strokeStyle = `rgba(190,225,180,${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.6 + near * 0.8;
          ctx.beginPath();
          ctx.moveTo(px[i], py[i]);
          ctx.lineTo(px[j], py[j]);
          ctx.stroke();
        }
      }

      // particle dots
      for (let i = 0; i < px.length; i++) {
        const cd = Math.hypot(px[i] - mxpx, py[i] - mypx);
        const near = Math.max(0, 1 - cd / 200);
        const z = pz[i];
        ctx.globalAlpha = z * 0.45 + near * 0.4;
        ctx.fillStyle = near > 0.5 ? "rgba(220,245,210,1)" : "rgba(200,225,190,1)";
        const s = 1.2 + z * 1.1 + near * 1.4;
        ctx.fillRect(px[i] - s / 2, py[i] - s / 2, s, s);
      }
      ctx.globalAlpha = 1;

      // filmic grain (subtle), shifted each frame so it shimmers
      if (grainPattern) {
        ctx.save();
        ctx.globalAlpha = 0.035;
        ctx.translate((Math.random() * 140) | 0, (Math.random() * 140) | 0);
        ctx.fillStyle = grainPattern;
        ctx.fillRect(-140, -140, W + 280, H + 280);
        ctx.restore();
      }

      // vignette for cinematic depth
      const vg = ctx.createRadialGradient(
        W / 2,
        H / 2,
        Math.min(W, H) * 0.35,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.75
      );
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      // dual custom cursor: snappy dot + lagging ring
      if (finePointer) {
        dxp += (mx * W - dxp) * 0.35;
        dyp += (my * H - dyp) * 0.35;
        cxp += (mx * W - cxp) * 0.12;
        cyp += (my * H - cyp) * 0.12;
        if (dotRef.current)
          dotRef.current.style.transform = `translate(${dxp}px, ${dyp}px)`;
        if (cursorEl) cursorEl.style.transform = `translate(${cxp}px, ${cyp}px)`;
      }
    };

    const frame = (now: number) => {
      if (running) draw(now);
      raf = requestAnimationFrame(frame);
    };

    if (reduceMotion) {
      // draw a single elegant static frame, no loop
      draw(performance.now());
    } else {
      raf = requestAnimationFrame(frame);
    }

    // pause work when the tab is hidden (saves battery, stays smooth)
    const onVisibility = () => {
      running = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("visibilitychange", onVisibility);
      document.body.style.cursor = prevCursor;
    };
  }, [scrollDraw]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      />
      {/* lagging ring */}
      <div
        ref={cursorRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[60] hidden md:block"
      >
        <div ref={ringRef} className="cur-ring h-10 w-10 rounded-full border border-emerald-100/40" />
      </div>
      {/* snappy dot */}
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[61] hidden md:block"
      >
        <div className="cur-dot h-1.5 w-1.5 rounded-full bg-emerald-100" />
      </div>
    </>
  );
}
