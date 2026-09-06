import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_library_resources_resource_type" AS ENUM('report', 'technical-guide', 'workshop-presentation', 'yearbook-statistics', 'video', 'photo-album');
  CREATE TYPE "public"."enum_library_resources_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__library_resources_v_version_resource_type" AS ENUM('report', 'technical-guide', 'workshop-presentation', 'yearbook-statistics', 'video', 'photo-album');
  CREATE TYPE "public"."enum__library_resources_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__library_resources_v_published_locale" AS ENUM('tr', 'en', 'ru');
  ALTER TYPE "public"."enum_document_files_document_type" ADD VALUE 'video' BEFORE 'other';
  ALTER TYPE "public"."enum_navigation_main_menu_children_route" ADD VALUE 'library' BEFORE 'news';
  ALTER TYPE "public"."enum_navigation_main_menu_route" ADD VALUE 'library' BEFORE 'news';
  ALTER TYPE "public"."enum_navigation_footer_columns_links_route" ADD VALUE 'library' BEFORE 'news';
  ALTER TYPE "public"."enum_navigation_footer_legal_links_route" ADD VALUE 'library' BEFORE 'news';
  ALTER TYPE "public"."enum_navigation_quick_access_route" ADD VALUE 'library' BEFORE 'news';
  ALTER TYPE "public"."enum__navigation_v_version_main_menu_children_route" ADD VALUE 'library' BEFORE 'news';
  ALTER TYPE "public"."enum__navigation_v_version_main_menu_route" ADD VALUE 'library' BEFORE 'news';
  ALTER TYPE "public"."enum__navigation_v_version_footer_columns_links_route" ADD VALUE 'library' BEFORE 'news';
  ALTER TYPE "public"."enum__navigation_v_version_footer_legal_links_route" ADD VALUE 'library' BEFORE 'news';
  ALTER TYPE "public"."enum__navigation_v_version_quick_access_route" ADD VALUE 'library' BEFORE 'news';
  ALTER TYPE "public"."enum_homepage_hero_primary_cta_route" ADD VALUE 'library' BEFORE 'news';
  ALTER TYPE "public"."enum_homepage_hero_secondary_cta_route" ADD VALUE 'library' BEFORE 'news';
  ALTER TYPE "public"."enum__homepage_v_version_hero_primary_cta_route" ADD VALUE 'library' BEFORE 'news';
  ALTER TYPE "public"."enum__homepage_v_version_hero_secondary_cta_route" ADD VALUE 'library' BEFORE 'news';
  CREATE TABLE "library_resources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"resource_type" "enum_library_resources_resource_type" DEFAULT 'report',
  	"publication_year" numeric,
  	"featured" boolean DEFAULT false,
  	"downloads" numeric DEFAULT 0,
  	"translation_status" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"allow_video_download" boolean DEFAULT true,
  	"external_url" varchar,
  	"cover_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_library_resources_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "library_resources_locales" (
  	"slug" varchar,
  	"title" varchar,
  	"description" varchar,
  	"author" varchar,
  	"video_duration" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "library_resources_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"training_topics_id" integer,
  	"media_id" integer,
  	"document_files_id" integer
  );
  
  CREATE TABLE "_library_resources_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_resource_type" "enum__library_resources_v_version_resource_type" DEFAULT 'report',
  	"version_publication_year" numeric,
  	"version_featured" boolean DEFAULT false,
  	"version_downloads" numeric DEFAULT 0,
  	"version_translation_status" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_allow_video_download" boolean DEFAULT true,
  	"version_external_url" varchar,
  	"version_cover_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__library_resources_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__library_resources_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_library_resources_v_locales" (
  	"version_slug" varchar,
  	"version_title" varchar,
  	"version_description" varchar,
  	"version_author" varchar,
  	"version_video_duration" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_library_resources_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"training_topics_id" integer,
  	"media_id" integer,
  	"document_files_id" integer
  );
  
  CREATE TABLE "homepage_hero_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "homepage_hero_highlights_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_homepage_v_version_hero_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_version_hero_highlights_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "search_index_rels" ADD COLUMN "library_resources_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "library_resources_id" integer;
  ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "library_resources_locales" ADD CONSTRAINT "library_resources_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."library_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "library_resources_rels" ADD CONSTRAINT "library_resources_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."library_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "library_resources_rels" ADD CONSTRAINT "library_resources_rels_training_topics_fk" FOREIGN KEY ("training_topics_id") REFERENCES "public"."training_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "library_resources_rels" ADD CONSTRAINT "library_resources_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "library_resources_rels" ADD CONSTRAINT "library_resources_rels_document_files_fk" FOREIGN KEY ("document_files_id") REFERENCES "public"."document_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_library_resources_v" ADD CONSTRAINT "_library_resources_v_parent_id_library_resources_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."library_resources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_library_resources_v" ADD CONSTRAINT "_library_resources_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_library_resources_v_locales" ADD CONSTRAINT "_library_resources_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_library_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_library_resources_v_rels" ADD CONSTRAINT "_library_resources_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_library_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_library_resources_v_rels" ADD CONSTRAINT "_library_resources_v_rels_training_topics_fk" FOREIGN KEY ("training_topics_id") REFERENCES "public"."training_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_library_resources_v_rels" ADD CONSTRAINT "_library_resources_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_library_resources_v_rels" ADD CONSTRAINT "_library_resources_v_rels_document_files_fk" FOREIGN KEY ("document_files_id") REFERENCES "public"."document_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_hero_highlights" ADD CONSTRAINT "homepage_hero_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_hero_highlights_locales" ADD CONSTRAINT "homepage_hero_highlights_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_hero_highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_hero_highlights" ADD CONSTRAINT "_homepage_v_version_hero_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_hero_highlights_locales" ADD CONSTRAINT "_homepage_v_version_hero_highlights_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_version_hero_highlights"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "library_resources_resource_type_idx" ON "library_resources" USING btree ("resource_type");
  CREATE INDEX "library_resources_publication_year_idx" ON "library_resources" USING btree ("publication_year");
  CREATE INDEX "library_resources_cover_image_idx" ON "library_resources" USING btree ("cover_image_id");
  CREATE INDEX "library_resources_updated_at_idx" ON "library_resources" USING btree ("updated_at");
  CREATE INDEX "library_resources_created_at_idx" ON "library_resources" USING btree ("created_at");
  CREATE INDEX "library_resources__status_idx" ON "library_resources" USING btree ("_status");
  CREATE UNIQUE INDEX "library_resources_slug_idx" ON "library_resources_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "library_resources_locales_locale_parent_id_unique" ON "library_resources_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "library_resources_rels_order_idx" ON "library_resources_rels" USING btree ("order");
  CREATE INDEX "library_resources_rels_parent_idx" ON "library_resources_rels" USING btree ("parent_id");
  CREATE INDEX "library_resources_rels_path_idx" ON "library_resources_rels" USING btree ("path");
  CREATE INDEX "library_resources_rels_training_topics_id_idx" ON "library_resources_rels" USING btree ("training_topics_id");
  CREATE INDEX "library_resources_rels_media_id_idx" ON "library_resources_rels" USING btree ("media_id");
  CREATE INDEX "library_resources_rels_document_files_id_idx" ON "library_resources_rels" USING btree ("document_files_id");
  CREATE INDEX "_library_resources_v_parent_idx" ON "_library_resources_v" USING btree ("parent_id");
  CREATE INDEX "_library_resources_v_version_version_resource_type_idx" ON "_library_resources_v" USING btree ("version_resource_type");
  CREATE INDEX "_library_resources_v_version_version_publication_year_idx" ON "_library_resources_v" USING btree ("version_publication_year");
  CREATE INDEX "_library_resources_v_version_version_cover_image_idx" ON "_library_resources_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_library_resources_v_version_version_updated_at_idx" ON "_library_resources_v" USING btree ("version_updated_at");
  CREATE INDEX "_library_resources_v_version_version_created_at_idx" ON "_library_resources_v" USING btree ("version_created_at");
  CREATE INDEX "_library_resources_v_version_version__status_idx" ON "_library_resources_v" USING btree ("version__status");
  CREATE INDEX "_library_resources_v_created_at_idx" ON "_library_resources_v" USING btree ("created_at");
  CREATE INDEX "_library_resources_v_updated_at_idx" ON "_library_resources_v" USING btree ("updated_at");
  CREATE INDEX "_library_resources_v_snapshot_idx" ON "_library_resources_v" USING btree ("snapshot");
  CREATE INDEX "_library_resources_v_published_locale_idx" ON "_library_resources_v" USING btree ("published_locale");
  CREATE INDEX "_library_resources_v_latest_idx" ON "_library_resources_v" USING btree ("latest");
  CREATE INDEX "_library_resources_v_version_version_slug_idx" ON "_library_resources_v_locales" USING btree ("version_slug","_locale");
  CREATE UNIQUE INDEX "_library_resources_v_locales_locale_parent_id_unique" ON "_library_resources_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_library_resources_v_rels_order_idx" ON "_library_resources_v_rels" USING btree ("order");
  CREATE INDEX "_library_resources_v_rels_parent_idx" ON "_library_resources_v_rels" USING btree ("parent_id");
  CREATE INDEX "_library_resources_v_rels_path_idx" ON "_library_resources_v_rels" USING btree ("path");
  CREATE INDEX "_library_resources_v_rels_training_topics_id_idx" ON "_library_resources_v_rels" USING btree ("training_topics_id");
  CREATE INDEX "_library_resources_v_rels_media_id_idx" ON "_library_resources_v_rels" USING btree ("media_id");
  CREATE INDEX "_library_resources_v_rels_document_files_id_idx" ON "_library_resources_v_rels" USING btree ("document_files_id");
  CREATE INDEX "homepage_hero_highlights_order_idx" ON "homepage_hero_highlights" USING btree ("_order");
  CREATE INDEX "homepage_hero_highlights_parent_id_idx" ON "homepage_hero_highlights" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_hero_highlights_locales_locale_parent_id_unique" ON "homepage_hero_highlights_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_version_hero_highlights_order_idx" ON "_homepage_v_version_hero_highlights" USING btree ("_order");
  CREATE INDEX "_homepage_v_version_hero_highlights_parent_id_idx" ON "_homepage_v_version_hero_highlights" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_homepage_v_version_hero_highlights_locales_locale_parent_id" ON "_homepage_v_version_hero_highlights_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "search_index_rels" ADD CONSTRAINT "search_index_rels_library_resources_fk" FOREIGN KEY ("library_resources_id") REFERENCES "public"."library_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_library_resources_fk" FOREIGN KEY ("library_resources_id") REFERENCES "public"."library_resources"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "search_index_rels_library_resources_id_idx" ON "search_index_rels" USING btree ("library_resources_id");
  CREATE INDEX "payload_locked_documents_rels_library_resources_id_idx" ON "payload_locked_documents_rels" USING btree ("library_resources_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "library_resources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "library_resources_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "library_resources_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_library_resources_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_library_resources_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_library_resources_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_hero_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_hero_highlights_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_version_hero_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_version_hero_highlights_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "library_resources" CASCADE;
  DROP TABLE "library_resources_locales" CASCADE;
  DROP TABLE "library_resources_rels" CASCADE;
  DROP TABLE "_library_resources_v" CASCADE;
  DROP TABLE "_library_resources_v_locales" CASCADE;
  DROP TABLE "_library_resources_v_rels" CASCADE;
  DROP TABLE "homepage_hero_highlights" CASCADE;
  DROP TABLE "homepage_hero_highlights_locales" CASCADE;
  DROP TABLE "_homepage_v_version_hero_highlights" CASCADE;
  DROP TABLE "_homepage_v_version_hero_highlights_locales" CASCADE;
  ALTER TABLE "search_index_rels" DROP CONSTRAINT "search_index_rels_library_resources_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_library_resources_fk";
  
  ALTER TABLE "document_files" ALTER COLUMN "document_type" SET DATA TYPE text;
  ALTER TABLE "document_files" ALTER COLUMN "document_type" SET DEFAULT 'other'::text;
  DROP TYPE "public"."enum_document_files_document_type";
  CREATE TYPE "public"."enum_document_files_document_type" AS ENUM('programme', 'announcement-annex', 'form', 'guide', 'report', 'legal', 'other');
  ALTER TABLE "document_files" ALTER COLUMN "document_type" SET DEFAULT 'other'::"public"."enum_document_files_document_type";
  ALTER TABLE "document_files" ALTER COLUMN "document_type" SET DATA TYPE "public"."enum_document_files_document_type" USING "document_type"::"public"."enum_document_files_document_type";
  ALTER TABLE "navigation_main_menu_children" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum_navigation_main_menu_children_route";
  CREATE TYPE "public"."enum_navigation_main_menu_children_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "navigation_main_menu_children" ALTER COLUMN "route" SET DATA TYPE "public"."enum_navigation_main_menu_children_route" USING "route"::"public"."enum_navigation_main_menu_children_route";
  ALTER TABLE "navigation_main_menu" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum_navigation_main_menu_route";
  CREATE TYPE "public"."enum_navigation_main_menu_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "navigation_main_menu" ALTER COLUMN "route" SET DATA TYPE "public"."enum_navigation_main_menu_route" USING "route"::"public"."enum_navigation_main_menu_route";
  ALTER TABLE "navigation_footer_columns_links" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum_navigation_footer_columns_links_route";
  CREATE TYPE "public"."enum_navigation_footer_columns_links_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "navigation_footer_columns_links" ALTER COLUMN "route" SET DATA TYPE "public"."enum_navigation_footer_columns_links_route" USING "route"::"public"."enum_navigation_footer_columns_links_route";
  ALTER TABLE "navigation_footer_legal_links" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum_navigation_footer_legal_links_route";
  CREATE TYPE "public"."enum_navigation_footer_legal_links_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "navigation_footer_legal_links" ALTER COLUMN "route" SET DATA TYPE "public"."enum_navigation_footer_legal_links_route" USING "route"::"public"."enum_navigation_footer_legal_links_route";
  ALTER TABLE "navigation_quick_access" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum_navigation_quick_access_route";
  CREATE TYPE "public"."enum_navigation_quick_access_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "navigation_quick_access" ALTER COLUMN "route" SET DATA TYPE "public"."enum_navigation_quick_access_route" USING "route"::"public"."enum_navigation_quick_access_route";
  ALTER TABLE "_navigation_v_version_main_menu_children" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum__navigation_v_version_main_menu_children_route";
  CREATE TYPE "public"."enum__navigation_v_version_main_menu_children_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "_navigation_v_version_main_menu_children" ALTER COLUMN "route" SET DATA TYPE "public"."enum__navigation_v_version_main_menu_children_route" USING "route"::"public"."enum__navigation_v_version_main_menu_children_route";
  ALTER TABLE "_navigation_v_version_main_menu" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum__navigation_v_version_main_menu_route";
  CREATE TYPE "public"."enum__navigation_v_version_main_menu_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "_navigation_v_version_main_menu" ALTER COLUMN "route" SET DATA TYPE "public"."enum__navigation_v_version_main_menu_route" USING "route"::"public"."enum__navigation_v_version_main_menu_route";
  ALTER TABLE "_navigation_v_version_footer_columns_links" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum__navigation_v_version_footer_columns_links_route";
  CREATE TYPE "public"."enum__navigation_v_version_footer_columns_links_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "_navigation_v_version_footer_columns_links" ALTER COLUMN "route" SET DATA TYPE "public"."enum__navigation_v_version_footer_columns_links_route" USING "route"::"public"."enum__navigation_v_version_footer_columns_links_route";
  ALTER TABLE "_navigation_v_version_footer_legal_links" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum__navigation_v_version_footer_legal_links_route";
  CREATE TYPE "public"."enum__navigation_v_version_footer_legal_links_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "_navigation_v_version_footer_legal_links" ALTER COLUMN "route" SET DATA TYPE "public"."enum__navigation_v_version_footer_legal_links_route" USING "route"::"public"."enum__navigation_v_version_footer_legal_links_route";
  ALTER TABLE "_navigation_v_version_quick_access" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum__navigation_v_version_quick_access_route";
  CREATE TYPE "public"."enum__navigation_v_version_quick_access_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "_navigation_v_version_quick_access" ALTER COLUMN "route" SET DATA TYPE "public"."enum__navigation_v_version_quick_access_route" USING "route"::"public"."enum__navigation_v_version_quick_access_route";
  ALTER TABLE "homepage" ALTER COLUMN "hero_primary_cta_route" SET DATA TYPE text;
  DROP TYPE "public"."enum_homepage_hero_primary_cta_route";
  CREATE TYPE "public"."enum_homepage_hero_primary_cta_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "homepage" ALTER COLUMN "hero_primary_cta_route" SET DATA TYPE "public"."enum_homepage_hero_primary_cta_route" USING "hero_primary_cta_route"::"public"."enum_homepage_hero_primary_cta_route";
  ALTER TABLE "homepage" ALTER COLUMN "hero_secondary_cta_route" SET DATA TYPE text;
  DROP TYPE "public"."enum_homepage_hero_secondary_cta_route";
  CREATE TYPE "public"."enum_homepage_hero_secondary_cta_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "homepage" ALTER COLUMN "hero_secondary_cta_route" SET DATA TYPE "public"."enum_homepage_hero_secondary_cta_route" USING "hero_secondary_cta_route"::"public"."enum_homepage_hero_secondary_cta_route";
  ALTER TABLE "_homepage_v" ALTER COLUMN "version_hero_primary_cta_route" SET DATA TYPE text;
  DROP TYPE "public"."enum__homepage_v_version_hero_primary_cta_route";
  CREATE TYPE "public"."enum__homepage_v_version_hero_primary_cta_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "_homepage_v" ALTER COLUMN "version_hero_primary_cta_route" SET DATA TYPE "public"."enum__homepage_v_version_hero_primary_cta_route" USING "version_hero_primary_cta_route"::"public"."enum__homepage_v_version_hero_primary_cta_route";
  ALTER TABLE "_homepage_v" ALTER COLUMN "version_hero_secondary_cta_route" SET DATA TYPE text;
  DROP TYPE "public"."enum__homepage_v_version_hero_secondary_cta_route";
  CREATE TYPE "public"."enum__homepage_v_version_hero_secondary_cta_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "_homepage_v" ALTER COLUMN "version_hero_secondary_cta_route" SET DATA TYPE "public"."enum__homepage_v_version_hero_secondary_cta_route" USING "version_hero_secondary_cta_route"::"public"."enum__homepage_v_version_hero_secondary_cta_route";
  DROP INDEX "search_index_rels_library_resources_id_idx";
  DROP INDEX "payload_locked_documents_rels_library_resources_id_idx";
  ALTER TABLE "search_index_rels" DROP COLUMN "library_resources_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "library_resources_id";
  DROP TYPE "public"."enum_library_resources_resource_type";
  DROP TYPE "public"."enum_library_resources_status";
  DROP TYPE "public"."enum__library_resources_v_version_resource_type";
  DROP TYPE "public"."enum__library_resources_v_version_status";
  DROP TYPE "public"."enum__library_resources_v_published_locale";`)
}
