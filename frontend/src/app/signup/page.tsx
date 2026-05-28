"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        const next = new URLSearchParams(window.location.search).get("next");
        router.push(next === "meetings" ? "/dashboard/meetings" : "/dashboard");
      } else {
        setMessage(data.message || "Signup failed. Please try again.");
      }
    } catch (error) {
      console.error("SIGNUP ERROR:", error);
      setMessage(error instanceof DOMException && error.name === "AbortError"
        ? "Signup is taking too long. Please try again in a moment."
        : "Server error. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

          <h1 className="text-4xl font-bold">Create Account</h1>

          <p className="text-gray-400 mt-4">
            Join Syntrix and start building your next project.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition"
          />

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              disabled={isSubmitting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 pr-14 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 transition"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((value) => !value)}
              disabled={isSubmitting}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-300 py-4 rounded-2xl font-semibold hover:scale-[1.02]"
          >
            {isSubmitting ? "Creating..." : "Create Account"}
          </button>
        </form>

        {message && (
          <p className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {message}
          </p>
        )}

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
