"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  Tooltip,
} from "recharts";
import type { ElevationProfile } from "@/types/property";

interface ElevationProfileChartProps {
  profile: ElevationProfile;
  propertyElevationM?: number | null;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { distanceKm: number; elevationM: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const { distanceKm, elevationM } = payload[0].payload;
  const elevFt = Math.round(elevationM * 3.28084);
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        padding: "6px 10px",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        color: "var(--text-hi)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
        pointerEvents: "none",
      }}
    >
      <div>↑ {elevFt.toLocaleString()} ft</div>
      <div style={{ color: "var(--text-lo)", marginTop: "2px" }}>
        {distanceKm} km west
      </div>
    </div>
  );
}

export default function ElevationProfileChart({
  profile,
  propertyElevationM,
}: ElevationProfileChartProps) {
  const data = profile.points.map((pt) => ({
    distanceKm: parseFloat(pt.distanceKm.toFixed(1)),
    elevationM: Math.round(pt.elevationM),
  }));

  const lastPoint = data[data.length - 1];
  const propertyElev =
    propertyElevationM != null
      ? Math.round(propertyElevationM)
      : (data[0]?.elevationM ?? null);

  return (
    <div style={{ width: "100%", height: "140px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2D6A4F" stopOpacity={0.55} />
              <stop offset="60%" stopColor="#2D6A4F" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#2D6A4F" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis dataKey="distanceKm" hide />
          <YAxis hide />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: "#2D6A4F",
              strokeWidth: 1,
              strokeDasharray: "3 3",
              strokeOpacity: 0.5,
            }}
          />

          {/* Property's own elevation — horizontal reference */}
          {propertyElev !== null && (
            <ReferenceLine
              y={propertyElev}
              stroke="#2D6A4F"
              strokeDasharray="3 3"
              strokeWidth={1}
              strokeOpacity={0.45}
            />
          )}

          {/* Vertical marker at origin (property location) */}
          <ReferenceLine
            x={0}
            stroke="#2D6A4F"
            strokeDasharray="3 3"
            strokeWidth={1.5}
          >
            <Label
              value="here"
              position="top"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                fill: "#2D6A4F",
              }}
            />
          </ReferenceLine>

          {/* "Rockies" label at right edge */}
          {lastPoint && (
            <ReferenceLine x={lastPoint.distanceKm} stroke="transparent">
              <Label
                value="Rockies →"
                position="insideTopRight"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  fill: "#9B9B96",
                }}
              />
            </ReferenceLine>
          )}

          <Area
            type="monotone"
            dataKey="elevationM"
            stroke="#2D6A4F"
            strokeWidth={2}
            fill="url(#elevGrad)"
            isAnimationActive={true}
            animationDuration={500}
            animationEasing="ease-out"
            dot={false}
            activeDot={{
              r: 3,
              fill: "#2D6A4F",
              stroke: "#ffffff",
              strokeWidth: 1.5,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
