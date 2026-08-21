export type CatalogValidationRecord = {
  id: string;
  name: string;
  lastVerifiedAt: string | null;
  reviewDueAt: string | null;
  sourceCount: number;
};

export type CatalogValidationArea = CatalogValidationRecord & {
  latitude: number | null;
  longitude: number | null;
};

export type CatalogValidationStop = CatalogValidationRecord & {
  areaIds: readonly string[];
  latitude: number | null;
  longitude: number | null;
  typicalDurationMinutes: number;
};

export type CatalogValidationRoute = CatalogValidationRecord & {
  areas: readonly CatalogValidationArea[];
  stops: readonly CatalogValidationStop[];
  legs: readonly {
    fromAreaId: string;
    toAreaId: string;
    distanceMiles: number;
    driveMinutes: number;
    lastVerifiedAt: string | null;
    reviewDueAt: string | null;
  }[];
  sources: readonly {
    id: string;
    status: string;
    lastCheckedAt: string | null;
  }[];
};

export type CatalogValidationReport = {
  errors: string[];
  warnings: string[];
};

function addVerificationIssues(
  record: Pick<CatalogValidationRecord, "id" | "lastVerifiedAt" | "reviewDueAt">,
  label: string,
  today: string,
  report: CatalogValidationReport,
) {
  if (!record.lastVerifiedAt) {
    report.errors.push(`${label} ${record.id} has no verification date.`);
  }
  if (!record.reviewDueAt) {
    report.errors.push(`${label} ${record.id} has no review date.`);
  }
  if (
    record.lastVerifiedAt &&
    record.reviewDueAt &&
    record.reviewDueAt < record.lastVerifiedAt
  ) {
    report.errors.push(`${label} ${record.id} has a review date before its verification date.`);
  }
  if (record.reviewDueAt && record.reviewDueAt < today) {
    report.warnings.push(`${label} ${record.id} is due for review (${record.reviewDueAt}).`);
  }
}

function addEvidenceIssue(
  record: Pick<CatalogValidationRecord, "id" | "sourceCount">,
  label: string,
  report: CatalogValidationReport,
) {
  if (record.sourceCount === 0) {
    report.errors.push(`${label} ${record.id} has no source evidence.`);
  }
}

export function validateRouteCatalog(
  route: CatalogValidationRoute,
  { today = new Date().toISOString().slice(0, 10) }: { today?: string } = {},
): CatalogValidationReport {
  const report: CatalogValidationReport = { errors: [], warnings: [] };
  const areaIds = route.areas.map((area) => area.id);

  addEvidenceIssue(route, "Route", report);
  addVerificationIssues(route, "Route", today, report);

  if (areaIds.length < 2) {
    report.errors.push(`Route ${route.id} needs at least two ordered areas.`);
  }
  if (new Set(areaIds).size !== areaIds.length) {
    report.errors.push(`Route ${route.id} repeats an area in its ordered area sequence.`);
  }

  for (const area of route.areas) {
    addEvidenceIssue(area, "Area", report);
    addVerificationIssues(area, "Area", today, report);
    if (area.latitude === null || area.longitude === null) {
      report.errors.push(`Area ${area.id} needs coordinates.`);
    }
  }

  for (const stop of route.stops) {
    addEvidenceIssue(stop, "Stop", report);
    addVerificationIssues(stop, "Stop", today, report);
    if (stop.latitude === null || stop.longitude === null) {
      report.errors.push(`Stop ${stop.id} needs coordinates.`);
    }
    if (stop.typicalDurationMinutes < 15 || stop.typicalDurationMinutes > 720) {
      report.errors.push(`Stop ${stop.id} has an implausible typical duration.`);
    }
    if (!stop.areaIds.some((areaId) => areaIds.includes(areaId))) {
      report.errors.push(`Stop ${stop.id} is not connected to an area on route ${route.id}.`);
    }
  }

  const expectedLegCount = Math.max(0, areaIds.length - 1);
  if (route.legs.length !== expectedLegCount) {
    report.errors.push(`Route ${route.id} has ${route.legs.length} legs but needs ${expectedLegCount}.`);
  }
  for (let index = 0; index < route.legs.length; index += 1) {
    const leg = route.legs[index];
    const expectedFrom = areaIds[index];
    const expectedTo = areaIds[index + 1];

    if (leg.fromAreaId !== expectedFrom || leg.toAreaId !== expectedTo) {
      report.errors.push(`Route ${route.id} leg ${index + 1} does not connect the ordered areas.`);
    }
    if (leg.distanceMiles <= 0 || leg.driveMinutes <= 0) {
      report.errors.push(`Route ${route.id} leg ${index + 1} needs positive miles and drive minutes.`);
    }
    addVerificationIssues(
      { id: `${route.id} leg ${index + 1}`, ...leg },
      "Route",
      today,
      report,
    );
  }

  const sources = new Map(route.sources.map((source) => [source.id, source]));
  for (const source of sources.values()) {
    if (source.status !== "active") {
      report.errors.push(`Source ${source.id} is ${source.status}, not active.`);
    }
    if (!source.lastCheckedAt) {
      report.warnings.push(`Source ${source.id} has no last-checked date.`);
    }
  }

  return report;
}
