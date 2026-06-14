"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { DashboardSkeleton } from "@/components/dashboard/States";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type Payment = {
  _id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: "Upcoming" | "Paid" | "Overdue";
  paymentUrl?: string;
  provider?: string;
  currency?: string;
  client?: { name?: string; email?: string };
  project?: { title?: string };
};

const fallbackPayments: Payment[] = [
  { _id: "demo", title: "Website milestone", amount: 0, dueDate: "Admin will set", status: "Upcoming", client: { name: "Demo Client" } }
];

const payInput =
  "rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(fallbackPayments);
  const [form, setForm] = useState({ title: "", amount: "", dueDate: "", clientEmail: "", paymentUrl: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPayments = () => apiGet<Payment[]>("/api/payments/admin/all", fallbackPayments).then(setPayments);
  useEffect(() => {
    loadPayments().finally(() => setLoading(false));
  }, []);

  const createPayment = async () => {
    const response = await fetch(apiPath("/api/payments"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ ...form, amount: Number(form.amount || 0), status: "Upcoming", provider: form.paymentUrl ? "Razorpay" : "Manual", currency: "INR" })
    });
    if (response.ok) {
      setForm({ title: "", amount: "", dueDate: "", clientEmail: "", paymentUrl: "" });
      setMsg("");
      loadPayments();
    } else {
      setMsg("Payment could not be created — check the client email.");
    }
  };

  const markPaid = async (id: string) => {
    await fetch(apiPath(`/api/payments/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ status: "Paid" })
    });
    loadPayments();
  };

  if (loading) {
    return (
      <DashboardShell type="admin">
        <DashboardSkeleton />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell type="admin">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader icon="credit-card" eyebrow="Payments" title="Payment control" description="Create upcoming payments, add payment links, and mark completed payments for client history." />

        <div className="mb-6 grid grid-cols-1 gap-4 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm md:grid-cols-5">
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Payment title" className={payInput} />
          <input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="Amount" type="number" className={payInput} />
          <input value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} type="date" className={payInput} />
          <input value={form.clientEmail} onChange={(event) => setForm({ ...form, clientEmail: event.target.value })} placeholder="Client email" className={payInput} />
          <button onClick={createPayment} className="rounded-2xl bg-emerald-500/90 px-5 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98]">Add payment</button>
          <input value={form.paymentUrl} onChange={(event) => setForm({ ...form, paymentUrl: event.target.value })} placeholder="Payment URL" className={`${payInput} md:col-span-5`} />
          {msg && <p className="text-sm text-emerald-200 md:col-span-5">{msg}</p>}
        </div>

        <div className="space-y-4">
          {payments.map((payment, i) => (
            <motion.div
              key={payment._id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="flex flex-col justify-between gap-4 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm md:flex-row md:items-center"
            >
              <div>
                <h2 className="text-2xl font-light tracking-wide">{payment.title}</h2>
                <p className="mt-1 font-light text-emerald-50/60">{payment.client?.name || "Client"} • {payment.project?.title || "General"}</p>
                <p className="mt-1 text-sm text-emerald-300">{payment.currency || "INR"} {payment.amount} • Due: {payment.dueDate || "Not set"} • {payment.status} • {payment.provider || "Manual"}</p>
              </div>
              <button onClick={() => markPaid(payment._id)} className="rounded-2xl border border-emerald-200/15 px-5 py-3 text-emerald-50/80 transition hover:border-emerald-300/50 hover:text-white">Mark paid</button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
