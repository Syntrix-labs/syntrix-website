"use client";

import { motion } from "framer-motion";
import Topbar from "@/components/topbar/Topbar";

export default function MessagesPage() {
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
            Messages
          </p>

          <h1 className="text-5xl font-bold">
            Client Conversations
          </h1>

          <p className="text-gray-400 mt-4">
            Stay updated with project communication and team discussions.
          </p>
        </div>

        <div className="space-y-6">

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">

              <div>
                <h2 className="text-xl font-bold">
                  Soham
                </h2>

                <p className="text-gray-500 text-sm">
                  Backend Developer
                </p>
              </div>

              <span className="text-blue-500 text-sm">
                2 min ago
              </span>

            </div>

            <p className="text-gray-300">
              Authentication APIs are almost completed.
            </p>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">

              <div>
                <h2 className="text-xl font-bold">
                  Design Team
                </h2>

                <p className="text-gray-500 text-sm">
                  UI Department
                </p>
              </div>

              <span className="text-blue-500 text-sm">
                1 hour ago
              </span>

            </div>

            <p className="text-gray-300">
              New dashboard design revisions uploaded successfully.
            </p>
          </div>

          

        </div>

      </motion.div>

    </main>
  );
}