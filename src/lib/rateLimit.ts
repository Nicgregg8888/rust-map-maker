// Simple "N requests per minute per visitor" limiter for our API routes.
//
// Like the Stage 1 cache, this lives in server memory. It protects you while
// developing and on small traffic; in Stage 8 we move it to the database so
// all server copies share one count.
import "server-only";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(
  id: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  // Occasional cleanup so the map doesn't grow forever.
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const b = buckets.get(id);
  if (!b || b.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }
  b.count += 1;
  if (b.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/** Best guess at the visitor's IP (Vercel and most hosts set x-forwarded-for). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
