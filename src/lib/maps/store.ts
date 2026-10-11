// Looks up generated maps in the database and queues new ones for the
// map generator. SERVER ONLY (uses the Supabase secret key).
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { MapRequest } from "./mapRequest";
import { MapSummarySchema } from "./schema";
import type { MapInfo, MapSource } from "./types";

const BUCKET = "maps";

export type MapLookup =
  | { status: "ready"; map: MapInfo }
  | { status: "queued" | "generating"; queuePosition: number | null }
  | { status: "failed" }
  | { status: "missing" };

interface MapRow {
  key: string;
  seed: number | null;
  size: number;
  source: MapSource;
  status: "queued" | "generating" | "ready" | "failed";
  info: unknown;
  image_path: string | null;
  requested_at: string;
}

export class MapStore {
  constructor(private db: SupabaseClient) {}

  async lookup(key: string): Promise<MapLookup> {
    const { data, error } = await this.db
      .from("maps")
      .select("key, seed, size, source, status, info, image_path, requested_at")
      .eq("key", key)
      .maybeSingle<MapRow>();
    if (error) throw new Error(`maps lookup failed: ${error.message}`);
    if (!data) return { status: "missing" };

    switch (data.status) {
      case "ready":
        return this.toReady(data);
      case "queued":
        return { status: "queued", queuePosition: await this.queuePosition(data.requested_at) };
      case "generating":
        return { status: "generating", queuePosition: null };
      case "failed":
        return { status: "failed" };
    }
  }

  /** Add a map to the generator's queue (does nothing if it's already there). */
  async enqueue(req: MapRequest): Promise<void> {
    const { error } = await this.db
      .from("maps")
      .upsert({ key: req.key, seed: req.seed, size: req.size }, { onConflict: "key", ignoreDuplicates: true });
    if (error) throw new Error(`maps enqueue failed: ${error.message}`);
  }

  /** How many maps are waiting to be generated. */
  async queueLength(): Promise<number> {
    const { count, error } = await this.db
      .from("maps")
      .select("key", { count: "exact", head: true })
      .eq("status", "queued");
    if (error) throw new Error(`maps queue count failed: ${error.message}`);
    return count ?? 0;
  }

  private async queuePosition(requestedAt: string): Promise<number | null> {
    const { count, error } = await this.db
      .from("maps")
      .select("key", { count: "exact", head: true })
      .eq("status", "queued")
      .lt("requested_at", requestedAt);
    return error ? null : (count ?? 0) + 1;
  }

  private toReady(row: MapRow): MapLookup {
    const summary = MapSummarySchema.safeParse(row.info);
    if (!summary.success) {
      console.error(`[maps] bad info for ${row.key}`, summary.error.issues.slice(0, 3));
      return { status: "failed" };
    }
    const imageUrl = row.image_path
      ? this.db.storage.from(BUCKET).getPublicUrl(row.image_path).data.publicUrl
      : null;
    return {
      status: "ready",
      map: {
        key: row.key,
        source: row.source,
        seed: row.seed,
        size: row.size,
        imageUrl,
        ...summary.data,
      },
    };
  }
}

/** Null until Supabase keys are set in .env.local. */
export function getMapStore(): MapStore | null {
  const db = getSupabaseAdmin();
  return db ? new MapStore(db) : null;
}
