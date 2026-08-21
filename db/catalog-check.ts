import { and, asc, eq, inArray, isNotNull, or } from "drizzle-orm";

import {
  areaStops,
  areas,
  catalogEvidence,
  catalogSources,
  routeLegs,
  routeWaypoints,
  routes,
  stops,
} from "./schema";
import { loadLocalEnvironment } from "./load-local-env";
import { validateRouteCatalog } from "@/lib/catalog/validate-route";

loadLocalEnvironment();

const { getDatabase } = await import("@/lib/db/client");
const database = getDatabase();
const publishedRoutes = await database
  .select({
    id: routes.id,
    name: routes.name,
    lastVerifiedAt: routes.lastVerifiedAt,
    reviewDueAt: routes.reviewDueAt,
  })
  .from(routes)
  .where(eq(routes.published, true))
  .orderBy(asc(routes.name));

if (publishedRoutes.length === 0) {
  console.error("Catalog check failed: there are no published routes.");
  process.exitCode = 1;
} else {
  let errorCount = 0;
  let warningCount = 0;
  let areaCount = 0;
  let stopCount = 0;
  let legCount = 0;

  for (const route of publishedRoutes) {
    const [areaRows, stopRows, legRows] = await Promise.all([
      database
        .select({
          id: areas.id,
          name: areas.name,
          latitude: areas.latitude,
          longitude: areas.longitude,
          lastVerifiedAt: areas.lastVerifiedAt,
          reviewDueAt: areas.reviewDueAt,
        })
        .from(routeWaypoints)
        .innerJoin(areas, eq(routeWaypoints.areaId, areas.id))
        .where(
          and(
            eq(routeWaypoints.routeId, route.id),
            isNotNull(routeWaypoints.areaId),
          ),
        )
        .orderBy(asc(routeWaypoints.position)),
      database
        .select({
          id: stops.id,
          name: stops.name,
          latitude: stops.latitude,
          longitude: stops.longitude,
          typicalDurationMinutes: stops.typicalDurationMinutes,
          lastVerifiedAt: stops.lastVerifiedAt,
          reviewDueAt: stops.reviewDueAt,
          areaId: areaStops.areaId,
        })
        .from(routeWaypoints)
        .innerJoin(stops, eq(routeWaypoints.stopId, stops.id))
        .leftJoin(areaStops, eq(areaStops.stopId, stops.id))
        .where(
          and(
            eq(routeWaypoints.routeId, route.id),
            isNotNull(routeWaypoints.stopId),
          ),
        )
        .orderBy(asc(routeWaypoints.position)),
      database
        .select({
          fromAreaId: routeLegs.fromAreaId,
          toAreaId: routeLegs.toAreaId,
          distanceMiles: routeLegs.distanceMiles,
          driveMinutes: routeLegs.driveMinutes,
          lastVerifiedAt: routeLegs.lastVerifiedAt,
          reviewDueAt: routeLegs.reviewDueAt,
        })
        .from(routeLegs)
        .where(eq(routeLegs.routeId, route.id))
        .orderBy(asc(routeLegs.position)),
    ]);

    const areaIds = areaRows.map((area) => area.id);
    const stopIds = [...new Set(stopRows.map((stop) => stop.id))];
    const evidenceConditions = [eq(catalogEvidence.routeId, route.id)];
    if (areaIds.length > 0) evidenceConditions.push(inArray(catalogEvidence.areaId, areaIds));
    if (stopIds.length > 0) evidenceConditions.push(inArray(catalogEvidence.stopId, stopIds));

    const evidenceRows = await database
      .select({
        routeId: catalogEvidence.routeId,
        areaId: catalogEvidence.areaId,
        stopId: catalogEvidence.stopId,
        sourceId: catalogSources.id,
        sourceStatus: catalogSources.status,
        lastCheckedAt: catalogSources.lastCheckedAt,
      })
      .from(catalogEvidence)
      .innerJoin(catalogSources, eq(catalogEvidence.sourceId, catalogSources.id))
      .where(or(...evidenceConditions));

    const evidenceCountBySubject = new Map<string, number>();
    const subjectKey = (kind: "route" | "area" | "stop", id: string) => `${kind}:${id}`;
    for (const evidence of evidenceRows) {
      const subject = evidence.routeId
        ? subjectKey("route", evidence.routeId)
        : evidence.areaId
          ? subjectKey("area", evidence.areaId)
          : evidence.stopId
            ? subjectKey("stop", evidence.stopId)
            : null;
      if (subject) {
        evidenceCountBySubject.set(subject, (evidenceCountBySubject.get(subject) ?? 0) + 1);
      }
    }

    const stopsById = new Map<
      string,
      {
        id: string;
        name: string;
        latitude: number;
        longitude: number;
        typicalDurationMinutes: number;
        lastVerifiedAt: string | null;
        reviewDueAt: string | null;
        areaIds: string[];
      }
    >();
    for (const stop of stopRows) {
      const existing = stopsById.get(stop.id);
      if (existing) {
        if (stop.areaId) existing.areaIds.push(stop.areaId);
        continue;
      }
      stopsById.set(stop.id, {
        ...stop,
        areaIds: stop.areaId ? [stop.areaId] : [],
      });
    }

    const report = validateRouteCatalog({
      id: route.id,
      name: route.name,
      lastVerifiedAt: route.lastVerifiedAt,
      reviewDueAt: route.reviewDueAt,
      sourceCount: evidenceCountBySubject.get(subjectKey("route", route.id)) ?? 0,
      areas: areaRows.map((area) => ({
        ...area,
        sourceCount: evidenceCountBySubject.get(subjectKey("area", area.id)) ?? 0,
      })),
      stops: [...stopsById.values()].map((stop) => ({
        ...stop,
        sourceCount: evidenceCountBySubject.get(subjectKey("stop", stop.id)) ?? 0,
      })),
      legs: legRows,
      sources: evidenceRows.map((evidence) => ({
        id: evidence.sourceId,
        status: evidence.sourceStatus,
        lastCheckedAt: evidence.lastCheckedAt,
      })),
    });

    areaCount += areaRows.length;
    stopCount += stopsById.size;
    legCount += legRows.length;
    errorCount += report.errors.length;
    warningCount += report.warnings.length;

    console.log(`\n${route.name}`);
    for (const warning of report.warnings) console.warn(`  warning: ${warning}`);
    for (const error of report.errors) console.error(`  error: ${error}`);
    if (report.errors.length === 0 && report.warnings.length === 0) {
      console.log("  ready for use");
    }
  }

  console.log(
    `\nChecked ${publishedRoutes.length} published route${publishedRoutes.length === 1 ? "" : "s"}: ${areaCount} areas, ${stopCount} stops, ${legCount} route legs.`,
  );
  if (errorCount > 0) {
    console.error(`Catalog check failed with ${errorCount} error${errorCount === 1 ? "" : "s"}.`);
    process.exitCode = 1;
  } else {
    console.log(`Catalog check passed${warningCount ? ` with ${warningCount} warning${warningCount === 1 ? "" : "s"}` : ""}.`);
  }
}
