/* Syntrix Labs service worker — shows push notifications for new chat messages
   and opens the right conversation when one is tapped. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  // Always show a notification: browsers (Safari especially) revoke push
  // permission from sites that receive pushes without showing one.
  event.waitUntil(
    self.registration.showNotification(data.title || "Syntrix Labs", {
      body: data.body || "You have a new message",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "syntrix-chat",
      renotify: true,
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const win of windows) {
        if (new URL(win.url).origin === self.location.origin) {
          await win.focus();
          if ("navigate" in win) await win.navigate(url).catch(() => {});
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});
