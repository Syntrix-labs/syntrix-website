"use client";

import { motion } from "framer-motion";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-10"
      >

        <div className="text-center mb-10">
          <p className="text-blue-500 uppercase tracking-[0.3em] text-sm mb-4">
            Syntrix Labs
          </p>

          <h1 className="text-4xl font-bold">
            Create Account
          </h1>

          <p className="text-gray-400 mt-4">
            Join Syntrix and start building your next project.
          </p>
        </div>

        <form className="space-y-5">

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

          <input
            type="password"
            placeholder="Password"
            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition"
          />

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-300 py-4 rounded-2xl font-semibold hover:scale-[1.02]"
          >
            Create Account
          </button>

        </form>

        <p className="text-gray-500 text-sm text-center mt-8">
  Already have an account?{" "}

  <a
    href="/login"
    className="text-blue-500 hover:text-blue-400 transition"
  >
    Login
  </a>
</p>

      </motion.div>

    </main>
  );
}