"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { enablePush, getPushKey, isIOS, isStandalone, pushSupported, syncPush } from "@/lib/push";

type Mode = "hidden" | "ask" | "ios-install" | "blocked";
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// "Later" only hides the card for the rest of today — it comes back daily
// until notifications are on (browsers don't allow forcing it).
const SNOOZE_KEY = "syntrix-notify-snooze";
const today = () => new Date().toDateString();

/** Dashboard card that gets people to turn on push notifications (and install the app on iPhone). */
export default function NotifyPrompt() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    const onInstallable = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onInstallable);
    return () => window.removeEventListener("beforeinstallprompt", onInstallable);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const key = await getPushKey();
      if (cancelled || !key) return; // push not switched on server-side yet
      let snoozed = false;
      try {
        snoozed = localStorage.getItem(SNOOZE_KEY) === today();
      } catch {}
      // iPhone/iPad only allow web notifications for apps added to the Home Screen.
      if (isIOS() && !isStandalone()) {
        if (!snoozed) setMode("ios-install");
        return;
      }
      if (!pushSupported()) return;
      if (Notification.permission === "granted") {
        syncPush(); // keep this device linked to whoever is logged in
        return;
      }
      if (!snoozed) setMode(Notification.permission === "denied" ? "blocked" : "ask");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const later = () => {
    try {
      localStorage.setItem(SNOOZE_KEY, today());
    } catch {}
    setMode("hidden");
  };

  const turnOn = async () => {
    setBusy(true);
    setNote("");
    const result = await enablePush();
    setBusy(false);
    if (result === "enabled") {
      setNote("Notifications are on for this device ✓");
      setTimeout(() => setMode("hidden"), 1800);
    } else if (result === "denied") {
      setMode("blocked");
    } else {
      setNote("Couldn't turn notifications on in this browser. Try Chrome, Edge or Safari.");
    }
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice.catch(() => null);
    setInstallEvent(null);
  };

  const copy = {
    ask: {
      title: "Turn on message notifications",
      body: "Get notified the moment someone replies in Consultation — even when this app is closed.",
    },
    "ios-install": {
      title: "Get notifications on your iPhone",
      body: "",
    },
    blocked: {
      title: "Notifications are blocked",
      body: "Your browser is blocking notifications for this site. Tap the 🔒 icon next to the address, set Notifications to Allow, then reload.",
    },
  } as const;

  return (
    <AnimatePresence>
      {mode !== "hidden" && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="relative mb-4 flex items-start gap-3 rounded-2xl border border-emerald-300/25 bg-gradient-to-br from-emerald-500/15 to-emerald-950/40 p-4 backdrop-blur-md md:mb-6 md:gap-4 md:rounded-3xl md:p-5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/20 text-lg text-emerald-100 md:h-11 md:w-11 md:rounded-2xl md:text-xl">
            <i className={`ti ${mode === "blocked" ? "ti-bell-off" : mode === "ios-install" ? "ti-device-mobile" : "ti-bell-ringing"}`} aria-hidden />
          </span>
          <div className="min-w-0 flex-1 pr-6">
            <p className="text-[15px] font-normal text-white md:text-base md:font-light">{copy[mode].title}</p>
            {mode === "ios-install" ? (
              <p className="mt-1 text-[13px] font-light leading-snug text-emerald-50/70 md:text-sm">
                In Safari tap <strong className="font-medium">Share</strong> <i className="ti ti-share-2" aria-hidden /> →{" "}
                <strong className="font-medium">Add to Home Screen</strong>, then open Syntrix from your Home Screen.
              </p>
            ) : (
              <p className="mt-1 text-[13px] font-light leading-snug text-emerald-50/70 md:text-sm">{copy[mode].body}</p>
            )}
            {note && <p className="mt-2 text-xs text-emerald-200">{note}</p>}
            {mode === "ask" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={turnOn}
                  disabled={busy}
                  className="rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-60"
                >
                  {busy ? "Turning on…" : "Turn on"}
                </button>
                {installEvent && (
                  <button onClick={install} className="rounded-xl border border-emerald-200/25 px-4 py-2 text-sm text-emerald-50/85 transition hover:border-emerald-300/50">
                    <i className="ti ti-download mr-1" aria-hidden /> Install app
                  </button>
                )}
              </div>
            )}
          </div>
          {/* "Later": hides it until tomorrow (it returns daily until notifications are on) */}
          <button
            onClick={later}
            aria-label="Remind me tomorrow"
            title="Remind me tomorrow"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-emerald-50/45 transition hover:bg-emerald-200/10 hover:text-white"
          >
            <i className="ti ti-x" aria-hidden />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
