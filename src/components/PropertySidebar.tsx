"use client";

import { useMapStore } from "@/store/mapStore";
import { useQuery } from "@tanstack/react-query";
import ElevationProfileChart from "./ElevationProfileChart";
import type { ElevationProfile } from "@/types/property";

// ─── Helpers ────────────────────────────────────────────────────────

function formatPrice(price: number | null): string {
  if (price === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function metersToFeet(m: number | null): number | null {
  if (m === null) return null;
  return Math.round(m * 3.28084);
}

function sqftToAcres(sqft: number | null | undefined): string {
  if (!sqft) return "—";
  return (sqft / 43560).toFixed(2);
}

// ─── Sub-components ──────────────────────────────────────────────────

function ElevationChip({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: "var(--accent-bg)",
        color: "var(--accent)",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        padding: "4px 10px",
        borderRadius: "9999px",
        marginRight: "6px",
        marginBottom: "6px",
      }}
    >
      {label} {value}
    </span>
  );
}

function SpecCell({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "17px",
          fontWeight: 600,
          color: "var(--text-hi)",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "10px",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--text-lo)",
          marginTop: "2px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div
      className="skeleton"
      style={{ width: "100%", height: "100px", borderRadius: "8px" }}
    />
  );
}

// ─── Chart fetching wrapper ──────────────────────────────────────────

function ElevationSection({
  lat,
  lng,
  propertyElevationM,
}: {
  lat: number;
  lng: number;
  propertyElevationM?: number | null;
}) {
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery<ElevationProfile>({
    queryKey: ["elevation-profile", lat, lng],
    queryFn: async () => {
      const res = await fetch(`/api/elevation/profile?lat=${lat}&lng=${lng}`);
      if (!res.ok) throw new Error("Failed to fetch elevation profile");
      return res.json() as Promise<ElevationProfile>;
    },
    enabled: !isNaN(lat) && !isNaN(lng),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return (
    <div>
      {isLoading ? (
        <ProfileSkeleton />
      ) : isError ? (
        <div
          style={{
            width: "100%",
            height: "100px",
            borderRadius: "8px",
            background: "var(--surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "12px",
              color: "var(--text-xlo)",
            }}
          >
            Elevation data unavailable
          </span>
        </div>
      ) : profile ? (
        <ElevationProfileChart
          profile={profile}
          propertyElevationM={propertyElevationM}
        />
      ) : null}
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "11px",
          color: "var(--text-xlo)",
          marginTop: "8px",
          marginBottom: 0,
        }}
      >
        Terrain cross-section heading west toward the Front Range
      </p>
    </div>
  );
}

// ─── Point elevation display ──────────────────────────────────────────

function PointElevationDisplay({ lat, lng }: { lat: number; lng: number }) {
  const { data, isLoading, isError } = useQuery<{
    lat: number;
    lng: number;
    elevationM: number | null;
  }>({
    queryKey: ["elevation-point", lat, lng],
    queryFn: async () => {
      const res = await fetch(`/api/elevation/point?lat=${lat}&lng=${lng}`);
      if (!res.ok) throw new Error("Failed to fetch point elevation");
      return res.json();
    },
    enabled: !isNaN(lat) && !isNaN(lng),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const elevFt = metersToFeet(data?.elevationM ?? null);

  return (
    <div style={{ marginBottom: "16px" }}>
      {isLoading ? (
        <div className="skeleton" style={{ height: "20px", width: "120px" }} />
      ) : isError || (data && data.elevationM === null) ? (
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "12px",
            color: "var(--text-xlo)",
          }}
        >
          Elevation data unavailable
        </span>
      ) : elevFt !== null ? (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            color: "var(--accent)",
          }}
        >
          ↑ {elevFt.toLocaleString()} ft elevation
        </span>
      ) : null}
    </div>
  );
}

// ─── Main Sidebar ────────────────────────────────────────────────────

