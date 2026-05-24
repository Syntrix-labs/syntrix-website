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
  client?: { name?: string; email?: string };
};

const fallbackMeetings: Meeting[] = [
  {
    _id: "demo",
    title: "Website discovery call",
    date: "2026-05-28",
    time: "19:00",
    timezone: "Asia/Kolkata",
    status: "Requested",
    client: { name: "Demo Client", email: "client@example.com" },
    notes: "Client wants custom website and app consultation."
  }
];

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(fallbackMeetings);
  const [links, setLinks] = useState<Record<string, string>>({});

  const loadMeetings = () => {
    apiGet<Meeting[]>("/api/meetings/admin/all", fallbackMeetings).then(setMeetings);
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const updateMeeting = async (id: string, body: Partial<Meeting>) => {
    const response = await fetch(apiPath(`/api/meetings/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      loadMeetings();
    }
  };

  return (
    <DashboardShell type="admin">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          eyebrow="Meetings"
          title="Meeting requests and schedule"
          description="Clients request a time from their dashboard. Admin confirms, adds a meeting link, and marks finished calls as completed."
        />

        <div className="space-y-5">
          {meetings.map((meeting) => (
            <div key={meeting._id} className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
                <div>
                  <p className="text-blue-400 text-sm mb-2">{meeting.client?.name || "Client"} • {meeting.client?.email}</p>
                  <h2 className="text-2xl font-bold">{meeting.title}</h2>
                  <p className="text-gray-400 mt-2">{meeting.date} at {meeting.time} ({meeting.timezone || "Asia/Kolkata"})</p>
                  <p className="text-gray-500 mt-2">{meeting.notes || "No notes added."}</p>
                  {meeting.meetingLink && <a className="text-blue-300 mt-3 inline-block" href={meeting.meetingLink} target="_blank">Open meeting link</a>}
                </div>

                <div className="min-w-full xl:min-w-[360px] space-y-3">
                  <span className="inline-flex bg-blue-500/10 text-blue-300 px-4 py-2 rounded-full text-sm">{meeting.status}</span>
                  <input
                    value={links[meeting._id] ?? meeting.meetingLink ?? ""}
                    onChange={(event) => setLinks({ ...links, [meeting._id]: event.target.value })}
                    placeholder="Paste Google Meet / Zoom link"
                    className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-blue-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => updateMeeting(meeting._id, { status: "Confirmed", meetingLink: links[meeting._id] || meeting.meetingLink })} className="bg-blue-500 hover:bg-blue-600 rounded-2xl px-4 py-3 font-semibold">Confirm</button>
                    <button onClick={() => updateMeeting(meeting._id, { status: "Completed" })} className="border border-white/10 hover:border-green-500 rounded-2xl px-4 py-3">Complete</button>
                    <button onClick={() => updateMeeting(meeting._id, { status: "Cancelled" })} className="border border-white/10 hover:border-red-500 rounded-2xl px-4 py-3">Cancel</button>
                    <button onClick={() => updateMeeting(meeting._id, { status: "Requested" })} className="border border-white/10 hover:border-yellow-500 rounded-2xl px-4 py-3">Reopen</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
