CREATE TABLE "destination_preferences" (
	"destination_id" text NOT NULL,
	"preference_id" text NOT NULL,
	CONSTRAINT "destination_preferences_destination_id_preference_id_pk" PRIMARY KEY("destination_id","preference_id")
);
--> statement-breakpoint
CREATE TABLE "destinations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"country_code" text NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"min_days" integer NOT NULL,
	"max_days" integer NOT NULL,
	"family_fit" integer NOT NULL,
	"weather_backup" integer NOT NULL,
	"summary" text NOT NULL,
	"anchor" text NOT NULL,
	"stay" text NOT NULL,
	"caution" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "destinations_days_check" CHECK ("destinations"."min_days" between 1 and 4),
	CONSTRAINT "destinations_max_days_check" CHECK ("destinations"."max_days" between 1 and 4),
	CONSTRAINT "destinations_day_range_check" CHECK ("destinations"."min_days" <= "destinations"."max_days"),
	CONSTRAINT "destinations_family_fit_check" CHECK ("destinations"."family_fit" between 1 and 10),
	CONSTRAINT "destinations_weather_backup_check" CHECK ("destinations"."weather_backup" between 1 and 10)
);
--> statement-breakpoint
CREATE TABLE "origins" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"country_code" text NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"is_default" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_estimates" (
	"origin_id" text NOT NULL,
	"destination_id" text NOT NULL,
	"travel_mode" text DEFAULT 'drive' NOT NULL,
	"duration_minutes" integer NOT NULL,
	"source_type" text DEFAULT 'curated' NOT NULL,
	"last_verified_at" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "route_estimates_origin_id_destination_id_travel_mode_pk" PRIMARY KEY("origin_id","destination_id","travel_mode"),
	CONSTRAINT "route_estimates_duration_check" CHECK ("route_estimates"."duration_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "source_references" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "source_references_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"destination_id" text NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"source_type" text NOT NULL,
	"last_verified_at" date,
	"confidence" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_references_confidence_check" CHECK ("source_references"."confidence" in ('low', 'medium', 'high'))
);
--> statement-breakpoint
ALTER TABLE "destination_preferences" ADD CONSTRAINT "destination_preferences_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destination_preferences" ADD CONSTRAINT "destination_preferences_preference_id_preferences_id_fk" FOREIGN KEY ("preference_id") REFERENCES "public"."preferences"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_estimates" ADD CONSTRAINT "route_estimates_origin_id_origins_id_fk" FOREIGN KEY ("origin_id") REFERENCES "public"."origins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_estimates" ADD CONSTRAINT "route_estimates_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_references" ADD CONSTRAINT "source_references_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;