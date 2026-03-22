"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import MapViewLoader from "@/components/MapViewLoader";
import PropertySidebar from "@/components/PropertySidebar";
import ElevationSlider from "@/components/ElevationSlider";
import PropertyCard from "@/components/PropertyCard";
import { useMapStore } from "@/store/mapStore";
import type { Property } from "@/types/property";

async function fetchListings(): Promise<Property[]> {
  const res = await fetch("/api/listings");
  if (!res.ok) throw new Error("Failed to fetch listings");
  const data = (await res.json()) as { properties: Property[] };
  return data.properties ?? [];
}

export default function Home() {
  const {
    selectedProperty,
    elevationFilter,
    setSelectedProperty,
    setSidebarOpen,
  } = useMapStore();

  const listRailRef = useRef<HTMLDivElement>(null);

  const { data: listings = [] } = useQuery<Property[]>({
    queryKey: ["listings"],
    queryFn: fetchListings,
  });

  // Filter listings client-side to show count matching elevation range
  const FT_TO_M = 0.3048;
  const [minFt, maxFt] = elevationFilter;
  const minM = minFt * FT_TO_M;
  const maxM = maxFt * FT_TO_M;

  const visibleListings = listings.filter((p) => {
    if (p.elevation === null) return true;
    return p.elevation >= minM && p.elevation <= maxM;
  });

  function handleCardClick(property: Property) {
    setSelectedProperty(property);
    setSidebarOpen(true);
  }

  // Determine unique cities for header label
  const cities = [...new Set(listings.map((p) => p.city))];
  const regionLabel = cities.length === 1 ? cities[0] : "Front Range";

  return (
    <main
      style={{
        height: "100dvh",
        display: "flex",
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      {/* ── Left rail (desktop only) ─────────────────────── */}
      <div
        className="left-rail"
        style={{
          width: "380px",
          flexShrink: 0,
          borderRight: "1px solid var(--border)",
          background: "var(--bg)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Rail header */}
        <div
          style={{
            padding: "16px 16px 12px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            {/* Topographic icon */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flexShrink: 0 }}
            >
              <defs>
                <linearGradient
                  id="topoGrad"
                  x1="0"
                  y1="28"
                  x2="28"
                  y2="0"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#1B4332" />
                  <stop offset="45%" stopColor="#2D6A4F" />
                  <stop offset="100%" stopColor="#74C69D" />
                </linearGradient>
              </defs>
              {/* Rounded square background */}
              <rect width="28" height="28" rx="6" fill="url(#topoGrad)" />
              {/* Topo contour lines — concentric, slightly organic */}
              <path
                d="M 4 16 Q 5 9 14 8 Q 22 7 24 15 Q 25 21 18 22.5 Q 14 23.5 9 22 Q 4 20 4 16 Z"
                fill="none"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="1"
              />
              <path
                d="M 7 15.5 Q 8 11 14 10.5 Q 19.5 10 21 15 Q 21.5 18.5 17 19.5 Q 14 20.5 10.5 19 Q 7 17.5 7 15.5 Z"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="1"
              />
              <path
                d="M 10.5 15 Q 11 12.5 14 12 Q 16.5 11.5 17.5 14 Q 18 16 16 17 Q 14 17.5 12 16.5 Q 10.5 15.5 10.5 15 Z"
                fill="none"
                stroke="rgba(255,255,255,0.65)"
                strokeWidth="1"
              />
              {/* Summit dot */}
              <circle cx="14" cy="14.5" r="1.5" fill="rgba(255,255,255,0.85)" />
            </svg>

            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "22px",
                letterSpacing: "-0.01em",
              }}
            >
              <span style={{ color: "var(--accent)" }}>Hi</span>
              <span style={{ color: "var(--text-hi)" }}>Sight</span>
            </span>
          </div>

          {/* Region + count */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-hi)",
              }}
            >
              {regionLabel}
            </span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                color: "var(--text-lo)",
              }}
            >
              {visibleListings.length} home
              {visibleListings.length !== 1 ? "s" : ""} in view
            </span>
          </div>
        </div>

        {/* Scrollable property list */}
        <div
          ref={listRailRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px",
          }}
        >
          {visibleListings.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isActive={selectedProperty?.id === property.id}
              onClick={() => handleCardClick(property)}
            />
          ))}
        </div>
      </div>

      {/* ── Map area ──────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Full-fill map */}
        <div style={{ position: "absolute", inset: 0 }}>
          <MapViewLoader />
        </div>

        {/* Floating elevation slider — bottom-center */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            width: "calc(100% - 32px)",
            maxWidth: "360px",
          }}
        >
          <ElevationSlider />
        </div>

        {/* Property sidebar — absolute over map, slides from right */}
        <PropertySidebar />
      </div>

      {/* ── Mobile styles ─────────────────────────────────── */}
      <style>{`
        @media (max-width: 768px) {
          .left-rail {
            display: none !important;
          }
        }
      `}</style>
    </main>
  );
}
