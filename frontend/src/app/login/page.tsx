"use client";

import { motion } from "framer-motion";

export default function LoginPage() {
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
            Welcome Back
          </h1>

          <p className="text-gray-400 mt-4">
            Login to access your dashboard and projects.
          </p>
        </div>

        <form className="space-y-6">

          <div>
            <label className="block mb-2 text-sm text-gray-400">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-400">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="text-right mt-3">
  <a
    href="/forgot-password"
    className="text-sm text-blue-500 hover:text-blue-400 transition"
  >
    Forgot Password?
  </a>
</div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-300 py-4 rounded-2xl font-semibold hover:scale-[1.02]"
          >
            Login
          </button>

        </form>

        <p className="text-gray-500 text-sm text-center mt-8">
  Don&apos;t have an account?{" "}
  
  <a
    href="/signup"
    className="text-blue-500 hover:text-blue-400 transition"
  >
    Sign up
  </a>
</p>

      </motion.div>

    </main>
  );
}