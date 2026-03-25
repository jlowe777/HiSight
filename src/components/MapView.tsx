"use client";

import { useRef, useCallback, useEffect, useMemo } from "react";
import Map, {
  Source,
  Layer,
  NavigationControl,
  type MapRef,
  type MapLayerMouseEvent,
} from "react-map-gl";
import type { Map as MapboxMap, FilterSpecification } from "mapbox-gl";
import type { GeoJSON } from "geojson";
import { useQuery } from "@tanstack/react-query";
import { useMapStore } from "@/store/mapStore";
import type { Property } from "@/types/property";
import { generateWestTransect } from "@/lib/transect";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const FT_TO_M = 0.3048;

// Elevation band boundaries in meters (matching DESIGN.md ramp)
const LOW_MID_M = 1650;
const MID_HIGH_M = 1750;

function getElevationColor(elevationM: number | null): string {
  if (elevationM === null) return "#6BAA75";
  if (elevationM < LOW_MID_M) return "#6BAA75";
  if (elevationM < MID_HIGH_M) return "#D4A84B";
  return "#8B5E3C";
}

function formatPriceLabel(price: number | null): string {
  if (price === null) return "";
  const k = Math.round(price / 1000);
  return `$${k}k`;
}

function listingsToGeoJSON(listings: Property[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: listings.map((p) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [p.lng, p.lat],
      },
      properties: {
        id: p.id,
        price: p.price,
        ...(p.elevation !== null ? { elevation: p.elevation } : {}),
        localProminence: p.localProminence,
        beds: p.beds,
        baths: p.baths,
        sqft: p.sqft,
        lotSize: p.lotSize ?? null,
        daysOnMarket: p.daysOnMarket,
        address: p.address,
        priceLabel: formatPriceLabel(p.price),
        elevationColor: getElevationColor(p.elevation),
      },
    })),
  };
}

async function fetchListings(): Promise<Property[]> {
  const res = await fetch("/api/listings");
  if (!res.ok) throw new Error("Failed to fetch listings");
  const data = (await res.json()) as { properties: Property[] };
  return data.properties ?? [];
}

