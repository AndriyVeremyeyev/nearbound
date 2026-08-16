import type {
  Destination,
  ExclusionReason,
  Preference,
  RankedDestination,
  RecommendationResult,
  ScoreFactor,
  TripCriteria,
} from "./types";

const DRIVE_TIME_ESTIMATE_TOLERANCE_HOURS = 0.15;

export const SCORE_WEIGHTS = {
  experience: 30,
  driveTime: 25,
  groupFit: 20,
  weatherBackup: 15,
  logistics: 10,
} as const;

function clampScore(score: number, maxScore: number) {
  return Math.round(Math.max(0, Math.min(maxScore, score)));
}

function formatPreference(preference: Preference) {
  return preference
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatPreferenceList(preferences: readonly Preference[]) {
  const labels = preferences.map(formatPreference);

  if (labels.length <= 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels.at(-1)}`;
}

function buildScoreBreakdown(
  destination: Destination,
  criteria: TripCriteria,
): ScoreFactor[] {
  const preferenceMatches = destination.preferences.filter((preference) =>
    criteria.preferences.includes(preference),
  );
  const preferenceRatio = criteria.preferences.length
    ? preferenceMatches.length / criteria.preferences.length
    : null;
  const experienceScore =
    preferenceRatio === null
      ? Math.round(SCORE_WEIGHTS.experience * 0.6)
      : Math.round(SCORE_WEIGHTS.experience * preferenceRatio);
  const experienceFactor: ScoreFactor = {
    id: "experience",
    label: "Experience match",
    score: experienceScore,
    maxScore: SCORE_WEIGHTS.experience,
    summary:
      preferenceRatio === null
        ? "No experience preference selected."
        : preferenceMatches.length === criteria.preferences.length
          ? `Matches all selected experiences: ${formatPreferenceList(preferenceMatches)}.`
          : preferenceMatches.length > 0
            ? `Matches ${preferenceMatches.length} of ${criteria.preferences.length} selected experiences: ${formatPreferenceList(preferenceMatches)}.`
            : "Doesn’t match the selected experience tags.",
    sentiment:
      preferenceRatio === null
        ? "neutral"
        : preferenceRatio >= 0.5
          ? "strength"
          : "caution",
  };

  const driveRatio = destination.hours / Math.max(criteria.maxDriveHours, 0.1);
  const driveFactor: ScoreFactor = {
    id: "drive-time",
    label: "Drive-time margin",
    score: clampScore(
      SCORE_WEIGHTS.driveTime - driveRatio * 15,
      SCORE_WEIGHTS.driveTime,
    ),
    maxScore: SCORE_WEIGHTS.driveTime,
    summary:
      driveRatio <= 0.7
        ? "Leaves a comfortable margin inside your drive-time limit."
        : driveRatio <= 0.9
          ? "Fits inside your drive-time limit."
          : "Uses most of your drive-time limit.",
    sentiment:
      driveRatio <= 0.7
        ? "strength"
        : driveRatio <= 0.9
          ? "neutral"
          : "caution",
  };

  const groupScore =
    criteria.children > 0
      ? clampScore(
          (destination.familyFit / 10) * SCORE_WEIGHTS.groupFit,
          SCORE_WEIGHTS.groupFit,
        )
      : Math.round(SCORE_WEIGHTS.groupFit * 0.6);
  const groupFactor: ScoreFactor = {
    id: "group-fit",
    label: "Group fit",
    score: groupScore,
    maxScore: SCORE_WEIGHTS.groupFit,
    summary:
      criteria.children === 0
        ? "Family-specific fit is neutral for this group."
        : destination.familyFit >= 8
          ? "Strong fit for a trip with children."
          : destination.familyFit >= 6
            ? "Practical fit for a trip with children."
            : "Family fit is weaker than the leading options.",
    sentiment:
      criteria.children === 0
        ? "neutral"
        : destination.familyFit >= 8
          ? "strength"
          : destination.familyFit >= 6
            ? "neutral"
            : "caution",
  };

  const weatherFactor: ScoreFactor = {
    id: "weather-backup",
    label: "Weather backup",
    score: clampScore(
      (destination.weatherBackup / 10) * SCORE_WEIGHTS.weatherBackup,
      SCORE_WEIGHTS.weatherBackup,
    ),
    maxScore: SCORE_WEIGHTS.weatherBackup,
    summary:
      destination.weatherBackup >= 8
        ? "Strong indoor or bad-weather fallback."
        : destination.weatherBackup >= 7
          ? "Has a practical bad-weather fallback."
          : "Bad-weather options are limited.",
    sentiment:
      destination.weatherBackup >= 8
        ? "strength"
        : destination.weatherBackup >= 7
          ? "neutral"
          : "caution",
  };

  const logisticsPenalty =
    (destination.usesFerry ? 3 : 0) +
    (destination.crossesBorder ? 4 : 0);
  const logisticsFactor: ScoreFactor = {
    id: "logistics",
    label: "Route simplicity",
    score: SCORE_WEIGHTS.logistics - logisticsPenalty,
    maxScore: SCORE_WEIGHTS.logistics,
    summary:
      destination.usesFerry && destination.crossesBorder
        ? "Requires both a ferry and an international border crossing."
        : destination.usesFerry
          ? "Requires a ferry crossing even when ferries are allowed."
          : destination.crossesBorder
            ? "Requires an international border crossing."
            : "Simple route without a ferry or border crossing.",
    sentiment:
      destination.usesFerry || destination.crossesBorder
        ? "caution"
        : "strength",
  };

  return [
    experienceFactor,
    driveFactor,
    groupFactor,
    weatherFactor,
    logisticsFactor,
  ];
}

export function recommendDestinations(
  destinations: readonly Destination[],
  criteria: TripCriteria,
): RecommendationResult {
  const {
    allowBorderCrossings,
    allowFerryRoutes,
    days,
    hideVisited,
    maxDriveHours,
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

    const scoreBreakdown = buildScoreBreakdown(destination, criteria);
    const score = scoreBreakdown.reduce(
      (total, factor) => total + factor.score,
      0,
    );
    const strengths = scoreBreakdown.filter(
      (factor) => factor.sentiment === "strength",
    );
    const neutralFactors = scoreBreakdown.filter(
      (factor) => factor.sentiment === "neutral",
    );
    const matchReasons = [...strengths, ...neutralFactors]
      .slice(0, 2)
      .map((factor) => factor.summary);
    const tradeoffs = scoreBreakdown
      .filter((factor) => factor.sentiment === "caution")
      .map((factor) => factor.summary);

    recommendations.push({
      ...destination,
      score,
      scoreBreakdown,
      matchReasons,
      tradeoffs,
    });
  }

  recommendations.sort((a, b) => b.score - a.score || a.hours - b.hours);

  return { recommendations, exclusions };
}
