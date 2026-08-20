ALTER TABLE "user_saved_origins" ADD COLUMN "street_address" text;
--> statement-breakpoint
ALTER TABLE "user_saved_origins" ADD COLUMN "city" text;
--> statement-breakpoint
ALTER TABLE "user_saved_origins" ADD COLUMN "region_code" text;
--> statement-breakpoint
ALTER TABLE "user_saved_origins" ADD COLUMN "postal_code" text;
--> statement-breakpoint
ALTER TABLE "user_saved_origins" ADD COLUMN "country_code" text;
