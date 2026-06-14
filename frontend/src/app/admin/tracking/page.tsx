"use client";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";

const steps = ["Created", "Coding Starting", "Frontend Review", "Test", "Final Review", "Publish"];

export default function TrackingPage() {
  return (
    <DashboardShell type="admin">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <SectionHeader
          eyebrow="Tracking"
          title="Manual project tracking"
          description="Admin members update the project stage manually. A guidelines reminder is shown for the last 5 days before the deadline."
        />
        <div className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm">
          <h2 className="mb-6 text-2xl font-light tracking-wide">Tracking timeline</h2>
          <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-6">
            {steps.map((s, i) => (
              <motion.div
                key={s}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-100"
              >
                {s}
              </motion.div>
            ))}
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-amber-200">
            Reminder: show the project guideline reminder during the last 5 days before the deadline.
          </div>
        </div>
      </motion.div>
    </DashboardShell>
  );
}
