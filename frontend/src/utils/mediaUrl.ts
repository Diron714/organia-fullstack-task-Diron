/**
 * Build a value suitable for <img src>. Handles data URLs, absolute URLs, and
 * same-origin paths like /uploads/avatars/1.jpg (proxied to the API in dev).
 */
export function resolveAvatarUrl(url?: string | null): string | undefined {
  if (url == null) return undefined;
  const u = String(url).trim();
  if (!u) return undefined;
  if (u.startsWith("data:") || u.startsWith("blob:")) return u;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) {
    const raw = import.meta.env.VITE_API_BASE_URL;
    const base = typeof raw === "string" ? raw.replace(/\/api\/?$/, "").replace(/\/$/, "") : "";
    return base ? `${base}${u}` : u;
  }
  return u;
}
