"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, { authStagger, authItem, authInputClass } from "@/components/auth/AuthShell";
import { apiFetch } from "@/lib/api";

const signupPerks: [string, string][] = [
  ["Start with a free call", "Map your scope, timeline, and budget before you commit."],
  ["Built custom, never templated", "A platform shaped around your business, not a theme."],
  ["Track it all in your dashboard", "Projects, meetings, documents, and payments in one place."],
];

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        const next = new URLSearchParams(window.location.search).get("next");
        router.push(next === "meetings" ? "/dashboard/meetings" : data.isAdmin ? "/admin" : "/dashboard");
      } else {
        setMessage(data.message || "Signup failed. Please try again.");
      }
    } catch (error) {
      console.error("SIGNUP ERROR:", error);
      setMessage(error instanceof DOMException && error.name === "AbortError"
        ? "The server is waking up. Please try again in a moment."
        : "Server error. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      heading="Start building with Syntrix."
      tagline="Create your account to kick off your project and follow it live from your own client dashboard."
      perks={signupPerks}
      cardTitle="Create account"
      cardSubtitle="Join Syntrix and start building your next project."
    >
      <motion.form onSubmit={handleSignup} variants={authStagger} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={authItem}>
          <label className="mb-2 block text-sm text-emerald-50/60">Full name</label>
          <input
            type="text"
            required
            disabled={isSubmitting}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className={authInputClass}
          />
        </motion.div>

        <motion.div variants={authItem}>
          <label className="mb-2 block text-sm text-emerald-50/60">Email</label>
          <input
            type="email"
            required
            disabled={isSubmitting}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className={authInputClass}
          />
        </motion.div>

        <motion.div variants={authItem}>
          <label className="mb-2 block text-sm text-emerald-50/60">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              disabled={isSubmitting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className={`${authInputClass} pr-14`}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((value) => !value)}
              disabled={isSubmitting}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-emerald-50/50 transition hover:text-white disabled:opacity-40"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </motion.div>

        <motion.button
          variants={authItem}
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-2xl bg-emerald-500/90 py-4 font-semibold tracking-wide text-white shadow-lg shadow-emerald-500/25 transition-colors duration-300 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create Account"}
        </motion.button>
      </motion.form>

      {message && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {message}
        </motion.p>
      )}

      <p className="mt-8 text-center text-sm text-emerald-50/50">
        Already have an account?{" "}
        <a href="/login" className="text-emerald-300 transition hover:text-emerald-200">Login</a>
      </p>
    </AuthShell>
  );
}
