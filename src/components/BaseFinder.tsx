"use client";

// The main screen: enter seed + size → load the map → show it with its details.
import dynamic from "next/dynamic";
import { useState } from "react";

import type { LoadMapResponse, MapInfo } from "@/lib/maps/types";
import { MapInfoPanel } from "./MapInfoPanel";
import { MapRequestForm, type MapRequestInput } from "./MapRequestForm";

// Leaflet needs the browser's `window`, so only load it in the browser.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <MapPlaceholder text="Loading map viewer…" />,
});

export function BaseFinder() {
  const [map, setMap] = useState<MapInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(input: MapRequestInput) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json().catch(() => null)) as LoadMapResponse | null;
      if (!data) throw new Error("bad response");
      if (data.ok) setMap(data.map);
      else setError(data.error);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <MapRequestForm onSubmit={load} loading={loading} serverError={error} />

      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <section className="relative h-[60vh] min-h-80 overflow-hidden rounded border border-edge lg:h-auto lg:min-h-[70vh] lg:flex-1">
          {map ? (
            <MapView key={map.key} map={map} />
          ) : (
            <MapPlaceholder
              text={loading ? "Fetching map…" : "Enter your server's map seed and size above, or try the demo map."}
            />
          )}
        </section>

        {map && (
          <aside className="w-full shrink-0 lg:w-80">
            <MapInfoPanel map={map} />
          </aside>
        )}
      </div>
    </>
  );
}

function MapPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-80 items-center justify-center bg-panel p-6 text-center text-muted">
      {text}
    </div>
  );
}
