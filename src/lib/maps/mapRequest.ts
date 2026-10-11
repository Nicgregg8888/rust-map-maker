// Checks the seed + map size a user typed in.
//
// Every normal ("procedural") Rust map is built from just these two numbers,
// so they're all we need to generate the map ourselves. This file has no
// secrets, so it runs in the browser (instant error messages) AND on the
// server (never trust what the browser sends).

export const MIN_MAP_SIZE = 1000;
export const MAX_MAP_SIZE = 6000;
export const MAX_SEED = 2147483647;

/** Sizes most servers use, offered as suggestions in the form. */
export const COMMON_MAP_SIZES = [3000, 3500, 3750, 4000, 4250, 4500, 5000];

export interface MapRequest {
  seed: number;
  size: number;
  /** Cache key, e.g. "proc:4500_123456". Same map → same key. */
  key: string;
}

export type MapRequestResult =
  | { ok: true; value: MapRequest }
  | { ok: false; error: string; field: "seed" | "size" };

export function parseMapRequest(seedInput: unknown, sizeInput: unknown): MapRequestResult {
  const seed = toWholeNumber(seedInput);
  if (seed === "empty") return { ok: false, field: "seed", error: "Enter the server's map seed." };
  if (seed === "invalid" || seed < 0 || seed > MAX_SEED) {
    return {
      ok: false,
      field: "seed",
      error: `The seed must be a whole number from 0 to ${MAX_SEED.toLocaleString("en-GB")}.`,
    };
  }

  const size = toWholeNumber(sizeInput);
  if (size === "empty") return { ok: false, field: "size", error: "Enter the map size (for example 4500)." };
  if (size === "invalid" || size < MIN_MAP_SIZE || size > MAX_MAP_SIZE) {
    return {
      ok: false,
      field: "size",
      error: `The map size must be a whole number from ${MIN_MAP_SIZE} to ${MAX_MAP_SIZE}.`,
    };
  }

  return { ok: true, value: { seed, size, key: mapKey(seed, size) } };
}

export function mapKey(seed: number, size: number) {
  return `proc:${size}_${seed}`;
}

function toWholeNumber(v: unknown): number | "empty" | "invalid" {
  if (typeof v === "number") return Number.isSafeInteger(v) ? v : "invalid";
  if (typeof v !== "string") return v == null ? "empty" : "invalid";
  // Allow "4,500" or "4 500" as people often type them.
  const s = v.trim().replace(/[,\s_]/g, "");
  if (!s) return "empty";
  if (!/^\d{1,10}$/.test(s)) return "invalid";
  return Number(s);
}
