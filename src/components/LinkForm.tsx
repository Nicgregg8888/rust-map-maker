"use client";

import { useState, type FormEvent } from "react";

import { parseMapLink } from "@/lib/rustmaps/parseLink";

interface Props {
  onSubmit: (link: string) => void;
  loading: boolean;
  serverError: string | null;
}

export function LinkForm({ onSubmit, loading, serverError }: Props) {
  const [value, setValue] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    // Check the link in the browser first, so typos get an instant message.
    const parsed = parseMapLink(value);
    if (!parsed.ok) {
      setLocalError(parsed.error);
      return;
    }
    setLocalError(null);
    onSubmit(value);
  }

  const error = localError ?? serverError;

  return (
    <form onSubmit={submit} className="rounded border border-edge bg-panel p-4">
      <label htmlFor="map-link" className="mb-2 block font-display text-sm uppercase tracking-wider text-muted">
        RustMaps link
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="map-link"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://rustmaps.com/map/4500_123456"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "map-link-error" : undefined}
          className="min-w-0 flex-1 rounded border border-edge bg-panel-2 px-3 py-2 text-ink placeholder:text-muted/60 focus:border-rust focus:outline-none"
        />
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
              onSubmit("demo");
            }}
            className="flex-1 rounded border border-edge px-4 py-2 font-display uppercase tracking-wider text-muted hover:border-rust hover:text-ink disabled:opacity-60 sm:flex-none"
          >
            Try demo
          </button>
        </div>
      </div>
      {error && (
        <p id="map-link-error" role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
