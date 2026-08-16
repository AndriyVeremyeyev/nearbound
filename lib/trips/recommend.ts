import type { Destination, RankedDestination, TripCriteria } from "./types";

const DRIVE_TIME_ESTIMATE_TOLERANCE_HOURS = 0.15;

export function recommendDestinations(
  destinations: readonly Destination[],
  criteria: TripCriteria,
): RankedDestination[] {
  const {
    children,
    days,
    hideVisited,
    maxDriveHours,
    preferences,
    visitedDestinationIds,
  } = criteria;
  const visitedIds = new Set(visitedDestinationIds);

  return destinations
    .filter(
      (destination) =>
        destination.hours <= maxDriveHours + DRIVE_TIME_ESTIMATE_TOLERANCE_HOURS,
    )
    .filter(
      (destination) => !hideVisited || !visitedIds.has(destination.id),
    )
    .map((destination) => {
      const preferenceMatches = destination.preferences.filter((tag) =>
        preferences.includes(tag),
      ).length;
      const preferenceScore = preferences.length
        ? (preferenceMatches / preferences.length) * 28
        : 16;
      const distanceScore = Math.max(
        5,
        18 - (destination.hours / maxDriveHours) * 8,
      );
      const dayScore =
        days >= destination.minDays && days <= destination.maxDays ? 14 : 3;
      const childScore =
        children > 0 ? destination.familyFit * 1.8 : destination.familyFit;
      const weatherScore = destination.weatherBackup * 0.9;
      const score = Math.round(
        Math.min(
          98,
          15 +
            preferenceScore +
            distanceScore +
            dayScore +
            childScore +
            weatherScore,
        ),
      );

      return { ...destination, score, preferenceMatches };
    })
    .sort((a, b) => b.score - a.score || a.hours - b.hours);
}
