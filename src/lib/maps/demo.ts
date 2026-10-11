// A made-up sample map so the site can be tried before any real maps exist.
// The UI always labels it "DEMO DATA". Coordinates: metres from the map
// centre, x to the east, y to the north (same as real maps).

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
  seed: null,
  size: SIZE,
  imageUrl: "/demo/demo-map.svg",
  monuments: [
    { type: "Launch Site", name: null, ...px(505, 467) },
    { type: "Military Tunnels", name: null, ...px(785, 580) },
    { type: "Airfield", name: null, ...px(327, 272) },
    { type: "Harbor", name: null, ...px(702, 777) },
    { type: "Supermarket", name: null, ...px(235, 630) },
    { type: "Gas Station", name: null, ...px(627, 220) },
    { type: "Outpost", name: null, ...px(420, 835) },
    { type: "Mining Outpost", name: null, ...px(837, 397) },
  ],
  biomes: { snow: 22, desert: 18, forest: 0, tundra: 60, jungle: 0 },
  generatedAt: "2026-01-01T00:00:00.000Z",
};