export default function MapView({
  onPropertySelect,
}: {
  onPropertySelect?: (property: Property) => void;
}) {
  const mapRef = useRef<MapRef>(null);
  const {
    viewport,
    setSelectedPoint,
    setSelectedProperty,
    setSidebarOpen,
    elevationFilter,
    selectedProperty,
    sidebarOpen,
  } = useMapStore();

  const { data: listings = [] } = useQuery<Property[]>({
    queryKey: ["listings"],
    queryFn: fetchListings,
  });

  const geojson = useMemo(() => listingsToGeoJSON(listings), [listings]);

  // Elevation filter — computed declaratively and passed as `filter` prop to
  // <Layer>, so it's always in sync with React state and never lost on re-render.
  const [minFt, maxFt] = elevationFilter;
  const minM = minFt * FT_TO_M;
  const maxM = maxFt * FT_TO_M;
  const pinFilter: FilterSpecification = [
    "any",
    ["!", ["has", "elevation"]],
    [
      "all",
      [">=", ["get", "elevation"], minM],
      ["<=", ["get", "elevation"], maxM],
    ],
  ];

  // Transect line: 30km due west from selected property
  const transectLine: GeoJSON.FeatureCollection = selectedProperty
    ? {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: generateWestTransect(
                selectedProperty.lat,
                selectedProperty.lng,
                30,
                2,
              ).map((pt) => [pt.lng, pt.lat]),
            },
            properties: {},
          },
        ],
      }
    : { type: "FeatureCollection", features: [] };

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap() as MapboxMap | undefined;
    if (!map) return;
    map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
  }, []);

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const { lng, lat } = e.lngLat;

      // Check if a property pin was clicked
      const map = mapRef.current?.getMap() as MapboxMap | undefined;
      if (!map) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: ["property-pins-circle"],
      });

      if (features.length > 0) {
        const feat = features[0];
        const props = feat.properties;
        if (!props) return;

        // Find the full property object from listings
        const property = listings.find((p) => p.id === props.id);
        if (property) {
          setSelectedProperty(property);
          setSidebarOpen(true);
          onPropertySelect?.(property);

          // Fly to pin — tilt toward mountains for terrain context
          map.flyTo({
            center: [property.lng, property.lat],
            zoom: Math.max(map.getZoom(), 13),
            pitch: 60,
            bearing: -15,
            duration: 900,
            easing: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
          });
        }
      } else {
        // Empty map click — set point for terrain profile
        setSelectedProperty(null);
        setSelectedPoint({ lat, lng });
        setSidebarOpen(true);
      }
    },
    [
      listings,
      setSelectedPoint,
      setSelectedProperty,
      setSidebarOpen,
      onPropertySelect,
    ],
  );

  // Fly to selected property when it changes externally (e.g. card click)
  useEffect(() => {
    if (!selectedProperty) return;
    const map = mapRef.current?.getMap() as MapboxMap | undefined;
    if (!map) return;
    map.flyTo({
      center: [selectedProperty.lng, selectedProperty.lat],
      zoom: Math.max(map.getZoom(), 13),
      pitch: 60,
      bearing: -15,
      duration: 900,
      easing: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    });
  }, [selectedProperty]);

  // Reset camera when sidebar closes
  useEffect(() => {
    if (sidebarOpen) return;
    const map = mapRef.current?.getMap() as MapboxMap | undefined;
    if (!map || !map.isStyleLoaded()) return;
    map.easeTo({ pitch: 45, bearing: 0, duration: 700 });
  }, [sidebarOpen]);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: viewport.lng,
        latitude: viewport.lat,
        zoom: viewport.zoom,
        pitch: 45,
        bearing: 0,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/outdoors-v12"
      onLoad={handleLoad}
      onClick={handleClick}
      terrain={{ source: "mapbox-dem", exaggeration: 1.5 }}
      interactiveLayerIds={["property-pins-circle"]}
    >
      {/* Digital Elevation Model source */}
      <Source
        id="mapbox-dem"
        type="raster-dem"
        url="mapbox://mapbox.mapbox-terrain-dem-v1"
        tileSize={512}
        maxzoom={14}
      />

      {/* Hillshade */}
      <Layer
        id="hillshade"
        type="hillshade"
        source="mapbox-dem"
        paint={{
          "hillshade-exaggeration": 0.5,
          "hillshade-highlight-color": "#f5f0e8",
          "hillshade-shadow-color": "#3d2b1f",
          "hillshade-illumination-anchor": "map",
        }}
      />

      {/* Sky / atmosphere */}
      <Layer
        id="sky"
        type="sky"
        paint={{
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 90.0],
          "sky-atmosphere-sun-intensity": 15,
          "sky-atmosphere-color": "rgba(135, 206, 235, 1.0)",
          "sky-atmosphere-halo-color": "rgba(255, 255, 255, 0.5)",
        }}
      />

      {/* Property listings GeoJSON source */}
      <Source id="properties" type="geojson" data={geojson}>
        {/* Circle layer — color-coded by elevation band */}
        <Layer
          id="property-pins-circle"
          type="circle"
          filter={pinFilter}
          paint={{
            "circle-radius": [
              "case",
              ["==", ["get", "id"], selectedProperty?.id ?? ""],
              14,
              10,
            ],
            "circle-color": [
              "case",
              ["<", ["coalesce", ["get", "elevation"], 0], LOW_MID_M],
              "#6BAA75",
              ["<", ["coalesce", ["get", "elevation"], 0], MID_HIGH_M],
              "#D4A84B",
              "#8B5E3C",
            ],
            "circle-stroke-width": [
              "case",
              ["==", ["get", "id"], selectedProperty?.id ?? ""],
              3,
              2,
            ],
            "circle-stroke-color": [
              "case",
              ["==", ["get", "id"], selectedProperty?.id ?? ""],
              "#2D6A4F",
              "#ffffff",
            ],
          }}
        />

        {/* Price label layer */}
        <Layer
          id="property-pins-label"
          type="symbol"
          filter={pinFilter}
          layout={{
            "text-field": ["get", "priceLabel"],
            "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
            "text-size": 10,
            "text-offset": [0, -1.8],
            "text-anchor": "bottom",
            "text-allow-overlap": false,
          }}
          paint={{
            "text-color": "#1A1A18",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1.5,
          }}
        />
      </Source>

      {/* Transect line — shows where the elevation profile is measured */}
      <Source id="transect-line" type="geojson" data={transectLine}>
        <Layer
          id="transect-line-layer"
          type="line"
          paint={{
            "line-color": "#2D6A4F",
            "line-width": 1.5,
            "line-dasharray": [5, 4],
            "line-opacity": selectedProperty ? 0.55 : 0,
          }}
        />
      </Source>

      <NavigationControl position="top-right" visualizePitch />
    </Map>
  );
}
