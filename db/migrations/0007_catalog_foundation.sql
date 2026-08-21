CREATE TABLE "areas" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"parent_area_id" text,
	"country_code" text NOT NULL,
	"region_code" text NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"summary" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"last_verified_at" date,
	"review_due_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "areas_kind_check" CHECK ("areas"."kind" in ('town', 'island', 'park', 'resort', 'coastal_area', 'region')),
	CONSTRAINT "areas_coordinates_check" CHECK (("areas"."latitude" is null and "areas"."longitude" is null) or ("areas"."latitude" is not null and "areas"."longitude" is not null)),
	CONSTRAINT "areas_review_due_after_verification_check" CHECK ("areas"."review_due_at" is null or "areas"."last_verified_at" is null or "areas"."review_due_at" >= "areas"."last_verified_at")
);
--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_parent_area_id_areas_id_fk" FOREIGN KEY ("parent_area_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "areas_slug_unique" ON "areas" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX "areas_parent_area_id_idx" ON "areas" USING btree ("parent_area_id");
--> statement-breakpoint
CREATE TABLE "stops" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"typical_duration_minutes" integer NOT NULL,
	"indoor_outdoor" text NOT NULL,
	"child_fit" text NOT NULL,
	"booking_required" boolean DEFAULT false NOT NULL,
	"weather_sensitivity" text NOT NULL,
	"summary" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"last_verified_at" date,
	"review_due_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stops_kind_check" CHECK ("stops"."kind" in ('hike', 'zoo', 'aquarium', 'museum', 'beach', 'farm', 'historic_downtown', 'viewpoint', 'park', 'other')),
	CONSTRAINT "stops_duration_check" CHECK ("stops"."typical_duration_minutes" between 15 and 720),
	CONSTRAINT "stops_indoor_outdoor_check" CHECK ("stops"."indoor_outdoor" in ('indoor', 'outdoor', 'mixed')),
	CONSTRAINT "stops_child_fit_check" CHECK ("stops"."child_fit" in ('good', 'possible', 'not_recommended')),
	CONSTRAINT "stops_weather_sensitivity_check" CHECK ("stops"."weather_sensitivity" in ('low', 'medium', 'high')),
	CONSTRAINT "stops_review_due_after_verification_check" CHECK ("stops"."review_due_at" is null or "stops"."last_verified_at" is null or "stops"."review_due_at" >= "stops"."last_verified_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "stops_slug_unique" ON "stops" USING btree ("slug");
--> statement-breakpoint
CREATE TABLE "area_stops" (
	"area_id" text NOT NULL,
	"stop_id" text NOT NULL,
	"role" text DEFAULT 'primary' NOT NULL,
	"travel_minutes_from_area_center" integer,
	CONSTRAINT "area_stops_area_id_stop_id_pk" PRIMARY KEY("area_id","stop_id"),
	CONSTRAINT "area_stops_role_check" CHECK ("area_stops"."role" in ('primary', 'nearby', 'gateway')),
	CONSTRAINT "area_stops_travel_minutes_check" CHECK ("area_stops"."travel_minutes_from_area_center" is null or "area_stops"."travel_minutes_from_area_center" >= 0)
);
--> statement-breakpoint
ALTER TABLE "area_stops" ADD CONSTRAINT "area_stops_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "area_stops" ADD CONSTRAINT "area_stops_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "area_stops_stop_id_idx" ON "area_stops" USING btree ("stop_id");
--> statement-breakpoint
CREATE TABLE "stop_preferences" (
	"stop_id" text NOT NULL,
	"preference_id" text NOT NULL,
	"strength" text DEFAULT 'secondary' NOT NULL,
	CONSTRAINT "stop_preferences_stop_id_preference_id_pk" PRIMARY KEY("stop_id","preference_id"),
	CONSTRAINT "stop_preferences_strength_check" CHECK ("stop_preferences"."strength" in ('primary', 'secondary'))
);
--> statement-breakpoint
ALTER TABLE "stop_preferences" ADD CONSTRAINT "stop_preferences_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "stop_preferences" ADD CONSTRAINT "stop_preferences_preference_id_preferences_id_fk" FOREIGN KEY ("preference_id") REFERENCES "public"."preferences"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "hike_details" (
	"stop_id" text PRIMARY KEY NOT NULL,
	"difficulty" text NOT NULL,
	"distance_miles" double precision NOT NULL,
	"elevation_gain_feet" integer NOT NULL,
	"route_shape" text NOT NULL,
	"trailhead_latitude" double precision,
	"trailhead_longitude" double precision,
	CONSTRAINT "hike_details_difficulty_check" CHECK ("hike_details"."difficulty" in ('easy', 'moderate', 'hard')),
	CONSTRAINT "hike_details_distance_check" CHECK ("hike_details"."distance_miles" > 0),
	CONSTRAINT "hike_details_elevation_check" CHECK ("hike_details"."elevation_gain_feet" >= 0),
	CONSTRAINT "hike_details_route_shape_check" CHECK ("hike_details"."route_shape" in ('loop', 'out_and_back', 'point_to_point')),
	CONSTRAINT "hike_details_trailhead_coordinates_check" CHECK (("hike_details"."trailhead_latitude" is null and "hike_details"."trailhead_longitude" is null) or ("hike_details"."trailhead_latitude" is not null and "hike_details"."trailhead_longitude" is not null))
);
--> statement-breakpoint
ALTER TABLE "hike_details" ADD CONSTRAINT "hike_details_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "catalog_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"publisher_type" text NOT NULL,
	"last_checked_at" date,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_sources_publisher_type_check" CHECK ("catalog_sources"."publisher_type" in ('official', 'visitor_bureau', 'government', 'trail_organization')),
	CONSTRAINT "catalog_sources_status_check" CHECK ("catalog_sources"."status" in ('active', 'needs_review', 'broken'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_sources_url_unique" ON "catalog_sources" USING btree ("url");
--> statement-breakpoint
CREATE TABLE "catalog_evidence" (
	"id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"area_id" text,
	"stop_id" text,
	"claim_type" text NOT NULL,
	"note" text NOT NULL,
	"confidence" text NOT NULL,
	"verified_at" date,
	"review_due_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_evidence_one_subject_check" CHECK (("catalog_evidence"."area_id" is not null and "catalog_evidence"."stop_id" is null) or ("catalog_evidence"."area_id" is null and "catalog_evidence"."stop_id" is not null)),
	CONSTRAINT "catalog_evidence_confidence_check" CHECK ("catalog_evidence"."confidence" in ('low', 'medium', 'high')),
	CONSTRAINT "catalog_evidence_review_due_after_verification_check" CHECK ("catalog_evidence"."review_due_at" is null or "catalog_evidence"."verified_at" is null or "catalog_evidence"."review_due_at" >= "catalog_evidence"."verified_at")
);
--> statement-breakpoint
ALTER TABLE "catalog_evidence" ADD CONSTRAINT "catalog_evidence_source_id_catalog_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."catalog_sources"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "catalog_evidence" ADD CONSTRAINT "catalog_evidence_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "catalog_evidence" ADD CONSTRAINT "catalog_evidence_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "catalog_evidence_source_id_idx" ON "catalog_evidence" USING btree ("source_id");
--> statement-breakpoint
CREATE INDEX "catalog_evidence_area_id_idx" ON "catalog_evidence" USING btree ("area_id");
--> statement-breakpoint
CREATE INDEX "catalog_evidence_stop_id_idx" ON "catalog_evidence" USING btree ("stop_id");
