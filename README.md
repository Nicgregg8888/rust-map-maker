# Rust Base Finder

Paste a [RustMaps](https://rustmaps.com) link and find the best places to build a base,
scored for your group size, playstyle, server and wipe stage.

> Fan project. Not affiliated with Facepunch Studios or RustMaps. Map data and images © RustMaps.com.

## Status

| Stage | What | Done? |
|---|---|---|
| 1 | Project setup + load a map from a RustMaps link | ✅ |
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

### 3. Add your RustMaps API key (optional, demo mode works without it)

1. Log in at <https://rustmaps.com> and open your **dashboard** (<https://rustmaps.com/dashboard>).
2. Find the **API key** section and copy your key.
3. In the project folder, make a copy of `.env.example` named **`.env.local`**:
   - Mac/Linux: `cp .env.example .env.local`
   - Windows PowerShell: `Copy-Item .env.example .env.local`
4. Open `.env.local` in a text editor and paste the key after the `=`:
   ```
   RUSTMAPS_API_KEY=your-key-here
   ```

> 🔒 **Keep your key secret.**
> - Put it ONLY in `.env.local`. That file is ignored by git, so it never gets uploaded to GitHub.
> - Never paste it into `.env.example`, into code, into a GitHub issue, or into chat.
> - The key is only ever used by the server part of the site. Browsers never see it.
> - If it leaks, create a new key on the RustMaps dashboard. That cancels the old one.

### 4. Start the site

```bash
npm run dev
```

Open <http://localhost:3000> in your browser. To stop the site, press **Ctrl+C** in the terminal.

## Testing Stage 1

1. Click **Try demo**. A sample island loads; you can zoom and drag it, and the side panel shows "DEMO DATA".
2. Paste `https://google.com` and click **Load map**. You get a clear error.
3. Paste `https://rustmaps.com/map/banana`. You get a "couldn't find size and seed" error.
4. With your API key set: paste a real link like `https://rustmaps.com/map/4500_123456`.
   The real map image loads, with seed, size, biomes and monument list.
   Load the same link again: it comes from the cache (no second RustMaps request).
5. Without an API key, a real link says the site isn't connected to RustMaps yet. That's expected.

Automatic checks (run these before committing):

```bash
npm test          # unit tests (link parsing)
npm run lint      # code style
npm run typecheck # TypeScript errors
npm run build     # full production build
```

## How it fits together

```
Browser (React + Leaflet)                 Our server (Next.js API routes)            RustMaps
─────────────────────────                 ───────────────────────────────            ────────
paste link ─► parseMapLink (instant check)
           ─► POST /api/maps ───────────► rate limit ─► check link again
                                          ─► cache hit? return it
                                          ─► else fetch with secret key ───────────► /v4/maps/...
◄──────────── map info (no secrets) ◄──── save in cache ◄──────────────────────────
```

| Folder / file | What it is |
|---|---|
| `src/app/page.tsx` | The home page |
| `src/app/api/maps/route.ts` | Server route that loads maps (uses the API key) |
| `src/components/` | Page pieces: link form, map view, info panel |
| `src/lib/rustmaps/parseLink.ts` | Understands pasted RustMaps links |
| `src/lib/rustmaps/client.ts` | Talks to the RustMaps API (server only) |
| `src/lib/maps/cache.ts` | Map cache (memory now, Supabase database in Stage 6) |
| `src/lib/maps/demo.ts`, `public/demo/` | The made-up demo island |
| `src/app/globals.css` | Colours and theme |
| `.env.example` | List of secret settings (template, no real values) |

## Notes and limits (Stage 1)

- **The cache lives in server memory for now.** It works while running locally, but it resets
  when the server restarts. In Stage 6 it moves to the Supabase database, so each map
  is fetched from RustMaps only once, ever.
- **Rate limit:** 20 map loads per minute per visitor (in `src/app/api/maps/route.ts`).
- RustMaps only gives **map-wide biome percentages**, not where each biome is. Positions come from
  the `.map` file (when downloadable) or image analysis in Stage 2.
