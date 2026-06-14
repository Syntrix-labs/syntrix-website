"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type Meeting = {
  _id: string;
  title: string;
  date: string;
  time: string;
  timezone?: string;
  status: "Requested" | "Confirmed" | "Completed" | "Cancelled";
  meetingLink?: string;
  meetingPlatform?: string;
  notes?: string;
};

const fallback: Meeting[] = [
  {
    _id: "demo",
    title: "Project consultation",
    date: "Admin will confirm",
    time: "Requested",
    timezone: "Your timezone",
    status: "Requested",
    notes: "Your meeting requests and confirmed calls will appear here."
  }
];

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(fallback);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [notes, setNotes] = useState("");

  const loadMeetings = () => apiGet<Meeting[]>("/api/meetings", fallback).then(setMeetings);
  useEffect(() => {
    loadMeetings();
  }, []);

  const book = async () => {
    if (!date || !time) return alert("Choose date and time");
    const response = await fetch(apiPath("/api/meetings/book"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ title: "Client consultation", date, time, timezone, notes })
    });
    if (response.ok) {
      alert("Meeting request sent. After admin accepts, it will move to upcoming automatically.");
      setDate("");
      setTime("");
      setNotes("");
      loadMeetings();
    }
  };

  const pending = meetings.filter((meeting) => meeting.status === "Requested");
  const upcoming = meetings.filter((meeting) => meeting.status === "Confirmed");
  const history = meetings.filter((meeting) => meeting.status === "Completed" || meeting.status === "Cancelled");

  return (
    <DashboardShell>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          eyebrow="Meetings"
          title="Book meetings and track history"
          description="Request a meeting in your timezone. After Syntrix accepts it, the confirmed meeting and link appear here automatically."
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Panel title="Pending Admin Approval" items={pending} />
            <Panel title="Upcoming Meetings" items={upcoming} />
            <Panel title="Meeting History" items={history} />
          </div>

          <div className="h-fit rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm">
            <h2 className="mb-5 text-2xl font-light tracking-wide">Book a meeting</h2>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mb-4 w-full rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition focus:border-emerald-400/60" />
            <input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="mb-4 w-full rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition focus:border-emerald-400/60" />
            <select value={timezone} onChange={(event) => setTimezone(event.target.value)} className="mb-4 w-full rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition focus:border-emerald-400/60">
              <option value="Asia/Kolkata">India - IST</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">New York</option>
              <option value="Europe/London">London</option>
              <option value="Asia/Dubai">Dubai</option>
              <option value="Asia/Singapore">Singapore</option>
            </select>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What do you want to discuss?" className="mb-4 min-h-28 w-full rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60" />
            <button onClick={book} className="w-full rounded-2xl bg-emerald-500/90 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98]">Request schedule</button>
          </div>
        </div>
      </motion.div>
    </DashboardShell>
  );
}

function Panel({ title, items }: { title: string; items: Meeting[] }) {
  return (
    <div className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm">
      <h2 className="mb-5 text-2xl font-light tracking-wide">{title}</h2>
      <div className="space-y-4">
        {items.length ? items.map((meeting, i) => (
          <motion.div
            key={meeting._id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="rounded-2xl border border-emerald-200/10 bg-emerald-950/40 p-5"
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <h3 className="text-xl font-light">{meeting.title}</h3>
                <p className="mt-2 font-light text-emerald-50/60">{meeting.date} at {meeting.time} ({meeting.timezone || "Asia/Kolkata"})</p>
                <p className="mt-1 text-sm text-emerald-50/40">{meeting.notes}</p>
                {meeting.meetingLink && meeting.meetingLink.startsWith("http") && (
                  <a href={meeting.meetingLink} target="_blank" className="mt-3 inline-block text-emerald-300 transition hover:text-emerald-200">Join meeting</a>
                )}
                {meeting.meetingLink && !meeting.meetingLink.startsWith("http") && (
                  <p className="mt-3 text-emerald-300">{meeting.meetingLink}</p>
                )}
              </div>
              <span className="h-fit rounded-full bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{meeting.status}</span>
            </div>
          </motion.div>
        )) : <p className="text-emerald-50/40">No records yet.</p>}
      </div>
    </div>
  );
}
