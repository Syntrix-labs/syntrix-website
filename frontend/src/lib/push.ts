import { apiGet, apiPath, authHeaders } from "@/lib/api";

/** Browser push-notification helpers (service worker at /sw.js). */

export const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

function base64UrlToUint8Array(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const raw = atob((base64Url + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function getPushKey(): Promise<string | null> {
  const res = await apiGet<{ enabled: boolean; publicKey?: string }>("/api/notifications/push/key", { enabled: false });
  return res.enabled && res.publicKey ? res.publicKey : null;
}

/** Subscribe this device and register it to the logged-in user. Needs permission already granted. */
async function subscribeThisDevice(publicKey: string) {
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const appKey = base64UrlToUint8Array(publicKey);
  let sub = await reg.pushManager.getSubscription();
  if (sub) {
    // Re-subscribe if the server's key changed since this device subscribed.
    const current = sub.options.applicationServerKey ? new Uint8Array(sub.options.applicationServerKey) : null;
    if (!current || current.length !== appKey.length || current.some((b, i) => b !== appKey[i])) {
      await sub.unsubscribe();
      sub = null;
    }
  }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
  const res = await fetch(apiPath("/api/notifications/push/subscribe"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  });
  return res.ok;
}

export type EnableResult = "enabled" | "denied" | "unsupported" | "disabled" | "error";

/** Ask for permission (must be called from a tap/click) and subscribe. */
export async function enablePush(): Promise<EnableResult> {
  if (!pushSupported()) return "unsupported";
  const key = await getPushKey();
  if (!key) return "disabled";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";
  try {
    return (await subscribeThisDevice(key)) ? "enabled" : "error";
  } catch {
    return "error";
  }
}

/** Silent refresh: if permission is already granted, make sure this device is linked to the current user. */
export async function syncPush(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  const key = await getPushKey();
  if (!key) return false;
  try {
    return await subscribeThisDevice(key);
  } catch {
    return false;
  }
}

/** On logout: stop sending this user's notifications to this device. */
export async function unlinkThisDevice() {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg && (await reg.pushManager.getSubscription());
    if (!sub) return;
    await fetch(apiPath("/api/notifications/push/unsubscribe"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  } catch {
    /* best effort */
  }
}
