export function apiPath(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export async function apiFetch(path: string, init?: RequestInit, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(apiPath(path), {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

export function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { "x-auth-token": token } : {};
}

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(apiPath(path), { headers: authHeaders(), cache: "no-store" });
    if (!response.ok) return fallback;
    return await response.json();
  } catch {
    return fallback;
  }
}
