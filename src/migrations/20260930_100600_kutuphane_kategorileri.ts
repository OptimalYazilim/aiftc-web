import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "library_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"order" numeric DEFAULT 100,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "library_categories_locales" (
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "library_resources" ADD COLUMN "category_id" integer;
  ALTER TABLE "_library_resources_v" ADD COLUMN "version_category_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "library_categories_id" integer;
  ALTER TABLE "library_categories" ADD CONSTRAINT "library_categories_parent_id_library_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."library_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "library_categories_locales" ADD CONSTRAINT "library_categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."library_categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "library_categories_parent_idx" ON "library_categories" USING btree ("parent_id");
  CREATE INDEX "library_categories_updated_at_idx" ON "library_categories" USING btree ("updated_at");
  CREATE INDEX "library_categories_created_at_idx" ON "library_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "library_categories_slug_idx" ON "library_categories_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "library_categories_locales_locale_parent_id_unique" ON "library_categories_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_category_id_library_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."library_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_library_resources_v" ADD CONSTRAINT "_library_resources_v_version_category_id_library_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."library_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_library_categories_fk" FOREIGN KEY ("library_categories_id") REFERENCES "public"."library_categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "library_resources_category_idx" ON "library_resources" USING btree ("category_id");
  CREATE INDEX "_library_resources_v_version_version_category_idx" ON "_library_resources_v" USING btree ("version_category_id");
  CREATE INDEX "payload_locked_documents_rels_library_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("library_categories_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "library_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "library_categories_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "library_categories" CASCADE;
  DROP TABLE "library_categories_locales" CASCADE;
  ALTER TABLE "library_resources" DROP CONSTRAINT "library_resources_category_id_library_categories_id_fk";
  
  ALTER TABLE "_library_resources_v" DROP CONSTRAINT "_library_resources_v_version_category_id_library_categories_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_library_categories_fk";
  
  DROP INDEX "library_resources_category_idx";
  DROP INDEX "_library_resources_v_version_version_category_idx";
  DROP INDEX "payload_locked_documents_rels_library_categories_id_idx";
  ALTER TABLE "library_resources" DROP COLUMN "category_id";
  ALTER TABLE "_library_resources_v" DROP COLUMN "version_category_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "library_categories_id";`)
}
