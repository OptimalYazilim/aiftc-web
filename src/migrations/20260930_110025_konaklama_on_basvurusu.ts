import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_accommodation_requests_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_accommodation_settings_currency" AS ENUM('TRY', 'EUR', 'USD');
  CREATE TABLE "accommodation_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_accommodation_requests_status" DEFAULT 'pending' NOT NULL,
  	"staff_note" varchar,
  	"full_name" varchar,
  	"phone" varchar,
  	"email" varchar,
  	"registration_id" integer,
  	"training_id" integer,
  	"check_in" timestamp(3) with time zone NOT NULL,
  	"check_out" timestamp(3) with time zone NOT NULL,
  	"nights" numeric,
  	"nights_in_training" numeric,
  	"nights_outside" numeric,
  	"estimated_cost" numeric,
  	"currency" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "accommodation_settings_closed_periods" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"from" timestamp(3) with time zone NOT NULL,
  	"to" timestamp(3) with time zone NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "accommodation_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT false,
  	"max_nights" numeric DEFAULT 20 NOT NULL,
  	"capacity" numeric,
  	"currency" "enum_accommodation_settings_currency" DEFAULT 'TRY',
  	"rate_in_training" numeric,
  	"rate_outside_training" numeric,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "accommodation_requests_id" integer;
  ALTER TABLE "accommodation_requests" ADD CONSTRAINT "accommodation_requests_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "accommodation_requests" ADD CONSTRAINT "accommodation_requests_training_id_training_programs_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."training_programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "accommodation_settings_closed_periods" ADD CONSTRAINT "accommodation_settings_closed_periods_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."accommodation_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "accommodation_requests_status_idx" ON "accommodation_requests" USING btree ("status");
  CREATE INDEX "accommodation_requests_registration_idx" ON "accommodation_requests" USING btree ("registration_id");
  CREATE INDEX "accommodation_requests_training_idx" ON "accommodation_requests" USING btree ("training_id");
  CREATE INDEX "accommodation_requests_check_in_idx" ON "accommodation_requests" USING btree ("check_in");
  CREATE INDEX "accommodation_requests_updated_at_idx" ON "accommodation_requests" USING btree ("updated_at");
  CREATE INDEX "accommodation_requests_created_at_idx" ON "accommodation_requests" USING btree ("created_at");
  CREATE INDEX "accommodation_settings_closed_periods_order_idx" ON "accommodation_settings_closed_periods" USING btree ("_order");
  CREATE INDEX "accommodation_settings_closed_periods_parent_id_idx" ON "accommodation_settings_closed_periods" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_accommodation_requests_fk" FOREIGN KEY ("accommodation_requests_id") REFERENCES "public"."accommodation_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_accommodation_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("accommodation_requests_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "accommodation_requests" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "accommodation_settings_closed_periods" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "accommodation_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "accommodation_requests" CASCADE;
  DROP TABLE "accommodation_settings_closed_periods" CASCADE;
  DROP TABLE "accommodation_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_accommodation_requests_fk";
  
  DROP INDEX "payload_locked_documents_rels_accommodation_requests_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "accommodation_requests_id";
  DROP TYPE "public"."enum_accommodation_requests_status";
  DROP TYPE "public"."enum_accommodation_settings_currency";`)
}
