"use client";

import { useMapStore } from "@/store/mapStore";

const MIN_FT = 5200;
const MAX_FT = 6500;

function formatFt(ft: number): string {
  return ft.toLocaleString("en-US");
}

export default function ElevationSlider() {
  const { elevationFilter, setElevationFilter } = useMapStore();
  const [low, high] = elevationFilter;

  const lowPct = ((low - MIN_FT) / (MAX_FT - MIN_FT)) * 100;
  const highPct = ((high - MIN_FT) / (MAX_FT - MIN_FT)) * 100;

  function handleLow(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.min(Number(e.target.value), high - 100);
    setElevationFilter([val, high]);
  }

  function handleHigh(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.max(Number(e.target.value), low + 100);
    setElevationFilter([low, val]);
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "16px",
        boxShadow: "0 4px 12px rgba(26,26,24,.08)",
        border: "1px solid var(--border)",
        padding: "14px 20px 16px",
        minWidth: "280px",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-lo)",
          }}
        >
          Elevation Range
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--accent)",
          }}
        >
          {formatFt(low)} – {formatFt(high)} ft
        </span>
      </div>

      {/* Dual-thumb track */}
      <div className="elevation-slider-track">
        {/* Filled portion between thumbs */}
        <div
          className="elevation-slider-fill"
          style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
        />

        {/* Low thumb */}
        <input
          type="range"
          className="elevation-thumb"
          min={MIN_FT}
          max={MAX_FT}
          step={50}
          value={low}
          onChange={handleLow}
          aria-label="Minimum elevation"
          style={{ zIndex: low > MAX_FT - 100 ? 5 : 3 }}
        />

        {/* High thumb */}
        <input
          type="range"
          className="elevation-thumb"
          min={MIN_FT}
          max={MAX_FT}
          step={50}
          value={high}
          onChange={handleHigh}
          aria-label="Maximum elevation"
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Endpoint labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "4px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--text-xlo)",
          }}
        >
          {formatFt(MIN_FT)} ft
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--text-xlo)",
          }}
        >
          {formatFt(MAX_FT)} ft
        </span>
      </div>
    </div>
  );
}
