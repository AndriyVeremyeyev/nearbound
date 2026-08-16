import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  doublePrecision,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const destinations = pgTable(
  "destinations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    region: text("region").notNull(),
    countryCode: text("country_code").notNull(),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    minDays: integer("min_days").notNull(),
    maxDays: integer("max_days").notNull(),
    familyFit: integer("family_fit").notNull(),
    weatherBackup: integer("weather_backup").notNull(),
    summary: text("summary").notNull(),
    anchor: text("anchor").notNull(),
    stay: text("stay").notNull(),
    caution: text("caution").notNull(),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("destinations_days_check", sql`${table.minDays} between 1 and 4`),
    check("destinations_max_days_check", sql`${table.maxDays} between 1 and 4`),
    check(
      "destinations_day_range_check",
      sql`${table.minDays} <= ${table.maxDays}`,
    ),
    check(
      "destinations_family_fit_check",
      sql`${table.familyFit} between 1 and 10`,
    ),
    check(
      "destinations_weather_backup_check",
      sql`${table.weatherBackup} between 1 and 10`,
    ),
  ],
);

export const preferences = pgTable("preferences", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const destinationPreferences = pgTable(
  "destination_preferences",
  {
    destinationId: text("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    preferenceId: text("preference_id")
      .notNull()
      .references(() => preferences.id, { onDelete: "restrict" }),
  },
  (table) => [primaryKey({ columns: [table.destinationId, table.preferenceId] })],
);

export const origins = pgTable("origins", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  countryCode: text("country_code").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  isDefault: boolean("is_default").notNull().default(false),
});

export const routeEstimates = pgTable(
  "route_estimates",
  {
    originId: text("origin_id")
      .notNull()
      .references(() => origins.id, { onDelete: "cascade" }),
    destinationId: text("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    travelMode: text("travel_mode").notNull().default("drive"),
    durationMinutes: integer("duration_minutes").notNull(),
    usesFerry: boolean("uses_ferry").notNull().default(false),
    crossesBorder: boolean("crosses_border").notNull().default(false),
    sourceType: text("source_type").notNull().default("curated"),
    lastVerifiedAt: date("last_verified_at"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.originId, table.destinationId, table.travelMode],
    }),
    check(
      "route_estimates_duration_check",
      sql`${table.durationMinutes} > 0`,
    ),
  ],
);

export const sourceReferences = pgTable(
  "source_references",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    destinationId: text("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url"),
    sourceType: text("source_type").notNull(),
    lastVerifiedAt: date("last_verified_at"),
    confidence: text("confidence").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "source_references_confidence_check",
      sql`${table.confidence} in ('low', 'medium', 'high')`,
    ),
  ],
);
