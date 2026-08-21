export type TripPace = "easy" | "balanced" | "see-more";

export type CatalogRouteArea = {
  id: string;
  name: string;
};

export type CatalogRouteStop = {
  id: string;
  areaId: string;
  name: string;
  typicalDurationMinutes: number;
  childFit: "good" | "possible" | "not_recommended";
  preferences: string[];
};

export type CatalogRouteLeg = {
  fromAreaId: string;
  toAreaId: string;
  distanceMiles: number;
  driveMinutes: number;
};

export type RouteCatalog = {
  id: string;
  name: string;
  areas: readonly CatalogRouteArea[];
  stops: readonly CatalogRouteStop[];
  legs: readonly CatalogRouteLeg[];
};

export type TripCompositionCriteria = {
  days: number;
  pace: TripPace;
  preferences: readonly string[];
  travelingWithChildren: boolean;
};

export type TripIdea = {
  id: string;
  title: string;
  areaIds: string[];
  stops: CatalogRouteStop[];
  distanceMiles: number;
  driveMinutes: number;
  activityMinutes: number;
  matchedPreferences: string[];
};

const PACE_RULES: Record<
  TripPace,
  {
    activityMinutesPerDay: number;
    driveMinutesPerDay: number;
    minAreas: (days: number) => number;
    maxAreas: (days: number) => number;
    targetAreas: (days: number) => number;
  }
> = {
  easy: {
    activityMinutesPerDay: 180,
    driveMinutesPerDay: 150,
    minAreas: (days) => Math.max(1, Math.ceil(days * 0.5)),
    maxAreas: (days) => Math.max(1, days),
    targetAreas: (days) => Math.max(1, Math.round(days * 0.75)),
  },
  balanced: {
    activityMinutesPerDay: 300,
    driveMinutesPerDay: 210,
    minAreas: (days) => Math.max(1, days),
    maxAreas: (days) => Math.max(1, days * 2),
    targetAreas: (days) => Math.max(1, Math.round(days * 1.5)),
  },
  "see-more": {
    activityMinutesPerDay: 420,
    driveMinutesPerDay: 270,
    minAreas: (days) => Math.max(1, days * 2),
    maxAreas: (days) => Math.max(1, days * 3),
    targetAreas: (days) => Math.max(1, Math.round(days * 2.25)),
  },
};

function getLeg(
  legs: readonly CatalogRouteLeg[],
  fromAreaId: string,
  toAreaId: string,
) {
  return legs.find(
    (leg) => leg.fromAreaId === fromAreaId && leg.toAreaId === toAreaId,
  );
}

function stopScore(
  stop: CatalogRouteStop,
  criteria: TripCompositionCriteria,
) {
  const matchingPreferences = stop.preferences.filter((preference) =>
    criteria.preferences.includes(preference),
  ).length;
  const childFitScore = criteria.travelingWithChildren
    ? stop.childFit === "good"
      ? 3
      : stop.childFit === "possible"
        ? 1
        : -4
    : 0;

  return matchingPreferences * 10 + childFitScore - stop.typicalDurationMinutes / 120;
}

function selectStops(
  stops: readonly CatalogRouteStop[],
  areaIds: readonly string[],
  criteria: TripCompositionCriteria,
  activityBudgetMinutes: number,
) {
  const candidates = stops
    .filter((stop) => areaIds.includes(stop.areaId))
    .filter(
      (stop) =>
        !criteria.travelingWithChildren || stop.childFit !== "not_recommended",
    )
    .sort((left, right) => stopScore(right, criteria) - stopScore(left, criteria));

  const selected: CatalogRouteStop[] = [];
  let activityMinutes = 0;

  for (const stop of candidates) {
    if (activityMinutes + stop.typicalDurationMinutes > activityBudgetMinutes) {
      continue;
    }

    selected.push(stop);
    activityMinutes += stop.typicalDurationMinutes;
  }

  return { stops: selected, activityMinutes };
}

