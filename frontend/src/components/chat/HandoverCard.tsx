"use client";

import { useState } from "react";

export type HandoverState = "pending" | "approved" | "changes" | "cancelled";

const STATE_LABEL: Record<HandoverState, { text: string; className: string; icon: string }> = {
  pending: { text: "Waiting for the client", className: "border-amber-300/35 bg-amber-400/10 text-amber-100", icon: "ti-hourglass" },
  approved: { text: "Approved — work done", className: "border-emerald-300/40 bg-emerald-500/15 text-emerald-100", icon: "ti-circle-check" },
  changes: { text: "Changes requested", className: "border-amber-300/35 bg-amber-400/10 text-amber-100", icon: "ti-pencil" },
  cancelled: { text: "Withdrawn", className: "border-emerald-200/15 bg-emerald-950/40 text-emerald-50/45", icon: "ti-circle-x" },
};

/**
 * "Work is ready" card in the consultation chat. The client answers it with
 * Done / Request changes; staff see where it stands.
 */
export default function HandoverCard({
  title,
  text,
  by,
  state = "pending",
  viewer,
  onRespond,
}: {
  title?: string;
  text: string;
  by?: string;
  state?: HandoverState;
  viewer: "client" | "staff";
  onRespond?: (approve: boolean, note: string) => Promise<boolean>;
}) {
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canAnswer = viewer === "client" && state === "pending" && onRespond;
  const label = viewer === "client" && state === "pending" ? null : STATE_LABEL[state];

  const answer = async (approve: boolean) => {
    if (!onRespond || busy) return;
    setBusy(true);
    setError("");
    const ok = await onRespond(approve, note.trim());
    setBusy(false);
    if (!ok) setError("Couldn't send that — please try again.");
  };

  return (
    <div className="w-80 max-w-full overflow-hidden rounded-2xl border border-emerald-300/30 bg-gradient-to-br from-emerald-500/15 to-emerald-950/60 text-left">
      <div className="flex items-center gap-2.5 border-b border-emerald-200/10 px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-100">
          <i className="ti ti-package" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-200/70">Work handed over</p>
          <p className="truncate text-sm text-white">{title || "Your project"}</p>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-[13px] font-light leading-relaxed text-emerald-50/85">{text}</p>
        {by && <p className="mt-1.5 text-[11px] text-emerald-100/45">From {by}</p>}

        {canAnswer && !asking && (
          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={() => answer(true)}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/90 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-60"
            >
              <i className="ti ti-circle-check" aria-hidden /> {busy ? "Sending…" : "Done — I'm satisfied"}
            </button>
            <button
              onClick={() => setAsking(true)}
              disabled={busy}
              className="rounded-xl border border-emerald-200/20 px-4 py-2.5 text-sm text-emerald-50/80 transition hover:border-emerald-300/50 hover:text-white"
            >
              Request changes
            </button>
          </div>
        )}
        {canAnswer && asking && (
          <div className="mt-3 space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What would you like changed?"
              rows={3}
              autoFocus
              className="w-full rounded-xl border border-emerald-200/15 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50/90 outline-none placeholder:text-emerald-50/30 focus:border-emerald-400/60"
            />
            <div className="flex gap-2">
              <button
                onClick={() => answer(false)}
                disabled={busy || !note.trim()}
                className="flex-1 rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send"}
              </button>
              <button onClick={() => setAsking(false)} className="rounded-xl px-3 py-2 text-sm text-emerald-50/55 transition hover:text-white">
                Back
              </button>
            </div>
          </div>
        )}
        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        {label && (
          <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${label.className}`}>
            <i className={`ti ${label.icon}`} aria-hidden /> {label.text}
          </span>
        )}
      </div>
    </div>
  );
}
