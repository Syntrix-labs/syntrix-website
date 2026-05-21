"use client";

import { motion } from "framer-motion";
import Topbar from "@/components/topbar/Topbar";

export default function ProjectsPage() {
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
            Projects
          </p>

          <h1 className="text-5xl font-bold">
            Your Active Projects
          </h1>

          <p className="text-gray-400 mt-4">
            Track progress, updates, files, and project delivery status.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">

              <h2 className="text-2xl font-bold">
                Syntrix Business Platform
              </h2>

              <span className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm">
                In Progress
              </span>

            </div>

            <p className="text-gray-400 leading-relaxed mb-8">
              Modern business management platform with dashboard,
              authentication system, analytics, and automation features.
            </p>

            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div className="w-[70%] h-full bg-blue-500 rounded-full"></div>
            </div>

            <p className="text-gray-500 text-sm mt-4">
              70% Completed
            </p>

          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">

              <h2 className="text-2xl font-bold">
                Mobile App UI
              </h2>

              <span className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm">
                Planning
              </span>

            </div>

            <p className="text-gray-400 leading-relaxed mb-8">
              UI/UX planning and application architecture for modern
              cross-platform mobile experience.
            </p>

            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div className="w-[25%] h-full bg-yellow-400 rounded-full"></div>
            </div>

            <p className="text-gray-500 text-sm mt-4">
              25% Completed
            </p>

          </div>

          {/* Upload Section */}

<div className="mt-12">

  <h2 className="text-3xl font-bold mb-6">
    Project Uploads
  </h2>

  <div className="bg-zinc-900 border border-dashed border-white/20 rounded-3xl p-12 text-center hover:border-blue-500 transition-all duration-300">

    <div className="text-6xl mb-6">
      Files
    </div>

    <h3 className="text-2xl font-bold mb-4">
      Upload Project Files
    </h3>

    <p className="text-gray-400 mb-8">
      Upload logos, documents, PDFs, and assets.
    </p>

    <button
      className="bg-blue-500 hover:bg-blue-600 px-8 py-4 rounded-2xl transition-all duration-300 font-semibold"
    >
      Choose Files
    </button>

  </div>

</div>

        </div>

      </motion.div>

    </main>
  );
}
