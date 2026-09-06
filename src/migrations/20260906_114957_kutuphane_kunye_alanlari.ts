import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_library_resources_language" AS ENUM('tr', 'en', 'ru');
  CREATE TYPE "public"."enum_library_resources_countries" AS ENUM('TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'OTHER');
  CREATE TYPE "public"."enum_library_resources_file_format" AS ENUM('pdf', 'docx', 'xlsx', 'pptx', 'epub', 'mp4', 'mp3', 'zip', 'html', 'other');
  CREATE TYPE "public"."enum_library_resources_license" AS ENUM('cc-by', 'cc-by-sa', 'cc-by-nc', 'cc-by-nc-nd', 'cc0', 'institutional', 'all-rights-reserved');
  CREATE TYPE "public"."enum__library_resources_v_version_language" AS ENUM('tr', 'en', 'ru');
  CREATE TYPE "public"."enum__library_resources_v_version_countries" AS ENUM('TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'OTHER');
  CREATE TYPE "public"."enum__library_resources_v_version_file_format" AS ENUM('pdf', 'docx', 'xlsx', 'pptx', 'epub', 'mp4', 'mp3', 'zip', 'html', 'other');
  CREATE TYPE "public"."enum__library_resources_v_version_license" AS ENUM('cc-by', 'cc-by-sa', 'cc-by-nc', 'cc-by-nc-nd', 'cc0', 'institutional', 'all-rights-reserved');
  CREATE TABLE "library_resources_language" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_library_resources_language",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "library_resources_countries" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_library_resources_countries",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "library_resources_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar,
  	"locale" "_locales"
  );
  
  CREATE TABLE "_library_resources_v_version_language" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__library_resources_v_version_language",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_library_resources_v_version_countries" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__library_resources_v_version_countries",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_library_resources_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar,
  	"locale" "_locales"
  );
  
  ALTER TABLE "library_resources" ADD COLUMN "uploaded_by_id" integer;
  ALTER TABLE "library_resources" ADD COLUMN "identifier" varchar;
  ALTER TABLE "library_resources" ADD COLUMN "captions_url" varchar;
  ALTER TABLE "library_resources" ADD COLUMN "file_format" "enum_library_resources_file_format";
  ALTER TABLE "library_resources" ADD COLUMN "file_size" varchar;
  ALTER TABLE "library_resources" ADD COLUMN "version" varchar;
  ALTER TABLE "library_resources" ADD COLUMN "license" "enum_library_resources_license";
  ALTER TABLE "library_resources" ADD COLUMN "copyright_holder" varchar;
  ALTER TABLE "library_resources_locales" ADD COLUMN "institution" varchar;
  ALTER TABLE "library_resources_rels" ADD COLUMN "training_programs_id" integer;
  ALTER TABLE "library_resources_rels" ADD COLUMN "projects_id" integer;
  ALTER TABLE "_library_resources_v" ADD COLUMN "version_uploaded_by_id" integer;
  ALTER TABLE "_library_resources_v" ADD COLUMN "version_identifier" varchar;
  ALTER TABLE "_library_resources_v" ADD COLUMN "version_captions_url" varchar;
  ALTER TABLE "_library_resources_v" ADD COLUMN "version_file_format" "enum__library_resources_v_version_file_format";
  ALTER TABLE "_library_resources_v" ADD COLUMN "version_file_size" varchar;
  ALTER TABLE "_library_resources_v" ADD COLUMN "version_version" varchar;
  ALTER TABLE "_library_resources_v" ADD COLUMN "version_license" "enum__library_resources_v_version_license";
  ALTER TABLE "_library_resources_v" ADD COLUMN "version_copyright_holder" varchar;
  ALTER TABLE "_library_resources_v_locales" ADD COLUMN "version_institution" varchar;
  ALTER TABLE "_library_resources_v_rels" ADD COLUMN "training_programs_id" integer;
  ALTER TABLE "_library_resources_v_rels" ADD COLUMN "projects_id" integer;
  ALTER TABLE "library_resources_language" ADD CONSTRAINT "library_resources_language_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."library_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "library_resources_countries" ADD CONSTRAINT "library_resources_countries_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."library_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "library_resources_texts" ADD CONSTRAINT "library_resources_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."library_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_library_resources_v_version_language" ADD CONSTRAINT "_library_resources_v_version_language_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_library_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_library_resources_v_version_countries" ADD CONSTRAINT "_library_resources_v_version_countries_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_library_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_library_resources_v_texts" ADD CONSTRAINT "_library_resources_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_library_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "library_resources_language_order_idx" ON "library_resources_language" USING btree ("order");
  CREATE INDEX "library_resources_language_parent_idx" ON "library_resources_language" USING btree ("parent_id");
  CREATE INDEX "library_resources_language_value_idx" ON "library_resources_language" USING btree ("value");
  CREATE INDEX "library_resources_countries_order_idx" ON "library_resources_countries" USING btree ("order");
  CREATE INDEX "library_resources_countries_parent_idx" ON "library_resources_countries" USING btree ("parent_id");
  CREATE INDEX "library_resources_countries_value_idx" ON "library_resources_countries" USING btree ("value");
  CREATE INDEX "library_resources_texts_order_parent" ON "library_resources_texts" USING btree ("order","parent_id");
  CREATE INDEX "library_resources_texts_locale_parent" ON "library_resources_texts" USING btree ("locale","parent_id");
  CREATE INDEX "_library_resources_v_version_language_order_idx" ON "_library_resources_v_version_language" USING btree ("order");
  CREATE INDEX "_library_resources_v_version_language_parent_idx" ON "_library_resources_v_version_language" USING btree ("parent_id");
  CREATE INDEX "_library_resources_v_version_language_value_idx" ON "_library_resources_v_version_language" USING btree ("value");
  CREATE INDEX "_library_resources_v_version_countries_order_idx" ON "_library_resources_v_version_countries" USING btree ("order");
  CREATE INDEX "_library_resources_v_version_countries_parent_idx" ON "_library_resources_v_version_countries" USING btree ("parent_id");
  CREATE INDEX "_library_resources_v_version_countries_value_idx" ON "_library_resources_v_version_countries" USING btree ("value");
  CREATE INDEX "_library_resources_v_texts_order_parent" ON "_library_resources_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_library_resources_v_texts_locale_parent" ON "_library_resources_v_texts" USING btree ("locale","parent_id");
  ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "library_resources_rels" ADD CONSTRAINT "library_resources_rels_training_programs_fk" FOREIGN KEY ("training_programs_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "library_resources_rels" ADD CONSTRAINT "library_resources_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_library_resources_v" ADD CONSTRAINT "_library_resources_v_version_uploaded_by_id_users_id_fk" FOREIGN KEY ("version_uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_library_resources_v_rels" ADD CONSTRAINT "_library_resources_v_rels_training_programs_fk" FOREIGN KEY ("training_programs_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_library_resources_v_rels" ADD CONSTRAINT "_library_resources_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "library_resources_uploaded_by_idx" ON "library_resources" USING btree ("uploaded_by_id");
  CREATE INDEX "library_resources_identifier_idx" ON "library_resources" USING btree ("identifier");
  CREATE INDEX "library_resources_institution_idx" ON "library_resources_locales" USING btree ("institution","_locale");
  CREATE INDEX "library_resources_rels_training_programs_id_idx" ON "library_resources_rels" USING btree ("training_programs_id");
  CREATE INDEX "library_resources_rels_projects_id_idx" ON "library_resources_rels" USING btree ("projects_id");
  CREATE INDEX "_library_resources_v_version_version_uploaded_by_idx" ON "_library_resources_v" USING btree ("version_uploaded_by_id");
  CREATE INDEX "_library_resources_v_version_version_identifier_idx" ON "_library_resources_v" USING btree ("version_identifier");
  CREATE INDEX "_library_resources_v_version_version_institution_idx" ON "_library_resources_v_locales" USING btree ("version_institution","_locale");
  CREATE INDEX "_library_resources_v_rels_training_programs_id_idx" ON "_library_resources_v_rels" USING btree ("training_programs_id");
  CREATE INDEX "_library_resources_v_rels_projects_id_idx" ON "_library_resources_v_rels" USING btree ("projects_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "library_resources_language" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "library_resources_countries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "library_resources_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_library_resources_v_version_language" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_library_resources_v_version_countries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_library_resources_v_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "library_resources_language" CASCADE;
  DROP TABLE "library_resources_countries" CASCADE;
  DROP TABLE "library_resources_texts" CASCADE;
  DROP TABLE "_library_resources_v_version_language" CASCADE;
  DROP TABLE "_library_resources_v_version_countries" CASCADE;
  DROP TABLE "_library_resources_v_texts" CASCADE;
  ALTER TABLE "library_resources" DROP CONSTRAINT "library_resources_uploaded_by_id_users_id_fk";
  
  ALTER TABLE "library_resources_rels" DROP CONSTRAINT "library_resources_rels_training_programs_fk";
  
  ALTER TABLE "library_resources_rels" DROP CONSTRAINT "library_resources_rels_projects_fk";
  
  ALTER TABLE "_library_resources_v" DROP CONSTRAINT "_library_resources_v_version_uploaded_by_id_users_id_fk";
  
  ALTER TABLE "_library_resources_v_rels" DROP CONSTRAINT "_library_resources_v_rels_training_programs_fk";
  
  ALTER TABLE "_library_resources_v_rels" DROP CONSTRAINT "_library_resources_v_rels_projects_fk";
  
  DROP INDEX "library_resources_uploaded_by_idx";
  DROP INDEX "library_resources_identifier_idx";
  DROP INDEX "library_resources_institution_idx";
  DROP INDEX "library_resources_rels_training_programs_id_idx";
  DROP INDEX "library_resources_rels_projects_id_idx";
  DROP INDEX "_library_resources_v_version_version_uploaded_by_idx";
  DROP INDEX "_library_resources_v_version_version_identifier_idx";
  DROP INDEX "_library_resources_v_version_version_institution_idx";
  DROP INDEX "_library_resources_v_rels_training_programs_id_idx";
  DROP INDEX "_library_resources_v_rels_projects_id_idx";
  ALTER TABLE "library_resources" DROP COLUMN "uploaded_by_id";
  ALTER TABLE "library_resources" DROP COLUMN "identifier";
  ALTER TABLE "library_resources" DROP COLUMN "captions_url";
  ALTER TABLE "library_resources" DROP COLUMN "file_format";
  ALTER TABLE "library_resources" DROP COLUMN "file_size";
  ALTER TABLE "library_resources" DROP COLUMN "version";
  ALTER TABLE "library_resources" DROP COLUMN "license";
  ALTER TABLE "library_resources" DROP COLUMN "copyright_holder";
  ALTER TABLE "library_resources_locales" DROP COLUMN "institution";
  ALTER TABLE "library_resources_rels" DROP COLUMN "training_programs_id";
  ALTER TABLE "library_resources_rels" DROP COLUMN "projects_id";
  ALTER TABLE "_library_resources_v" DROP COLUMN "version_uploaded_by_id";
  ALTER TABLE "_library_resources_v" DROP COLUMN "version_identifier";
  ALTER TABLE "_library_resources_v" DROP COLUMN "version_captions_url";
  ALTER TABLE "_library_resources_v" DROP COLUMN "version_file_format";
  ALTER TABLE "_library_resources_v" DROP COLUMN "version_file_size";
  ALTER TABLE "_library_resources_v" DROP COLUMN "version_version";
  ALTER TABLE "_library_resources_v" DROP COLUMN "version_license";
  ALTER TABLE "_library_resources_v" DROP COLUMN "version_copyright_holder";
  ALTER TABLE "_library_resources_v_locales" DROP COLUMN "version_institution";
  ALTER TABLE "_library_resources_v_rels" DROP COLUMN "training_programs_id";
  ALTER TABLE "_library_resources_v_rels" DROP COLUMN "projects_id";
  DROP TYPE "public"."enum_library_resources_language";
  DROP TYPE "public"."enum_library_resources_countries";
  DROP TYPE "public"."enum_library_resources_file_format";
  DROP TYPE "public"."enum_library_resources_license";
  DROP TYPE "public"."enum__library_resources_v_version_language";
  DROP TYPE "public"."enum__library_resources_v_version_countries";
  DROP TYPE "public"."enum__library_resources_v_version_file_format";
  DROP TYPE "public"."enum__library_resources_v_version_license";`)
}
