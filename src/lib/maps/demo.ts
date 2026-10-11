// A made-up sample map so the site can be tried without a RustMaps API key.
// The UI always labels it "DEMO DATA". Coordinates use the same convention as
// RustMaps: metres from the map centre, x to the east, y to the north.

import type { MapInfo } from "./types";

export const DEMO_MAP_KEY = "demo";
const SIZE = 3000;

/** Convert a pixel on the 1024px demo image into world coordinates. */
function px(x: number, y: number) {
  const s = SIZE / 1024;
  return { x: Math.round(x * s - SIZE / 2), y: Math.round(SIZE / 2 - y * s) };
}

export const DEMO_MAP: MapInfo = {
  key: DEMO_MAP_KEY,
  source: "demo",
  rustmapsId: null,
  seed: null,
  size: SIZE,
  isCustomMap: false,
  isStaging: false,
  pageUrl: null,
  imageUrl: "/demo/demo-map.svg",
  rawImageUrl: "/demo/demo-map.svg",
  thumbnailUrl: "/demo/demo-map.svg",
  mapFileAvailable: false,
  monuments: [
    { type: "Launch Site", name: null, ...px(505, 467) },
    { type: "Military Tunnels", name: null, ...px(785, 580) },
    { type: "Airfield", name: null, ...px(327, 272) },
    { type: "Harbor 1", name: null, ...px(702, 777) },
    { type: "Supermarket", name: null, ...px(235, 630) },
    { type: "Gas Station", name: null, ...px(627, 220) },
    { type: "Outpost", name: null, ...px(420, 835) },
    { type: "Mining Outpost", name: null, ...px(837, 397) },
  ],
  biomes: { snow: 22, desert: 18, forest: 0, tundra: 60, jungle: 0 },
  stats: {
    landPercentage: 58,
    islands: 0,
    mountains: 0,
    iceLakes: 0,
    rivers: 1,
    lakes: 1,
    canyons: 0,
    oases: 0,
    buildableRocks: 0,
    waterPipes: 0,
  },
  estimatedDeletionDate: null,
  fetchedAt: "2026-01-01T00:00:00.000Z",
};
