import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  doublePrecision,
  integer,
  index,
  type AnyPgColumn,
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

export const areas = pgTable(
  "areas",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    parentAreaId: text("parent_area_id").references((): AnyPgColumn => areas.id, {
      onDelete: "restrict",
    }),
    countryCode: text("country_code").notNull(),
    regionCode: text("region_code").notNull(),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    summary: text("summary").notNull(),
    published: boolean("published").notNull().default(false),
    lastVerifiedAt: date("last_verified_at"),
    reviewDueAt: date("review_due_at"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("areas_parent_area_id_idx").on(table.parentAreaId),
    check(
      "areas_kind_check",
      sql`${table.kind} in ('town', 'island', 'park', 'resort', 'coastal_area', 'region')`,
    ),
    check(
      "areas_coordinates_check",
      sql`(${table.latitude} is null and ${table.longitude} is null) or (${table.latitude} is not null and ${table.longitude} is not null)`,
    ),
    check(
      "areas_review_due_after_verification_check",
      sql`${table.reviewDueAt} is null or ${table.lastVerifiedAt} is null or ${table.reviewDueAt} >= ${table.lastVerifiedAt}`,
    ),
  ],
);

export const stops = pgTable(
  "stops",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    typicalDurationMinutes: integer("typical_duration_minutes").notNull(),
    indoorOutdoor: text("indoor_outdoor").notNull(),
    childFit: text("child_fit").notNull(),
    bookingRequired: boolean("booking_required").notNull().default(false),
    weatherSensitivity: text("weather_sensitivity").notNull(),
    summary: text("summary").notNull(),
    published: boolean("published").notNull().default(false),
    lastVerifiedAt: date("last_verified_at"),
    reviewDueAt: date("review_due_at"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "stops_kind_check",
      sql`${table.kind} in ('hike', 'zoo', 'aquarium', 'museum', 'beach', 'farm', 'historic_downtown', 'viewpoint', 'park', 'other')`,
    ),
    check("stops_duration_check", sql`${table.typicalDurationMinutes} between 15 and 720`),
    check(
      "stops_indoor_outdoor_check",
      sql`${table.indoorOutdoor} in ('indoor', 'outdoor', 'mixed')`,
    ),
    check(
      "stops_child_fit_check",
      sql`${table.childFit} in ('good', 'possible', 'not_recommended')`,
    ),
    check(
      "stops_weather_sensitivity_check",
      sql`${table.weatherSensitivity} in ('low', 'medium', 'high')`,
    ),
    check(
      "stops_review_due_after_verification_check",
      sql`${table.reviewDueAt} is null or ${table.lastVerifiedAt} is null or ${table.reviewDueAt} >= ${table.lastVerifiedAt}`,
    ),
  ],
);

