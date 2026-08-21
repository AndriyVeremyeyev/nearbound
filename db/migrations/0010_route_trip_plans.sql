CREATE TABLE "route_trip_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"route_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL,
	"start_area_id" text NOT NULL,
	"end_area_id" text NOT NULL,
	"min_days" integer NOT NULL,
	"min_days_with_children" integer,
	"max_days" integer NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	CONSTRAINT "route_trip_plans_slug_unique" UNIQUE("slug"),
	CONSTRAINT "route_trip_plans_distinct_areas_check" CHECK ("route_trip_plans"."start_area_id" <> "route_trip_plans"."end_area_id"),
	CONSTRAINT "route_trip_plans_min_days_check" CHECK ("route_trip_plans"."min_days" between 1 and 4),
	CONSTRAINT "route_trip_plans_max_days_check" CHECK ("route_trip_plans"."max_days" between 1 and 4),
	CONSTRAINT "route_trip_plans_day_range_check" CHECK ("route_trip_plans"."min_days" <= "route_trip_plans"."max_days"),
	CONSTRAINT "route_trip_plans_family_day_range_check" CHECK ("route_trip_plans"."min_days_with_children" is null or ("route_trip_plans"."min_days_with_children" between "route_trip_plans"."min_days" and "route_trip_plans"."max_days"))
);
--> statement-breakpoint
ALTER TABLE "route_trip_plans" ADD CONSTRAINT "route_trip_plans_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "route_trip_plans" ADD CONSTRAINT "route_trip_plans_start_area_id_areas_id_fk" FOREIGN KEY ("start_area_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "route_trip_plans" ADD CONSTRAINT "route_trip_plans_end_area_id_areas_id_fk" FOREIGN KEY ("end_area_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "route_trip_plans_route_id_idx" ON "route_trip_plans" USING btree ("route_id");
--> statement-breakpoint
CREATE INDEX "route_trip_plans_start_area_id_idx" ON "route_trip_plans" USING btree ("start_area_id");
--> statement-breakpoint
CREATE INDEX "route_trip_plans_end_area_id_idx" ON "route_trip_plans" USING btree ("end_area_id");
