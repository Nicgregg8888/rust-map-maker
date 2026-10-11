# RustMaps API: research notes

Checked on 2026-10-11 against the official docs (<https://rustmaps.com/docs>,
OpenAPI file at <https://api.rustmaps.com/swagger/v4-public/swagger.json>) and
the Terms of Service (<https://rustmaps.com/tos>). Re-check both before launch;
the TOS says it can change at any time.

## What the API gives us

- **Auth:** `X-API-Key` header. Key from <https://rustmaps.com/dashboard>.
- **Endpoints we use:** `GET /v4/maps/{size}/{seed}?staging=false` and `GET /v4/maps/{mapId}`.
- **Per map:** seed, size, images (`rawImageUrl` = no labels, `imageUrl` = labels,
  `imageIconUrl` = icons, `thumbnailUrl`), monuments with coordinates, biome % of land,
  land %, counts of islands/mountains/ice lakes/rivers/lakes/canyons/oases/buildable rocks/water pipes.
- **Coordinates:** whole metres from the map centre, x = east, y = north.
- **Monument types (104)** include terrain features as well as monuments: lakes, canyons,
  mountains, swamps, oases, ice lakes, caves, tunnel entrances, power lines, substations,
  god rocks / buildable rocks. These help a lot with terrain estimation.
- **`.map` file:** only for *custom maps you generated yourself* (`canDownload`).
  Docs: "Vanilla maps have no file." So for normal server maps we must
  **estimate roads, rivers, height and biomes from the map image**.
- **Errors:** 400 size out of range, 401 bad key, 404 not on RustMaps, 409 still generating
  (`data.state`), 429 rate limited (`meta.errors` says when to retry).
- **Rate limits:** exact numbers aren't published. Responses carry `X-Rate-Limit-Remaining` and
  `X-Rate-Limit-Reset` headers. Map *generation* limits depend on subscription (`GET /v4/maps/limits`).
  We only *read* maps, and we cache each one, so usage stays low.

## What the Terms of Service say (summary, not legal advice)

1. **Using several API keys to get around limits counts as abuse.** So the site must use
   **one key (yours), kept on the server**, shared by all visitors. Asking every user for their own key isn't
   needed, and would be worse for users.
2. **Reselling RustMaps' content counts as abuse**, and using the site "maliciously … for direct financial gain"
   can get you banned. This matters for future premium features: charging for features
   built on RustMaps data could be read as reselling.
3. **Content (images, icons etc.) is RustMaps' property.** Their services should only be used "for the
   purpose of generating seeds", and for anything outside that scope, or any
   "reproduction or representation" of their content, **you need written permission from
   admin@rustmaps.com**.

**➡️ Before the site goes public (Stage 8), get written permission from RustMaps.**
Until then it's fine to build and test privately.

## Draft email to RustMaps

> **To:** admin@rustmaps.com
> **Subject:** Permission request: fan site using the RustMaps API (Rust Base Finder)
>
> Hi RustMaps team,
>
> I'm building a free fan website called **Rust Base Finder**. A player pastes a RustMaps link for
> their server's map, and the site suggests good places to build a base (based on distances
> to monuments, terrain, biomes, etc.).
>
> How it would use RustMaps:
> - One API key (mine), only on the server, never shared with users.
> - Reads existing maps only (`GET /v4/maps/{size}/{seed}`, `GET /v4/maps/{mapId}`). It never generates maps.
> - Each map is fetched once and cached, so each map costs one API call however many people view it.
> - Shows the map image and monument positions with clear credit and a link back to the map on rustmaps.com.
>
> The site is free. In the future I may add optional paid extras (e.g. saved history, team
> sharing). Those would be my own features, not resale of RustMaps data, but I want to be
> upfront about it.
>
> Could you confirm whether this is OK, and whether there's anything you'd like changed (attribution
> style, caching period, rate limits, a required plan)? I'm happy to work with you on it.
>
> Thanks!
> [your name], [site URL when live]
