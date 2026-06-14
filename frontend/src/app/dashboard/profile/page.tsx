"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type User = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
};

const profileInput =
  "w-full rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-emerald-50/80 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60 focus:bg-emerald-950/60";

export default function ProfilePage() {
  const [user, setUser] = useState<User>({});
  const [originalEmail, setOriginalEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");

  useEffect(() => {
    apiGet<User>("/api/auth/me", {}).then((data) => {
      setUser(data);
      setOriginalEmail(data.email || "");
    });
  }, []);

  const requestOtp = async () => {
    const response = await fetch(apiPath("/api/auth/profile/request-otp"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ email: user.email })
    });
    const data = await response.json();
    setOtpMessage(data.message || "OTP request sent.");
  };

  const save = async () => {
    const response = await fetch(apiPath("/api/auth/profile"), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ ...user, otp })
    });
    const data = await response.json();
    if (data.success) {
      alert("Profile saved.");
      setOriginalEmail(data.user.email || "");
      setOtp("");
      return;
    }
    alert(data.message || "Profile update failed.");
  };

  const emailChanged = Boolean(user.email && user.email !== originalEmail);

  return (
    <DashboardShell>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          eyebrow="Profile"
          title="Edit your information"
          description="Update your contact details. Email changes require OTP verification for account security."
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm">
            <input value={user.name || ""} onChange={(event) => setUser({ ...user, name: event.target.value })} placeholder="Full name" className={profileInput} />
            <input value={user.email || ""} onChange={(event) => setUser({ ...user, email: event.target.value })} placeholder="Email" className={profileInput} />
            <input value={user.phone || ""} onChange={(event) => setUser({ ...user, phone: event.target.value })} placeholder="Phone" className={profileInput} />
            <input value={user.company || ""} onChange={(event) => setUser({ ...user, company: event.target.value })} placeholder="Company" className={profileInput} />
            <button onClick={save} className="rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98]">Save changes</button>
          </div>

          <div className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm">
            <h2 className="mb-4 text-2xl font-light tracking-wide">Email OTP</h2>
            <p className="mb-4 font-light text-emerald-50/60">
              {emailChanged ? "Request an OTP before saving a changed email address." : "OTP is only required when you change your email."}
            </p>
            <button onClick={requestOtp} disabled={!user.email} className="mb-4 rounded-2xl border border-emerald-200/15 px-6 py-3 text-emerald-50/80 transition hover:border-emerald-300/50 hover:text-white disabled:opacity-40">
              Send OTP
            </button>
            {otpMessage && <p className="mb-4 text-emerald-300">{otpMessage}</p>}
            <input value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Enter OTP" className={profileInput} />
          </div>
        </div>
      </motion.div>
    </DashboardShell>
  );
}
