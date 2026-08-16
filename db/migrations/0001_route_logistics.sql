ALTER TABLE "route_estimates" ADD COLUMN "uses_ferry" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "route_estimates" ADD COLUMN "crosses_border" boolean DEFAULT false NOT NULL;