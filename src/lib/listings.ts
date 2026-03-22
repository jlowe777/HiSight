import type { Property } from "@/types/property";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST =
  process.env.RAPIDAPI_HOST ?? "real-estate101.p.rapidapi.com";
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}`;

/**
 * Shape of a single listing from the real-estate101 /api/search endpoint.
 * Field names verified against live API response.
 */
interface RapidApiListing {
  id?: string | number;
  price?: string; // formatted: "$1,200,000"
  unformattedPrice?: number; // numeric
  beds?: number;
  baths?: number;
  area?: number;
  livingArea?: number;
  lotAreaValue?: number;
  lotAreaUnit?: string; // "sqft" or "acres"
  homeType?: string;
  homeStatus?: string;
  daysOnZillow?: number;
  zestimate?: number;
  imgSrc?: string;
  detailUrl?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  };
  latLong?: {
    latitude?: number;
    longitude?: number;
  };
  yearBuilt?: number;
  taxAssessedValue?: number;
}

/**
 * Shape of the /api/search response.
 */
interface SearchResponse {
  success?: boolean;
  totalCount?: number;
  filteredCount?: number;
  results?: RapidApiListing[];
}

/**
 * Normalize a real-estate101 listing into our internal Property type.
 * Elevation fields are left null — populated by /api/elevation routes.
 */
export function normalizeRapidApiListing(raw: RapidApiListing): Property {
  const streetAddress = raw.address?.street ?? "Unknown address";
  const city = raw.address?.city ?? "";
  const state = raw.address?.state ?? "";
  const zip = raw.address?.zipcode ?? "";

  // Lot size: convert acres → sqft if needed
  let lotSize: number | null = null;
  if (raw.lotAreaValue != null) {
    const unit = (raw.lotAreaUnit ?? "").toLowerCase();
    lotSize =
      unit === "acres" || unit === "acre"
        ? Math.round(raw.lotAreaValue * 43560)
        : Math.round(raw.lotAreaValue);
  }

  // Listing URL: always full on this API but guard anyway
  let listingUrl = raw.detailUrl ?? "";
  if (listingUrl && listingUrl.startsWith("/")) {
    listingUrl = `https://www.zillow.com${listingUrl}`;
  }

  return {
    id: String(raw.id ?? Math.random().toString(36).slice(2)),
    address: streetAddress,
    city,
    state,
    zip,
    lat: raw.latLong?.latitude ?? 0,
    lng: raw.latLong?.longitude ?? 0,
    price: raw.unformattedPrice ?? null,
    zestimate: raw.zestimate ?? null,
    beds: raw.beds ?? 0,
    baths: raw.baths ?? 0,
    sqft: raw.livingArea ?? raw.area ?? null,
    lotSize,
    yearBuilt: raw.yearBuilt ?? null,
    propertyType: raw.homeType ?? null,
    daysOnMarket: raw.daysOnZillow ?? null,
    photos: raw.imgSrc ? [raw.imgSrc] : [],
    listingUrl,
    elevation: null,
    localProminence: null,
    elevationFetchedAt: null,
  };
}

export function normalizeListings(rawListings: RapidApiListing[]): Property[] {
  return rawListings.map(normalizeRapidApiListing);
}

/**
 * Fetch listings from real-estate101.p.rapidapi.com /api/search.
 * Searches Golden, Wheat Ridge, and Applewood area for homes for sale.
 * Throws on error — caller should catch and fall back to seed data.
 */
export async function fetchListingsFromRapidAPI(
  location = "Golden, CO",
): Promise<Property[]> {
  if (!RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY not set");

  const url = new URL(`${RAPIDAPI_BASE}/api/search`);
  url.searchParams.set("location", location);
  url.searchParams.set("status_type", "ForSale");
  url.searchParams.set("home_type", "Houses");
  url.searchParams.set("page", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`RapidAPI returned ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as SearchResponse;
  const results = data.results ?? [];

  // Filter out entries missing coordinates (unusable on map)
  const valid = results.filter(
    (p) => p.latLong?.latitude != null && p.latLong?.longitude != null,
  );

  return normalizeListings(valid);
}
