"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      setMessage(data.message || (response.ok ? "Reset email sent" : "Unable to send reset email"));
    } catch (error) {
      console.error(error);
      setMessage(error instanceof DOMException && error.name === "AbortError"
        ? "The server is waking up. Please try again in a moment."
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

          <h1 className="text-4xl font-bold">Forgot Password</h1>

          <p className="text-gray-400 mt-4">
            Enter your email to receive a password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 transition-all duration-300 py-4 rounded-2xl font-semibold hover:scale-[1.02]"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <p className="mt-5 rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-gray-200">
            {message}
          </p>
        )}

        <p className="text-gray-500 text-sm text-center mt-8">
          Remember your password?{" "}
          <a href="/login" className="text-blue-500 hover:text-blue-400 transition">
            Login
          </a>
        </p>
      </motion.div>
    </main>
  );
}
