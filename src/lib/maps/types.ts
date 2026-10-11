// The shape of a loaded map, as used everywhere in the app.

/**
 * Where the map data came from:
 * - "generated": our own map generator (a real Rust server) built it from seed + size
 * - "upload":    built from a .map file a server owner uploaded
 * - "demo":      the made-up sample island
 */
export type MapSource = "generated" | "upload" | "demo";

export interface MonumentPoint {
  /** Monument type, e.g. "Launch Site", "Harbor". */
  type: string;
  /** Extra label, if any (e.g. a custom prefab name). */
  name: string | null;
  /** Metres from the map centre: x = east, y = north. */
  x: number;
  y: number;
}

/** Share of the land area in each biome, 0–100. */
export interface BiomePercentages {
  snow: number;
  desert: number;
  forest: number;
  tundra: number;
  jungle: number;
}

export interface MapInfo {
  /** Cache key, e.g. "proc:4500_123456" or "demo". */
  key: string;
  source: MapSource;
  seed: number | null;
  size: number;
  /** Top-down picture of the map. */
  imageUrl: string | null;
  monuments: MonumentPoint[];
  biomes: BiomePercentages | null;
  /** When the map data was produced (ISO date). */
  generatedAt: string;
}

/** What the browser gets back from POST /api/maps. */
export type LoadMapResponse =
  | { ok: true; map: MapInfo }
  | { ok: false; error: string; reason?: "not_generated" };
