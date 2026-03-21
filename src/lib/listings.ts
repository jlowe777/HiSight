import type { Property } from "@/types/property";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST ?? "zillow-com1.p.rapidapi.com";
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}`;

/**
 * Shape of a single listing from the RapidAPI Zillow /propertyExtendedSearch endpoint.
 * Only the fields we actually use are typed; the rest are unknown.
 */
interface RapidApiListing {
  zpid?: string | number;
  address?: string;
  streetAddress?: string;
  // Some endpoints nest address; others return a flat string
  addressObj?: {
    streetAddress?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  };
  city?: string;
  state?: string;
  zipcode?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  zestimate?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  lotAreaValue?: number;
  lotAreaUnit?: string;
  daysOnZillow?: number;
  imgSrc?: string;
  detailUrl?: string;
  homeType?: string;
  yearBuilt?: number;
}

/**
 * Shape of the /propertyExtendedSearch response.
 */
interface SearchResponse {
  props?: RapidApiListing[];
  totalResultCount?: number;
}

/**
 * Normalize a RapidAPI Zillow listing into our internal Property type.
 * Elevation fields are left null — they are populated by the /api/elevation routes.
 * Any missing/undefined field uses null rather than crashing.
 */
export function normalizeRapidApiListing(raw: RapidApiListing): Property {
  // Address can come as a flat string or nested object depending on endpoint
  const streetAddress =
    raw.streetAddress ??
    raw.addressObj?.streetAddress ??
    (typeof raw.address === "string" ? raw.address : undefined) ??
    "Unknown address";

  const city = raw.city ?? raw.addressObj?.city ?? "";
  const state = raw.state ?? raw.addressObj?.state ?? "";
  const zip = raw.zipcode ?? raw.addressObj?.zipcode ?? "";

  // Lot size: convert acres → sqft if needed
  let lotSize: number | null = null;
  if (raw.lotAreaValue != null) {
    const unit = (raw.lotAreaUnit ?? "").toLowerCase();
    lotSize =
      unit === "acres" || unit === "acre"
        ? Math.round(raw.lotAreaValue * 43560)
        : Math.round(raw.lotAreaValue);
  }

  // Listing URL: prepend zillow.com if relative
  let listingUrl = raw.detailUrl ?? "";
  if (listingUrl && listingUrl.startsWith("/")) {
    listingUrl = `https://www.zillow.com${listingUrl}`;
  }

  return {
    id: String(raw.zpid ?? Math.random().toString(36).slice(2)),
    address: streetAddress,
    city,
    state,
    zip,
    lat: raw.latitude ?? 0,
    lng: raw.longitude ?? 0,
    price: raw.price ?? null,
    zestimate: raw.zestimate ?? null,
    beds: raw.bedrooms ?? 0,
    baths: raw.bathrooms ?? 0,
    sqft: raw.livingArea ?? null,
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

/**
 * Normalize an array of raw RapidAPI listings.
 */
export function normalizeListings(rawListings: RapidApiListing[]): Property[] {
  return rawListings.map(normalizeRapidApiListing);
}

/**
 * Fetch listings from RapidAPI Zillow (zillow-com1.p.rapidapi.com).
 * Uses /propertyExtendedSearch with status_type=ForSale and home_type=Houses.
 *
 * Throws on network/API errors — callers should catch and fall back to seed data.
 */
export async function fetchListingsFromRapidAPI(
  location = "Golden, CO",
): Promise<Property[]> {
  if (!RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY not set");

  const url = new URL(`${RAPIDAPI_BASE}/propertyExtendedSearch`);
  url.searchParams.set("location", location);
  url.searchParams.set("status_type", "ForSale");
  url.searchParams.set("home_type", "Houses");

  const res = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
    // Next.js ISR cache — revalidate every hour at the route level
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`RapidAPI returned ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as SearchResponse;
  const props = data.props ?? [];

  // Filter out entries with no lat/lng (unusable on the map)
  const valid = props.filter((p) => p.latitude != null && p.longitude != null);

  return normalizeListings(valid);
}
