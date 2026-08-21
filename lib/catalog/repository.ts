import { and, asc, eq, isNotNull } from "drizzle-orm";

import {
  areaStops,
  areas,
  catalogEvidence,
  catalogSources,
  routeLegs,
  routeTripPlans,
  routeWaypoints,
  routes,
  stopPreferences,
  stops,
} from "@/db/schema";
import { getDatabase } from "@/lib/db/client";
import type { RouteCatalog } from "./compose-trip";

export async function loadRouteCatalog(
  routeId: string,
): Promise<RouteCatalog | null> {
  const database = getDatabase();
  const [routeRows, areaRows, legRows, stopRows, sourceRows, tripPlanRows] = await Promise.all([
    database
      .select({ id: routes.id, name: routes.name, shape: routes.shape, summary: routes.summary })
      .from(routes)
      .where(and(eq(routes.id, routeId), eq(routes.published, true))),
    database
      .select({
        id: areas.id,
        name: areas.name,
        summary: areas.summary,
        latitude: areas.latitude,
        longitude: areas.longitude,
        position: routeWaypoints.position,
      })
      .from(routeWaypoints)
      .innerJoin(areas, eq(routeWaypoints.areaId, areas.id))
      .where(
        and(
          eq(routeWaypoints.routeId, routeId),
          isNotNull(routeWaypoints.areaId),
        ),
      )
      .orderBy(asc(routeWaypoints.position)),
    database
      .select({
        fromAreaId: routeLegs.fromAreaId,
        toAreaId: routeLegs.toAreaId,
        distanceMiles: routeLegs.distanceMiles,
        driveMinutes: routeLegs.driveMinutes,
        usesFerry: routeLegs.usesFerry,
      })
      .from(routeLegs)
      .where(eq(routeLegs.routeId, routeId))
      .orderBy(asc(routeLegs.position)),
    database
      .select({
        id: stops.id,
        areaId: areaStops.areaId,
        name: stops.name,
        typicalDurationMinutes: stops.typicalDurationMinutes,
        childFit: stops.childFit,
        summary: stops.summary,
        preferenceId: stopPreferences.preferenceId,
      })
      .from(routeWaypoints)
      .innerJoin(stops, eq(routeWaypoints.stopId, stops.id))
      .innerJoin(areaStops, eq(areaStops.stopId, stops.id))
      .leftJoin(stopPreferences, eq(stopPreferences.stopId, stops.id))
      .where(
        and(
          eq(routeWaypoints.routeId, routeId),
          isNotNull(routeWaypoints.stopId),
          eq(stops.published, true),
        ),
      )
      .orderBy(asc(routeWaypoints.position)),
    database
      .select({
        title: catalogSources.title,
        url: catalogSources.url,
        publisherType: catalogSources.publisherType,
        lastVerifiedAt: catalogEvidence.verifiedAt,
      })
      .from(catalogEvidence)
      .innerJoin(catalogSources, eq(catalogEvidence.sourceId, catalogSources.id))
      .where(eq(catalogEvidence.routeId, routeId)),
    database
      .select({
        id: routeTripPlans.id,
        name: routeTripPlans.name,
        summary: routeTripPlans.summary,
        startAreaId: routeTripPlans.startAreaId,
        endAreaId: routeTripPlans.endAreaId,
        minDays: routeTripPlans.minDays,
        minDaysWithChildren: routeTripPlans.minDaysWithChildren,
        maxDays: routeTripPlans.maxDays,
      })
      .from(routeTripPlans)
      .where(and(eq(routeTripPlans.routeId, routeId), eq(routeTripPlans.published, true)))
      .orderBy(asc(routeTripPlans.minDays), asc(routeTripPlans.name)),
  ]);
  const route = routeRows[0];

  if (!route) return null;

  const stopsById = new Map<
    string,
    RouteCatalog["stops"][number]
  >();

  for (const row of stopRows) {
    const existing = stopsById.get(row.id);

    if (existing) {
      if (row.preferenceId) existing.preferences.push(row.preferenceId);
      continue;
    }

    stopsById.set(row.id, {
      id: row.id,
      areaId: row.areaId,
      name: row.name,
      typicalDurationMinutes: row.typicalDurationMinutes,
      childFit: row.childFit as RouteCatalog["stops"][number]["childFit"],
      summary: row.summary,
      preferences: row.preferenceId ? [row.preferenceId] : [],
    });
  }

  return {
    id: route.id,
    name: route.name,
    shape: route.shape as RouteCatalog["shape"],
    summary: route.summary,
    sourceReferences: sourceRows.map((source) => ({
      ...source,
      lastVerifiedAt: source.lastVerifiedAt ?? null,
    })),
    plans: tripPlanRows,
    areas: areaRows.flatMap(({ id, name, summary, latitude, longitude }) =>
      latitude === null || longitude === null
        ? []
        : [{ id, name, summary, latitude, longitude }],
    ),
    stops: [...stopsById.values()],
    legs: legRows,
  };
}

export async function loadRouteCatalogs(routeIds: readonly string[]) {
  const catalogs = await Promise.all(routeIds.map((routeId) => loadRouteCatalog(routeId)));
  return catalogs.filter((catalog): catalog is RouteCatalog => catalog !== null);
}
