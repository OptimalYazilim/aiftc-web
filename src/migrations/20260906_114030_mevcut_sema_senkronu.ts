import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_training_programs_review_status" AS ENUM('draft', 'in_review', 'approved', 'published');
  CREATE TYPE "public"."enum__training_programs_v_version_review_status" AS ENUM('draft', 'in_review', 'approved', 'published');
  CREATE TYPE "public"."enum_news_review_status" AS ENUM('draft', 'in_review', 'approved', 'published');
  CREATE TYPE "public"."enum__news_v_version_review_status" AS ENUM('draft', 'in_review', 'approved', 'published');
  CREATE TYPE "public"."enum_library_resources_review_status" AS ENUM('draft', 'in_review', 'approved', 'published');
  CREATE TYPE "public"."enum_library_resources_access_level" AS ENUM('public', 'staff', 'instructor', 'trainee');
  CREATE TYPE "public"."enum__library_resources_v_version_review_status" AS ENUM('draft', 'in_review', 'approved', 'published');
  CREATE TYPE "public"."enum__library_resources_v_version_access_level" AS ENUM('public', 'staff', 'instructor', 'trainee');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'staff', 'instructor', 'trainee');
  CREATE TYPE "public"."enum_users_account_status" AS ENUM('pending', 'approved', 'suspended');
  ALTER TABLE "training_programs" ADD COLUMN "review_status" "enum_training_programs_review_status" DEFAULT 'draft';
  ALTER TABLE "_training_programs_v" ADD COLUMN "version_review_status" "enum__training_programs_v_version_review_status" DEFAULT 'draft';
  ALTER TABLE "news" ADD COLUMN "review_status" "enum_news_review_status" DEFAULT 'draft';
  ALTER TABLE "_news_v" ADD COLUMN "version_review_status" "enum__news_v_version_review_status" DEFAULT 'draft';
  ALTER TABLE "library_resources" ADD COLUMN "review_status" "enum_library_resources_review_status" DEFAULT 'draft';
  ALTER TABLE "library_resources" ADD COLUMN "access_level" "enum_library_resources_access_level" DEFAULT 'staff';
  ALTER TABLE "_library_resources_v" ADD COLUMN "version_review_status" "enum__library_resources_v_version_review_status" DEFAULT 'draft';
  ALTER TABLE "_library_resources_v" ADD COLUMN "version_access_level" "enum__library_resources_v_version_access_level" DEFAULT 'staff';
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'staff' NOT NULL;
  ALTER TABLE "users" ADD COLUMN "account_status" "enum_users_account_status" NOT NULL;
  CREATE INDEX "training_programs_review_status_idx" ON "training_programs" USING btree ("review_status");
  CREATE INDEX "_training_programs_v_version_version_review_status_idx" ON "_training_programs_v" USING btree ("version_review_status");
  CREATE INDEX "news_review_status_idx" ON "news" USING btree ("review_status");
  CREATE INDEX "_news_v_version_version_review_status_idx" ON "_news_v" USING btree ("version_review_status");
  CREATE INDEX "library_resources_review_status_idx" ON "library_resources" USING btree ("review_status");
  CREATE INDEX "library_resources_access_level_idx" ON "library_resources" USING btree ("access_level");
  CREATE INDEX "_library_resources_v_version_version_review_status_idx" ON "_library_resources_v" USING btree ("version_review_status");
  CREATE INDEX "_library_resources_v_version_version_access_level_idx" ON "_library_resources_v" USING btree ("version_access_level");
  CREATE INDEX "users_role_idx" ON "users" USING btree ("role");
  CREATE INDEX "users_account_status_idx" ON "users" USING btree ("account_status");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "training_programs_review_status_idx";
  DROP INDEX "_training_programs_v_version_version_review_status_idx";
  DROP INDEX "news_review_status_idx";
  DROP INDEX "_news_v_version_version_review_status_idx";
  DROP INDEX "library_resources_review_status_idx";
  DROP INDEX "library_resources_access_level_idx";
  DROP INDEX "_library_resources_v_version_version_review_status_idx";
  DROP INDEX "_library_resources_v_version_version_access_level_idx";
  DROP INDEX "users_role_idx";
  DROP INDEX "users_account_status_idx";
  ALTER TABLE "training_programs" DROP COLUMN "review_status";
  ALTER TABLE "_training_programs_v" DROP COLUMN "version_review_status";
  ALTER TABLE "news" DROP COLUMN "review_status";
  ALTER TABLE "_news_v" DROP COLUMN "version_review_status";
  ALTER TABLE "library_resources" DROP COLUMN "review_status";
  ALTER TABLE "library_resources" DROP COLUMN "access_level";
  ALTER TABLE "_library_resources_v" DROP COLUMN "version_review_status";
  ALTER TABLE "_library_resources_v" DROP COLUMN "version_access_level";
  ALTER TABLE "users" DROP COLUMN "role";
  ALTER TABLE "users" DROP COLUMN "account_status";
  DROP TYPE "public"."enum_training_programs_review_status";
  DROP TYPE "public"."enum__training_programs_v_version_review_status";
  DROP TYPE "public"."enum_news_review_status";
  DROP TYPE "public"."enum__news_v_version_review_status";
  DROP TYPE "public"."enum_library_resources_review_status";
  DROP TYPE "public"."enum_library_resources_access_level";
  DROP TYPE "public"."enum__library_resources_v_version_review_status";
  DROP TYPE "public"."enum__library_resources_v_version_access_level";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_users_account_status";`)
}
