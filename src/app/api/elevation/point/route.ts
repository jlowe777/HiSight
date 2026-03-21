import { fetchElevationMeters } from "@/lib/elevation";

export const maxDuration = 15;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    return Response.json({ error: "lat and lng required" }, { status: 400 });
  }

  const elevationM = await fetchElevationMeters(lat, lng);
  return Response.json({ elevationM, lat, lng });
}
