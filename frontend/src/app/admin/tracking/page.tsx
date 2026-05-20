"use client";

import { motion } from "framer-motion";
import Topbar from "@/components/topbar/Topbar";

export default function TrackingPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8 md:p-12">

      <Topbar showBack={true} showLogout={false} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >

        <div className="mb-12">
          <p className="text-blue-500 uppercase tracking-[0.3em] text-sm mb-4">
            Project Tracking
          </p>

          <h1 className="text-5xl font-bold">
            Syntrix Business Platform
          </h1>

          <p className="text-gray-400 mt-4">
            Track your project progress, milestones, and delivery updates.
          </p>
        </div>

        <div className="space-y-8">

          {/* Progress Card */}
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-2xl font-bold">
                Overall Progress
              </h2>

              <span className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm">
                78% Complete
              </span>

            </div>

            <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden">
              <div className="w-[78%] h-full bg-blue-500 rounded-full"></div>
            </div>

          </div>

          {/* Timeline */}
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">

            <h2 className="text-2xl font-bold mb-8">
              Project Timeline
            </h2>

            <div className="space-y-6">

              <div className="flex items-start gap-4">

                <div className="w-4 h-4 rounded-full bg-green-500 mt-2"></div>

                <div>
                  <h3 className="text-xl font-semibold">
                    Planning Completed
                  </h3>

                  <p className="text-gray-400">
                    Requirement analysis and roadmap finalized.
                  </p>
                </div>

              </div>

              <div className="flex items-start gap-4">

                <div className="w-4 h-4 rounded-full bg-blue-500 mt-2"></div>

                <div>
                  <h3 className="text-xl font-semibold">
                    Dashboard Development
                  </h3>

                  <p className="text-gray-400">
                    Frontend and backend systems currently in progress.
                  </p>
                </div>

              </div>

              <div className="flex items-start gap-4">

                <div className="w-4 h-4 rounded-full bg-zinc-600 mt-2"></div>

                <div>
                  <h3 className="text-xl font-semibold">
                    Deployment Phase
                  </h3>

                  <p className="text-gray-400">
                    Final testing and production deployment pending.
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

      </motion.div>

    </main>
  );
}