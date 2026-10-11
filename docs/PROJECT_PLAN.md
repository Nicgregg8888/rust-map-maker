# Rust Base Finder: project plan & decisions

This file is the hand-over between work sessions. **Read it first** before continuing.
The full original brief is in the first message of the project; this captures the decisions made since.

## Owner context

- The owner is a **beginner**. Explain simply, give exact commands and where to run them, and do as
  much setup as possible. Give step-by-step account sign-up instructions when needed.
- Work in stages; after each stage: run checks, commit, push, and explain how to run and test it.
- Ask when something is unclear or there are several good options.
- Develop on branch `claude/peaceful-tesla-6qe2x2`.
- Never ask the owner to paste keys or passwords into chat. Secrets go in `.env.local` (git-ignored) or
  the hosting/cloud-environment settings.

## Key decisions

| Topic | Decision |
|---|---|
| Stack | Next.js 16 (App Router) + TypeScript + Tailwind v4 + Leaflet (react-leaflet) + Supabase + Vercel |
| Map data source | **No RustMaps.** Their TOS needs written permission for showing their content, and the owner chose not to rely on it. |
| Main source | **Our own map generator**: a Rust dedicated server (SteamCMD) + Oxide/uMod + our plugin that exports map data for a seed + size, then quits. Each map generated once, cached in Supabase. |
| Generator host | The **owner's Windows PC** (24 GB RAM) at first; a cloud server (~$20–40/month) later if needed. |
| Other sources | `.map` file upload (server owners; load via the same generator for identical output) and **screenshot upload** fallback (analysed in the browser, never stored, everything labelled "estimated"). |
| Logins | Email + Discord at launch (Supabase Auth). Steam later. |
| Database | Supabase (free tier). Moved earlier than planned: needed in Stage 1b for the map cache + generator job queue. |
| Scoring | Runs in the browser in a Web Worker. All weights in one commented config file. |
| Look | Dark, gritty survival theme. No Facepunch/Rust logos or artwork. |

## Stages

| Stage | What | Status |
|---|---|---|
| 1 | Next.js setup, seed + size form, map viewer, demo island | ✅ done |
| 1b | Map generator + Supabase (cache + job queue) | 🟡 website + database done; generator next |
| 2 | Map layers (monuments, roads, rail, rivers, recyclers, biomes) + `.map` upload + screenshot fallback | |
| 3 | Requirements panel + scoring engine (Web Worker) | |
| 4 | Pins + info panel (pros/cons, wipe tips, base designs) | |
| 5 | Clan predictions (zones + A* routes) | |
| 6 | Accounts, saving, comparing, share links | |
| 7 | Community reports + moderation | |
| 8 | Premium-ready setup (plan field, feature flags), security review, deploy to Vercel | |

## Stage 1b plan (map generator)

**Generator blocker:** network is now open, but this session's auto-mode safety check denied downloading and
running SteamCMD/the Rust server. The owner must approve that (or add a Bash permission rule) before
the generator can be developed and tested here. Earlier note: the dev cloud environment needed **Full** network access to download SteamCMD, the Rust
dedicated server (~10 GB) and Oxide (umod.org). The owner changed the setting; it applies to new sessions.
Verified in the cloud container: 15 GB RAM, 4 CPUs and ≥14 GB writable disk, enough to test-run a Rust server.

1. **Plugin `generator/plugin/BaseFinderExport.cs` (Oxide):** on `OnServerInitialized`, export to JSON + PNG:
   - monuments: `TerrainMeta.Path.Monuments` (display name, prefab name, position, bounds, tier/type)
   - roads, rail, rivers, power lines: `TerrainMeta.Path.Roads/Rails/Rivers/Powerlines` (points, width)
   - grids sampled every N metres: height, slope, water depth, biome, splat, topology flags
   - ore nodes / collectibles / animals spawned at startup (real distributions)
   - map image: the server's map renderer (the same top-down image the Rust+ app shows)
   - then shut the server down
2. **Runner `generator/` (Node + TypeScript, Windows-friendly):** install/update the server with SteamCMD,
   start it with `+server.seed`, `+server.worldsize`, `+server.level "Procedural Map"`, minimal settings,
   wait for the export, compress it into a map package, upload to Supabase Storage, and mark the job done.
   Poll Supabase for queued jobs. Beginner setup script + instructions for the owner's PC.
3. ✅ **Supabase** (done, `supabase/migrations/20261011000000_maps.sql`, tested on local Postgres 16): `maps` table (key, seed, size, status, package path, timestamps), `map_jobs` queue,
   Storage bucket for packages and images, RLS rules (public read of finished maps; only the generator,
   via its service key, writes).
4. ✅ **Website** (done): `/api/maps` queues a job when a map isn't generated yet; the UI shows "generating…
   (about 5–10 min)" and polls. `src/lib/maps/cache.ts` gets a Supabase implementation.

## Useful facts

- World coordinates: metres from the map centre, x = east, y (Unity z) = north. Leaflet uses CRS.Simple with
  `[lat, lng] = [y, x]`, bounds `[-size/2, size/2]`.
- Rust map sizes are 1000–6000; seeds 0–2147483647.
- This Next.js version enables `cacheComponents`; read `node_modules/next/dist/docs/` before using
  unfamiliar Next APIs (see `AGENTS.md`).
