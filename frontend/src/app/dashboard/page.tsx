"use client";

import { motion } from "framer-motion";

export default function DashboardPage() {
  return (
    <main className="h-screen bg-black text-white flex">

      {/* Sidebar */}
      <aside className="w-72 min-h-screen bg-zinc-950 border-r border-white/10 p-8 hidden md:flex flex-col">

        <h1 className="text-3xl font-bold text-blue-500 mb-14">
          SYNTRIX
        </h1>

        <nav className="flex flex-col gap-6 text-gray-400">

          <a href="#" className="hover:text-white transition">
            Dashboard
          </a>

          <a
  href="/dashboard/projects"
  className="hover:text-white transition"
>
  Projects
</a>

          <a
  href="/dashboard/messages"
  className="hover:text-white transition"
>
  Messages
</a>

          <a
  href="/dashboard/meetings"
  className="hover:text-white transition"
>
  Meetings
</a>

          <a
  href="/dashboard/settings"
  className="hover:text-white transition"
>
  Settings
</a>

        </nav>

        <div>
  <button
    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-all duration-300"
  >
    Logout
  </button>

</div>

      </aside>

      {/* Main Content */}
      <section className="flex-1 p-8 md:p-12">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >

          <div className="mb-12">
            <p className="text-blue-500 uppercase tracking-[0.3em] text-sm mb-4">
              Client Dashboard
            </p>

            <h1 className="text-5xl font-bold">
              Welcome Back, Tahir
            </h1>

            <p className="text-gray-400 mt-4">
              Manage your projects, meetings, files, and updates.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-4">
                Active Projects
              </h2>

              <p className="text-5xl font-bold text-blue-500">
                03
              </p>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-4">
                Unread Messages
              </h2>

              <p className="text-5xl font-bold text-blue-500">
                12
              </p>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-4">
                Scheduled Meetings
              </h2>

              <p className="text-5xl font-bold text-blue-500">
                02
              </p>
            </div>

          </div>
          

        </motion.div>

      </section>

    </main>
  );
}