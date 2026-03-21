export interface Property {
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
  lotSize?: number | null; // sqft
  yearBuilt?: number | null;
  propertyType?: string | null;
  daysOnMarket: number | null;
  photos: string[];
  listingUrl: string;
  elevation: number | null; // meters, from USGS
  localProminence: number | null; // meters above avg within 0.25mi
  elevationFetchedAt: string | null;
}

export interface ElevationPoint {
  lat: number;
  lng: number;
  distanceKm: number;
  elevationM: number;
}

export interface ElevationProfile {
  originLat: number;
  originLng: number;
  points: ElevationPoint[];
  generatedAt: string;
}
