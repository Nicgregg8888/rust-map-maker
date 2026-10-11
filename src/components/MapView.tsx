"use client";

// Zoomable / pannable map image using Leaflet.
//
// We use Leaflet's "Simple" coordinate system, where map units are just
// metres. Leaflet's [lat, lng] = RustMaps' [y, x], with (0,0) in the centre,
// so later stages can drop monuments and pins straight onto the map.
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { ImageOverlay, MapContainer } from "react-leaflet";

import type { MapInfo } from "@/lib/maps/types";

export default function MapView({ map }: { map: MapInfo }) {
  const half = map.size / 2;
  const bounds = L.latLngBounds([-half, -half], [half, half]);
  const image = map.imageUrl ?? map.rawImageUrl;

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={bounds}
      maxBounds={bounds.pad(0.25)}
      minZoom={-4}
      maxZoom={3}
      zoomSnap={0.25}
      attributionControl={false}
      className="h-full w-full"
    >
      {image && <ImageOverlay url={image} bounds={bounds} />}
    </MapContainer>
  );
}
