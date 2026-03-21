/**
 * scripts/enrich-elevation.ts
 *
 * One-time script to enrich seed-listings.json with real USGS 3DEP elevation data.
 *
 * For each property:
 *   1. Fetches property elevation from USGS 3DEP
 *   2. Fetches elevation at 8 surrounding points (N, NE, E, SE, S, SW, W, NW)
 *      at 0.25 mile radius (~0.4023 km)
 *   3. Computes localProminence = propertyElevation - avg(surroundingElevations)
 *   4. Writes enriched data back to seed-listings.json
 *
 * Run with: npm run enrich:elevation
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const USGS_3DEP_URL = "https://epqs.nationalmap.gov/v1/json";

// 0.25 miles in km
const RADIUS_KM = 0.25 * 1.60934;

interface SeedProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  price: number | null;
  zestimate: number | null;
  beds: number;
  baths: number;
  sqft: number | null;
  daysOnMarket: number | null;
  photos: string[];
  listingUrl: string;
  elevation: number | null;
  localProminence: number | null;
  elevationFetchedAt: string | null;
  [key: string]: unknown;
}

// ─── USGS fetch (inline, no imports from app code to keep tsx invocation simple) ──

async function fetchElevationMeters(
  lat: number,
  lng: number,
): Promise<number | null> {
  const roundedLat = parseFloat(lat.toFixed(6));
  const roundedLng = parseFloat(lng.toFixed(6));

  const url = new URL(USGS_3DEP_URL);
  url.searchParams.set("x", String(roundedLng));
  url.searchParams.set("y", String(roundedLat));
  url.searchParams.set("wkid", "4326");
  url.searchParams.set("includeDate", "false");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = (await res.json()) as { value?: string | number };
    const raw = data.value;
    if (raw === undefined || raw === "No Data" || raw === -1000000) return null;

    const elevM = parseFloat(String(raw));
    return isNaN(elevM) ? null : elevM;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

// ─── Haversine destination (inline, avoids Next.js module resolution) ──

const EARTH_RADIUS_KM = 6371;

function haversineDestination(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceKm: number,
): { lat: number; lng: number } {
  const R = EARTH_RADIUS_KM;
  const δ = distanceKm / R;
  const θ = (bearingDeg * Math.PI) / 180;

  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;

  const sinφ2 =
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
  const φ2 = Math.asin(sinφ2);

  const y = Math.sin(θ) * Math.sin(δ) * Math.cos(φ1);
  const x = Math.cos(δ) - Math.sin(φ1) * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);

  return {
    lat: (φ2 * 180) / Math.PI,
    lng: (((λ2 * 180) / Math.PI + 540) % 360) - 180,
  };
}

// 8 cardinal/intercardinal bearings
const SURROUNDING_BEARINGS = [0, 45, 90, 135, 180, 225, 270, 315];
const BEARING_NAMES = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

async function computeLocalProminence(
  propertyElevM: number,
  lat: number,
  lng: number,
): Promise<number | null> {
  const surroundingPoints = SURROUNDING_BEARINGS.map((bearing) =>
    haversineDestination(lat, lng, bearing, RADIUS_KM),
  );

  console.log(
    `    Fetching 8 surrounding points at ${RADIUS_KM.toFixed(3)}km radius...`,
  );

  const elevations = await Promise.all(
    surroundingPoints.map((pt, i) => {
      process.stdout.write(`      ${BEARING_NAMES[i]}... `);
      return fetchElevationMeters(pt.lat, pt.lng).then((elev) => {
        process.stdout.write(
          `${elev !== null ? elev.toFixed(1) + "m" : "null"}\n`,
        );
        return elev;
      });
    }),
  );

  const validElevations = elevations.filter((e): e is number => e !== null);
  if (validElevations.length === 0) return null;

  const avgSurrounding =
    validElevations.reduce((sum, e) => sum + e, 0) / validElevations.length;

  return Math.round((propertyElevM - avgSurrounding) * 10) / 10;
}

// ─── Main ──

async function main() {
  const seedPath = join(
    new URL(".", import.meta.url).pathname,
    "../src/data/seed-listings.json",
  );

  const raw = readFileSync(seedPath, "utf-8");
  const listings: SeedProperty[] = JSON.parse(raw) as SeedProperty[];

  console.log(
    `\nEnriching ${listings.length} seed listings with USGS 3DEP elevation data...\n`,
  );

  const enriched: SeedProperty[] = [];

  for (let i = 0; i < listings.length; i++) {
    const p = listings[i];
    console.log(
      `[${i + 1}/${listings.length}] ${p.address}, ${p.city}, ${p.state}`,
    );
    console.log(`  lat=${p.lat}, lng=${p.lng}`);

    console.log(`  Fetching property elevation...`);
    const elevationM = await fetchElevationMeters(p.lat, p.lng);

    if (elevationM === null) {
      console.warn(
        `  WARNING: No elevation data returned. Keeping previous value.`,
      );
      enriched.push(p);
      continue;
    }

    console.log(`  Property elevation: ${elevationM.toFixed(2)}m`);

    const localProminence = await computeLocalProminence(
      elevationM,
      p.lat,
      p.lng,
    );

    console.log(
      `  Local prominence: ${localProminence !== null ? localProminence.toFixed(1) + "m" : "null (insufficient surrounding data)"}`,
    );

    enriched.push({
      ...p,
      elevation: Math.round(elevationM * 10) / 10,
      localProminence,
      elevationFetchedAt: new Date().toISOString(),
    });

    // Brief pause between properties to stay well within USGS rate limits
    if (i < listings.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  writeFileSync(seedPath, JSON.stringify(enriched, null, 2) + "\n", "utf-8");

  console.log(
    `\nDone. Wrote ${enriched.length} enriched listings to seed-listings.json\n`,
  );
  console.log("Summary:");
  enriched.forEach((p) => {
    const elevFt =
      p.elevation !== null ? Math.round(p.elevation * 3.28084) : null;
    const promFt =
      p.localProminence !== null
        ? Math.round(p.localProminence * 3.28084)
        : null;
    console.log(
      `  ${p.address.padEnd(28)} ${elevFt !== null ? `${elevFt} ft` : "n/a".padStart(7)}${promFt !== null ? ` (+${promFt} ft prominence)` : ""}`,
    );
  });
}

main().catch((err) => {
  console.error("Enrich script failed:", err);
  process.exit(1);
});
