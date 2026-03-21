import { fetchElevationsBatch } from "@/lib/elevation";

export const maxDuration = 30;

const MAX_POINTS = 50;

interface BatchPoint {
  lat: number;
  lng: number;
}

function parsedPoints(raw: unknown): BatchPoint[] | null {
  if (!Array.isArray(raw)) return null;
  const pts: BatchPoint[] = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as Record<string, unknown>).lat === "number" &&
      typeof (item as Record<string, unknown>).lng === "number"
    ) {
      pts.push({
        lat: (item as BatchPoint).lat,
        lng: (item as BatchPoint).lng,
      });
    }
  }
  return pts;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPoints = searchParams.get("points");

  if (!rawPoints) {
    return Response.json(
      { error: "points query param is required (JSON array of {lat, lng})" },
      { status: 400 },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawPoints);
  } catch {
    return Response.json(
      { error: "points must be a valid JSON array" },
      { status: 400 },
    );
  }

  const points = parsedPoints(parsed);
  if (!points) {
    return Response.json(
      { error: "points must be an array of {lat, lng} objects" },
      { status: 400 },
    );
  }

  if (points.length > MAX_POINTS) {
    return Response.json(
      { error: `Maximum ${MAX_POINTS} points per request` },
      { status: 400 },
    );
  }

  const elevations = await fetchElevationsBatch(points);
  const results = points.map((pt, i) => ({
    lat: pt.lat,
    lng: pt.lng,
    elevationM: elevations[i],
  }));

  return Response.json({ results });
}

export async function POST(request: Request) {
  let body: { points?: unknown };
  try {
    body = (await request.json()) as { points?: unknown };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const points = parsedPoints(body.points ?? []);
  if (!points) {
    return Response.json(
      { error: "body.points must be an array of {lat, lng} objects" },
      { status: 400 },
    );
  }

  if (points.length > MAX_POINTS) {
    return Response.json(
      { error: `Maximum ${MAX_POINTS} points per request` },
      { status: 400 },
    );
  }

  const elevations = await fetchElevationsBatch(points);
  const results = points.map((pt, i) => ({
    lat: pt.lat,
    lng: pt.lng,
    elevationM: elevations[i],
  }));

  return Response.json({ results });
}
