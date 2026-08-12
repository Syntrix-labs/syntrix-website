"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import AuthShell, { authStagger, authItem, authInputClass } from "@/components/auth/AuthShell";
import { apiFetch } from "@/lib/api";

const forgotPerks: [string, string][] = [
  ["Quick & secure reset", "We email you a one-time link to set a new password."],
  ["Your data stays protected", "Reset tokens expire and never expose your account."],
  ["Back in, in a minute", "Follow the link, choose a password, and you're done."],
];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setSent(response.ok);
      setMessage(data.message || (response.ok ? "Reset email sent" : "Unable to send reset email"));
    } catch (error) {
      console.error(error);
      setSent(false);
      setMessage(error instanceof DOMException && error.name === "AbortError"
        ? "The server is waking up. Please try again in a moment."
        : "Server error. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      heading="Let's get you back in."
      tagline="Forgot your password? Enter your email and we'll send a secure link to reset it."
      perks={forgotPerks}
      cardTitle="Forgot password"
      cardSubtitle="Enter your email to receive a password reset link."
    >
      <motion.form onSubmit={handleSubmit} variants={authStagger} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={authItem}>
          <label className="mb-2 block text-sm text-emerald-50/60">Email</label>
          <input
            type="email"
            required
            disabled={isSubmitting}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            className={authInputClass}
          />
        </motion.div>

        <motion.button
          variants={authItem}
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-2xl bg-emerald-500/90 py-4 font-semibold tracking-wide text-white shadow-lg shadow-emerald-500/25 transition-colors duration-300 hover:bg-emerald-400 disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </motion.button>
      </motion.form>

      {message && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
            sent ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-emerald-200/15 bg-emerald-950/40 text-emerald-50/80"
          }`}
        >
          {message}
        </motion.p>
      )}

      <p className="mt-8 text-center text-sm text-emerald-50/50">
        Remember your password?{" "}
        <a href="/login" className="text-emerald-300 transition hover:text-emerald-200">Login</a>
      </p>
    </AuthShell>
  );
}
