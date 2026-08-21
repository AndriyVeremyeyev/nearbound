import { and, asc, eq, isNotNull } from "drizzle-orm";

import {
  areaStops,
  areas,
  routeLegs,
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
  const [routeRows, areaRows, legRows, stopRows] = await Promise.all([
    database
      .select({ id: routes.id, name: routes.name })
      .from(routes)
      .where(and(eq(routes.id, routeId), eq(routes.published, true))),
    database
      .select({
        id: areas.id,
        name: areas.name,
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
      preferences: row.preferenceId ? [row.preferenceId] : [],
    });
  }

  return {
    id: route.id,
    name: route.name,
    areas: areaRows.map(({ id, name }) => ({ id, name })),
    stops: [...stopsById.values()],
    legs: legRows,
  };
}
