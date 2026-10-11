# Rust Base Finder

Enter your Rust server's **map seed and size** and find the best places to build a base,
scored for your group size, playstyle, server and wipe stage.

> Fan project. Not affiliated with or endorsed by Facepunch Studios.

## Where the map data comes from

We don't use any third-party map website. Map data comes from:

1. **Our own map generator** (main source). A Rust dedicated server builds the map from its
   seed and size, and a small plugin exports monuments, roads, rail, rivers, height and biomes.
   Each map is generated once and saved for everyone.
2. **`.map` file upload**, for server owners (exact data).
3. **Screenshot upload** of the in-game map, as a fallback for anyone (analysed in the
   browser, never stored; terrain is estimated and labelled as such).

## Status

| Stage | What | Done? |
|---|---|---|
| 1 | Project setup + load a map from seed and size | ✅ |
| 1b | Map generator + database (Supabase) | ⏳ |
| 2 | Map layers (monuments, roads, rail, recyclers, biomes) | ⏳ |
| 3 | Requirements panel + scoring engine | ⏳ |
| 4 | Pins + info panel (pros/cons, wipe tips, base designs) | ⏳ |
| 5 | Clan predictions (zones + routes) | ⏳ |
| 6 | Accounts, saving, comparing, share links | ⏳ |
| 7 | Community reports + moderation | ⏳ |
| 8 | Premium-ready setup, security checks, deploy | ⏳ |

---

## Run it on your computer (first time)

### 1. Install the tools (once)

- **Node.js 22 (LTS)**: download from <https://nodejs.org> and run the installer.
  Check it worked by opening a terminal and typing `node -v`. You should see `v22.something`.
  - Windows: "terminal" = **PowerShell** (Start menu → type PowerShell).
  - Mac: "terminal" = **Terminal** (Cmd+Space → type Terminal).
- **Git**: <https://git-scm.com/downloads>.

### 2. Download the code (once)

In the terminal:

```bash
git clone https://github.com/nicgregg8888/rust-map-maker.git
cd rust-map-maker
git checkout claude/peaceful-tesla-6qe2x2
npm install
```

`npm install` downloads the libraries the project uses. It takes a minute or two.

### 3. Start the site

```bash
npm run dev
```

Open <http://localhost:3000> in your browser. To stop the site, press **Ctrl+C** in the terminal.

## Testing Stage 1

1. Click **Try demo**. A sample island loads; you can zoom and drag it, and the side panel shows "DEMO DATA".
2. Type `abc` as the seed and click **Load map**. You get a clear error.
3. Type seed `123` and size `999`. You get a "size must be from 1000 to 6000" error.
4. Type seed `123` and size `4500`. You get "this map hasn't been generated yet". That's expected
   until the map generator is connected (Stage 1b).

Automatic checks (run these before committing):

```bash
npm test          # unit tests (seed/size checks)
npm run lint      # code style
npm run typecheck # TypeScript errors
npm run build     # full production build
```

## How it fits together

```
Browser (React + Leaflet)               Our server (Next.js API routes)       Map generator (Stage 1b)
─────────────────────────               ───────────────────────────────       ───────────────────────
seed + size ─► instant check
            ─► POST /api/maps ────────► rate limit ─► check again
                                        ─► already generated? return it ◄──── saves finished maps
◄────────────── map data ◄──────────────
```

| Folder / file | What it is |
|---|---|
| `src/app/page.tsx` | The home page |
| `src/app/api/maps/route.ts` | Server route that loads maps |
| `src/components/` | Page pieces: seed/size form, map view, info panel |
| `src/lib/maps/mapRequest.ts` | Checks the seed and size people type in |
| `src/lib/maps/cache.ts` | Store of generated maps (memory now, Supabase database next) |
| `src/lib/maps/demo.ts`, `public/demo/` | The made-up demo island |
| `src/app/globals.css` | Colours and theme |
| `.env.example` | List of secret settings (template, no real values) |

## Notes and limits (Stage 1)

- **Generated maps are kept in server memory for now**, and the generator isn't connected yet,
  so only the demo map loads. Stage 1b adds the generator and the Supabase database.
- **Rate limit:** 20 map loads per minute per visitor (in `src/app/api/maps/route.ts`).
