const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST ?? "zillow-com1.p.rapidapi.com";
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}`;
const PLACEHOLDER_KEY = "your_rapidapi_key_here";

export const maxDuration = 15;

/**
 * GET /api/listings/[zpid]
 *
 * Fetches full property detail from RapidAPI Zillow /property endpoint.
 * Returns rich data including photos, description, schools, price history,
 * tax history, walk score, and transit score.
 *
 * Falls back to 404 if RapidAPI is unavailable or zpid is not found.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ zpid: string }> },
) {
  const { zpid } = await params;

  if (!zpid) {
    return Response.json({ error: "zpid is required" }, { status: 400 });
  }

  if (!RAPIDAPI_KEY || RAPIDAPI_KEY === PLACEHOLDER_KEY) {
    return Response.json(
      { error: "Property detail unavailable — RapidAPI not configured" },
      { status: 404 },
    );
  }

  try {
    const url = new URL(`${RAPIDAPI_BASE}/property`);
    url.searchParams.set("zpid", zpid);

    const res = await fetch(url.toString(), {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
      next: { revalidate: 3600 },
    });

    if (res.status === 404) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    if (!res.ok) {
      throw new Error(`RapidAPI /property returned ${res.status}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (await res.json()) as Record<string, any>;

    // Extract the fields we surface to clients
    const detail = {
      zpid: String(raw.zpid ?? zpid),
      address: raw.address ?? null,
      latitude: raw.latitude ?? null,
      longitude: raw.longitude ?? null,
      price: raw.price ?? null,
      zestimate: raw.zestimate ?? null,
      bedrooms: raw.bedrooms ?? null,
      bathrooms: raw.bathrooms ?? null,
      livingArea: raw.livingArea ?? null,
      lotAreaValue: raw.lotAreaValue ?? null,
      lotAreaUnit: raw.lotAreaUnit ?? null,
      yearBuilt: raw.yearBuilt ?? null,
      homeType: raw.homeType ?? null,
      description: raw.description ?? null,
      // Photos: try hdpData.homeInfo.photos first, then top-level
      photos: extractPhotos(raw),
      schools: raw.schools ?? null,
      walkScore: raw.walkScore ?? null,
      transitScore: raw.transitScore ?? null,
      priceHistory: raw.priceHistory ?? null,
      taxHistory: raw.taxHistory ?? null,
    };

    return Response.json(detail);
  } catch (err) {
    console.error(`Failed to fetch property detail for zpid ${zpid}:`, err);
    return Response.json(
      { error: "Property detail unavailable" },
      { status: 404 },
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPhotos(raw: Record<string, any>): string[] {
  // Try hdpData path first
  const hdpPhotos = raw?.hdpData?.homeInfo?.photos;
  if (Array.isArray(hdpPhotos)) {
    return hdpPhotos
      .map((p: Record<string, unknown>) =>
        typeof p.url === "string"
          ? p.url
          : typeof p.mixedSources === "object" && p.mixedSources
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ((p.mixedSources as any)?.jpeg?.[0]?.url ?? null)
            : null,
      )
      .filter(Boolean) as string[];
  }

  // Fall back to top-level photos or imgSrc
  if (Array.isArray(raw.photos)) {
    return raw.photos
      .map((p: Record<string, unknown>) =>
        typeof p === "string" ? p : typeof p.url === "string" ? p.url : null,
      )
      .filter(Boolean) as string[];
  }

  if (typeof raw.imgSrc === "string") return [raw.imgSrc];

  return [];
}
