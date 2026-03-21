import { buildElevationProfile } from "@/lib/elevation";

export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    return Response.json(
      { error: "lat and lng query params are required" },
      { status: 400 },
    );
  }

  const profile = await buildElevationProfile(lat, lng, 30, 80);
  return Response.json(profile);
}
