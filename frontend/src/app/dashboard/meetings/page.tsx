"use client";

import { motion } from "framer-motion";
import Topbar from "@/components/topbar/Topbar";

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

          {/* Upcoming Meetings */}

<div className="mt-12">

  <h2 className="text-3xl font-bold mb-6">
    Upcoming Meetings
  </h2>

  <div className="space-y-6">

    {/* Meeting Card */}
    <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">

      <div className="flex items-center justify-between mb-6">

        <div>
          <h3 className="text-2xl font-bold">
            UI Review Meeting
          </h3>

          <p className="text-gray-400 mt-2">
            Discuss dashboard progress and next features.
          </p>
        </div>

        <span className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm">
          Upcoming
        </span>

      </div>

      <div className="space-y-3 text-gray-300">

        <p>
          📅 24 May 2026
        </p>

        <p>
          ⏰ 7:00 PM IST
        </p>

        <p>
          📍 Google Meet
        </p>

      </div>

      <div className="flex gap-4 mt-8">

        <button
          className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-2xl transition-all duration-300 font-semibold"
        >
          Join Meeting
        </button>

        <button
          className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-6 py-3 rounded-2xl transition-all duration-300"
        >
          Schedule
        </button>

      </div>

    </div>

  </div>

</div>

        </div>

      </motion.div>

    </main>
  );
}