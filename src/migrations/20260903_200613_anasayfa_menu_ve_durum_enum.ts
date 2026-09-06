import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_homepage_hero_overlay_style" AS ENUM('gradient', 'solid');
  CREATE TYPE "public"."enum_homepage_hero_primary_cta_type" AS ENUM('page', 'route', 'library', 'portal', 'external');
  CREATE TYPE "public"."enum_homepage_hero_primary_cta_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  CREATE TYPE "public"."enum_homepage_hero_secondary_cta_type" AS ENUM('page', 'route', 'library', 'portal', 'external');
  CREATE TYPE "public"."enum_homepage_hero_secondary_cta_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  CREATE TYPE "public"."enum__homepage_v_version_hero_overlay_style" AS ENUM('gradient', 'solid');
  CREATE TYPE "public"."enum__homepage_v_version_hero_primary_cta_type" AS ENUM('page', 'route', 'library', 'portal', 'external');
  CREATE TYPE "public"."enum__homepage_v_version_hero_primary_cta_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  CREATE TYPE "public"."enum__homepage_v_version_hero_secondary_cta_type" AS ENUM('page', 'route', 'library', 'portal', 'external');
  CREATE TYPE "public"."enum__homepage_v_version_hero_secondary_cta_route" AS ENUM('home', 'training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TYPE "public"."program_status" RENAME TO "enum_tp_custom_status";
  ALTER TYPE "public"."enum_navigation_main_menu_children_route" ADD VALUE 'home' BEFORE 'training-topics';
  ALTER TYPE "public"."enum_navigation_main_menu_route" ADD VALUE 'home' BEFORE 'training-topics';
  ALTER TYPE "public"."enum_navigation_footer_columns_links_route" ADD VALUE 'home' BEFORE 'training-topics';
  ALTER TYPE "public"."enum_navigation_footer_legal_links_route" ADD VALUE 'home' BEFORE 'training-topics';
  ALTER TYPE "public"."enum_navigation_quick_access_route" ADD VALUE 'home' BEFORE 'training-topics';
  ALTER TYPE "public"."enum__navigation_v_version_main_menu_children_route" ADD VALUE 'home' BEFORE 'training-topics';
  ALTER TYPE "public"."enum__navigation_v_version_main_menu_route" ADD VALUE 'home' BEFORE 'training-topics';
  ALTER TYPE "public"."enum__navigation_v_version_footer_columns_links_route" ADD VALUE 'home' BEFORE 'training-topics';
  ALTER TYPE "public"."enum__navigation_v_version_footer_legal_links_route" ADD VALUE 'home' BEFORE 'training-topics';
  ALTER TYPE "public"."enum__navigation_v_version_quick_access_route" ADD VALUE 'home' BEFORE 'training-topics';
  CREATE TABLE "homepage_hero_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "homepage_hero_stats_locales" (
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_background_image_id" integer,
  	"hero_overlay_opacity" numeric DEFAULT 72,
  	"hero_overlay_style" "enum_homepage_hero_overlay_style" DEFAULT 'gradient',
  	"hero_primary_cta_type" "enum_homepage_hero_primary_cta_type" DEFAULT 'page',
  	"hero_primary_cta_page_id" integer,
  	"hero_primary_cta_route" "enum_homepage_hero_primary_cta_route",
  	"hero_primary_cta_path" varchar,
  	"hero_primary_cta_url" varchar,
  	"hero_secondary_cta_type" "enum_homepage_hero_secondary_cta_type" DEFAULT 'page',
  	"hero_secondary_cta_page_id" integer,
  	"hero_secondary_cta_route" "enum_homepage_hero_secondary_cta_route",
  	"hero_secondary_cta_path" varchar,
  	"hero_secondary_cta_url" varchar,
  	"featured_trainings_limit" numeric DEFAULT 5,
  	"featured_trainings_show_status_badges" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_locales" (
  	"hero_eyebrow" varchar,
  	"hero_headline" varchar,
  	"hero_subheadline" varchar,
  	"hero_primary_cta_label" varchar,
  	"hero_secondary_cta_label" varchar,
  	"featured_trainings_title" varchar,
  	"featured_trainings_intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_version_hero_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_version_hero_stats_locales" (
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_background_image_id" integer,
  	"version_hero_overlay_opacity" numeric DEFAULT 72,
  	"version_hero_overlay_style" "enum__homepage_v_version_hero_overlay_style" DEFAULT 'gradient',
  	"version_hero_primary_cta_type" "enum__homepage_v_version_hero_primary_cta_type" DEFAULT 'page',
  	"version_hero_primary_cta_page_id" integer,
  	"version_hero_primary_cta_route" "enum__homepage_v_version_hero_primary_cta_route",
  	"version_hero_primary_cta_path" varchar,
  	"version_hero_primary_cta_url" varchar,
  	"version_hero_secondary_cta_type" "enum__homepage_v_version_hero_secondary_cta_type" DEFAULT 'page',
  	"version_hero_secondary_cta_page_id" integer,
  	"version_hero_secondary_cta_route" "enum__homepage_v_version_hero_secondary_cta_route",
  	"version_hero_secondary_cta_path" varchar,
  	"version_hero_secondary_cta_url" varchar,
  	"version_featured_trainings_limit" numeric DEFAULT 5,
  	"version_featured_trainings_show_status_badges" boolean DEFAULT true,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_homepage_v_locales" (
  	"version_hero_eyebrow" varchar,
  	"version_hero_headline" varchar,
  	"version_hero_subheadline" varchar,
  	"version_hero_primary_cta_label" varchar,
  	"version_hero_secondary_cta_label" varchar,
  	"version_featured_trainings_title" varchar,
  	"version_featured_trainings_intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "homepage_hero_stats" ADD CONSTRAINT "homepage_hero_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_hero_stats_locales" ADD CONSTRAINT "homepage_hero_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_hero_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_hero_background_image_id_media_id_fk" FOREIGN KEY ("hero_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_hero_primary_cta_page_id_pages_id_fk" FOREIGN KEY ("hero_primary_cta_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_hero_secondary_cta_page_id_pages_id_fk" FOREIGN KEY ("hero_secondary_cta_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_hero_stats" ADD CONSTRAINT "_homepage_v_version_hero_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_hero_stats_locales" ADD CONSTRAINT "_homepage_v_version_hero_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_version_hero_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_hero_background_image_id_media_id_fk" FOREIGN KEY ("version_hero_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_hero_primary_cta_page_id_pages_id_fk" FOREIGN KEY ("version_hero_primary_cta_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_hero_secondary_cta_page_id_pages_id_fk" FOREIGN KEY ("version_hero_secondary_cta_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_locales" ADD CONSTRAINT "_homepage_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "homepage_hero_stats_order_idx" ON "homepage_hero_stats" USING btree ("_order");
  CREATE INDEX "homepage_hero_stats_parent_id_idx" ON "homepage_hero_stats" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_hero_stats_locales_locale_parent_id_unique" ON "homepage_hero_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_hero_hero_background_image_idx" ON "homepage" USING btree ("hero_background_image_id");
  CREATE INDEX "homepage_hero_primary_cta_hero_primary_cta_page_idx" ON "homepage" USING btree ("hero_primary_cta_page_id");
  CREATE INDEX "homepage_hero_secondary_cta_hero_secondary_cta_page_idx" ON "homepage" USING btree ("hero_secondary_cta_page_id");
  CREATE UNIQUE INDEX "homepage_locales_locale_parent_id_unique" ON "homepage_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_version_hero_stats_order_idx" ON "_homepage_v_version_hero_stats" USING btree ("_order");
  CREATE INDEX "_homepage_v_version_hero_stats_parent_id_idx" ON "_homepage_v_version_hero_stats" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_homepage_v_version_hero_stats_locales_locale_parent_id_uniq" ON "_homepage_v_version_hero_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_version_hero_version_hero_background_image_idx" ON "_homepage_v" USING btree ("version_hero_background_image_id");
  CREATE INDEX "_homepage_v_version_hero_primary_cta_version_hero_primar_idx" ON "_homepage_v" USING btree ("version_hero_primary_cta_page_id");
  CREATE INDEX "_homepage_v_version_hero_secondary_cta_version_hero_seco_idx" ON "_homepage_v" USING btree ("version_hero_secondary_cta_page_id");
  CREATE INDEX "_homepage_v_created_at_idx" ON "_homepage_v" USING btree ("created_at");
  CREATE INDEX "_homepage_v_updated_at_idx" ON "_homepage_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "_homepage_v_locales_locale_parent_id_unique" ON "_homepage_v_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."program_status" AS ENUM('planned', 'applications-open', 'applications-closed', 'ongoing', 'completed', 'postponed', 'cancelled');
  ALTER TABLE "homepage_hero_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_hero_stats_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_version_hero_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_version_hero_stats_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "homepage_hero_stats" CASCADE;
  DROP TABLE "homepage_hero_stats_locales" CASCADE;
  DROP TABLE "homepage" CASCADE;
  DROP TABLE "homepage_locales" CASCADE;
  DROP TABLE "_homepage_v_version_hero_stats" CASCADE;
  DROP TABLE "_homepage_v_version_hero_stats_locales" CASCADE;
  DROP TABLE "_homepage_v" CASCADE;
  DROP TABLE "_homepage_v_locales" CASCADE;
  ALTER TABLE "navigation_main_menu_children" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum_navigation_main_menu_children_route";
  CREATE TYPE "public"."enum_navigation_main_menu_children_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "navigation_main_menu_children" ALTER COLUMN "route" SET DATA TYPE "public"."enum_navigation_main_menu_children_route" USING "route"::"public"."enum_navigation_main_menu_children_route";
  ALTER TABLE "navigation_main_menu" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum_navigation_main_menu_route";
  CREATE TYPE "public"."enum_navigation_main_menu_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "navigation_main_menu" ALTER COLUMN "route" SET DATA TYPE "public"."enum_navigation_main_menu_route" USING "route"::"public"."enum_navigation_main_menu_route";
  ALTER TABLE "navigation_footer_columns_links" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum_navigation_footer_columns_links_route";
  CREATE TYPE "public"."enum_navigation_footer_columns_links_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "navigation_footer_columns_links" ALTER COLUMN "route" SET DATA TYPE "public"."enum_navigation_footer_columns_links_route" USING "route"::"public"."enum_navigation_footer_columns_links_route";
  ALTER TABLE "navigation_footer_legal_links" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum_navigation_footer_legal_links_route";
  CREATE TYPE "public"."enum_navigation_footer_legal_links_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "navigation_footer_legal_links" ALTER COLUMN "route" SET DATA TYPE "public"."enum_navigation_footer_legal_links_route" USING "route"::"public"."enum_navigation_footer_legal_links_route";
  ALTER TABLE "navigation_quick_access" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum_navigation_quick_access_route";
  CREATE TYPE "public"."enum_navigation_quick_access_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "navigation_quick_access" ALTER COLUMN "route" SET DATA TYPE "public"."enum_navigation_quick_access_route" USING "route"::"public"."enum_navigation_quick_access_route";
  ALTER TABLE "_navigation_v_version_main_menu_children" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum__navigation_v_version_main_menu_children_route";
  CREATE TYPE "public"."enum__navigation_v_version_main_menu_children_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "_navigation_v_version_main_menu_children" ALTER COLUMN "route" SET DATA TYPE "public"."enum__navigation_v_version_main_menu_children_route" USING "route"::"public"."enum__navigation_v_version_main_menu_children_route";
  ALTER TABLE "_navigation_v_version_main_menu" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum__navigation_v_version_main_menu_route";
  CREATE TYPE "public"."enum__navigation_v_version_main_menu_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "_navigation_v_version_main_menu" ALTER COLUMN "route" SET DATA TYPE "public"."enum__navigation_v_version_main_menu_route" USING "route"::"public"."enum__navigation_v_version_main_menu_route";
  ALTER TABLE "_navigation_v_version_footer_columns_links" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum__navigation_v_version_footer_columns_links_route";
  CREATE TYPE "public"."enum__navigation_v_version_footer_columns_links_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "_navigation_v_version_footer_columns_links" ALTER COLUMN "route" SET DATA TYPE "public"."enum__navigation_v_version_footer_columns_links_route" USING "route"::"public"."enum__navigation_v_version_footer_columns_links_route";
  ALTER TABLE "_navigation_v_version_footer_legal_links" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum__navigation_v_version_footer_legal_links_route";
  CREATE TYPE "public"."enum__navigation_v_version_footer_legal_links_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "_navigation_v_version_footer_legal_links" ALTER COLUMN "route" SET DATA TYPE "public"."enum__navigation_v_version_footer_legal_links_route" USING "route"::"public"."enum__navigation_v_version_footer_legal_links_route";
  ALTER TABLE "_navigation_v_version_quick_access" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum__navigation_v_version_quick_access_route";
  CREATE TYPE "public"."enum__navigation_v_version_quick_access_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  ALTER TABLE "_navigation_v_version_quick_access" ALTER COLUMN "route" SET DATA TYPE "public"."enum__navigation_v_version_quick_access_route" USING "route"::"public"."enum__navigation_v_version_quick_access_route";
  ALTER TABLE "training_programs" ALTER COLUMN "status" DROP DEFAULT;
  ALTER TABLE "training_programs" ALTER COLUMN "status" SET DATA TYPE "public"."program_status" USING "status"::text::"public"."program_status";
  ALTER TABLE "training_programs" ALTER COLUMN "status" SET DEFAULT 'planned';
  ALTER TABLE "_training_programs_v" ALTER COLUMN "version_status" DROP DEFAULT;
  ALTER TABLE "_training_programs_v" ALTER COLUMN "version_status" SET DATA TYPE "public"."program_status" USING "version_status"::text::"public"."program_status";
  ALTER TABLE "_training_programs_v" ALTER COLUMN "version_status" SET DEFAULT 'planned';
  DROP TYPE "public"."enum_tp_custom_status";
  DROP TYPE "public"."enum_homepage_hero_overlay_style";
  DROP TYPE "public"."enum_homepage_hero_primary_cta_type";
  DROP TYPE "public"."enum_homepage_hero_primary_cta_route";
  DROP TYPE "public"."enum_homepage_hero_secondary_cta_type";
  DROP TYPE "public"."enum_homepage_hero_secondary_cta_route";
  DROP TYPE "public"."enum__homepage_v_version_hero_overlay_style";
  DROP TYPE "public"."enum__homepage_v_version_hero_primary_cta_type";
  DROP TYPE "public"."enum__homepage_v_version_hero_primary_cta_route";
  DROP TYPE "public"."enum__homepage_v_version_hero_secondary_cta_type";
  DROP TYPE "public"."enum__homepage_v_version_hero_secondary_cta_route";`)
}
