"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet } from "@/lib/api";

type Payment = { _id: string; title: string; amount: number; dueDate: string; status: string; paymentUrl?: string; provider?: string; currency?: string };
const fallback = [{ _id: "demo", title: "Project milestone payment", amount: 0, dueDate: "Admin will set", status: "Upcoming" } as Payment];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(fallback);
  useEffect(() => { apiGet<Payment[]>("/api/payments", fallback).then(setPayments); }, []);
  const upcoming = payments.filter((p) => p.status !== "Paid");
  const history = payments.filter((p) => p.status === "Paid");
  return (
    <DashboardShell>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <SectionHeader
          eyebrow="Payments"
          title="Payment information"
          description="Upcoming payments and history are controlled by admin. The pay button appears when a payment is ready."
        />
        <PaymentPanel title="Upcoming Payments" items={upcoming} pay />
        <PaymentPanel title="Payment History" items={history} />
      </motion.div>
    </DashboardShell>
  );
}

function PaymentPanel({ title, items, pay }: { title: string; items: Payment[]; pay?: boolean }) {
  return (
    <div className="mb-6 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm">
      <h2 className="mb-5 text-2xl font-light tracking-wide">{title}</h2>
      <div className="space-y-4">
        {items.length ? items.map((p, i) => (
          <motion.div
            key={p._id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-200/10 bg-emerald-950/40 p-5 md:flex-row md:items-center"
          >
            <div>
              <h3 className="text-xl font-light">{p.title}</h3>
              <p className="mt-1 font-light text-emerald-50/60">{p.currency || "INR"} {p.amount} • Due: {p.dueDate}</p>
              <p className="mt-1 text-sm text-emerald-300">{p.status} {p.provider ? `• ${p.provider}` : ""}</p>
            </div>
            {pay && (
              <a
                href={p.paymentUrl || "#"}
                target={p.paymentUrl ? "_blank" : undefined}
                className={`rounded-2xl px-6 py-3 text-center font-medium tracking-wide transition ${
                  p.paymentUrl
                    ? "bg-emerald-500/90 text-white hover:bg-emerald-400 active:scale-[0.98]"
                    : "pointer-events-none bg-emerald-900/40 text-emerald-50/40"
                }`}
              >
                Pay Now
              </a>
            )}
          </motion.div>
        )) : <p className="text-emerald-50/40">No records yet.</p>}
      </div>
    </div>
  );
}
