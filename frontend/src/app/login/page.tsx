"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/brand/BrandLogo";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [loginSucceeded, setLoginSucceeded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  setMessage("");
  setLoginSucceeded(false);

  try {
    const response = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (data.success) {

      localStorage.setItem("token", data.token);

      const next = new URLSearchParams(window.location.search).get("next");
      const destination = next === "meetings" ? "/dashboard/meetings" : data.isAdmin ? "/admin" : "/dashboard";
      setLoginSucceeded(true);
      setMessage("Login successful. Taking you to your dashboard...");
      window.setTimeout(() => router.push(destination), 800);

    } else {

      setMessage(data.message || "Login failed. Please check your email and password.");

    }

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
          <BrandLogo className="mb-7 justify-center" markClassName="h-14 w-14 rounded-2xl" textClassName="text-blue-100" />

          <h1 className="text-4xl font-bold">
            Welcome Back
          </h1>

          <p className="text-gray-400 mt-4">
            Login to access your dashboard and projects.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">

          <div>
            <label className="block mb-2 text-sm text-gray-400">
              Email
            </label>

            <input
              type="email"
              required
              disabled={isSubmitting || loginSucceeded}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 transition"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-400">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={isSubmitting || loginSucceeded}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 pr-14 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 transition"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
                disabled={isSubmitting || loginSucceeded}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
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
            disabled={isSubmitting || loginSucceeded}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70 transition-all duration-300 py-4 rounded-2xl font-semibold hover:scale-[1.02]"
          >
            {loginSucceeded ? "Redirecting..." : isSubmitting ? "Checking..." : "Login"}
          </button>

        </form>

        {message && (
          <div className={`mt-5 rounded-2xl border px-4 py-4 text-sm ${
            loginSucceeded
              ? "border-green-500/30 bg-green-500/10 text-green-100"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}>
            <p className="font-semibold">{loginSucceeded ? "Welcome back" : "Login issue"}</p>
            <p className="mt-1 opacity-90">{message}</p>
          </div>
        )}

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
