import type {
  Destination,
  ExclusionReason,
  RankedDestination,
  RecommendationResult,
  TripCriteria,
} from "./types";

const DRIVE_TIME_ESTIMATE_TOLERANCE_HOURS = 0.15;

export function recommendDestinations(
  destinations: readonly Destination[],
  criteria: TripCriteria,
): RecommendationResult {
  const {
    allowBorderCrossings,
    allowFerryRoutes,
    children,
    days,
    hideVisited,
    maxDriveHours,
    preferences,
    visitedDestinationIds,
  } = criteria;
  const visitedIds = new Set(visitedDestinationIds);
  const recommendations: RankedDestination[] = [];
  const exclusions: RecommendationResult["exclusions"] = [];

  for (const destination of destinations) {
    const reasons: ExclusionReason[] = [];

    if (
      destination.hours >
      maxDriveHours + DRIVE_TIME_ESTIMATE_TOLERANCE_HOURS
    ) {
      reasons.push("drive-time");
    }
    if (days < destination.minDays || days > destination.maxDays) {
      reasons.push("trip-length");
    }
    if (!allowFerryRoutes && destination.usesFerry) {
      reasons.push("ferry");
    }
    if (!allowBorderCrossings && destination.crossesBorder) {
      reasons.push("border");
    }
    if (hideVisited && visitedIds.has(destination.id)) {
      reasons.push("visited");
    }

    if (reasons.length > 0) {
      exclusions.push({ destination, reasons });
      continue;
    }

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
    const tripLengthScore = 14;
    const childScore =
      children > 0 ? destination.familyFit * 1.8 : destination.familyFit;
    const weatherScore = destination.weatherBackup * 0.9;
    const score = Math.round(
      Math.min(
        98,
        15 +
          preferenceScore +
          distanceScore +
          tripLengthScore +
          childScore +
          weatherScore,
      ),
    );

    recommendations.push({ ...destination, score, preferenceMatches });
  }

  recommendations.sort((a, b) => b.score - a.score || a.hours - b.hours);

  return { recommendations, exclusions };
}
