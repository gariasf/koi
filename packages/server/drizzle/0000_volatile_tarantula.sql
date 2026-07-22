CREATE TABLE "cars" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"nickname" text,
	"plate" text,
	"fuel_type" text NOT NULL,
	"year" integer,
	"tank_capacity_l" integer,
	"initial_odometer_km" integer,
	"archived_at" timestamp with time zone,
	"record_version" bigint DEFAULT 1 NOT NULL,
	"column_versions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dead_letters" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text,
	"op" text NOT NULL,
	"record_table" text NOT NULL,
	"record_id" text,
	"payload" jsonb NOT NULL,
	"reason" text NOT NULL,
	"actor" text,
	"device_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flags" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text,
	"record_table" text NOT NULL,
	"record_id" text NOT NULL,
	"car_id" text,
	"column_name" text,
	"kind" text NOT NULL,
	"message" text NOT NULL,
	"displaced_value" jsonb,
	"incoming_value" jsonb,
	"base_version" bigint,
	"record_version" bigint,
	"actor" text,
	"device_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "odometer_readings" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"car_id" text NOT NULL,
	"reading_km" integer NOT NULL,
	"recorded_date" text NOT NULL,
	"source" text,
	"device_id" text,
	"record_version" bigint DEFAULT 1 NOT NULL,
	"column_versions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "cars_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "odometer_readings" ADD CONSTRAINT "odometer_readings_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "odometer_readings" ADD CONSTRAINT "odometer_readings_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cars_household_idx" ON "cars" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "flags_household_idx" ON "flags" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "flags_record_idx" ON "flags" USING btree ("record_table","record_id");--> statement-breakpoint
CREATE INDEX "odometer_readings_car_idx" ON "odometer_readings" USING btree ("car_id");--> statement-breakpoint
CREATE INDEX "odometer_readings_household_idx" ON "odometer_readings" USING btree ("household_id");