// POST /api/maps   body: { "seed": 123456, "size": 4500 }   or   { "demo": true }
//
// Checks the seed + size, then returns the map if it has already been
// generated. Requesting generation of new maps is added with the generator.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { mapStore } from "@/lib/maps/cache";
import { DEMO_MAP } from "@/lib/maps/demo";
import { parseMapRequest } from "@/lib/maps/mapRequest";
import type { LoadMapResponse } from "@/lib/maps/types";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const Body = z.union([
  z.object({ demo: z.literal(true) }),
  z.object({ seed: z.union([z.string().max(20), z.number()]), size: z.union([z.string().max(10), z.number()]) }),
]);

// How many map loads one visitor can do per minute.
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

  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return json({ ok: false, error: "Bad request." }, 400);
  if ("demo" in body.data) return json({ ok: true, map: DEMO_MAP });

  const request = parseMapRequest(body.data.seed, body.data.size);
  if (!request.ok) return json({ ok: false, error: request.error }, 400);

  const map = await mapStore.get(request.value.key);
  if (map) return json({ ok: true, map });

  return json(
    {
      ok: false,
      reason: "not_generated",
      error: "This map hasn't been generated yet, and the map generator isn't connected yet. Try the demo map for now.",
    },
    404,
  );
}

function json(body: LoadMapResponse, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(body, { status, headers });
}
