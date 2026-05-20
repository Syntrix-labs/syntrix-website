"use client";

import { motion } from "framer-motion";
import Topbar from "@/components/topbar/Topbar";

export default function AdminProjectsPage() {
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
            Projects
          </p>

          <h1 className="text-5xl font-bold">
            Project Management
          </h1>

          <p className="text-gray-400 mt-4">
            Track and manage all active Syntrix projects.
          </p>
        </div>

        <div className="space-y-6">

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-2xl font-bold">
                Syntrix Business Platform
              </h2>

              <span className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm">
                In Progress
              </span>

            </div>

            <p className="text-gray-400 mb-8">
              Full-stack SaaS dashboard system with authentication,
              admin panel, analytics, and automation features.
            </p>

            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div className="w-[78%] h-full bg-blue-500 rounded-full"></div>
            </div>

            <p className="text-gray-500 text-sm mt-4">
              78% Completed
            </p>

          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-2xl font-bold">
                Mobile Client App
              </h2>

              <span className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm">
                Planning
              </span>

            </div>

            <p className="text-gray-400 mb-8">
              Cross-platform mobile app design and development planning.
            </p>

            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div className="w-[25%] h-full bg-yellow-400 rounded-full"></div>
            </div>

            <p className="text-gray-500 text-sm mt-4">
              25% Completed
            </p>

          </div>

        </div>

      </motion.div>

    </main>
  );
}