"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet } from "@/lib/api";

type Payment = { _id: string; title: string; amount: number; dueDate: string; status: string; paymentUrl?: string; provider?: string; currency?: string };

const fallback: Payment[] = [
  { _id: "demo", title: "Project milestone payment", amount: 0, dueDate: "Admin will set", status: "Upcoming" },
];

const sym = (c?: string) => (c && c !== "INR" ? `${c} ` : "₹");
const money = (n: number, c?: string) => sym(c) + Math.round(n || 0).toLocaleString("en-IN");
const dueText = (s: string) => {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

function MoneyUp({ value, currency }: { value: number; currency?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const s = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - s) / 1300, 1);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{sym(currency) + n.toLocaleString("en-IN")}</>;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(fallback);
  useEffect(() => {
    apiGet<Payment[]>("/api/payments", fallback).then(setPayments);
  }, []);

  const upcoming = payments.filter((p) => p.status !== "Paid");
  const history = payments.filter((p) => p.status === "Paid");
  const currency = upcoming[0]?.currency || payments[0]?.currency || "INR";
  const outstanding = upcoming.reduce((s, p) => s + (p.amount || 0), 0);
  const paidTotal = history.reduce((s, p) => s + (p.amount || 0), 0);

  const dated = upcoming
    .map((p) => ({ p, d: new Date(p.dueDate) }))
    .filter((x) => !Number.isNaN(x.d.getTime()))
    .sort((a, b) => a.d.getTime() - b.d.getTime());
  const nextDue = dated.length ? dated[0].d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) : upcoming[0]?.dueDate || "—";

  return (
    <DashboardShell>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <SectionHeader
          icon="credit-card"
          eyebrow="Payments"
          title="Billing & payments"
          description="Your outstanding balance, upcoming payments, and history. The Pay button appears when a payment link is ready."
        />

        {/* hero */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-2xl border border-emerald-500/40 p-6"
            style={{ background: "#0c2a1d" }}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-400/12" />
            <div className="relative flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-[0.25em] text-emerald-100/70">SYNTRIX · BILLING</span>
              <i className="ti ti-credit-card text-xl text-emerald-400" aria-hidden />
            </div>
            <p className="relative mt-6 text-xs text-emerald-100/60">Outstanding balance</p>
            <p className="relative mt-1 text-4xl font-light text-white">
              <MoneyUp value={outstanding} currency={currency} />
            </p>
            <div className="relative mt-5 flex justify-between text-[11.5px] text-emerald-100/60">
              <span>Next · {nextDue}</span>
              <span>{upcoming.length} payment{upcoming.length === 1 ? "" : "s"} due</span>
            </div>
          </motion.div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-1 flex-col justify-center rounded-2xl border border-emerald-200/12 bg-emerald-950/30 p-4 backdrop-blur-md">
              <p className="text-xs text-emerald-100/60">Paid to date</p>
              <p className="mt-1 text-2xl font-light text-white">{money(paidTotal, currency)}</p>
            </div>
            <div className="flex flex-1 flex-col justify-center rounded-2xl border border-emerald-200/12 bg-emerald-950/30 p-4 backdrop-blur-md">
              <p className="text-xs text-emerald-100/60">Invoices</p>
              <p className="mt-1 text-2xl font-light text-white">{payments.length} total</p>
            </div>
          </div>
        </div>

        {/* due now */}
        {upcoming.length > 0 && (
          <>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-100/45">Due now</p>
            <div className="mb-6 space-y-2.5">
              {upcoming.map((p, i) => {
                const payable = p.paymentUrl && p.paymentUrl.startsWith("http");
                return (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ duration: 0.45, delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-2xl border border-emerald-200/10 bg-emerald-950/40 p-3.5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/14 text-amber-200">
                      <i className="ti ti-clock" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-light text-white">{p.title}</p>
                      <p className="truncate text-xs text-emerald-50/50">Due {dueText(p.dueDate)} {p.provider ? `· ${p.provider}` : ""}</p>
                    </div>
                    <span className="ml-auto text-base font-medium text-white">{money(p.amount, p.currency)}</span>
                    {payable ? (
                      <a href={p.paymentUrl} target="_blank" className="shrink-0 rounded-xl bg-emerald-500/90 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-400">
                        Pay
                      </a>
                    ) : (
                      <span className="shrink-0 rounded-xl border border-emerald-200/15 px-4 py-2 text-xs text-emerald-50/40">Link soon</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* history */}
        {history.length > 0 && (
          <>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-100/45">History</p>
            <div className="space-y-2">
              {history.map((p, i) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  className="flex items-center gap-3 rounded-2xl border border-emerald-200/[0.07] bg-emerald-950/25 p-3.5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/14 text-emerald-300">
                    <i className="ti ti-check" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-light text-white">{p.title}</p>
                    <p className="truncate text-xs text-emerald-50/45">Paid {p.provider ? `· ${p.provider}` : ""}</p>
                  </div>
                  <span className="ml-auto text-base font-medium text-emerald-50/70">{money(p.amount, p.currency)}</span>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {upcoming.length === 0 && history.length === 0 && (
          <p className="text-sm font-light text-emerald-50/50">No payments yet. Anything billable will show up here.</p>
        )}
      </motion.div>
    </DashboardShell>
  );
}
