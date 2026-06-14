"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type User = { _id?: string; name?: string; email?: string; phone?: string; company?: string; createdAt?: string };

const input =
  "w-full rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-50/85 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60 focus:bg-emerald-950/60";

export default function ProfilePage() {
  const [user, setUser] = useState<User>({});
  const [originalEmail, setOriginalEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<User>("/api/auth/me", {}).then((data) => {
      setUser(data);
      setOriginalEmail(data.email || "");
    });
  }, []);

  const emailChanged = Boolean(user.email && user.email !== originalEmail);

  const requestOtp = async () => {
    setOtpMessage("");
    const res = await fetch(apiPath("/api/auth/profile/request-otp"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ email: user.email }),
    });
    const data = await res.json();
    setOtpMessage(data.message || "OTP request sent.");
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(apiPath("/api/auth/profile"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ ...user, otp }),
      });
      const data = await res.json();
      if (data.success) {
        setOriginalEmail(data.user?.email || user.email || "");
        setOtp("");
        setMsg("Profile saved.");
      } else {
        setMsg(data.message || "Profile update failed.");
      }
    } catch {
      setMsg("Server error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const initial = (user.name || "?").charAt(0).toUpperCase();
  const memberId = user._id ? `SX-${user._id.slice(-4).toUpperCase()}` : "SX-····";
  const since = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }).toUpperCase()
    : "—";

  return (
    <DashboardShell>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <SectionHeader
          icon="user"
          eyebrow="Profile"
          title="Your account"
          description="Update your contact details. Email changes require a one-time code for account security."
        />

        {/* identity card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-4 overflow-hidden rounded-2xl border border-emerald-500/40 p-5"
          style={{ background: "#0c2a1d" }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/10" />
          <div className="relative flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-[0.3em] text-emerald-100/70">SYNTRIX · CLIENT</span>
            <i className="ti ti-rosette-discount-check text-xl text-emerald-400" aria-hidden />
          </div>
          <div className="relative mt-4 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/22 text-2xl font-light text-emerald-100">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xl font-light text-white">{user.name || "Your name"}</p>
              <p className="truncate text-xs text-emerald-100/70">{user.email || "your@email.com"}</p>
            </div>
          </div>
          <div className="relative mt-5 flex flex-wrap gap-x-7 gap-y-3 font-mono">
            <div>
              <p className="text-[9px] tracking-[0.15em] text-emerald-200/40">MEMBER ID</p>
              <p className="mt-1 text-xs text-emerald-50/80">{memberId}</p>
            </div>
            <div>
              <p className="text-[9px] tracking-[0.15em] text-emerald-200/40">SINCE</p>
              <p className="mt-1 text-xs text-emerald-50/80">{since}</p>
            </div>
            <div>
              <p className="text-[9px] tracking-[0.15em] text-emerald-200/40">COMPANY</p>
              <p className="mt-1 text-xs text-emerald-50/80">{user.company || "—"}</p>
            </div>
          </div>
        </motion.div>

        {/* edit form */}
        <div className="rounded-2xl border border-emerald-200/12 bg-emerald-950/30 p-5 backdrop-blur-md md:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-emerald-50/55">Full name</label>
              <input value={user.name || ""} onChange={(e) => setUser({ ...user, name: e.target.value })} className={input} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-emerald-50/55">Phone</label>
              <input value={user.phone || ""} onChange={(e) => setUser({ ...user, phone: e.target.value })} placeholder="Add a number" className={input} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-emerald-50/55">Email</label>
              <input value={user.email || ""} onChange={(e) => setUser({ ...user, email: e.target.value })} className={input} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-emerald-50/55">Company</label>
              <input value={user.company || ""} onChange={(e) => setUser({ ...user, company: e.target.value })} className={input} />
            </div>
          </div>

          {/* security / OTP */}
          <div className={`mt-4 rounded-2xl border p-4 transition ${emailChanged ? "border-amber-500/30 bg-amber-500/[0.06]" : "border-emerald-200/10 bg-emerald-950/40"}`}>
            <p className="flex items-center gap-2 text-sm font-light text-white">
              <i className="ti ti-shield-lock text-emerald-300" aria-hidden /> Email verification
            </p>
            <p className="mt-1 text-xs text-emerald-50/55">
              {emailChanged ? "You changed your email — request a code and enter it to confirm." : "Only needed when you change your email."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={requestOtp}
                disabled={!user.email}
                className="rounded-xl border border-emerald-200/20 px-4 py-2.5 text-sm text-emerald-50/80 transition hover:border-emerald-300/50 hover:text-white disabled:opacity-40"
              >
                Send OTP
              </button>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter code"
                className={`${input} max-w-[160px] tracking-[0.3em]`}
              />
              {otpMessage && <span className="text-xs text-emerald-200">{otpMessage}</span>}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {msg && <span className="text-sm text-emerald-200">{msg}</span>}
          </div>
        </div>
      </motion.div>
    </DashboardShell>
  );
}
