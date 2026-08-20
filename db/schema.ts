import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  doublePrecision,
  integer,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userSavedOrigins = pgTable(
  "user_saved_origins",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    addressInput: text("address_input").notNull(),
    streetAddress: text("street_address"),
    city: text("city"),
    regionCode: text("region_code"),
    postalCode: text("postal_code"),
    countryCode: text("country_code"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("user_saved_origins_user_id_idx").on(table.userId)],
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("auth_sessions_user_id_idx").on(table.userId)],
);

export const authAccounts = pgTable(
  "auth_accounts",
  {
    id: text("id").primaryKey(),
    issuer: text("issuer").notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("auth_accounts_user_id_idx").on(table.userId),
    uniqueIndex("auth_accounts_issuer_account_id_idx").on(
      table.issuer,
      table.accountId,
    ),
  ],
);

export const authVerifications = pgTable(
  "auth_verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("auth_verifications_identifier_idx").on(table.identifier),
  ],
);

export const userDestinationHistory = pgTable(
  "user_destination_history",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    destinationId: text("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("visited"),
    rating: integer("rating"),
    note: text("note"),
    visitedAt: timestamp("visited_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.destinationId] }),
    index("user_destination_history_destination_id_idx").on(table.destinationId),
    check("user_destination_history_status_check", sql`${table.status} = 'visited'`),
    check("user_destination_history_rating_check", sql`${table.rating} between 1 and 5`),
  ],
);

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
