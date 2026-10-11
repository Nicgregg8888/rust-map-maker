// The shape of a loaded map, as used everywhere in OUR app.
// RustMaps' raw response is converted into this so the rest of the code
// never depends on their exact format (easier if their API changes).

export type MapSource = "rustmaps" | "demo";

export interface MonumentPoint {
  /** RustMaps monument type, e.g. "Launch Site", "Harbor 1". */
  type: string;
  /** Custom label from RustMaps, if any (used on custom maps). */
  name: string | null;
  /** World coordinates in metres, exactly as RustMaps gives them. */
  x: number;
  y: number;
}

/** Share of the map's land in each biome, 0–100. Map-wide only (no positions). */
export interface BiomePercentages {
  snow: number;
  desert: number;
  forest: number;
  tundra: number;
  jungle: number;
}

export interface MapStats {
  landPercentage: number | null;
  islands: number | null;
  mountains: number | null;
  iceLakes: number | null;
  rivers: number | null;
  lakes: number | null;
  canyons: number | null;
  oases: number | null;
  buildableRocks: number | null;
}

export interface MapInfo {
  /** Our cache key, e.g. "ss:4500_123456" or "id:<hex>". */
  key: string;
  source: MapSource;
  rustmapsId: string | null;
  seed: number | null;
  size: number;
  isCustomMap: boolean;
  isStaging: boolean;
  /** Link back to the map on rustmaps.com (attribution). */
  pageUrl: string | null;
  imageUrl: string | null;
  rawImageUrl: string | null;
  thumbnailUrl: string | null;
  /** True if RustMaps lets us download the real .map file (used in Stage 2). */
  mapFileAvailable: boolean;
  monuments: MonumentPoint[];
  biomes: BiomePercentages | null;
  stats: MapStats;
  /** When RustMaps says it may delete this map (ISO date), if known. */
  estimatedDeletionDate: string | null;
  /** When we fetched it from RustMaps (ISO date). */
  fetchedAt: string;
}

/** What the browser gets back from POST /api/maps. */
export type LoadMapResponse =
  | { ok: true; map: MapInfo; cached: boolean }
  | { ok: false; error: string };
