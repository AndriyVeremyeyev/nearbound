import { and, eq, isNotNull } from "drizzle-orm";

import {
  destinationPreferences,
  destinations as destinationsTable,
  preferences,
  routeEstimates,
  sourceReferences,
} from "@/db/schema";
import { getDatabase } from "@/lib/db/client";
import type { Destination, DestinationCatalog, SourceReference } from "./types";

const DEFAULT_ORIGIN_ID = "issaquah-wa";

export type RoutableDestination = {
  id: string;
  latitude: number;
  longitude: number;
};

export async function loadRoutableDestinations(): Promise<RoutableDestination[]> {
  const database = getDatabase();

  return database
    .select({
      id: destinationsTable.id,
      latitude: destinationsTable.latitude,
      longitude: destinationsTable.longitude,
    })
    .from(destinationsTable)
    .where(
      and(
        eq(destinationsTable.published, true),
        isNotNull(destinationsTable.latitude),
        isNotNull(destinationsTable.longitude),
      ),
    )
    .orderBy(destinationsTable.id)
    .then((destinations) =>
      destinations.flatMap((destination) =>
        destination.latitude === null || destination.longitude === null
          ? []
          : [{
              id: destination.id,
              latitude: destination.latitude,
              longitude: destination.longitude,
            }],
      ),
    );
}

export async function loadDestinationCatalog(): Promise<DestinationCatalog> {
  const database = getDatabase();

  const [rows, preferenceOptions, sourceRows] = await Promise.all([
    database
      .select({
        id: destinationsTable.id,
        name: destinationsTable.name,
        region: destinationsTable.region,
        durationMinutes: routeEstimates.durationMinutes,
        usesFerry: routeEstimates.usesFerry,
        crossesBorder: routeEstimates.crossesBorder,
        minDays: destinationsTable.minDays,
        maxDays: destinationsTable.maxDays,
        familyFit: destinationsTable.familyFit,
        weatherBackup: destinationsTable.weatherBackup,
        summary: destinationsTable.summary,
        anchor: destinationsTable.anchor,
        stay: destinationsTable.stay,
        caution: destinationsTable.caution,
        preferenceId: preferences.id,
      })
      .from(destinationsTable)
      .innerJoin(
        routeEstimates,
        and(
          eq(routeEstimates.destinationId, destinationsTable.id),
          eq(routeEstimates.originId, DEFAULT_ORIGIN_ID),
          eq(routeEstimates.travelMode, "drive"),
        ),
      )
      .leftJoin(
        destinationPreferences,
        eq(destinationPreferences.destinationId, destinationsTable.id),
      )
      .leftJoin(
        preferences,
        eq(preferences.id, destinationPreferences.preferenceId),
      )
      .where(eq(destinationsTable.published, true))
      .orderBy(destinationsTable.id, preferences.sortOrder),
    database
      .select({ id: preferences.id, label: preferences.label })
      .from(preferences)
      .orderBy(preferences.sortOrder),
    database
      .select({
        destinationId: sourceReferences.destinationId,
        title: sourceReferences.title,
        url: sourceReferences.url,
        sourceType: sourceReferences.sourceType,
        lastVerifiedAt: sourceReferences.lastVerifiedAt,
        confidence: sourceReferences.confidence,
      })
      .from(sourceReferences)
      .innerJoin(
        destinationsTable,
        eq(destinationsTable.id, sourceReferences.destinationId),
      )
      .where(eq(destinationsTable.published, true))
      .orderBy(sourceReferences.destinationId, sourceReferences.id),
  ]);

  const sourcesByDestinationId = new Map<string, SourceReference[]>();

  for (const source of sourceRows) {
    const sources = sourcesByDestinationId.get(source.destinationId) ?? [];
    sources.push({
      title: source.title,
      url: source.url,
      sourceType: source.sourceType,
      lastVerifiedAt: source.lastVerifiedAt,
      confidence: source.confidence as SourceReference["confidence"],
    });
    sourcesByDestinationId.set(source.destinationId, sources);
  }

  const destinationsById = new Map<string, Destination>();

  for (const row of rows) {
    const existing = destinationsById.get(row.id);

    if (existing) {
      if (row.preferenceId) existing.preferences.push(row.preferenceId);
      continue;
    }

    destinationsById.set(row.id, {
      id: row.id,
      name: row.name,
      region: row.region,
      hours: row.durationMinutes / 60,
      usesFerry: row.usesFerry,
      crossesBorder: row.crossesBorder,
      minDays: row.minDays,
      maxDays: row.maxDays,
      preferences: row.preferenceId ? [row.preferenceId] : [],
      familyFit: row.familyFit,
      weatherBackup: row.weatherBackup,
      summary: row.summary,
      anchor: row.anchor,
      stay: row.stay,
      caution: row.caution,
      sourceReferences: sourcesByDestinationId.get(row.id) ?? [],
    });
  }

  return {
    destinations: Array.from(destinationsById.values()),
    preferenceOptions,
  };
}
