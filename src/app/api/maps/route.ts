// POST /api/maps   body: { "link": "https://rustmaps.com/map/4500_123456" }
//
// Checks the link, then returns the map from our cache, or fetches it from
// RustMaps (using the secret API key, which never leaves the server).
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getOrLoad } from "@/lib/maps/cache";
import { DEMO_MAP, DEMO_MAP_KEY } from "@/lib/maps/demo";
import type { LoadMapResponse } from "@/lib/maps/types";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { fetchMapFromRustMaps, RustMapsError } from "@/lib/rustmaps/client";
import { parseMapLink } from "@/lib/rustmaps/parseLink";

const Body = z.object({ link: z.string().max(500) });

// How many map loads one visitor can do per minute. Cached maps are cheap,
// but this stops one person from hammering RustMaps through our key.
const LIMIT = { limit: 20, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  const limited = rateLimit(`maps:${clientIp(req.headers)}`, LIMIT);
  if (!limited.ok) {
    return json(
      { ok: false, error: `Slow down a little, try again in ${limited.retryAfterSeconds}s.` },
      429,
      { "Retry-After": String(limited.retryAfterSeconds) },
    );
  }

  const parsedBody = Body.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) return json({ ok: false, error: "Bad request." }, 400);

  const input = parsedBody.data.link.trim();
  if (input.toLowerCase() === DEMO_MAP_KEY) {
    return json({ ok: true, map: DEMO_MAP, cached: true });
  }

  const link = parseMapLink(input);
  if (!link.ok) return json({ ok: false, error: link.error }, 400);

  try {
    const { value, cached } = await getOrLoad(link.value.key, () =>
      fetchMapFromRustMaps(link.value),
    );
    return json({ ok: true, map: value.info, cached });
  } catch (err) {
    if (err instanceof RustMapsError) return json({ ok: false, error: err.message }, err.status);
    console.error("[api/maps] unexpected error", err);
    return json({ ok: false, error: "Something went wrong loading that map." }, 500);
  }
}

function json(body: LoadMapResponse, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(body, { status, headers });
}