export const areaStops = pgTable(
  "area_stops",
  {
    areaId: text("area_id").notNull().references(() => areas.id, { onDelete: "cascade" }),
    stopId: text("stop_id").notNull().references(() => stops.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("primary"),
    travelMinutesFromAreaCenter: integer("travel_minutes_from_area_center"),
  },
  (table) => [
    primaryKey({ columns: [table.areaId, table.stopId] }),
    index("area_stops_stop_id_idx").on(table.stopId),
    check("area_stops_role_check", sql`${table.role} in ('primary', 'nearby', 'gateway')`),
    check(
      "area_stops_travel_minutes_check",
      sql`${table.travelMinutesFromAreaCenter} is null or ${table.travelMinutesFromAreaCenter} >= 0`,
    ),
  ],
);

export const stopPreferences = pgTable(
  "stop_preferences",
  {
    stopId: text("stop_id").notNull().references(() => stops.id, { onDelete: "cascade" }),
    preferenceId: text("preference_id")
      .notNull()
      .references(() => preferences.id, { onDelete: "restrict" }),
    strength: text("strength").notNull().default("secondary"),
  },
  (table) => [
    primaryKey({ columns: [table.stopId, table.preferenceId] }),
    check(
      "stop_preferences_strength_check",
      sql`${table.strength} in ('primary', 'secondary')`,
    ),
  ],
);

export const hikeDetails = pgTable(
  "hike_details",
  {
    stopId: text("stop_id").primaryKey().references(() => stops.id, { onDelete: "cascade" }),
    difficulty: text("difficulty").notNull(),
    distanceMiles: doublePrecision("distance_miles").notNull(),
    elevationGainFeet: integer("elevation_gain_feet").notNull(),
    routeShape: text("route_shape").notNull(),
    trailheadLatitude: doublePrecision("trailhead_latitude"),
    trailheadLongitude: doublePrecision("trailhead_longitude"),
  },
  (table) => [
    check("hike_details_difficulty_check", sql`${table.difficulty} in ('easy', 'moderate', 'hard')`),
    check("hike_details_distance_check", sql`${table.distanceMiles} > 0`),
    check("hike_details_elevation_check", sql`${table.elevationGainFeet} >= 0`),
    check(
      "hike_details_route_shape_check",
      sql`${table.routeShape} in ('loop', 'out_and_back', 'point_to_point')`,
    ),
    check(
      "hike_details_trailhead_coordinates_check",
      sql`(${table.trailheadLatitude} is null and ${table.trailheadLongitude} is null) or (${table.trailheadLatitude} is not null and ${table.trailheadLongitude} is not null)`,
    ),
  ],
);

export const catalogSources = pgTable(
  "catalog_sources",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    url: text("url").notNull().unique(),
    publisherType: text("publisher_type").notNull(),
    lastCheckedAt: date("last_checked_at"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "catalog_sources_publisher_type_check",
      sql`${table.publisherType} in ('official', 'visitor_bureau', 'government', 'trail_organization')`,
    ),
    check("catalog_sources_status_check", sql`${table.status} in ('active', 'needs_review', 'broken')`),
  ],
);

export const routes = pgTable(
  "routes",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    shape: text("shape").notNull(),
    countryCode: text("country_code").notNull(),
    minDays: integer("min_days").notNull(),
    maxDays: integer("max_days").notNull(),
    summary: text("summary").notNull(),
    published: boolean("published").notNull().default(false),
    lastVerifiedAt: date("last_verified_at"),
    reviewDueAt: date("review_due_at"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("routes_shape_check", sql`${table.shape} in ('linear', 'loop')`),
    check("routes_min_days_check", sql`${table.minDays} between 1 and 14`),
    check("routes_max_days_check", sql`${table.maxDays} between 1 and 14`),
    check("routes_day_range_check", sql`${table.minDays} <= ${table.maxDays}`),
    check(
      "routes_review_due_after_verification_check",
      sql`${table.reviewDueAt} is null or ${table.lastVerifiedAt} is null or ${table.reviewDueAt} >= ${table.lastVerifiedAt}`,
    ),
  ],
);

