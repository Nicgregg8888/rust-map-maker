// POST /api/maps   body: { "seed": 123456, "size": 4500 }   or   { "demo": true }
//
// - Map already generated → returns it.
// - Map being generated   → returns its place in the queue (the page asks again every few seconds).
// - Map never seen before → adds it to the generator's queue.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { DEMO_MAP } from "@/lib/maps/demo";
import { parseMapRequest } from "@/lib/maps/mapRequest";
import { getMapStore, type MapLookup } from "@/lib/maps/store";
import type { LoadMapResponse } from "@/lib/maps/types";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const Body = z.union([
  z.object({ demo: z.literal(true) }),
  z.object({ seed: z.union([z.string().max(20), z.number()]), size: z.union([z.string().max(10), z.number()]) }),
]);

// Any request (including the page re-checking a map that's generating).
const REQUEST_LIMIT = { limit: 30, windowMs: 60_000 };
// Asking for a brand-new map costs ~5–10 minutes of generator time, so this is much stricter.
const NEW_MAP_LIMIT = { limit: 5, windowMs: 60 * 60_000 };
// Don't accept new maps when this many are already waiting.
const MAX_QUEUE = 30;

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limited = rateLimit(`maps:${ip}`, REQUEST_LIMIT);
  if (!limited.ok) return tooMany(limited.retryAfterSeconds);

  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return json({ ok: false, error: "Bad request." }, 400);
  if ("demo" in body.data) return json({ ok: true, status: "ready", map: DEMO_MAP });

  const request = parseMapRequest(body.data.seed, body.data.size);
  if (!request.ok) return json({ ok: false, error: request.error }, 400);

  const store = getMapStore();
  if (!store) {
    return json(
      { ok: false, error: "The map database isn't connected yet, so only the demo map works for now." },
      503,
    );
  }

  try {
    let found = await store.lookup(request.value.key);

    if (found.status === "missing") {
      const newMap = rateLimit(`maps-new:${ip}`, NEW_MAP_LIMIT);
      if (!newMap.ok) {
        return json(
          {
            ok: false,
            error: `You've requested a lot of new maps. Please wait ${Math.ceil(newMap.retryAfterSeconds / 60)} min before adding another.`,
          },
          429,
        );
      }
      if ((await store.queueLength()) >= MAX_QUEUE) {
        return json(
          { ok: false, error: "The map generator is very busy right now. Please try again in a while." },
          503,
        );
      }
      await store.enqueue(request.value);
      found = await store.lookup(request.value.key);
    }

    return respond(found);
  } catch (err) {
    console.error("[api/maps]", err);
    return json({ ok: false, error: "Something went wrong loading that map. Please try again." }, 500);
  }
}

function respond(found: MapLookup) {
  switch (found.status) {
    case "ready":
      return json({ ok: true, status: "ready", map: found.map });
    case "queued":
    case "generating":
      return json({ ok: true, status: "pending", state: found.status, queuePosition: found.queuePosition }, 202);
    case "failed":
      return json(
        { ok: false, error: "We couldn't generate this map. Double-check the seed and size, or try again later." },
        500,
      );
    case "missing":
      // Only possible if the row vanished right after we added it.
      return json({ ok: false, error: "Something went wrong queueing that map. Please try again." }, 500);
  }
}

function tooMany(retryAfterSeconds: number) {
  return json({ ok: false, error: `Slow down a little, try again in ${retryAfterSeconds}s.` }, 429, {
    "Retry-After": String(retryAfterSeconds),
  });
}

function json(body: LoadMapResponse, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(body, { status, headers });
}
