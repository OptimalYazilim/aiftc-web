import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_classroom_attendance_method" AS ENUM('account', 'code');
  CREATE TYPE "public"."enum_classroom_attendance_role" AS ENUM('attendee', 'moderator');
  CREATE TABLE "classroom_attendance" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"room_id" integer,
  	"training_id" integer,
  	"method" "enum_classroom_attendance_method" NOT NULL,
  	"role" "enum_classroom_attendance_role" NOT NULL,
  	"full_name" varchar,
  	"email" varchar,
  	"user_id" integer,
  	"registration_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "classroom_attendance_id" integer;
  ALTER TABLE "classroom_attendance" ADD CONSTRAINT "classroom_attendance_room_id_virtual_classrooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."virtual_classrooms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "classroom_attendance" ADD CONSTRAINT "classroom_attendance_training_id_training_programs_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."training_programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "classroom_attendance" ADD CONSTRAINT "classroom_attendance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "classroom_attendance" ADD CONSTRAINT "classroom_attendance_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "classroom_attendance_room_idx" ON "classroom_attendance" USING btree ("room_id");
  CREATE INDEX "classroom_attendance_training_idx" ON "classroom_attendance" USING btree ("training_id");
  CREATE INDEX "classroom_attendance_user_idx" ON "classroom_attendance" USING btree ("user_id");
  CREATE INDEX "classroom_attendance_registration_idx" ON "classroom_attendance" USING btree ("registration_id");
  CREATE INDEX "classroom_attendance_updated_at_idx" ON "classroom_attendance" USING btree ("updated_at");
  CREATE INDEX "classroom_attendance_created_at_idx" ON "classroom_attendance" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_classroom_attendance_fk" FOREIGN KEY ("classroom_attendance_id") REFERENCES "public"."classroom_attendance"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_classroom_attendance_id_idx" ON "payload_locked_documents_rels" USING btree ("classroom_attendance_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "classroom_attendance" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "classroom_attendance" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_classroom_attendance_fk";
  
  DROP INDEX "payload_locked_documents_rels_classroom_attendance_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "classroom_attendance_id";
  DROP TYPE "public"."enum_classroom_attendance_method";
  DROP TYPE "public"."enum_classroom_attendance_role";`)
}