function matchedPreferences(
  stops: readonly CatalogRouteStop[],
  preferences: readonly string[],
) {
  return preferences.filter((preference) =>
    stops.some((stop) => stop.preferences.includes(preference)),
  );
}

export function composeTripIdeas(
  catalog: RouteCatalog,
  criteria: TripCompositionCriteria,
  limit = 3,
): TripIdea[] {
  const days = Math.max(1, Math.round(criteria.days));
  const rules = PACE_RULES[criteria.pace];
  const minAreas = Math.min(catalog.areas.length, rules.minAreas(days));
  const maxAreas = Math.min(catalog.areas.length, rules.maxAreas(days));
  const targetAreas = Math.min(catalog.areas.length, rules.targetAreas(days));
  const activityBudgetMinutes = days * rules.activityMinutesPerDay;
  const driveBudgetMinutes = days * rules.driveMinutesPerDay;
  const candidates: Array<TripIdea & { score: number }> = [];

  for (let startIndex = 0; startIndex < catalog.areas.length; startIndex += 1) {
    for (
      let endIndex = startIndex + minAreas - 1;
      endIndex < catalog.areas.length && endIndex - startIndex + 1 <= maxAreas;
      endIndex += 1
    ) {
      const selectedAreas = catalog.areas.slice(startIndex, endIndex + 1);
      const selectedAreaIds = selectedAreas.map((area) => area.id);
      const selectedLegs: CatalogRouteLeg[] = [];

      for (let areaIndex = 0; areaIndex < selectedAreas.length - 1; areaIndex += 1) {
        const leg = getLeg(
          catalog.legs,
          selectedAreas[areaIndex].id,
          selectedAreas[areaIndex + 1].id,
        );

        if (!leg) break;
        selectedLegs.push(leg);
      }

      if (selectedLegs.length !== Math.max(0, selectedAreas.length - 1)) {
        continue;
      }

      const driveMinutes = selectedLegs.reduce(
        (total, leg) => total + leg.driveMinutes,
        0,
      );

      if (driveMinutes > driveBudgetMinutes) continue;

      const distanceMiles = selectedLegs.reduce(
        (total, leg) => total + leg.distanceMiles,
        0,
      );
      const selection = selectStops(
        catalog.stops,
        selectedAreaIds,
        criteria,
        activityBudgetMinutes,
      );

      if (selection.stops.length === 0) continue;

      const matched = matchedPreferences(selection.stops, criteria.preferences);
      const preferenceScore = criteria.preferences.length
        ? (matched.length / criteria.preferences.length) * 100
        : 60;
      const paceScore = Math.max(
        0,
        20 - Math.abs(selectedAreas.length - targetAreas) * 5,
      );
      const score = preferenceScore + paceScore + Math.min(selection.stops.length, 8);
      const firstArea = selectedAreas[0];
      const lastArea = selectedAreas.at(-1)!;

      candidates.push({
        id: `${catalog.id}:${firstArea.id}:${lastArea.id}:${days}:${criteria.pace}`,
        title:
          firstArea.id === lastArea.id
            ? firstArea.name
            : `${firstArea.name} to ${lastArea.name}`,
        areaIds: selectedAreaIds,
        stops: selection.stops,
        distanceMiles,
        driveMinutes,
        activityMinutes: selection.activityMinutes,
        matchedPreferences: matched,
        score,
      });
    }
  }

  return candidates
    .sort(
      (left, right) =>
        right.score - left.score || left.driveMinutes - right.driveMinutes,
    )
    .slice(0, limit)
    .map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      areaIds: candidate.areaIds,
      stops: candidate.stops,
      distanceMiles: candidate.distanceMiles,
      driveMinutes: candidate.driveMinutes,
      activityMinutes: candidate.activityMinutes,
      matchedPreferences: candidate.matchedPreferences,
    }));
}
