"use client";

import { motion } from "framer-motion";
import Topbar from "@/components/dashboard/Topbar";

export default function MeetingsPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8 md:p-12">
      <Topbar />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >

        <div className="mb-12">
          <p className="text-blue-500 uppercase tracking-[0.3em] text-sm mb-4">
            Meetings
          </p>

          <h1 className="text-5xl font-bold">
            Upcoming Meetings
          </h1>

          <p className="text-gray-400 mt-4">
            Manage scheduled calls, consultations, and project discussions.
          </p>
        </div>

        <div className="space-y-6">

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 flex items-center justify-between">

            <div>
              <h2 className="text-2xl font-bold mb-2">
                Client Strategy Call
              </h2>

              <p className="text-gray-400">
                Discussion about project planning and launch roadmap.
              </p>
            </div>

            <div className="text-right">
              <p className="text-blue-500 font-semibold">
                21 May
              </p>

              <p className="text-gray-500 text-sm">
                7:30 PM
              </p>
            </div>

          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 flex items-center justify-between">

            <div>
              <h2 className="text-2xl font-bold mb-2">
                UI Review Meeting
              </h2>

              <p className="text-gray-400">
                Reviewing dashboard and mobile responsiveness updates.
              </p>
            </div>

            <div className="text-right">
              <p className="text-blue-500 font-semibold">
                24 May
              </p>

              <p className="text-gray-500 text-sm">
                5:00 PM
              </p>
            </div>

          </div>

        </div>

      </motion.div>

    </main>
  );
}