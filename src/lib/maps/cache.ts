// Map cache: each map is fetched from RustMaps only once, then reused.
//
// STAGE 1: stored in the server's memory. That works while you run the site
// on your computer, but it's wiped on restart, and on Vercel each server copy
// has its own memory. In Stage 6 (when we set up Supabase) we swap in a
// database-backed version of this same interface, and nothing else changes.
import "server-only";

import type { MapInfo } from "./types";

export interface CachedMap {
  info: MapInfo;
  /** Private .map download link from RustMaps. Never sent to the browser. */
  downloadUrl: string | null;
}

export interface MapCache {
  get(key: string): Promise<CachedMap | null>;
  set(key: string, value: CachedMap): Promise<void>;
}

class MemoryMapCache implements MapCache {
  private store = new Map<string, CachedMap>();
  // Keep memory use bounded: drop the oldest entries past this many maps.
  private readonly maxEntries = 500;

  async get(key: string) {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: CachedMap) {
    this.store.delete(key);
    this.store.set(key, value);
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) break;
      this.store.delete(oldest);
    }
  }
}

// Reuse one cache across hot reloads while developing.
const globalForCache = globalThis as unknown as { __mapCache?: MapCache };
export const mapCache: MapCache = (globalForCache.__mapCache ??= new MemoryMapCache());

/**
 * If several people load the same un-cached map at the same moment, only one
 * request goes to RustMaps and the others wait for it.
 */
const inFlight = new Map<string, Promise<CachedMap>>();

export async function getOrLoad(
  key: string,
  load: () => Promise<CachedMap>,
): Promise<{ value: CachedMap; cached: boolean }> {
  const hit = await mapCache.get(key);
  if (hit) return { value: hit, cached: true };

  let pending = inFlight.get(key);
  if (!pending) {
    pending = load()
      .then(async (v) => {
        await mapCache.set(key, v);
        return v;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }
  return { value: await pending, cached: false };
}
