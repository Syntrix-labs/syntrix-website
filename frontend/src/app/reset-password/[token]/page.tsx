"use client";

import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell, { authStagger, authItem, authInputClass } from "@/components/auth/AuthShell";
import { apiPath } from "@/lib/api";

const resetPerks: [string, string][] = [
  ["Choose a strong password", "At least 6 characters — longer is better."],
  ["One-time secure link", "This reset link works once and then expires."],
  ["Straight back to your dashboard", "Sign in with your new password right away."],
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setSucceeded(false);

    try {
      const response = await fetch(apiPath(`/api/auth/reset-password/${params.token}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();

      if (data.success) {
        setSucceeded(true);
        setMessage("Password reset successful. Taking you to login...");
        window.setTimeout(() => router.push("/login"), 1200);
      } else {
        setMessage(data.message || "Unable to reset password. The link may have expired.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Server error. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      heading="Set a new password."
      tagline="Almost there — choose a new password and you'll be back in your dashboard in seconds."
      perks={resetPerks}
      cardTitle="Reset password"
      cardSubtitle="Choose a new password for your account."
    >
      <motion.form onSubmit={handleSubmit} variants={authStagger} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={authItem}>
          <label className="mb-2 block text-sm text-emerald-50/60">New password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              disabled={isSubmitting || succeeded}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className={`${authInputClass} pr-14`}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((value) => !value)}
              disabled={isSubmitting || succeeded}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-emerald-50/50 transition hover:text-white disabled:opacity-40"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </motion.div>

        <motion.button
          variants={authItem}
          type="submit"
          disabled={isSubmitting || succeeded}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-2xl bg-emerald-500/90 py-4 font-semibold tracking-wide text-white shadow-lg shadow-emerald-500/25 transition-colors duration-300 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {succeeded ? "Redirecting..." : isSubmitting ? "Saving..." : "Reset Password"}
        </motion.button>
      </motion.form>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-5 rounded-2xl border px-4 py-4 text-sm ${
            succeeded ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          <p className="font-semibold">{succeeded ? "All set" : "Reset issue"}</p>
          <p className="mt-1 opacity-90">{message}</p>
        </motion.div>
      )}

      <p className="mt-8 text-center text-sm text-emerald-50/50">
        Back to{" "}
        <a href="/login" className="text-emerald-300 transition hover:text-emerald-200">Login</a>
      </p>
    </AuthShell>
  );
}
