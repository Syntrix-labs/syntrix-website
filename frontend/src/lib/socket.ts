import { io, type Socket } from "socket.io-client";

/**
 * Connect to the realtime backend socket. Returns null when no socket URL is
 * configured (NEXT_PUBLIC_SOCKET_URL) or there's no auth token — callers then
 * fall back to polling. The browser talks to the backend directly here (not via
 * the Next /api proxy), so the URL must point at the backend origin.
 */
export function connectSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_SOCKET_URL;
  const token = localStorage.getItem("token");
  if (!url || !token) return null;
  return io(url, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
  });
}

export type { Socket };
