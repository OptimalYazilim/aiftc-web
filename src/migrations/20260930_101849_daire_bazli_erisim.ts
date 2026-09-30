import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "document_files_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"departments_id" integer
  );
  
  CREATE TABLE "departments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"external_code" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "departments_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "document_files" ADD COLUMN "restrict_to_departments" boolean DEFAULT false;
  ALTER TABLE "library_resources" ADD COLUMN "restrict_to_departments" boolean DEFAULT false;
  ALTER TABLE "library_resources_rels" ADD COLUMN "departments_id" integer;
  ALTER TABLE "_library_resources_v" ADD COLUMN "version_restrict_to_departments" boolean DEFAULT false;
  ALTER TABLE "_library_resources_v_rels" ADD COLUMN "departments_id" integer;
  ALTER TABLE "users" ADD COLUMN "department_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "departments_id" integer;
  ALTER TABLE "document_files_rels" ADD CONSTRAINT "document_files_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."document_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "document_files_rels" ADD CONSTRAINT "document_files_rels_departments_fk" FOREIGN KEY ("departments_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "departments_locales" ADD CONSTRAINT "departments_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "document_files_rels_order_idx" ON "document_files_rels" USING btree ("order");
  CREATE INDEX "document_files_rels_parent_idx" ON "document_files_rels" USING btree ("parent_id");
  CREATE INDEX "document_files_rels_path_idx" ON "document_files_rels" USING btree ("path");
  CREATE INDEX "document_files_rels_departments_id_idx" ON "document_files_rels" USING btree ("departments_id");
  CREATE UNIQUE INDEX "departments_external_code_idx" ON "departments" USING btree ("external_code");
  CREATE INDEX "departments_updated_at_idx" ON "departments" USING btree ("updated_at");
  CREATE INDEX "departments_created_at_idx" ON "departments" USING btree ("created_at");
  CREATE UNIQUE INDEX "departments_locales_locale_parent_id_unique" ON "departments_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "library_resources_rels" ADD CONSTRAINT "library_resources_rels_departments_fk" FOREIGN KEY ("departments_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_library_resources_v_rels" ADD CONSTRAINT "_library_resources_v_rels_departments_fk" FOREIGN KEY ("departments_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_departments_fk" FOREIGN KEY ("departments_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "library_resources_rels_departments_id_idx" ON "library_resources_rels" USING btree ("departments_id");
  CREATE INDEX "_library_resources_v_rels_departments_id_idx" ON "_library_resources_v_rels" USING btree ("departments_id");
  CREATE INDEX "users_department_idx" ON "users" USING btree ("department_id");
  CREATE INDEX "payload_locked_documents_rels_departments_id_idx" ON "payload_locked_documents_rels" USING btree ("departments_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "document_files_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "departments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "departments_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "document_files_rels" CASCADE;
  DROP TABLE "departments" CASCADE;
  DROP TABLE "departments_locales" CASCADE;
  ALTER TABLE "library_resources_rels" DROP CONSTRAINT "library_resources_rels_departments_fk";
  
  ALTER TABLE "_library_resources_v_rels" DROP CONSTRAINT "_library_resources_v_rels_departments_fk";
  
  ALTER TABLE "users" DROP CONSTRAINT "users_department_id_departments_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_departments_fk";
  
  DROP INDEX "library_resources_rels_departments_id_idx";
  DROP INDEX "_library_resources_v_rels_departments_id_idx";
  DROP INDEX "users_department_idx";
  DROP INDEX "payload_locked_documents_rels_departments_id_idx";
  ALTER TABLE "document_files" DROP COLUMN "restrict_to_departments";
  ALTER TABLE "library_resources" DROP COLUMN "restrict_to_departments";
  ALTER TABLE "library_resources_rels" DROP COLUMN "departments_id";
  ALTER TABLE "_library_resources_v" DROP COLUMN "version_restrict_to_departments";
  ALTER TABLE "_library_resources_v_rels" DROP COLUMN "departments_id";
  ALTER TABLE "users" DROP COLUMN "department_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "departments_id";`)
}
