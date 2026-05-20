"use client";

import { motion } from "framer-motion";
import Topbar from "@/components/topbar/Topbar";


export default function SettingsPage() {
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
            Settings
          </p>

          <h1 className="text-5xl font-bold">
            Account Settings
          </h1>

          <p className="text-gray-400 mt-4">
            Manage your profile, preferences, and account details.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">

            <h2 className="text-2xl font-bold mb-6">
              Profile Information
            </h2>

            <div className="space-y-5">

              <input
                type="text"
                placeholder="Full Name"
                className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition"
              />

              <input
                type="email"
                placeholder="Email Address"
                className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition"
              />

            </div>

          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">

            <h2 className="text-2xl font-bold mb-6">
              Security
            </h2>

            <div className="space-y-5">

              <input
                type="password"
                placeholder="New Password"
                className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition"
              />

              <button
                className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-300 py-4 rounded-2xl font-semibold"
              >
                Save Changes
              </button>

            </div>

          </div>

        </div>

      </motion.div>

    </main>
  );
}