import type { ElevationPoint } from "@/types/property";

/**
 * Compute the local prominence of a property: how many meters above the
 * average elevation of the surrounding transect points it sits.
 *
 * @param propertyElevM - The property's elevation in meters
 * @param transectPoints - Elevation points from the west-facing transect
 * @returns Prominence in meters (positive = above surroundings)
 */
export function computeLocalProminence(
  propertyElevM: number,
  transectPoints: ElevationPoint[],
): number {
  if (transectPoints.length === 0) return 0;

  const avgElevM =
    transectPoints.reduce((sum, pt) => sum + pt.elevationM, 0) /
    transectPoints.length;

  return propertyElevM - avgElevM;
}

/**
 * Filter transect points to those within radiusKm of the origin.
 * Useful for computing "local" prominence within a defined radius.
 */
export function filterPointsByRadius(
  points: ElevationPoint[],
  radiusKm: number,
): ElevationPoint[] {
  return points.filter((pt) => pt.distanceKm <= radiusKm);
}
