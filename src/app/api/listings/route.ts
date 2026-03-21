import { fetchListingsFromRapidAPI } from "@/lib/listings";

export const revalidate = 3600; // ISR: revalidate cached response every hour

const PLACEHOLDER_KEY = "your_rapidapi_key_here";

export async function GET() {
  // Attempt RapidAPI if a real key is configured
  if (
    process.env.RAPIDAPI_KEY &&
    process.env.RAPIDAPI_KEY !== PLACEHOLDER_KEY
  ) {
    try {
      const properties = await fetchListingsFromRapidAPI();
      if (properties.length > 0) {
        return Response.json({
          properties,
          source: "rapidapi",
          fetchedAt: new Date().toISOString(),
        });
      }
      console.warn("RapidAPI returned 0 results — falling back to seed data");
    } catch (err) {
      console.error("RapidAPI fetch failed, falling back to seed data:", err);
    }
  }

  // Fallback: enriched seed data (never crashes the app)
  const seed = await import("@/data/seed-listings.json");
  return Response.json({
    properties: seed.default,
    source: "seed",
    fetchedAt: new Date().toISOString(),
  });
}
