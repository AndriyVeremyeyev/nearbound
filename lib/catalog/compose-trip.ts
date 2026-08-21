export type TripPace = "easy" | "balanced" | "see-more";

export type CatalogRouteArea = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  summary?: string;
};

export type CatalogRouteStop = {
  id: string;
  areaId: string;
  name: string;
  typicalDurationMinutes: number;
  childFit: "good" | "possible" | "not_recommended";
  preferences: string[];
  summary?: string;
};

export type CatalogRouteLeg = {
  fromAreaId: string;
  toAreaId: string;
  distanceMiles: number;
  driveMinutes: number;
};

export type CatalogTripPlan = {
  id: string;
  name: string;
  summary: string;
  startAreaId: string;
  endAreaId: string;
  minDays: number;
  minDaysWithChildren: number | null;
  maxDays: number;
};

export type RouteCatalog = {
  id: string;
  name: string;
  shape?: "linear" | "loop";
  summary?: string;
  sourceReferences?: readonly CatalogRouteSourceReference[];
  plans?: readonly CatalogTripPlan[];
  areas: readonly CatalogRouteArea[];
  stops: readonly CatalogRouteStop[];
  legs: readonly CatalogRouteLeg[];
};

export type CatalogRouteSourceReference = {
  title: string;
  url: string;
  publisherType: string;
  lastVerifiedAt: string | null;
};

export type TripCompositionCriteria = {
  days: number;
  pace: TripPace;
  preferences: readonly string[];
  travelingWithChildren: boolean;
};

export type TripIdea = {
  id: string;
  planId?: string;
  title: string;
  summary?: string;
  areaIds: string[];
  startArea: CatalogRouteArea;
  endArea: CatalogRouteArea;
  stops: CatalogRouteStop[];
  distanceMiles: number;
  driveMinutes: number;
  driveSegmentMinutes: number[];
  activityMinutes: number;
  matchedPreferences: string[];
};

export type TripIdeaAccess = {
  outboundMinutes: number;
  returnMinutes: number;
};

const FAMILY_BREAK_INTERVAL_MINUTES = 120;
const FAMILY_BREAK_MINUTES = 30;
const FAMILY_TRAVEL_DAY_BUFFER_MINUTES = 45;

