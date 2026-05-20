"use client";

import { motion } from "framer-motion";
import Topbar from "@/components/topbar/Topbar";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function AdminSettingsPage() {
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
            Settings
          </p>

          <h1 className="text-5xl font-bold">
            Admin Settings
          </h1>

          <p className="text-gray-400 mt-4">
            Manage company settings and admin preferences.
          </p>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-2xl">

          <div className="space-y-6">

            <Input
              placeholder="Company Name"
            />

            <Input
              type="email"
              placeholder="Company Email"
            />

            <Input
              placeholder="Support Contact"
            />

            <Button>
              Save Changes
            </Button>

          </div>

        </div>

      </motion.div>

    </main>
  );
}