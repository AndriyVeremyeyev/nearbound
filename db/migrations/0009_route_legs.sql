CREATE TABLE "route_legs" (
	"route_id" text NOT NULL,
	"position" integer NOT NULL,
	"from_area_id" text NOT NULL,
	"to_area_id" text NOT NULL,
	"distance_miles" double precision NOT NULL,
	"drive_minutes" integer NOT NULL,
	"source_type" text DEFAULT 'curated' NOT NULL,
	"last_verified_at" date,
	"review_due_at" date,
	CONSTRAINT "route_legs_route_id_position_pk" PRIMARY KEY("route_id","position"),
	CONSTRAINT "route_legs_position_check" CHECK ("route_legs"."position" > 0),
	CONSTRAINT "route_legs_distance_check" CHECK ("route_legs"."distance_miles" > 0),
	CONSTRAINT "route_legs_drive_minutes_check" CHECK ("route_legs"."drive_minutes" > 0),
	CONSTRAINT "route_legs_source_type_check" CHECK ("route_legs"."source_type" in ('curated', 'live')),
	CONSTRAINT "route_legs_distinct_areas_check" CHECK ("route_legs"."from_area_id" <> "route_legs"."to_area_id"),
	CONSTRAINT "route_legs_review_due_after_verification_check" CHECK ("route_legs"."review_due_at" is null or "route_legs"."last_verified_at" is null or "route_legs"."review_due_at" >= "route_legs"."last_verified_at")
);
--> statement-breakpoint
ALTER TABLE "route_legs" ADD CONSTRAINT "route_legs_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "route_legs" ADD CONSTRAINT "route_legs_from_area_id_areas_id_fk" FOREIGN KEY ("from_area_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "route_legs" ADD CONSTRAINT "route_legs_to_area_id_areas_id_fk" FOREIGN KEY ("to_area_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "route_legs_from_area_id_idx" ON "route_legs" USING btree ("from_area_id");
--> statement-breakpoint
CREATE INDEX "route_legs_to_area_id_idx" ON "route_legs" USING btree ("to_area_id");
