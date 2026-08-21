CREATE TABLE "routes" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"shape" text NOT NULL,
	"country_code" text NOT NULL,
	"min_days" integer NOT NULL,
	"max_days" integer NOT NULL,
	"summary" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"last_verified_at" date,
	"review_due_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "routes_slug_unique" UNIQUE("slug"),
	CONSTRAINT "routes_shape_check" CHECK ("routes"."shape" in ('linear', 'loop')),
	CONSTRAINT "routes_min_days_check" CHECK ("routes"."min_days" between 1 and 14),
	CONSTRAINT "routes_max_days_check" CHECK ("routes"."max_days" between 1 and 14),
	CONSTRAINT "routes_day_range_check" CHECK ("routes"."min_days" <= "routes"."max_days"),
	CONSTRAINT "routes_review_due_after_verification_check" CHECK ("routes"."review_due_at" is null or "routes"."last_verified_at" is null or "routes"."review_due_at" >= "routes"."last_verified_at")
);
--> statement-breakpoint
CREATE TABLE "route_waypoints" (
	"route_id" text NOT NULL,
	"position" integer NOT NULL,
	"area_id" text,
	"stop_id" text,
	"role" text NOT NULL,
	"optional" boolean DEFAULT false NOT NULL,
	CONSTRAINT "route_waypoints_route_id_position_pk" PRIMARY KEY("route_id","position"),
	CONSTRAINT "route_waypoints_position_check" CHECK ("route_waypoints"."position" > 0),
	CONSTRAINT "route_waypoints_one_subject_check" CHECK (("route_waypoints"."area_id" is not null and "route_waypoints"."stop_id" is null) or ("route_waypoints"."area_id" is null and "route_waypoints"."stop_id" is not null)),
	CONSTRAINT "route_waypoints_role_check" CHECK ("route_waypoints"."role" in ('gateway', 'overnight', 'anchor', 'detour'))
);
--> statement-breakpoint
ALTER TABLE "route_waypoints" ADD CONSTRAINT "route_waypoints_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "route_waypoints" ADD CONSTRAINT "route_waypoints_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "route_waypoints" ADD CONSTRAINT "route_waypoints_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "route_waypoints_area_id_idx" ON "route_waypoints" USING btree ("area_id");
--> statement-breakpoint
CREATE INDEX "route_waypoints_stop_id_idx" ON "route_waypoints" USING btree ("stop_id");
--> statement-breakpoint
ALTER TABLE "catalog_evidence" ADD COLUMN "route_id" text;
--> statement-breakpoint
ALTER TABLE "catalog_evidence" DROP CONSTRAINT "catalog_evidence_one_subject_check";
--> statement-breakpoint
ALTER TABLE "catalog_evidence" ADD CONSTRAINT "catalog_evidence_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "catalog_evidence_route_id_idx" ON "catalog_evidence" USING btree ("route_id");
--> statement-breakpoint
ALTER TABLE "catalog_evidence" ADD CONSTRAINT "catalog_evidence_one_subject_check" CHECK (("catalog_evidence"."area_id" is not null and "catalog_evidence"."stop_id" is null and "catalog_evidence"."route_id" is null) or ("catalog_evidence"."area_id" is null and "catalog_evidence"."stop_id" is not null and "catalog_evidence"."route_id" is null) or ("catalog_evidence"."area_id" is null and "catalog_evidence"."stop_id" is null and "catalog_evidence"."route_id" is not null));
