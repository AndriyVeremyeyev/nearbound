ALTER TABLE "user_destination_history" ADD COLUMN "rating" integer;
--> statement-breakpoint
ALTER TABLE "user_destination_history" ADD COLUMN "note" text;
--> statement-breakpoint
ALTER TABLE "user_destination_history" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_destination_history" ADD CONSTRAINT "user_destination_history_rating_check" CHECK ("user_destination_history"."rating" between 1 and 5);