export default function PropertySidebar() {
  const {
    selectedProperty,
    selectedPoint,
    sidebarOpen,
    setSidebarOpen,
    setSelectedProperty,
  } = useMapStore();

  const isOpen =
    sidebarOpen && (selectedProperty !== null || selectedPoint !== null);

  function handleClose() {
    setSidebarOpen(false);
    setSelectedProperty(null);
  }

  const p = selectedProperty;

  const elevFt = metersToFeet(p?.elevation ?? null);
  const promFt = metersToFeet(p?.localProminence ?? null);
  const pricePerSqft =
    p?.price && p?.sqft ? Math.round(p.price / p.sqft) : null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        height: "100%",
        width: "380px",
        maxWidth: "100%",
        background: "var(--surface)",
        borderLeft: "1px solid var(--border)",
        boxShadow: "-4px 0 24px rgba(26,26,24,.10)",
        display: "flex",
        flexDirection: "column",
        zIndex: 20,
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: isOpen
          ? "transform 250ms ease-out"
          : "transform 200ms ease-in",
        overflowY: "auto",
      }}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        aria-label="Close sidebar"
        style={{
          position: "absolute",
          top: "14px",
          right: "16px",
          zIndex: 30,
          width: "28px",
          height: "28px",
          borderRadius: "9999px",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          color: "var(--text-lo)",
          lineHeight: 1,
        }}
      >
        ×
      </button>

      {/* ── State A: Property selected ── */}
      {p && (
        <div>
          {/* Photo area */}
          <div
            style={{
              position: "relative",
              height: "220px",
              background: `linear-gradient(135deg, ${
                p.elevation !== null && p.elevation < 1650
                  ? "#6BAA75"
                  : p.elevation !== null && p.elevation < 1750
                    ? "#D4A84B"
                    : "#8B5E3C"
              } 0%, #1B4332 100%)`,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {p.photos && p.photos.length > 0 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.photos[0]}
                alt={p.address}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            )}

            {/* Photo count badge (top-right) */}
            {p.photos && p.photos.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "48px",
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "9999px",
                  padding: "3px 8px",
                  fontSize: "11px",
                  fontFamily: "var(--font-sans)",
                  color: "var(--text-hi)",
                }}
              >
                {p.photos.length} photo{p.photos.length !== 1 ? "s" : ""}
              </div>
            )}

            {/* Elevation badge (bottom-left) */}
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "12px",
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(8px)",
                borderRadius: "9999px",
                padding: "4px 10px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "#ffffff",
                }}
              >
                {elevFt !== null ? `↑ ${elevFt.toLocaleString()} ft` : ""}
                {promFt !== null ? ` · +${promFt} ft prominence` : ""}
              </span>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: "20px 20px 24px" }}>
            {/* Price */}
            <div style={{ marginBottom: "4px" }}>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "30px",
                  color: "var(--text-hi)",
                  lineHeight: 1.1,
                }}
              >
                {formatPrice(p.price)}
              </span>
            </div>

            {/* Zestimate */}
            {p.zestimate && (
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "12px",
                  color: "var(--text-lo)",
                  margin: "0 0 8px",
                }}
              >
                Zestimate®: {formatPrice(p.zestimate)}
              </p>
            )}

            {/* Address */}
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                color: "var(--text-mid)",
                margin: "0 0 20px",
              }}
            >
              {p.address}, {p.city}, {p.state} {p.zip}
            </p>

            {/* Specs grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                marginBottom: "20px",
                paddingBottom: "20px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <SpecCell value={p.beds} label="Beds" />
              <SpecCell value={p.baths} label="Baths" />
              <SpecCell
                value={p.sqft ? p.sqft.toLocaleString() : "—"}
                label="Sqft"
              />
              <SpecCell value={sqftToAcres(p.lotSize)} label="Lot (ac)" />
              <SpecCell value={p.yearBuilt ?? "—"} label="Year Built" />
              <SpecCell
                value={pricePerSqft ? `$${pricePerSqft}` : "—"}
                label="$/sqft"
              />
            </div>

            {/* Terrain Intelligence */}
            <div style={{ marginBottom: "20px" }}>
              <h3
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text-lo)",
                  margin: "0 0 10px",
                }}
              >
                Terrain Intelligence
              </h3>

              {/* Chips */}
              <div style={{ marginBottom: "12px" }}>
                {elevFt !== null && (
                  <ElevationChip
                    label="↑"
                    value={`${elevFt.toLocaleString()} ft elevation`}
                  />
                )}
                {promFt !== null && (
                  <ElevationChip label="+" value={`${promFt} ft prominence`} />
                )}
              </div>

              {/* Chart */}
              <ElevationSection
                lat={p.lat}
                lng={p.lng}
                propertyElevationM={p.elevation}
              />
            </div>

            {/* Listing Details */}
            <div
              style={{
                paddingTop: "20px",
                borderTop: "1px solid var(--border)",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text-lo)",
                  margin: "0 0 10px",
                }}
              >
                Listing Details
              </h3>

              {/* Chips */}
              <div style={{ marginBottom: "16px" }}>
                {p.daysOnMarket !== null && (
                  <span
                    style={{
                      display: "inline-block",
                      background: "var(--surface-2)",
                      borderRadius: "9999px",
                      padding: "3px 10px",
                      fontSize: "11px",
                      fontFamily: "var(--font-sans)",
                      color: "var(--text-mid)",
                      marginRight: "6px",
                      marginBottom: "6px",
                    }}
                  >
                    {p.daysOnMarket} day{p.daysOnMarket !== 1 ? "s" : ""} on
                    market
                  </span>
                )}
                {p.propertyType && (
                  <span
                    style={{
                      display: "inline-block",
                      background: "var(--surface-2)",
                      borderRadius: "9999px",
                      padding: "3px 10px",
                      fontSize: "11px",
                      fontFamily: "var(--font-sans)",
                      color: "var(--text-mid)",
                      marginRight: "6px",
                      marginBottom: "6px",
                    }}
                  >
                    {p.propertyType}
                  </span>
                )}
                <span
                  style={{
                    display: "inline-block",
                    background: "var(--accent-bg)",
                    borderRadius: "9999px",
                    padding: "3px 10px",
                    fontSize: "11px",
                    fontFamily: "var(--font-sans)",
                    color: "var(--accent)",
                    marginRight: "6px",
                    marginBottom: "6px",
                  }}
                >
                  Active
                </span>
              </div>

              {/* CTAs */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <a
                  href={p.listingUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    textAlign: "center",
                    background: "var(--accent)",
                    color: "#ffffff",
                    fontFamily: "var(--font-sans)",
                    fontSize: "14px",
                    fontWeight: 600,
                    padding: "11px 16px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    transition: "background 100ms ease-out",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "var(--accent-lit)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "var(--accent)";
                  }}
                >
                  View on Zillow ↗
                </a>
                <button
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "center",
                    background: "var(--surface-2)",
                    color: "var(--text-mid)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "14px",
                    fontWeight: 500,
                    padding: "11px 16px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  Save home
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── State B: Map point selected ── */}
      {!p && selectedPoint && (
        <div style={{ padding: "20px" }}>
          <h2
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-hi)",
              margin: "0 0 8px",
              paddingRight: "40px",
            }}
          >
            Terrain Profile
          </h2>

          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--text-lo)",
              margin: "0 0 16px",
            }}
          >
            {selectedPoint.lat.toFixed(5)}, {selectedPoint.lng.toFixed(5)}
          </p>

          <PointElevationDisplay
            lat={selectedPoint.lat}
            lng={selectedPoint.lng}
          />

          <ElevationSection lat={selectedPoint.lat} lng={selectedPoint.lng} />
        </div>
      )}
    </div>
  );
}
