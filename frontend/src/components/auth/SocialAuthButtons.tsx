"use client";

import { motion } from "framer-motion";
import { apiPath } from "@/lib/api";

/** Brand marks (inline SVG so they stay crisp and need no external request). */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.4l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.3 5.2C41.2 36 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z"/>
  </svg>
);
const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/>
  </svg>
);
const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/>
  </svg>
);

const providers: { key: string; label: string; icon: () => React.ReactElement }[] = [
  { key: "google", label: "Continue with Google", icon: GoogleIcon },
  { key: "github", label: "Continue with GitHub", icon: GitHubIcon },
  { key: "linkedin", label: "Continue with LinkedIn", icon: LinkedInIcon },
];

/** Social sign-in buttons. Each is a full-page navigation to the backend
 *  OAuth route (OAuth must run at the top level, not via fetch). */
export default function SocialAuthButtons({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="my-6 flex items-center gap-3 text-xs text-emerald-50/40">
        <span className="h-px flex-1 bg-emerald-200/10" />
        or continue with
        <span className="h-px flex-1 bg-emerald-200/10" />
      </div>
      <div className="space-y-3">
        {providers.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.a
              key={p.key}
              href={apiPath(`/api/auth/oauth/${p.key}`)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-emerald-200/15 bg-emerald-950/40 py-3.5 text-sm font-medium text-emerald-50/85 transition-colors duration-300 hover:border-emerald-300/40 hover:bg-emerald-950/70"
            >
              <Icon />
              {p.label}
            </motion.a>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-emerald-50/40">
        By continuing you agree to our{" "}
        <a href="/terms" className="underline transition hover:text-emerald-200">Terms</a> and{" "}
        <a href="/privacy" className="underline transition hover:text-emerald-200">Privacy Policy</a>.
      </p>
    </div>
  );
}
