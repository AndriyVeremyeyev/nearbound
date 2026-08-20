CREATE TABLE "user_destination_history" (
	"user_id" text NOT NULL,
	"destination_id" text NOT NULL,
	"status" text DEFAULT 'visited' NOT NULL,
	"visited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_destination_history_user_id_destination_id_pk" PRIMARY KEY("user_id","destination_id"),
	CONSTRAINT "user_destination_history_status_check" CHECK ("user_destination_history"."status" = 'visited')
);
--> statement-breakpoint
ALTER TABLE "user_destination_history" ADD CONSTRAINT "user_destination_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_destination_history" ADD CONSTRAINT "user_destination_history_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "user_destination_history_destination_id_idx" ON "user_destination_history" USING btree ("destination_id");
