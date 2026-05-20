"use client";

import { motion } from "framer-motion";
import Topbar from "@/components/topbar/Topbar";

export default function TeamPage() {
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
            Team
          </p>

          <h1 className="text-5xl font-bold">
            Team Management
          </h1>

          <p className="text-gray-400 mt-4">
            Manage developers, designers, and company operations.
          </p>
        </div>

        <div className="space-y-6">

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 flex items-center justify-between">

            <div>
              <h2 className="text-2xl font-bold">
                Soham
              </h2>

              <p className="text-gray-400 mt-2">
                Backend Developer
              </p>
            </div>

            <span className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm">
              Active
            </span>

          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 flex items-center justify-between">

            <div>
              <h2 className="text-2xl font-bold">
                Tahir
              </h2>

              <p className="text-gray-400 mt-2">
                Frontend Developer
              </p>
            </div>

            <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm">
              Online
            </span>

          </div>

        </div>

      </motion.div>

    </main>
  );
}