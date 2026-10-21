export function apiPath(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export async function apiFetch(path: string, init?: RequestInit, timeoutMs = 60000) {
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

/** The server renews day-old logins (sliding 30-day sessions); keep the new token. */
export function keepRefreshedToken(response: Response) {
  const fresh = response.headers.get("x-refresh-token");
  if (!fresh) return;
  try {
    localStorage.setItem("token", fresh);
  } catch {
    /* storage unavailable — the current token still works */
  }
}

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(apiPath(path), { headers: authHeaders(), cache: "no-store" });
    keepRefreshedToken(response);
    if (!response.ok) return fallback;
    return await response.json();
  } catch {
    return fallback;
  }
}

export type MeUser = { _id: string; name?: string; email?: string; isAdmin?: boolean; isTeam?: boolean; isMarketingHead?: boolean };
export type MeResult = { status: "ok"; user: MeUser } | { status: "signed-out" } | { status: "offline" };

/**
 * Who is logged in. "signed-out" only when the server says the login is no
 * longer valid (401/404). A slow or sleeping server is "offline" — never a
 * reason to send someone back to the login page.
 */
export async function fetchMe(timeoutMs = 25000): Promise<MeResult> {
  if (typeof window === "undefined") return { status: "offline" };
  if (!localStorage.getItem("token")) return { status: "signed-out" };
  try {
    const res = await apiFetch("/api/auth/me", { headers: authHeaders(), cache: "no-store" }, timeoutMs);
    keepRefreshedToken(res);
    if (res.status === 401 || res.status === 404) return { status: "signed-out" };
    if (!res.ok) return { status: "offline" };
    const user = (await res.json()) as MeUser;
    return user && user._id ? { status: "ok", user } : { status: "offline" };
  } catch {
    return { status: "offline" };
  }
}

/** fetchMe, retrying for about a minute while the server wakes up (Render's free plan sleeps). */
export async function loadMe(onRetry?: (attempt: number) => void, tries = 6): Promise<MeResult> {
  let result = await fetchMe();
  for (let attempt = 1; result.status === "offline" && attempt < tries; attempt++) {
    onRetry?.(attempt);
    await new Promise((r) => setTimeout(r, Math.min(2000 * attempt, 8000)));
    result = await fetchMe();
  }
  return result;
}

/** The login really is over (expired or account removed): clear it and go to the login page. */
export function goToLogin(expired = false) {
  try {
    localStorage.removeItem("token");
  } catch {
    /* ignore */
  }
  window.location.replace(expired ? "/login?session=expired" : "/login");
}
