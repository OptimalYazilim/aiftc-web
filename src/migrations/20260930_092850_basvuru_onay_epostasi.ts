import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_registrations_approval_email_status" AS ENUM('sent', 'logged', 'failed');
  ALTER TABLE "registrations" ADD COLUMN "approval_email_status" "enum_registrations_approval_email_status";
  ALTER TABLE "registrations" ADD COLUMN "approval_email_at" timestamp(3) with time zone;
  ALTER TABLE "registrations" ADD COLUMN "approval_email_error" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "registrations" DROP COLUMN "approval_email_status";
  ALTER TABLE "registrations" DROP COLUMN "approval_email_at";
  ALTER TABLE "registrations" DROP COLUMN "approval_email_error";
  DROP TYPE "public"."enum_registrations_approval_email_status";`)
}
