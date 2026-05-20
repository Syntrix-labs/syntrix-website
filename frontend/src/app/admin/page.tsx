"use client";

import { motion } from "framer-motion";
import Topbar from "@/components/topbar/Topbar";
import Card from "@/components/ui/Card";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-black text-white flex">

      {/* Sidebar */}
      <aside className="w-72 bg-zinc-950 border-r border-white/10 p-8 hidden md:flex flex-col">

        <h1 className="text-3xl font-bold text-blue-500 mb-14">
          SYNTRIX ADMIN
        </h1>

        <nav className="flex flex-col gap-6 text-gray-400">

          <a href="#" className="hover:text-white transition">
            Dashboard
          </a>

          <a href="/admin/clients" className="hover:text-white transition">
            Clients
          </a>

          <a href="/admin/projects" className="hover:text-white transition">
            Projects
          </a>

          <a href="/admin/team" className="hover:text-white transition">
            Team
          </a>

          <a href="/admin/tracking" className="hover:text-white transition">
  Tracking
</a>

          <a href="/admin/settings" className="hover:text-white transition">
            Settings
          </a>

          

        </nav>

      </aside>

      {/* Main */}
      <section className="flex-1 p-8 md:p-12">

        <Topbar showBack={false} showLogout={true} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >

          <div className="mb-12">
            <p className="text-blue-500 uppercase tracking-[0.3em] text-sm mb-4">
              Admin Dashboard
            </p>

            <h1 className="text-5xl font-bold">
              Syntrix Control Panel
            </h1>

            <p className="text-gray-400 mt-4">
              Manage clients, projects, revenue, and operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">

            <Card
              title="Total Clients"
              value="28"
            />

            <Card
              title="Active Projects"
              value="14"
            />

            <Card
              title="Revenue"
              value="$12K"
            />

            <Card
              title="Team Members"
              value="08"
            />

          </div>

        </motion.div>

      </section>

    </main>
  );
}