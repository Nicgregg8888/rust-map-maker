"use client";

import { useState, type FormEvent } from "react";

import { COMMON_MAP_SIZES, parseMapRequest } from "@/lib/maps/mapRequest";

export type MapRequestInput = { seed: number; size: number } | { demo: true };

interface Props {
  onSubmit: (input: MapRequestInput) => void;
  loading: boolean;
  serverError: string | null;
}

const inputClass =
  "w-full rounded border border-edge bg-panel-2 px-3 py-2 text-ink placeholder:text-muted/60 focus:border-rust focus:outline-none aria-[invalid=true]:border-danger";

export function MapRequestForm({ onSubmit, loading, serverError }: Props) {
  const [seed, setSeed] = useState("");
  const [size, setSize] = useState("");
  const [localError, setLocalError] = useState<{ field: "seed" | "size"; message: string } | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    // Check in the browser first, so typos get an instant message.
    const parsed = parseMapRequest(seed, size);
    if (!parsed.ok) {
      setLocalError({ field: parsed.field, message: parsed.error });
      return;
    }
    setLocalError(null);
    onSubmit({ seed: parsed.value.seed, size: parsed.value.size });
  }

  const error = localError?.message ?? serverError;

  return (
    <form onSubmit={submit} noValidate className="rounded border border-edge bg-panel p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Map seed" htmlFor="map-seed" className="sm:flex-1">
          <input
            id="map-seed"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="e.g. 1337420"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            aria-invalid={localError?.field === "seed"}
            aria-describedby={error ? "map-request-error" : "map-request-help"}
            className={inputClass}
          />
        </Field>

        <Field label="Map size" htmlFor="map-size" className="sm:w-40">
          <input
            id="map-size"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="e.g. 4500"
            list="common-map-sizes"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            aria-invalid={localError?.field === "size"}
            aria-describedby={error ? "map-request-error" : "map-request-help"}
            className={inputClass}
          />
          <datalist id="common-map-sizes">
            {COMMON_MAP_SIZES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded bg-rust px-4 py-2 font-display uppercase tracking-wider text-white hover:bg-rust-bright disabled:opacity-60 sm:flex-none"
          >
            {loading ? "Loading…" : "Load map"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setLocalError(null);
              onSubmit({ demo: true });
            }}
            className="flex-1 rounded border border-edge px-4 py-2 font-display uppercase tracking-wider text-muted hover:border-rust hover:text-ink disabled:opacity-60 sm:flex-none"
          >
            Try demo
          </button>
        </div>
      </div>

      {error ? (
        <p id="map-request-error" role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : (
        <p id="map-request-help" className="mt-2 text-xs text-muted">
          Find the seed and size on your server&apos;s page on a server-listing site, or ask an admin
          (console commands <code>server.seed</code> and <code>server.worldsize</code>).
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block font-display text-sm uppercase tracking-wider text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
