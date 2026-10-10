"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/** Time between now and `due`, split into parts. null = no (valid) deadline. */
export function timeLeft(due?: string | null, now = Date.now()) {
  if (!due) return null;
  const ms = new Date(due).getTime() - now;
  if (Number.isNaN(ms)) return null;
  const abs = Math.abs(ms);
  return {
    ms,
    overdue: ms < 0,
    days: Math.floor(abs / 86400000),
    hours: Math.floor(abs / 3600000) % 24,
    minutes: Math.floor(abs / 60000) % 60,
    seconds: Math.floor(abs / 1000) % 60,
  };
}

/** "12 Oct 2026, 6:00 pm" in the viewer's local time. */
export function formatDeadline(due?: string | null) {
  if (!due) return "No deadline set";
  return new Date(due).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/** ISO → value for <input type="datetime-local"> (local time). */
export function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value → ISO (keeps the time the admin picked in their timezone). */
export function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : "";
}

/**
 * Live countdown to a deadline. Ticks every second; amber under 24h, red once
 * overdue, a calm "Completed" when the work is done.
 */
export default function Countdown({ due, done, size = "md" }: { due?: string | null; done?: boolean; size?: "sm" | "md" | "lg" }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (done || !due) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [due, done]);

  if (done) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-emerald-300 ${size === "lg" ? "text-base" : "text-xs"}`}>
        <i className="ti ti-circle-check" aria-hidden /> Completed
      </span>
    );
  }
  const t = timeLeft(due, now);
  if (!t) {
    return <span className={`text-emerald-50/40 ${size === "lg" ? "text-sm" : "text-xs"}`}>No deadline set</span>;
  }

  const tone = t.overdue ? "text-red-300" : t.ms < 86400000 ? "text-amber-200" : "text-emerald-200";
  const ring = t.overdue ? "border-red-400/40 bg-red-500/10" : t.ms < 86400000 ? "border-amber-300/40 bg-amber-400/10" : "border-emerald-300/25 bg-emerald-500/10";

  if (size === "lg") {
    const parts: [number, string][] = [
      [t.days, t.days === 1 ? "day" : "days"],
      [t.hours, "hrs"],
      [t.minutes, "min"],
      [t.seconds, "sec"],
    ];
    return (
      <div>
        <p className={`mb-2 font-mono text-[10px] uppercase tracking-[0.25em] ${tone}`}>{t.overdue ? "Overdue by" : "Time left"}</p>
        <div className="flex gap-2" role="timer" aria-label={`${t.overdue ? "Overdue by" : "Time left"} ${t.days} days ${t.hours} hours ${t.minutes} minutes`}>
          {parts.map(([value, label]) => (
            <div key={label} className={`min-w-[3.6rem] rounded-2xl border px-2 py-2 text-center ${ring}`}>
              <p className={`font-mono text-2xl font-light tabular-nums ${tone}`}>{pad(value)}</p>
              <p className="text-[10px] uppercase tracking-wider text-emerald-50/45">{label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const text = `${t.days ? `${t.days}d ` : ""}${pad(t.hours)}h ${pad(t.minutes)}m ${pad(t.seconds)}s`;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] tabular-nums ${ring} ${tone}`} role="timer">
      <i className="ti ti-clock" aria-hidden />
      {t.overdue ? `Overdue ${text}` : `${text} left`}
    </span>
  );
}
