"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { DashboardSkeleton, EmptyState } from "@/components/dashboard/States";
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
  const [loading, setLoading] = useState(true);

  const loadMeetings = () => apiGet<Meeting[]>("/api/meetings/admin/all", fallbackMeetings).then(setMeetings);

  useEffect(() => {
    loadMeetings().finally(() => setLoading(false));
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

  const pending = meetings.filter((m) => m.status === "Requested");
  const upcoming = meetings.filter((m) => m.status === "Confirmed");
  const past = meetings.filter((m) => m.status === "Completed" || m.status === "Cancelled");

  const renderList = (title: string, items: Meeting[]) =>
    items.length === 0 ? null : (
      <div>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-100/45">{title}</p>
        <div className="space-y-4">
          {items.map((meeting, i) => (
            <motion.div
              key={meeting._id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm"
            >
              <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
                <div>
                  <p className="mb-2 text-sm font-medium text-emerald-300">{meeting.client?.name || "Client"} • {meeting.client?.email}</p>
                  <h2 className="text-2xl font-light tracking-wide">{meeting.title}</h2>
                  <p className="mt-2 font-light text-emerald-50/60">{meeting.date} at {meeting.time} ({meeting.timezone || "Asia/Kolkata"})</p>
                  <p className="mt-2 text-sm text-emerald-50/45">{meeting.notes || "No notes added."}</p>
                  {meeting.meetingLink && <a className="mt-3 inline-block text-emerald-300 transition hover:text-emerald-200" href={meeting.meetingLink} target="_blank">Open meeting link</a>}
                </div>

                <div className="min-w-full space-y-3 xl:min-w-[360px]">
                  <input
                    value={links[meeting._id] ?? meeting.meetingLink ?? ""}
                    onChange={(event) => setLinks({ ...links, [meeting._id]: event.target.value })}
                    placeholder="Paste Google Meet / Zoom link"
                    className="w-full rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => updateMeeting(meeting._id, { status: "Confirmed", meetingLink: links[meeting._id] || meeting.meetingLink })} className="rounded-2xl bg-emerald-500/90 px-4 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98]">Confirm</button>
                    <button onClick={() => updateMeeting(meeting._id, { status: "Completed" })} className="rounded-2xl border border-emerald-200/15 px-4 py-3 transition hover:border-emerald-300/50">Complete</button>
                    <button onClick={() => updateMeeting(meeting._id, { status: "Cancelled" })} className="rounded-2xl border border-emerald-200/15 px-4 py-3 transition hover:border-red-400/50 hover:text-red-200">Cancel</button>
                    <button onClick={() => updateMeeting(meeting._id, { status: "Requested" })} className="rounded-2xl border border-emerald-200/15 px-4 py-3 transition hover:border-amber-400/50 hover:text-amber-200">Reopen</button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );

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
        <SectionHeader
          icon="calendar" eyebrow="Meetings"
          title="Meeting requests and schedule"
          description="Clients request a time from their dashboard. Admin confirms, adds a meeting link, and marks finished calls as completed."
        />

        {meetings.length === 0 ? (
          <EmptyState icon="calendar" title="No meetings yet" hint="Client meeting requests will appear here." />
        ) : (
          <div className="space-y-8">
            {renderList("Pending approval", pending)}
            {renderList("Upcoming", upcoming)}
            {renderList("Past", past)}
          </div>
        )}
      </motion.div>
    </DashboardShell>
  );
}
