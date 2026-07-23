ALTER TABLE "cars" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "deleted_by_device" text;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "deleted_via" text;--> statement-breakpoint
ALTER TABLE "odometer_readings" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "odometer_readings" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "odometer_readings" ADD COLUMN "deleted_by_device" text;--> statement-breakpoint
ALTER TABLE "odometer_readings" ADD COLUMN "deleted_via" text;--> statement-breakpoint
CREATE INDEX "cars_deleted_idx" ON "cars" USING btree ("deleted_at") WHERE "cars"."deleted_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "odometer_readings_deleted_idx" ON "odometer_readings" USING btree ("deleted_at") WHERE "odometer_readings"."deleted_at" IS NOT NULL;