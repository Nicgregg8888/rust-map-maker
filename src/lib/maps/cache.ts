// Store of maps that have already been generated, so each map is only ever
// generated once and then reused by everyone.
//
// FOR NOW: stored in the server's memory (wiped on restart). Next we swap in
// a Supabase database version of this same interface, which the map
// generator also writes into. Nothing else in the app needs to change.
import "server-only";

import type { MapInfo } from "./types";

export interface MapStore {
  get(key: string): Promise<MapInfo | null>;
  set(map: MapInfo): Promise<void>;
}

class MemoryMapStore implements MapStore {
  private store = new Map<string, MapInfo>();
  // Keep memory use bounded: drop the oldest entries past this many maps.
  private readonly maxEntries = 500;

  async get(key: string) {
    return this.store.get(key) ?? null;
  }

  async set(map: MapInfo) {
    this.store.delete(map.key);
    this.store.set(map.key, map);
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) break;
      this.store.delete(oldest);
    }
  }
}

// Reuse one store across hot reloads while developing.
const globalForStore = globalThis as unknown as { __mapStore?: MapStore };
export const mapStore: MapStore = (globalForStore.__mapStore ??= new MemoryMapStore());
