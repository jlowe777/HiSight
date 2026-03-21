import type { ElevationProfile } from "@/types/property";
import { generateWestTransect } from "./transect";

const USGS_3DEP_URL = "https://epqs.nationalmap.gov/v1/json";

// TODO: Add Vercel KV caching here once @vercel/kv is configured.
// Key pattern: `elev:${lat.toFixed(6)}:${lng.toFixed(6)}`
// TTL: 86400 seconds (1 day). USGS data is static; no need to re-fetch frequently.

/**
 * Fetch a single elevation point from the USGS 3DEP Elevation Point Query Service.
 * Returns elevation in meters, or null if the point has no data or the request fails.
 *
 * USGS endpoint: GET /v1/json?x={lng}&y={lat}&wkid=4326&includeDate=false
 * Response: { value: "1234.56" } — elevation in meters as a string, or "No Data"
 */
export async function fetchElevationMeters(
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
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = (await res.json()) as { value?: string | number };
    const raw = data.value;

    if (raw === undefined || raw === "No Data" || raw === -1000000) return null;

    const elevM = parseFloat(String(raw));
    if (isNaN(elevM)) return null;

    return elevM;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Fetch elevations for an array of lat/lng points in batches of 10.
 * Batches run sequentially to respect USGS rate limits.
 * Within each batch, requests run in parallel.
 *
 * Returns an array of number | null in the same order as the input.
 */
export async function fetchElevationsBatch(
  points: Array<{ lat: number; lng: number }>,
): Promise<Array<number | null>> {
  const BATCH_SIZE = 10;
  const results: Array<number | null> = [];

  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    const batch = points.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((pt) => fetchElevationMeters(pt.lat, pt.lng)),
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Interpolate null elevation values using linear interpolation between
 * the nearest non-null neighbors. Fills leading/trailing nulls with the
 * first/last known non-null value. If all values are null, returns 0.
 */
function interpolateNulls(values: Array<number | null>): number[] {
  const out = [...values] as Array<number | null>;
  const len = out.length;

  // Find first and last non-null indices
  let firstKnown = -1;
  let lastKnown = -1;
  for (let i = 0; i < len; i++) {
    if (out[i] !== null) {
      if (firstKnown === -1) firstKnown = i;
      lastKnown = i;
    }
  }

  // All null → return zeros
  if (firstKnown === -1) return new Array(len).fill(0);

  // Fill leading nulls with first known value
  for (let i = 0; i < firstKnown; i++) {
    out[i] = out[firstKnown];
  }

  // Fill trailing nulls with last known value
  for (let i = lastKnown + 1; i < len; i++) {
    out[i] = out[lastKnown];
  }

  // Linearly interpolate gaps in the middle
  let i = 0;
  while (i < len) {
    if (out[i] === null) {
      // Find next non-null
      let j = i + 1;
      while (j < len && out[j] === null) j++;
      // Interpolate between i-1 and j
      const lo = out[i - 1] as number;
      const hi = out[j] as number;
      const span = j - (i - 1);
      for (let k = i; k < j; k++) {
        out[k] = lo + ((hi - lo) * (k - (i - 1))) / span;
      }
      i = j;
    } else {
      i++;
    }
  }

  return out as number[];
}

/**
 * Build an ElevationProfile by querying 3DEP for each west-transect point.
 * Null elevations are interpolated from neighbors so the chart always renders.
 */
export async function buildElevationProfile(
  lat: number,
  lng: number,
  totalDistanceKm = 30,
  numPoints = 80,
): Promise<ElevationProfile> {
  const transectPoints = generateWestTransect(
    lat,
    lng,
    totalDistanceKm,
    numPoints,
  );

  const rawElevations = await fetchElevationsBatch(transectPoints);
  const elevations = interpolateNulls(rawElevations);

  const points = transectPoints.map((pt, idx) => ({
    ...pt,
    elevationM: elevations[idx],
  }));

  return {
    originLat: lat,
    originLng: lng,
    points,
    generatedAt: new Date().toISOString(),
  };
}
