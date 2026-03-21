"use client";

import dynamic from "next/dynamic";

// Mapbox GL JS requires browser APIs — must be loaded client-side only.
// This thin wrapper lives in a Client Component so `ssr: false` is permitted.
const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function MapViewLoader() {
  return <MapView />;
}
