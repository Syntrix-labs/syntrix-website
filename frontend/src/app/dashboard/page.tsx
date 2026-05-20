"use client";

import { motion } from "framer-motion";
import Topbar from "@/components/topbar/Topbar";
import Card from "@/components/ui/Card";

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


      </aside>

      {/* Main Content */}
      <section className="flex-1 p-8 md:p-12">
        <Topbar showBack={false} showLogout={true} />

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
          
          <Card
  title="Active Projects"
  value="03"
/>

<Card
  title="Unread Messages"
  value="12"
/>

<Card
  title="Scheduled Meetings"
  value="02"
/>
            

      

          </div>
          

        </motion.div>

      </section>

    </main>
  );
}