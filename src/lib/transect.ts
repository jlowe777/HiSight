const EARTH_RADIUS_KM = 6371;

/**
 * Compute the destination point given an origin, bearing (degrees), and distance (km).
 * Uses the Haversine/spherical Earth destination formula.
 */
function haversineDestination(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceKm: number,
): { lat: number; lng: number } {
  const R = EARTH_RADIUS_KM;
  const δ = distanceKm / R; // angular distance in radians
  const θ = (bearingDeg * Math.PI) / 180; // bearing in radians

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
    lng: (((λ2 * 180) / Math.PI + 540) % 360) - 180, // normalize to -180..+180
  };
}

/**
 * Generate N points heading due west (bearing = 270°) from the origin,
 * spaced evenly over totalDistanceKm.
 *
 * The first point is at distanceKm = 0 (the origin itself).
 */
export function generateWestTransect(
  lat: number,
  lng: number,
  totalDistanceKm = 30,
  numPoints = 80,
): Array<{ lat: number; lng: number; distanceKm: number }> {
  const step = totalDistanceKm / (numPoints - 1);

  return Array.from({ length: numPoints }, (_, i) => {
    const distanceKm = i * step;
    const dest = haversineDestination(lat, lng, 270, distanceKm);
    return { ...dest, distanceKm };
  });
}
