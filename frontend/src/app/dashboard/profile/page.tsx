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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 space-y-4">
            <input value={user.name || ""} onChange={(event) => setUser({ ...user, name: event.target.value })} placeholder="Full name" className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3" />
            <input value={user.email || ""} onChange={(event) => setUser({ ...user, email: event.target.value })} placeholder="Email" className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3" />
            <input value={user.phone || ""} onChange={(event) => setUser({ ...user, phone: event.target.value })} placeholder="Phone" className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3" />
            <input value={user.company || ""} onChange={(event) => setUser({ ...user, company: event.target.value })} placeholder="Company" className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3" />
            <button onClick={save} className="bg-blue-500 hover:bg-blue-600 rounded-2xl px-6 py-3 font-semibold">Save Changes</button>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
            <h2 className="text-2xl font-bold mb-4">Email OTP</h2>
            <p className="text-gray-400 mb-4">
              {emailChanged ? "Request an OTP before saving a changed email address." : "OTP is only required when you change your email."}
            </p>
            <button onClick={requestOtp} disabled={!user.email} className="border border-white/10 hover:border-blue-500 disabled:opacity-40 rounded-2xl px-6 py-3 mb-4">
              Send OTP
            </button>
            {otpMessage && <p className="text-blue-300 mb-4">{otpMessage}</p>}
            <input value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Enter OTP" className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3" />
          </div>
        </div>
      </motion.div>
    </DashboardShell>
  );
}
