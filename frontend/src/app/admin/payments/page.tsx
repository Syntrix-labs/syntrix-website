"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
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

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(fallbackPayments);
  const [form, setForm] = useState({ title: "", amount: "", dueDate: "", clientEmail: "", paymentUrl: "" });

  const loadPayments = () => apiGet<Payment[]>("/api/payments/admin/all", fallbackPayments).then(setPayments);
  useEffect(() => {
    loadPayments();
  }, []);

  const createPayment = async () => {
    const response = await fetch(apiPath("/api/payments"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ ...form, amount: Number(form.amount || 0), status: "Upcoming", provider: form.paymentUrl ? "Razorpay" : "Manual", currency: "INR" })
    });
    if (response.ok) {
      setForm({ title: "", amount: "", dueDate: "", clientEmail: "", paymentUrl: "" });
      loadPayments();
    } else {
      alert("Payment could not be created. Check client email.");
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

  return (
    <DashboardShell type="admin">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader eyebrow="Payments" title="Payment control" description="Create upcoming payments, add payment links, and mark completed payments for client history." />

        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Payment title" className="bg-black border border-white/10 rounded-2xl px-4 py-3" />
          <input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="Amount" type="number" className="bg-black border border-white/10 rounded-2xl px-4 py-3" />
          <input value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} type="date" className="bg-black border border-white/10 rounded-2xl px-4 py-3" />
          <input value={form.clientEmail} onChange={(event) => setForm({ ...form, clientEmail: event.target.value })} placeholder="Client email" className="bg-black border border-white/10 rounded-2xl px-4 py-3" />
          <button onClick={createPayment} className="bg-blue-500 hover:bg-blue-600 rounded-2xl px-5 py-3 font-semibold">Add Payment</button>
          <input value={form.paymentUrl} onChange={(event) => setForm({ ...form, paymentUrl: event.target.value })} placeholder="Payment URL" className="md:col-span-5 bg-black border border-white/10 rounded-2xl px-4 py-3" />
        </div>

        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment._id} className="bg-zinc-900 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{payment.title}</h2>
                <p className="text-gray-400 mt-1">{payment.client?.name || "Client"} • {payment.project?.title || "General"}</p>
                <p className="text-blue-300 mt-1">{payment.currency || "INR"} {payment.amount} • Due: {payment.dueDate || "Not set"} • {payment.status} • {payment.provider || "Manual"}</p>
              </div>
              <button onClick={() => markPaid(payment._id)} className="border border-white/10 hover:border-green-500 rounded-2xl px-5 py-3">Mark Paid</button>
            </div>
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
