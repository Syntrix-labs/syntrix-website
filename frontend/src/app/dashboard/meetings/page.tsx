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

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 h-fit">
            <h2 className="text-2xl font-bold mb-5">Book Meeting</h2>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 mb-4" />
            <input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 mb-4" />
            <select value={timezone} onChange={(event) => setTimezone(event.target.value)} className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 mb-4">
              <option value="Asia/Kolkata">India - IST</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">New York</option>
              <option value="Europe/London">London</option>
              <option value="Asia/Dubai">Dubai</option>
              <option value="Asia/Singapore">Singapore</option>
            </select>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What do you want to discuss?" className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 mb-4 min-h-28" />
            <button onClick={book} className="w-full bg-blue-500 hover:bg-blue-600 rounded-2xl py-3 font-semibold">Request Schedule</button>
          </div>
        </div>
      </motion.div>
    </DashboardShell>
  );
}

function Panel({ title, items }: { title: string; items: Meeting[] }) {
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
      <h2 className="text-2xl font-bold mb-5">{title}</h2>
      <div className="space-y-4">
        {items.length ? items.map((meeting) => (
          <div key={meeting._id} className="bg-black border border-white/10 rounded-2xl p-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-xl">{meeting.title}</h3>
                <p className="text-gray-400 mt-2">{meeting.date} at {meeting.time} ({meeting.timezone || "Asia/Kolkata"})</p>
                <p className="text-gray-500 mt-1">{meeting.notes}</p>
                {meeting.meetingLink && meeting.meetingLink.startsWith("http") && (
                  <a href={meeting.meetingLink} target="_blank" className="inline-block text-blue-300 mt-3">Join meeting</a>
                )}
                {meeting.meetingLink && !meeting.meetingLink.startsWith("http") && (
                  <p className="text-blue-300 mt-3">{meeting.meetingLink}</p>
                )}
              </div>
              <span className="text-blue-300 bg-blue-500/10 px-3 py-2 h-fit rounded-full text-sm">{meeting.status}</span>
            </div>
          </div>
        )) : <p className="text-gray-500">No records yet.</p>}
      </div>
    </div>
  );
}
