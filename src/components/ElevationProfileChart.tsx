"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from "recharts";
import type { ElevationProfile } from "@/types/property";

interface ElevationProfileChartProps {
  profile: ElevationProfile;
}

export default function ElevationProfileChart({
  profile,
}: ElevationProfileChartProps) {
  const data = profile.points.map((pt) => ({
    distanceKm: parseFloat(pt.distanceKm.toFixed(1)),
    elevationM: Math.round(pt.elevationM),
  }));

  const lastPoint = data[data.length - 1];

  return (
    <div style={{ width: "100%", height: "100px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="elevAccentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* No axis labels — clean look per spec */}
          <XAxis dataKey="distanceKm" hide />
          <YAxis hide />

          {/* Vertical dashed line at x=0 (property location) */}
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
                value="Rockies"
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
            strokeWidth={1.5}
            fill="url(#elevAccentGradient)"
            isAnimationActive={true}
            animationDuration={400}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
