// Turns whatever the user pasted into something we can ask RustMaps for.
//
// Accepted inputs:
//   https://rustmaps.com/map/4500_123456          (procedural map: size_seed)
//   https://rustmaps.com/map/4500_123456?staging=true
//   https://rustmaps.com/map/efc8296c9f6e4cacb750dc4ed0a95155   (custom map id)
//   rustmaps.com/map/4500_123456                  (no https://)
//   4500_123456                                   (just the size_seed part)
//
// This file has no secrets and no network calls, so it is safe to use in the
// browser (instant error messages) AND on the server (re-checking input).

export const MIN_MAP_SIZE = 1000;
export const MAX_MAP_SIZE = 6000;
export const MAX_SEED = 2147483647;

export type ParsedMapLink =
  | { kind: "seedSize"; size: number; seed: number; staging: boolean; key: string }
  | { kind: "id"; mapId: string; key: string };

export type ParseResult =
  | { ok: true; value: ParsedMapLink }
  | { ok: false; error: string };

const SIZE_SEED = /^(\d{1,5})_(\d{1,10})$/;
const MAP_ID = /^[0-9a-f]{32}$/i;

const HELP =
  "Paste a RustMaps link like https://rustmaps.com/map/4500_123456 (copy it from your browser's address bar on rustmaps.com).";

export function parseMapLink(raw: string): ParseResult {
  const input = (raw ?? "").trim();
  if (!input) return fail("Please paste a RustMaps link first.");
  if (input.length > 500) return fail("That link is too long to be a RustMaps link.");

  // Bare "4500_123456" with no website in front of it.
  if (SIZE_SEED.test(input)) return fromToken(input, false);

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return fail(`That doesn't look like a link. ${HELP}`);
  }

  const host = url.hostname.toLowerCase();
  if (host !== "rustmaps.com" && !host.endsWith(".rustmaps.com")) {
    return fail(`Only rustmaps.com links are supported (you pasted a ${host} link). ${HELP}`);
  }

  // Path should be /map/<token>, ignoring a trailing slash.
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2 || parts[0].toLowerCase() !== "map") {
    return fail(`That rustmaps.com link isn't a map page. ${HELP}`);
  }

  const staging = url.searchParams.get("staging")?.toLowerCase() === "true";
  return fromToken(decodeURIComponent(parts[1]), staging);
}

function fromToken(token: string, staging: boolean): ParseResult {
  if (MAP_ID.test(token)) {
    const mapId = token.toLowerCase();
    return { ok: true, value: { kind: "id", mapId, key: `id:${mapId}` } };
  }

  const m = SIZE_SEED.exec(token);
  if (!m) return fail(`Couldn't find a map size and seed in that link. ${HELP}`);

  const size = Number(m[1]);
  const seed = Number(m[2]);
  if (size < MIN_MAP_SIZE || size > MAX_MAP_SIZE) {
    return fail(`Map size ${size} is out of range (Rust maps are ${MIN_MAP_SIZE}–${MAX_MAP_SIZE}).`);
  }
  if (seed > MAX_SEED) return fail(`Seed ${seed} is too large to be a Rust seed.`);

  return {
    ok: true,
    value: {
      kind: "seedSize",
      size,
      seed,
      staging,
      key: `ss:${size}_${seed}${staging ? ":staging" : ""}`,
    },
  };
}

function fail(error: string): ParseResult {
  return { ok: false, error };
}
