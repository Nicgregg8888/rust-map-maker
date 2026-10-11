// Talks to the RustMaps API. SERVER ONLY.
//
// The "server-only" import below makes the build fail if any browser code
// ever imports this file, so the API key can never leak into the website.
import "server-only";

import type { MapInfo, MonumentPoint } from "@/lib/maps/types";
import type { ParsedMapLink } from "./parseLink";

const API_BASE = "https://api.rustmaps.com/v4";
const TIMEOUT_MS = 15_000;

/** A failure we can show to the user as-is. */
export class RustMapsError extends Error {
  constructor(
    message: string,
    /** HTTP status our own API route should answer with. */
    public readonly status: number,
  ) {
    super(message);
  }
}

export function hasRustMapsKey(): boolean {
  return Boolean(process.env.RUSTMAPS_API_KEY?.trim());
}

/** Result from RustMaps, plus the private .map download link (never sent to browsers). */
export interface FetchedMap {
  info: MapInfo;
  downloadUrl: string | null;
}

export async function fetchMapFromRustMaps(link: ParsedMapLink): Promise<FetchedMap> {
  const apiKey = process.env.RUSTMAPS_API_KEY?.trim();
  if (!apiKey) {
    throw new RustMapsError(
      "This site isn't connected to RustMaps yet (no API key set). Try the demo map instead.",
      503,
    );
  }

  const path =
    link.kind === "id"
      ? `/maps/${encodeURIComponent(link.mapId)}`
      : `/maps/${link.size}/${link.seed}?staging=${link.staging}`;

  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new RustMapsError("Couldn't reach RustMaps. Please try again in a minute.", 502);
  }

  switch (res.status) {
    case 200:
      break;
    case 401:
    case 403:
      // Our key problem, not the user's. Log it for the site owner.
      console.error(`[rustmaps] auth error ${res.status} – check RUSTMAPS_API_KEY`);
      throw new RustMapsError("The map service is temporarily unavailable. Please try again later.", 503);
    case 404:
      throw new RustMapsError(
        "RustMaps doesn't have this map yet. Open the link on rustmaps.com first so it gets generated, then try again.",
        404,
      );
    case 409:
      throw new RustMapsError(
        "RustMaps is still generating this map. Give it a minute or two, then try again.",
        409,
      );
    case 429:
      throw new RustMapsError("Too many map requests right now. Please try again in a minute.", 429);
    default:
      console.error(`[rustmaps] unexpected status ${res.status}`);
      throw new RustMapsError("RustMaps returned an error. Please try again later.", 502);
  }

  const body: unknown = await res.json().catch(() => null);
  const data = (body as { data?: RawMap } | null)?.data;
  if (!data || typeof data !== "object") {
    throw new RustMapsError("RustMaps sent back data we couldn't read.", 502);
  }

  return { info: toMapInfo(link, data), downloadUrl: str(data.downloadUrl) };
}

// ---- Converting RustMaps' format into ours --------------------------------

/** Fields we read from RustMaps (all optional: we never trust outside data). */
interface RawMap {
  id?: unknown;
  seed?: unknown;
  size?: unknown;
  url?: unknown;
  imageUrl?: unknown;
  rawImageUrl?: unknown;
  thumbnailUrl?: unknown;
  isStaging?: unknown;
  isCustomMap?: unknown;
  canDownload?: unknown;
  downloadUrl?: unknown;
  monuments?: unknown;
  landPercentageOfMap?: unknown;
  biomePercentages?: unknown;
  islands?: unknown;
  mountains?: unknown;
  iceLakes?: unknown;
  rivers?: unknown;
  lakes?: unknown;
  canyons?: unknown;
  oases?: unknown;
  buildableRocks?: unknown;
  estimatedDeletionDate?: unknown;
}

function toMapInfo(link: ParsedMapLink, d: RawMap): MapInfo {
  const size = num(d.size) ?? (link.kind === "seedSize" ? link.size : null);
  if (!size) throw new RustMapsError("RustMaps didn't say how big this map is.", 502);

  const b = (d.biomePercentages ?? null) as Record<string, unknown> | null;

  return {
    key: link.key,
    source: "rustmaps",
    rustmapsId: str(d.id),
    seed: num(d.seed) ?? (link.kind === "seedSize" ? link.seed : null),
    size,
    isCustomMap: d.isCustomMap === true,
    isStaging: d.isStaging === true,
    pageUrl: httpsUrl(d.url),
    imageUrl: httpsUrl(d.imageUrl),
    rawImageUrl: httpsUrl(d.rawImageUrl),
    thumbnailUrl: httpsUrl(d.thumbnailUrl),
    mapFileAvailable: d.canDownload === true && Boolean(str(d.downloadUrl)),
    monuments: Array.isArray(d.monuments) ? d.monuments.flatMap(toMonument) : [],
    biomes: b
      ? {
          snow: num(b.s) ?? 0,
          desert: num(b.d) ?? 0,
          forest: num(b.f) ?? 0,
          tundra: num(b.t) ?? 0,
          jungle: num(b.j) ?? 0,
        }
      : null,
    stats: {
      landPercentage: num(d.landPercentageOfMap),
      islands: num(d.islands),
      mountains: num(d.mountains),
      iceLakes: num(d.iceLakes),
      rivers: num(d.rivers),
      lakes: num(d.lakes),
      canyons: num(d.canyons),
      oases: num(d.oases),
      buildableRocks: num(d.buildableRocks),
    },
    estimatedDeletionDate: str(d.estimatedDeletionDate),
    fetchedAt: new Date().toISOString(),
  };
}

function toMonument(raw: unknown): MonumentPoint[] {
  const m = raw as { type?: unknown; nameOverride?: unknown; coordinates?: { x?: unknown; y?: unknown } };
  const x = num(m?.coordinates?.x);
  const y = num(m?.coordinates?.y);
  const type = str(m?.type);
  if (x === null || y === null || !type) return [];
  return [{ type, name: str(m.nameOverride), x, y }];
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

/** Only allow https links into the page (stops javascript: or http: URLs). */
function httpsUrl(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  try {
    return new URL(s).protocol === "https:" ? s : null;
  } catch {
    return null;
  }
}
