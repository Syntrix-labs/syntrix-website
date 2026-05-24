"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet } from "@/lib/api";

type Payment={_id:string;title:string;amount:number;dueDate:string;status:string;paymentUrl?:string;provider?:string;currency?:string};
const fallback=[{_id:"demo",title:"Project milestone payment",amount:0,dueDate:"Admin will set",status:"Upcoming"} as Payment];
export default function PaymentsPage(){const[payments,setPayments]=useState<Payment[]>(fallback);useEffect(()=>{apiGet<Payment[]>("/api/payments",fallback).then(setPayments)},[]);const upcoming=payments.filter(p=>p.status!=="Paid");const history=payments.filter(p=>p.status==="Paid");return <DashboardShell><motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}}><SectionHeader eyebrow="Payments" title="Payment information" description="Upcoming payments and history are controlled by admin. Pay button appears when payment is ready."/><PaymentPanel title="Upcoming Payments" items={upcoming} pay/><PaymentPanel title="Payment History" items={history}/></motion.div></DashboardShell>}
function PaymentPanel({title,items,pay}:{title:string;items:Payment[];pay?:boolean}){return <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 mb-6"><h2 className="text-2xl font-bold mb-5">{title}</h2><div className="space-y-4">{items.length?items.map(p=><div key={p._id} className="bg-black border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"><div><h3 className="font-bold text-xl">{p.title}</h3><p className="text-gray-400 mt-1">{p.currency || "INR"} {p.amount} • Due: {p.dueDate}</p><p className="text-blue-300 mt-1">{p.status} {p.provider ? `• ${p.provider}` : ""}</p></div>{pay&&<a href={p.paymentUrl || "#"} target={p.paymentUrl ? "_blank" : undefined} className={`rounded-2xl px-6 py-3 font-semibold text-center ${p.paymentUrl ? "bg-blue-500 hover:bg-blue-600" : "bg-zinc-800 text-gray-500 pointer-events-none"}`}>Pay Now</a>}</div>):<p className="text-gray-500">No records yet.</p>}</div></div>}
