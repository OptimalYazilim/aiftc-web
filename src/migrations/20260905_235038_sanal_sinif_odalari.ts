import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_virtual_classrooms_room_status" AS ENUM('active', 'closed');
  CREATE TYPE "public"."enum_virtual_classrooms_platform" AS ENUM('jitsi', 'bigbluebutton', 'zoom', 'teams', 'other');
  CREATE TABLE "virtual_classrooms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"training_id" integer NOT NULL,
  	"room_status" "enum_virtual_classrooms_room_status" DEFAULT 'closed' NOT NULL,
  	"platform" "enum_virtual_classrooms_platform" DEFAULT 'jitsi' NOT NULL,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"ends_at" timestamp(3) with time zone NOT NULL,
  	"join_window_minutes" numeric DEFAULT 15,
  	"meeting_url" varchar,
  	"meeting_id" varchar,
  	"moderator_password" varchar,
  	"attendee_password" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "virtual_classrooms_locales" (
  	"title" varchar NOT NULL,
  	"instructions" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "virtual_classrooms_id" integer;
  ALTER TABLE "virtual_classrooms" ADD CONSTRAINT "virtual_classrooms_training_id_training_programs_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."training_programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "virtual_classrooms_locales" ADD CONSTRAINT "virtual_classrooms_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."virtual_classrooms"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "virtual_classrooms_training_idx" ON "virtual_classrooms" USING btree ("training_id");
  CREATE INDEX "virtual_classrooms_room_status_idx" ON "virtual_classrooms" USING btree ("room_status");
  CREATE INDEX "virtual_classrooms_updated_at_idx" ON "virtual_classrooms" USING btree ("updated_at");
  CREATE INDEX "virtual_classrooms_created_at_idx" ON "virtual_classrooms" USING btree ("created_at");
  CREATE UNIQUE INDEX "virtual_classrooms_locales_locale_parent_id_unique" ON "virtual_classrooms_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_virtual_classrooms_fk" FOREIGN KEY ("virtual_classrooms_id") REFERENCES "public"."virtual_classrooms"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_virtual_classrooms_id_idx" ON "payload_locked_documents_rels" USING btree ("virtual_classrooms_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "virtual_classrooms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "virtual_classrooms_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "virtual_classrooms" CASCADE;
  DROP TABLE "virtual_classrooms_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_virtual_classrooms_fk";
  
  DROP INDEX "payload_locked_documents_rels_virtual_classrooms_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "virtual_classrooms_id";
  DROP TYPE "public"."enum_virtual_classrooms_room_status";
  DROP TYPE "public"."enum_virtual_classrooms_platform";`)
}
