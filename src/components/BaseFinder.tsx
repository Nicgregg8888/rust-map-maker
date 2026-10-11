"use client";

// The main screen: enter seed + size → load the map → show it with its details.
// If the map is still being generated, show progress and check again every few seconds.
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { LoadMapResponse, MapInfo } from "@/lib/maps/types";
import { MapInfoPanel } from "./MapInfoPanel";
import { MapRequestForm, type MapRequestInput } from "./MapRequestForm";

// Leaflet needs the browser's `window`, so only load it in the browser.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <MapPlaceholder>Loading map viewer…</MapPlaceholder>,
});

const POLL_MS = 15_000;

type Pending = Extract<LoadMapResponse, { status: "pending" }>;

export function BaseFinder() {
  const [map, setMap] = useState<MapInfo | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Each new request gets a number; answers to older requests are ignored.
  const requestId = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(pollTimer.current), []);

  async function load(input: MapRequestInput, { isPoll = false } = {}) {
    clearTimeout(pollTimer.current);
    const id = isPoll ? requestId.current : ++requestId.current;
    if (!isPoll) {
      setLoading(true);
      setError(null);
      setPending(null);
    }

    try {
      const res = await fetch("/api/maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json().catch(() => null)) as LoadMapResponse | null;
      if (id !== requestId.current) return;
      if (!data) throw new Error("bad response");

      if (!data.ok) {
        setPending(null);
        setError(data.error);
      } else if (data.status === "ready") {
        setPending(null);
        setMap(data.map);
      } else {
        setPending(data);
        pollTimer.current = setTimeout(() => load(input, { isPoll: true }), POLL_MS);
      }
    } catch {
      if (id !== requestId.current) return;
      if (isPoll) {
        // Network blip while waiting: keep waiting rather than giving up.
        pollTimer.current = setTimeout(() => load(input, { isPoll: true }), POLL_MS);
      } else {
        setError("Couldn't reach the server. Check your connection and try again.");
      }
    } finally {
      if (id === requestId.current && !isPoll) setLoading(false);
    }
  }

  return (
    <>
      <MapRequestForm onSubmit={(input) => load(input)} loading={loading} serverError={error} />

      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <section className="relative h-[60vh] min-h-80 overflow-hidden rounded border border-edge lg:h-auto lg:min-h-[70vh] lg:flex-1">
          {pending ? (
            <GeneratingNotice pending={pending} />
          ) : map ? (
            <MapView key={map.key} map={map} />
          ) : (
            <MapPlaceholder>
              {loading ? "Fetching map…" : "Enter your server's map seed and size above, or try the demo map."}
            </MapPlaceholder>
          )}
        </section>

        {map && !pending && (
          <aside className="w-full shrink-0 lg:w-80">
            <MapInfoPanel map={map} />
          </aside>
        )}
      </div>
    </>
  );
}

function GeneratingNotice({ pending }: { pending: Pending }) {
  return (
    <MapPlaceholder>
      <div className="flex max-w-md flex-col items-center gap-3" role="status" aria-live="polite">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-edge border-t-rust" aria-hidden />
        <p className="font-display text-lg uppercase tracking-wider text-ink">
          {pending.state === "generating" ? "Generating this map…" : "Map queued for generation"}
        </p>
        <p>
          {pending.state === "generating"
            ? "Our generator is building this map right now. It usually takes 5–10 minutes."
            : pending.queuePosition
              ? `It's number ${pending.queuePosition} in the queue. Each map takes about 5–10 minutes.`
              : "It's waiting in the queue. Each map takes about 5–10 minutes."}
        </p>
        <p className="text-xs">
          You can leave this page open, it loads by itself when ready. Once a map is generated it loads
          instantly for everyone.
        </p>
      </div>
    </MapPlaceholder>
  );
}

function MapPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-80 items-center justify-center bg-panel p-6 text-center text-muted">
      {children}
    </div>
  );
}
