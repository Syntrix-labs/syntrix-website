"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, { authStagger, authItem, authInputClass } from "@/components/auth/AuthShell";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import NameParticleTransition from "@/components/NameParticleTransition";
import BrandLoader from "@/components/BrandLoader";
import { apiFetch, apiGet } from "@/lib/api";

const OAUTH_ERRORS: Record<string, string> = {
  google_unavailable: "Google sign-in isn't switched on yet. Use email for now.",
  github_unavailable: "GitHub sign-in isn't switched on yet. Use email for now.",
  linkedin_unavailable: "LinkedIn sign-in isn't switched on yet. Use email for now.",
  no_email: "We couldn't read your email from that provider. Try another method.",
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [loginSucceeded, setLoginSucceeded] = useState(false);
  const [waking, setWaking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [transition, setTransition] = useState<{ name: string; destination: string } | null>(null);
  const [intro, setIntro] = useState(true);

  // Always play the brand loader when arriving at the login page.
  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 1800);
    return () => clearTimeout(t);
  }, []);

  // Surface OAuth failures redirected back from the backend (?error=...).
  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (err) setMessage(OAUTH_ERRORS[err] || "That sign-in didn't complete. Please try again.");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setWaking(false);
    setLoginSucceeded(false);

    // The backend (Render free tier) can be asleep and take ~30-60s to wake.
    // Instead of failing on the first timeout, quietly wait + retry a few times.
    const wakingMsg = "Waking up the server — the first login after a while can take up to a minute. Hang tight…";
    let response: Response | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const r = await apiFetch(
          "/api/auth/login",
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) },
          40000
        );
        // 502/503/504 = gateway/cold-start; retry rather than treat as an error.
        if (r.status >= 502 && r.status <= 504 && attempt < 3) {
          setWaking(true);
          setMessage(wakingMsg);
          await new Promise((res) => setTimeout(res, 1500));
          continue;
        }
        response = r;
        break;
      } catch (error) {
        const timedOut = error instanceof DOMException && error.name === "AbortError";
        const network = error instanceof TypeError;
        if ((timedOut || network) && attempt < 3) {
          setWaking(true);
          setMessage(wakingMsg);
          await new Promise((res) => setTimeout(res, 1500));
          continue;
        }
        setWaking(false);
        setMessage("Server error. Please try again in a moment.");
        setIsSubmitting(false);
        return;
      }
    }

    setWaking(false);
    if (!response) {
      setIsSubmitting(false);
      return;
    }

    try {
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        const next = new URLSearchParams(window.location.search).get("next");
        const destination = next === "meetings" ? "/dashboard/meetings" : data.isAdmin ? "/admin" : data.isTeam ? "/admin/my-projects" : "/dashboard";
        setMessage("");
        setLoginSucceeded(true);
        const me = await apiGet<{ name?: string }>("/api/auth/me", {});
        setTransition({ name: me.name || "Welcome", destination });
      } else {
        setMessage(data.message || "Login failed. Please check your email and password.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Server error. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (transition) {
    return (
      <NameParticleTransition
        name={transition.name}
        onComplete={() => router.push(transition.destination)}
      />
    );
  }

  return (
    <>
      <AnimatePresence>
        {intro && (
          <motion.div
            key="login-intro"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[90]"
          >
            <BrandLoader />
          </motion.div>
        )}
      </AnimatePresence>

      <AuthShell cardTitle="Welcome back" cardSubtitle="Login to access your dashboard and projects.">
      <motion.form onSubmit={handleLogin} variants={authStagger} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={authItem}>
          <label className="mb-2 block text-sm text-emerald-50/60">Email</label>
          <input
            type="email"
            required
            disabled={isSubmitting || loginSucceeded}
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
              disabled={isSubmitting || loginSucceeded}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={`${authInputClass} pr-14`}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((value) => !value)}
              disabled={isSubmitting || loginSucceeded}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-emerald-50/50 transition hover:text-white disabled:opacity-40"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </motion.div>

        <motion.div variants={authItem} className="text-right">
          <a href="/forgot-password" className="text-sm text-emerald-300 transition hover:text-emerald-200">Forgot Password?</a>
        </motion.div>

        <motion.button
          variants={authItem}
          type="submit"
          disabled={isSubmitting || loginSucceeded}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-2xl bg-emerald-500/90 py-4 font-semibold tracking-wide text-white shadow-lg shadow-emerald-500/25 transition-colors duration-300 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loginSucceeded ? "Redirecting..." : waking ? "Waking server…" : isSubmitting ? "Checking..." : "Login"}
        </motion.button>
      </motion.form>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-5 rounded-2xl border px-4 py-4 text-sm ${
            loginSucceeded
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
              : waking
              ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          <p className="flex items-center gap-2 font-semibold">
            {waking && <span className="h-2 w-2 animate-ping rounded-full bg-amber-300" />}
            {loginSucceeded ? "Welcome back" : waking ? "Waking the server" : "Login issue"}
          </p>
          <p className="mt-1 opacity-90">{message}</p>
        </motion.div>
      )}

      {!loginSucceeded && <SocialAuthButtons />}

      <p className="mt-8 text-center text-sm text-emerald-50/50">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="text-emerald-300 transition hover:text-emerald-200">Sign up</a>
      </p>
      </AuthShell>
    </>
  );
}
