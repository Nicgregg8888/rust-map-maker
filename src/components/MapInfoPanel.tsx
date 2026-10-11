"use client";

import type { MapInfo } from "@/lib/maps/types";

export function MapInfoPanel({ map }: { map: MapInfo }) {
  const isDemo = map.source === "demo";
  const monumentCounts = countBy(map.monuments.map((m) => m.name ?? m.type));

  return (
    <div className="flex flex-col gap-4 rounded border border-edge bg-panel p-4 text-sm">
      {isDemo && (
        <p className="rounded border border-warn/50 bg-warn/10 px-3 py-2 text-warn">
          <strong>DEMO DATA.</strong> This is a made-up sample island, not a real Rust map.
        </p>
      )}

      <section>
        <h2 className="font-display text-lg uppercase tracking-wider">Map</h2>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
          <Row label="Size" value={`${map.size} m`} />
          <Row label="Seed" value={map.seed ?? "—"} />
          <Row label="Source" value={SOURCE_LABEL[map.source]} />
        </dl>
      </section>

      {map.biomes && (
        <section>
          <h2 className="font-display text-lg uppercase tracking-wider">Biomes</h2>
          <p className="text-xs text-muted">Share of the land area.</p>
          <ul className="mt-2 flex flex-col gap-1">
            {Object.entries(map.biomes).map(([name, pct]) => (
              <li key={name} className="flex items-center gap-2">
                <span className="w-16 capitalize">{name}</span>
                <span className="h-2 flex-1 overflow-hidden rounded bg-panel-2">
                  <span className="block h-full bg-rust" style={{ width: `${Math.min(100, pct)}%` }} />
                </span>
                <span className="w-10 text-right tabular-nums text-muted">{round(pct)}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-display text-lg uppercase tracking-wider">
          Monuments <span className="text-muted">({map.monuments.length})</span>
        </h2>
        <ul className="mt-2 max-h-56 overflow-y-auto pr-1">
          {Object.entries(monumentCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, n]) => (
              <li key={name} className="flex justify-between border-b border-edge/50 py-0.5">
                <span>{name}</span>
                {n > 1 && <span className="text-muted">×{n}</span>}
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

const SOURCE_LABEL: Record<MapInfo["source"], string> = {
  generated: "Generated",
  upload: "Uploaded .map",
  demo: "Demo",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </>
  );
}

function countBy(items: string[]) {
  const out: Record<string, number> = {};
  for (const i of items) out[i] = (out[i] ?? 0) + 1;
  return out;
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}
