"use client";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
const steps=["Created","Coding Starting","Frontend Review","Test","Final Review","Publish"];
export default function TrackingPage(){return <DashboardShell type="admin"><motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}}><SectionHeader eyebrow="Tracking" title="Manual project tracking" description="Admin members update the project stage manually. Guidelines reminder is shown for the last 5 days before deadline."/><div className="bg-zinc-900 border border-white/10 rounded-3xl p-6"><h2 className="text-2xl font-bold mb-6">Tracking Timeline</h2><div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-8">{steps.map(s=><div key={s} className="bg-black border border-blue-500/30 rounded-2xl p-4 text-blue-200">{s}</div>)}</div><div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 rounded-2xl p-5">Reminder: show project guideline reminder during the last 5 days before deadline.</div></div></motion.div></DashboardShell>}
