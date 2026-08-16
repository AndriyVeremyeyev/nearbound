import { and, eq } from "drizzle-orm";

import {
  destinationPreferences,
  destinations as destinationsTable,
  preferences,
  routeEstimates,
} from "@/db/schema";
import { getDatabase } from "@/lib/db/client";
import type { Destination, DestinationCatalog } from "./types";

const DEFAULT_ORIGIN_ID = "issaquah-wa";

export async function loadDestinationCatalog(): Promise<DestinationCatalog> {
  const database = getDatabase();

  const [rows, preferenceOptions] = await Promise.all([
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
  ]);

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
    });
  }

  return {
    destinations: Array.from(destinationsById.values()),
    preferenceOptions,
  };
}