export const routeTripPlans = pgTable(
  "route_trip_plans",
  {
    id: text("id").primaryKey(),
    routeId: text("route_id")
      .notNull()
      .references(() => routes.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    summary: text("summary").notNull(),
    startAreaId: text("start_area_id")
      .notNull()
      .references(() => areas.id, { onDelete: "restrict" }),
    endAreaId: text("end_area_id")
      .notNull()
      .references(() => areas.id, { onDelete: "restrict" }),
    minDays: integer("min_days").notNull(),
    minDaysWithChildren: integer("min_days_with_children"),
    maxDays: integer("max_days").notNull(),
    published: boolean("published").notNull().default(false),
  },
  (table) => [
    index("route_trip_plans_route_id_idx").on(table.routeId),
    index("route_trip_plans_start_area_id_idx").on(table.startAreaId),
    index("route_trip_plans_end_area_id_idx").on(table.endAreaId),
    check("route_trip_plans_distinct_areas_check", sql`${table.startAreaId} <> ${table.endAreaId}`),
    check("route_trip_plans_min_days_check", sql`${table.minDays} between 1 and 4`),
    check("route_trip_plans_max_days_check", sql`${table.maxDays} between 1 and 4`),
    check("route_trip_plans_day_range_check", sql`${table.minDays} <= ${table.maxDays}`),
    check(
      "route_trip_plans_family_day_range_check",
      sql`${table.minDaysWithChildren} is null or (${table.minDaysWithChildren} between ${table.minDays} and ${table.maxDays})`,
    ),
  ],
);

export const routeWaypoints = pgTable(
  "route_waypoints",
  {
    routeId: text("route_id").notNull().references(() => routes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    areaId: text("area_id").references(() => areas.id, { onDelete: "cascade" }),
    stopId: text("stop_id").references(() => stops.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    optional: boolean("optional").notNull().default(false),
  },
  (table) => [
    primaryKey({ columns: [table.routeId, table.position] }),
    index("route_waypoints_area_id_idx").on(table.areaId),
    index("route_waypoints_stop_id_idx").on(table.stopId),
    check("route_waypoints_position_check", sql`${table.position} > 0`),
    check(
      "route_waypoints_one_subject_check",
      sql`(${table.areaId} is not null and ${table.stopId} is null) or (${table.areaId} is null and ${table.stopId} is not null)`,
    ),
    check(
      "route_waypoints_role_check",
      sql`${table.role} in ('gateway', 'overnight', 'anchor', 'detour')`,
    ),
  ],
);

export const routeLegs = pgTable(
  "route_legs",
  {
    routeId: text("route_id").notNull().references(() => routes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    fromAreaId: text("from_area_id").notNull().references(() => areas.id, { onDelete: "restrict" }),
    toAreaId: text("to_area_id").notNull().references(() => areas.id, { onDelete: "restrict" }),
    distanceMiles: doublePrecision("distance_miles").notNull(),
    driveMinutes: integer("drive_minutes").notNull(),
    sourceType: text("source_type").notNull().default("curated"),
    lastVerifiedAt: date("last_verified_at"),
    reviewDueAt: date("review_due_at"),
  },
  (table) => [
    primaryKey({ columns: [table.routeId, table.position] }),
    index("route_legs_from_area_id_idx").on(table.fromAreaId),
    index("route_legs_to_area_id_idx").on(table.toAreaId),
    check("route_legs_position_check", sql`${table.position} > 0`),
    check("route_legs_distance_check", sql`${table.distanceMiles} > 0`),
    check("route_legs_drive_minutes_check", sql`${table.driveMinutes} > 0`),
    check(
      "route_legs_source_type_check",
      sql`${table.sourceType} in ('curated', 'live')`,
    ),
    check(
      "route_legs_distinct_areas_check",
      sql`${table.fromAreaId} <> ${table.toAreaId}`,
    ),
    check(
      "route_legs_review_due_after_verification_check",
      sql`${table.reviewDueAt} is null or ${table.lastVerifiedAt} is null or ${table.reviewDueAt} >= ${table.lastVerifiedAt}`,
    ),
  ],
);

export const catalogEvidence = pgTable(
  "catalog_evidence",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    sourceId: text("source_id")
      .notNull()
      .references(() => catalogSources.id, { onDelete: "cascade" }),
    areaId: text("area_id").references(() => areas.id, { onDelete: "cascade" }),
    stopId: text("stop_id").references(() => stops.id, { onDelete: "cascade" }),
    routeId: text("route_id").references(() => routes.id, { onDelete: "cascade" }),
    claimType: text("claim_type").notNull(),
    note: text("note").notNull(),
    confidence: text("confidence").notNull(),
    verifiedAt: date("verified_at"),
    reviewDueAt: date("review_due_at"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("catalog_evidence_source_id_idx").on(table.sourceId),
    index("catalog_evidence_area_id_idx").on(table.areaId),
    index("catalog_evidence_stop_id_idx").on(table.stopId),
    index("catalog_evidence_route_id_idx").on(table.routeId),
    check(
      "catalog_evidence_one_subject_check",
      sql`(${table.areaId} is not null and ${table.stopId} is null and ${table.routeId} is null) or (${table.areaId} is null and ${table.stopId} is not null and ${table.routeId} is null) or (${table.areaId} is null and ${table.stopId} is null and ${table.routeId} is not null)`,
    ),
    check("catalog_evidence_confidence_check", sql`${table.confidence} in ('low', 'medium', 'high')`),
    check(
      "catalog_evidence_review_due_after_verification_check",
      sql`${table.reviewDueAt} is null or ${table.verifiedAt} is null or ${table.reviewDueAt} >= ${table.verifiedAt}`,
    ),
  ],
);
