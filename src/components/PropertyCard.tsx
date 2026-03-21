"use client";

import type { Property } from "@/types/property";

interface PropertyCardProps {
  property: Property;
  isActive: boolean;
  onClick: () => void;
}

function metersToFeet(m: number | null): number | null {
  if (m === null) return null;
  return Math.round(m * 3.28084);
}

function elevationDotColor(elevM: number | null): string {
  if (elevM === null) return "#6BAA75";
  if (elevM < 1650) return "#6BAA75";
  if (elevM < 1750) return "#D4A84B";
  return "#8B5E3C";
}

function elevationGradient(elevM: number | null): string {
  if (elevM === null) return "linear-gradient(135deg, #6BAA75, #1B4332)";
  if (elevM < 1650) return "linear-gradient(135deg, #6BAA75, #3d8b5e)";
  if (elevM < 1750) return "linear-gradient(135deg, #D4A84B, #8B5E3C)";
  return "linear-gradient(135deg, #8B5E3C, #4A2C17)";
}

function sqftToAcres(sqft: number | null | undefined): string | null {
  if (!sqft) return null;
  return (sqft / 43560).toFixed(2);
}

export default function PropertyCard({
  property: p,
  isActive,
  onClick,
}: PropertyCardProps) {
  const elevFt = metersToFeet(p.elevation);
  const promFt = metersToFeet(p.localProminence);
  const dotColor = elevationDotColor(p.elevation);
  const acreage = sqftToAcres(p.lotSize);

  const specsLine = [
    p.beds ? `${p.beds} bd` : null,
    p.baths ? `${p.baths} ba` : null,
    p.sqft ? `${p.sqft.toLocaleString()} sqft` : null,
    acreage ? `${acreage} ac lot` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      style={{
        display: "flex",
        borderRadius: "12px",
        overflow: "hidden",
        border: isActive
          ? "1px solid var(--accent)"
          : "1px solid var(--border)",
        boxShadow: isActive ? "0 0 0 2px var(--accent-bg)" : "none",
        background: "var(--surface)",
        cursor: "pointer",
        transition: "box-shadow 100ms ease-out, border-color 100ms ease-out",
        marginBottom: "8px",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 4px 12px rgba(26,26,24,.08)";
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "var(--border-mid)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "var(--border)";
        }
      }}
    >
      {/* Photo / gradient thumbnail */}
      <div
        style={{
          width: "120px",
          minWidth: "120px",
          background:
            p.photos && p.photos.length > 0
              ? undefined
              : elevationGradient(p.elevation),
          flexShrink: 0,
        }}
      >
        {p.photos && p.photos.length > 0 ? (
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
        ) : null}
      </div>

      {/* Text content */}
      <div
        style={{
          flex: 1,
          padding: "10px 12px",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {/* Price */}
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "22px",
            color: "var(--text-hi)",
            lineHeight: 1.15,
          }}
        >
          {p.price
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(p.price)
            : "—"}
        </div>

        {/* Specs */}
        {specsLine && (
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              color: "var(--text-mid)",
              lineHeight: 1.4,
            }}
          >
            {specsLine}
          </div>
        )}

        {/* Address */}
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "12px",
            color: "var(--text-lo)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {p.address}, {p.city}, {p.state}
        </div>

        {/* Elevation row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "4px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--accent)",
            }}
          >
            {/* Elevation dot */}
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "9999px",
                background: dotColor,
                flexShrink: 0,
              }}
            />
            <span>
              {elevFt !== null ? `${elevFt.toLocaleString()} ft` : "—"}
              {promFt !== null ? ` · +${promFt} ft` : ""}
            </span>
          </div>

          {/* Days on market */}
          {p.daysOnMarket !== null && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-xlo)",
              }}
            >
              {p.daysOnMarket}d
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
