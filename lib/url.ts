/**
 * Resolves the dynamic base application URL across API routes, server actions, and client components.
 * Prioritizes dynamic request headers (Host, X-Forwarded-Host), then window.location, then configured environment variables.
 */
export function getAppUrl(req?: Request): string {
  if (req) {
    try {
      const url = new URL(req.url);
      const host =
        req.headers.get("x-forwarded-host") ||
        req.headers.get("host") ||
        url.host;
      const proto =
        req.headers.get("x-forwarded-proto") ||
        (url.protocol ? url.protocol.replace(":", "") : "https");

      if (host) {
        return `${proto}://${host}`;
      }
      return url.origin;
    } catch {
      // Fallback
    }
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return "https://www.orbitbilling.me";
}
