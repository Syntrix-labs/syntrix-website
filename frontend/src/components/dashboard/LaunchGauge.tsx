"use client";

import { motion } from "framer-motion";
import CountUp from "@/components/ui/CountUp";

/**
 * Semicircular "launch" progress gauge: an arc sweeps to `value`, six stage
 * ticks sit along it, and a pulse marks the current position. The percentage
 * and current stage are overlaid in the center.
 */
export default function LaunchGauge({ value, stageLabel }: { value: number; stageLabel: string }) {
  const R = 95;
  const cx = 130;
  const cy = 125;
  const len = Math.PI * R;
  const f = Math.max(0, Math.min(100, value)) / 100;
  const offset = len * (1 - f);

  const pt = (ff: number) => {
    const th = Math.PI * (1 - ff);
    return { x: cx + R * Math.cos(th), y: cy - R * Math.sin(th) };
  };
  const cur = pt(f);
  const ticks = [0, 1, 2, 3, 4, 5].map((i) => ({ ...pt(i / 5), on: i / 5 <= f + 0.001 }));

  return (
    <div style={{ position: "relative", maxWidth: 300, margin: "0 auto" }}>
      <svg
        width="100%"
        viewBox="0 0 260 150"
        role="img"
        aria-label={`${Math.round(value)} percent complete, current stage ${stageLabel}`}
        style={{ display: "block" }}
      >
        <path d="M35 125 A95 95 0 0 1 225 125" fill="none" stroke="rgba(167,243,208,0.10)" strokeWidth={11} strokeLinecap="round" />
        <motion.path
          d="M35 125 A95 95 0 0 1 225 125"
          fill="none"
          stroke="#34d399"
          strokeWidth={11}
          strokeLinecap="round"
          strokeDasharray={len}
          initial={{ strokeDashoffset: len }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        />
        {ticks.map((t, i) => (
          <circle key={i} cx={t.x} cy={t.y} r={2.6} fill={t.on ? "#eafff2" : "#1d4634"} />
        ))}
        <motion.circle cx={cur.x} cy={cur.y} r={7} fill="#34d399" animate={{ r: [7, 11, 7] }} transition={{ duration: 1.6, repeat: Infinity }} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: "46%", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 34, fontWeight: 300, color: "#eafff2", lineHeight: 1 }}>
          <CountUp value={Math.round(value)} />%
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9fd8b8" }}>{stageLabel}</p>
      </div>
    </div>
  );
}
