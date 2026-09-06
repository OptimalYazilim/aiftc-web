import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_form_requests_submission_type" AS ENUM('contact', 'training-application');
  CREATE TYPE "public"."enum_form_requests_status" AS ENUM('pending', 'read');
  CREATE TYPE "public"."enum_form_requests_country" AS ENUM('TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'OTHER');
  CREATE TABLE "form_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"submission_type" "enum_form_requests_submission_type" DEFAULT 'contact' NOT NULL,
  	"status" "enum_form_requests_status" DEFAULT 'pending' NOT NULL,
  	"full_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"organization" varchar,
  	"country" "enum_form_requests_country",
  	"subject" varchar,
  	"message" varchar NOT NULL,
  	"related_training_id" integer,
  	"consent_accepted_at" timestamp(3) with time zone,
  	"consent_snapshot" varchar,
  	"locale" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "form_requests_id" integer;
  ALTER TABLE "form_requests" ADD CONSTRAINT "form_requests_related_training_id_training_programs_id_fk" FOREIGN KEY ("related_training_id") REFERENCES "public"."training_programs"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "form_requests_submission_type_idx" ON "form_requests" USING btree ("submission_type");
  CREATE INDEX "form_requests_status_idx" ON "form_requests" USING btree ("status");
  CREATE INDEX "form_requests_related_training_idx" ON "form_requests" USING btree ("related_training_id");
  CREATE INDEX "form_requests_updated_at_idx" ON "form_requests" USING btree ("updated_at");
  CREATE INDEX "form_requests_created_at_idx" ON "form_requests" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_form_requests_fk" FOREIGN KEY ("form_requests_id") REFERENCES "public"."form_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_form_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("form_requests_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_requests" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "form_requests" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_form_requests_fk";
  
  DROP INDEX "payload_locked_documents_rels_form_requests_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "form_requests_id";
  DROP TYPE "public"."enum_form_requests_submission_type";
  DROP TYPE "public"."enum_form_requests_status";
  DROP TYPE "public"."enum_form_requests_country";`)
}