const DAILY_LOAD_LIMITS: Record<TripPace, number> = {
  easy: 420,
  balanced: 540,
  "see-more": 600,
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

type TripSection = {
  plan?: CatalogTripPlan;
  selectedAreas: CatalogRouteArea[];
};

function sectionsForCriteria(
  catalog: RouteCatalog,
  criteria: TripCompositionCriteria,
  minAreas: number,
  maxAreas: number,
): TripSection[] {
  const days = Math.max(1, Math.round(criteria.days));

  if (catalog.plans && catalog.plans.length > 0) {
    return catalog.plans.flatMap((plan) => {
      const minimumDays = criteria.travelingWithChildren
        ? plan.minDaysWithChildren
        : plan.minDays;
      if (minimumDays === null || days < minimumDays || days > plan.maxDays) {
        return [];
      }

      const startIndex = catalog.areas.findIndex((area) => area.id === plan.startAreaId);
      const endIndex = catalog.areas.findIndex((area) => area.id === plan.endAreaId);
      if (startIndex < 0 || endIndex <= startIndex) return [];

      return [{ plan, selectedAreas: catalog.areas.slice(startIndex, endIndex + 1) }];
    });
  }

  const sections: TripSection[] = [];
  for (let startIndex = 0; startIndex < catalog.areas.length; startIndex += 1) {
    for (
      let endIndex = startIndex + minAreas - 1;
      endIndex < catalog.areas.length && endIndex - startIndex + 1 <= maxAreas;
      endIndex += 1
    ) {
      sections.push({ selectedAreas: catalog.areas.slice(startIndex, endIndex + 1) });
    }
  }

  return sections;
}

function requiredFamilyBreakMinutes(segmentMinutes: readonly number[]) {
  return segmentMinutes.reduce(
    (total, minutes) =>
      total + Math.floor(Math.max(0, minutes - 1) / FAMILY_BREAK_INTERVAL_MINUTES) * FAMILY_BREAK_MINUTES,
    0,
  );
}

/**
 * Uses an additive family buffer rather than hiding extra time in a multiplier:
 * a break after roughly each two hours of uninterrupted driving plus time lost
 * to loading, meals and settling in on travel days.
 */
export function estimateTripLoadMinutes(
  idea: Pick<TripIdea, "activityMinutes" | "driveSegmentMinutes">,
  criteria: Pick<TripCompositionCriteria, "days" | "pace" | "travelingWithChildren">,
  access: TripIdeaAccess,
) {
  const driveSegments = [
    access.outboundMinutes,
    ...idea.driveSegmentMinutes,
    access.returnMinutes,
  ];
  const drivingMinutes = driveSegments.reduce((total, minutes) => total + minutes, 0);
  const familyBufferMinutes = criteria.travelingWithChildren
    ? requiredFamilyBreakMinutes(driveSegments)
      + Math.min(Math.max(1, Math.round(criteria.days)), 2) * FAMILY_TRAVEL_DAY_BUFFER_MINUTES
    : 0;

  return {
    drivingMinutes,
    familyBufferMinutes,
    totalMinutes: drivingMinutes + idea.activityMinutes + familyBufferMinutes,
    maximumMinutes: Math.max(1, Math.round(criteria.days)) * DAILY_LOAD_LIMITS[criteria.pace],
  };
}

export function fitsTripLoad(
  idea: Pick<TripIdea, "activityMinutes" | "driveSegmentMinutes">,
  criteria: Pick<TripCompositionCriteria, "days" | "pace" | "travelingWithChildren">,
  access: TripIdeaAccess,
) {
  const load = estimateTripLoadMinutes(idea, criteria, access);
  return load.totalMinutes <= load.maximumMinutes;
}

/**
 * A viable route should lose optional stops before it disappears entirely.
 * The composer has already ordered stops by preference and family fit, so this
 * keeps the strongest anchors that still fit the actual access time.
 */
export function fitTripIdeaToAccess(
  idea: TripIdea,
  criteria: Pick<TripCompositionCriteria, "days" | "pace" | "travelingWithChildren">,
  access: TripIdeaAccess,
): TripIdea | null {
  const emptyIdea = { ...idea, stops: [], activityMinutes: 0 };
  if (!fitsTripLoad(emptyIdea, criteria, access)) return null;

  const stops: CatalogRouteStop[] = [];
  let activityMinutes = 0;
  for (const stop of idea.stops) {
    const candidate = {
      ...emptyIdea,
      stops: [...stops, stop],
      activityMinutes: activityMinutes + stop.typicalDurationMinutes,
    };
    if (!fitsTripLoad(candidate, criteria, access)) continue;
    stops.push(stop);
    activityMinutes += stop.typicalDurationMinutes;
  }

  return stops.length > 0 ? { ...idea, stops, activityMinutes } : null;
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

  for (const { plan, selectedAreas } of sectionsForCriteria(catalog, criteria, minAreas, maxAreas)) {
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
        id: `${catalog.id}:${plan?.id ?? `${firstArea.id}:${lastArea.id}`}:${days}:${criteria.pace}`,
        planId: plan?.id,
        title: plan?.name ?? (firstArea.id === lastArea.id ? firstArea.name : `${firstArea.name} to ${lastArea.name}`),
        summary: plan?.summary,
        areaIds: selectedAreaIds,
        startArea: firstArea,
        endArea: lastArea,
        stops: selection.stops,
        distanceMiles,
        driveMinutes,
        driveSegmentMinutes: selectedLegs.map((leg) => leg.driveMinutes),
        activityMinutes: selection.activityMinutes,
        matchedPreferences: matched,
        score,
      });
  }

  return candidates
    .sort(
      (left, right) =>
        right.score - left.score || left.driveMinutes - right.driveMinutes,
    )
    .slice(0, limit)
    .map((candidate) => ({
      id: candidate.id,
      planId: candidate.planId,
      title: candidate.title,
      summary: candidate.summary,
      areaIds: candidate.areaIds,
      startArea: candidate.startArea,
      endArea: candidate.endArea,
      stops: candidate.stops,
      distanceMiles: candidate.distanceMiles,
      driveMinutes: candidate.driveMinutes,
      driveSegmentMinutes: candidate.driveSegmentMinutes,
      activityMinutes: candidate.activityMinutes,
      matchedPreferences: candidate.matchedPreferences,
    }));
}

export function findTripIdea(
  catalog: RouteCatalog,
  criteria: TripCompositionCriteria,
  selection: { startAreaId: string; endAreaId: string },
) {
  return composeTripIdeas(
    catalog,
    criteria,
    Math.max(1, catalog.areas.length ** 2),
  ).find(
    (idea) =>
      idea.startArea.id === selection.startAreaId &&
      idea.endArea.id === selection.endAreaId,
  );
}
