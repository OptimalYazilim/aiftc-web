import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('tr', 'en', 'ru');
  CREATE TYPE "public"."enum_training_topics_level" AS ENUM('basic', 'intermediate', 'advanced', 'tot');
  CREATE TYPE "public"."enum_training_topics_category" AS ENUM('forest-fires', 'integrated-fire-management', 'sfm', 'flr', 'land-degradation', 'climate-change', 'nursery-afforestation', 'silviculture', 'protected-areas', 'nature-conservation', 'gis-rs', 'forest-pests', 'nwfp', 'forest-livelihoods', 'gender', 'capacity-development');
  CREATE TYPE "public"."enum_training_topics_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__training_topics_v_version_level" AS ENUM('basic', 'intermediate', 'advanced', 'tot');
  CREATE TYPE "public"."enum__training_topics_v_version_category" AS ENUM('forest-fires', 'integrated-fire-management', 'sfm', 'flr', 'land-degradation', 'climate-change', 'nursery-afforestation', 'silviculture', 'protected-areas', 'nature-conservation', 'gis-rs', 'forest-pests', 'nwfp', 'forest-livelihoods', 'gender', 'capacity-development');
  CREATE TYPE "public"."enum__training_topics_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__training_topics_v_published_locale" AS ENUM('tr', 'en', 'ru');
  CREATE TYPE "public"."enum_training_programs_instruction_languages" AS ENUM('tr', 'en', 'ru');
  CREATE TYPE "public"."enum_training_programs_participant_countries" AS ENUM('TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'OTHER');
  CREATE TYPE "public"."enum_training_programs_schedule_sessions_type" AS ENUM('theory', 'practice', 'simulation', 'field', 'assessment');
  CREATE TYPE "public"."program_status" AS ENUM('planned', 'applications-open', 'applications-closed', 'ongoing', 'completed', 'postponed', 'cancelled');
  CREATE TYPE "public"."enum_training_programs_delivery_mode" AS ENUM('in-person', 'online', 'hybrid');
  CREATE TYPE "public"."enum_training_programs_level" AS ENUM('basic', 'intermediate', 'advanced', 'tot');
  CREATE TYPE "public"."enum_training_programs_application_target_type" AS ENUM('contact', 'external', 'portal', 'email', 'none');
  CREATE TYPE "public"."enum_training_programs_certificate_type" AS ENUM('certificate', 'attendance', 'achievement', 'tot', 'project-specific', 'none');
  CREATE TYPE "public"."enum_training_programs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__training_programs_v_version_instruction_languages" AS ENUM('tr', 'en', 'ru');
  CREATE TYPE "public"."enum__training_programs_v_version_participant_countries" AS ENUM('TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'OTHER');
  CREATE TYPE "public"."enum__training_programs_v_version_schedule_sessions_type" AS ENUM('theory', 'practice', 'simulation', 'field', 'assessment');
  CREATE TYPE "public"."enum__training_programs_v_version_delivery_mode" AS ENUM('in-person', 'online', 'hybrid');
  CREATE TYPE "public"."enum__training_programs_v_version_level" AS ENUM('basic', 'intermediate', 'advanced', 'tot');
  CREATE TYPE "public"."enum__training_programs_v_version_application_target_type" AS ENUM('contact', 'external', 'portal', 'email', 'none');
  CREATE TYPE "public"."enum__training_programs_v_version_certificate_type" AS ENUM('certificate', 'attendance', 'achievement', 'tot', 'project-specific', 'none');
  CREATE TYPE "public"."enum__training_programs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__training_programs_v_published_locale" AS ENUM('tr', 'en', 'ru');
  CREATE TYPE "public"."enum_simulation_systems_access_links_audience" AS ENUM('trainer', 'learner', 'public');
  CREATE TYPE "public"."enum_simulation_systems_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__simulation_systems_v_version_access_links_audience" AS ENUM('trainer', 'learner', 'public');
  CREATE TYPE "public"."enum__simulation_systems_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__simulation_systems_v_published_locale" AS ENUM('tr', 'en', 'ru');
  CREATE TYPE "public"."enum_news_countries" AS ENUM('TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'OTHER');
  CREATE TYPE "public"."enum_news_kind" AS ENUM('news', 'announcement');
  CREATE TYPE "public"."enum_news_category" AS ENUM('training', 'project', 'cooperation', 'technical-visit', 'workshop', 'training-result', 'publication', 'announcement');
  CREATE TYPE "public"."enum_news_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__news_v_version_countries" AS ENUM('TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'OTHER');
  CREATE TYPE "public"."enum__news_v_version_kind" AS ENUM('news', 'announcement');
  CREATE TYPE "public"."enum__news_v_version_category" AS ENUM('training', 'project', 'cooperation', 'technical-visit', 'workshop', 'training-result', 'publication', 'announcement');
  CREATE TYPE "public"."enum__news_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__news_v_published_locale" AS ENUM('tr', 'en', 'ru');
  CREATE TYPE "public"."enum_international_guide_countries" AS ENUM('TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'OTHER');
  CREATE TYPE "public"."enum_international_guide_country_notes_country" AS ENUM('TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'OTHER');
  CREATE TYPE "public"."enum_international_guide_section_key" AS ENUM('about-centre', 'eligibility', 'application', 'language', 'accommodation', 'travel', 'arrival-antalya', 'transfer', 'visa', 'certificate', 'contact', 'practical', 'other');
  CREATE TYPE "public"."enum_international_guide_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__international_guide_v_version_countries" AS ENUM('TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'OTHER');
  CREATE TYPE "public"."enum__international_guide_v_version_country_notes_country" AS ENUM('TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'OTHER');
  CREATE TYPE "public"."enum__international_guide_v_version_section_key" AS ENUM('about-centre', 'eligibility', 'application', 'language', 'accommodation', 'travel', 'arrival-antalya', 'transfer', 'visa', 'certificate', 'contact', 'practical', 'other');
  CREATE TYPE "public"."enum__international_guide_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__international_guide_v_published_locale" AS ENUM('tr', 'en', 'ru');
  CREATE TYPE "public"."enum_faqs_group" AS ENUM('applications', 'languages', 'certificates', 'accommodation', 'materials', 'format', 'simulation', 'contact');
  CREATE TYPE "public"."enum_faqs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__faqs_v_version_group" AS ENUM('applications', 'languages', 'certificates', 'accommodation', 'materials', 'format', 'simulation', 'contact');
  CREATE TYPE "public"."enum__faqs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__faqs_v_published_locale" AS ENUM('tr', 'en', 'ru');
  CREATE TYPE "public"."enum_pages_blocks_media_block_width" AS ENUM('container', 'wide', 'full');
  CREATE TYPE "public"."enum_pages_blocks_cta_block_target" AS ENUM('internal', 'library', 'portal', 'external');
  CREATE TYPE "public"."enum_pages_page_type" AS ENUM('home', 'standard', 'institution', 'contact', 'legal');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_media_block_width" AS ENUM('container', 'wide', 'full');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_block_target" AS ENUM('internal', 'library', 'portal', 'external');
  CREATE TYPE "public"."enum__pages_v_version_page_type" AS ENUM('home', 'standard', 'institution', 'contact', 'legal');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('tr', 'en', 'ru');
  CREATE TYPE "public"."enum_gallery_albums_album_type" AS ENUM('photo', 'video', 'training-video', 'promo', 'webinar', 'simulation', 'infographic');
  CREATE TYPE "public"."enum_gallery_albums_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__gallery_albums_v_version_album_type" AS ENUM('photo', 'video', 'training-video', 'promo', 'webinar', 'simulation', 'infographic');
  CREATE TYPE "public"."enum__gallery_albums_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__gallery_albums_v_published_locale" AS ENUM('tr', 'en', 'ru');
  CREATE TYPE "public"."enum_media_media_type" AS ENUM('photo', 'video', 'infographic', 'screenshot', 'logo', 'document');
  CREATE TYPE "public"."enum_document_files_language" AS ENUM('tr', 'en', 'ru');
  CREATE TYPE "public"."enum_document_files_document_type" AS ENUM('programme', 'announcement-annex', 'form', 'guide', 'report', 'legal', 'other');
  CREATE TYPE "public"."enum_document_files_access_level" AS ENUM('public', 'staff', 'participants', 'trainers', 'internal');
  CREATE TYPE "public"."enum_document_files_license" AS ENUM('cc-by', 'cc-by-sa', 'cc-by-nc', 'cc-by-nc-nd', 'cc0', 'institutional', 'all-rights-reserved');
  CREATE TYPE "public"."enum_projects_focus_countries" AS ENUM('TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'OTHER');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__projects_v_version_focus_countries" AS ENUM('TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'OTHER');
  CREATE TYPE "public"."enum__projects_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__projects_v_published_locale" AS ENUM('tr', 'en', 'ru');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'editor', 'author', 'viewer');
  CREATE TYPE "public"."enum_users_preferred_admin_language" AS ENUM('tr', 'en', 'ru');
  CREATE TYPE "public"."enum_forms_confirmation_type" AS ENUM('message', 'redirect');
  CREATE TYPE "public"."enum_redirects_to_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_navigation_main_menu_children_type" AS ENUM('page', 'route', 'library', 'portal', 'external', 'anchor');
  CREATE TYPE "public"."enum_navigation_main_menu_children_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  CREATE TYPE "public"."enum_navigation_main_menu_type" AS ENUM('page', 'route', 'library', 'portal', 'external', 'anchor');
  CREATE TYPE "public"."enum_navigation_main_menu_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  CREATE TYPE "public"."enum_navigation_footer_columns_links_type" AS ENUM('page', 'route', 'library', 'portal', 'external', 'anchor');
  CREATE TYPE "public"."enum_navigation_footer_columns_links_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  CREATE TYPE "public"."enum_navigation_footer_legal_links_type" AS ENUM('page', 'route', 'library', 'portal', 'external', 'anchor');
  CREATE TYPE "public"."enum_navigation_footer_legal_links_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  CREATE TYPE "public"."enum_navigation_quick_access_type" AS ENUM('page', 'route', 'library', 'portal', 'external', 'anchor');
  CREATE TYPE "public"."enum_navigation_quick_access_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  CREATE TYPE "public"."enum__navigation_v_version_main_menu_children_type" AS ENUM('page', 'route', 'library', 'portal', 'external', 'anchor');
  CREATE TYPE "public"."enum__navigation_v_version_main_menu_children_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  CREATE TYPE "public"."enum__navigation_v_version_main_menu_type" AS ENUM('page', 'route', 'library', 'portal', 'external', 'anchor');
  CREATE TYPE "public"."enum__navigation_v_version_main_menu_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  CREATE TYPE "public"."enum__navigation_v_version_footer_columns_links_type" AS ENUM('page', 'route', 'library', 'portal', 'external', 'anchor');
  CREATE TYPE "public"."enum__navigation_v_version_footer_columns_links_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  CREATE TYPE "public"."enum__navigation_v_version_footer_legal_links_type" AS ENUM('page', 'route', 'library', 'portal', 'external', 'anchor');
  CREATE TYPE "public"."enum__navigation_v_version_footer_legal_links_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  CREATE TYPE "public"."enum__navigation_v_version_quick_access_type" AS ENUM('page', 'route', 'library', 'portal', 'external', 'anchor');
  CREATE TYPE "public"."enum__navigation_v_version_quick_access_route" AS ENUM('training-topics', 'training-programs', 'training-calendar', 'simulation-centre', 'news', 'gallery', 'international-guide', 'projects', 'contact', 'search');
  CREATE TYPE "public"."enum_external_services_library_status" AS ENUM('live', 'coming-soon', 'maintenance', 'hidden');
  CREATE TYPE "public"."enum_external_services_portal_status" AS ENUM('live', 'coming-soon', 'maintenance', 'hidden');
  CREATE TYPE "public"."enum__external_services_v_version_library_status" AS ENUM('live', 'coming-soon', 'maintenance', 'hidden');
  CREATE TYPE "public"."enum__external_services_v_version_portal_status" AS ENUM('live', 'coming-soon', 'maintenance', 'hidden');
  CREATE TYPE "public"."enum_simulation_center_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__simulation_center_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__simulation_center_v_published_locale" AS ENUM('tr', 'en', 'ru');
  CREATE TABLE "training_topics_learning_outcomes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "training_topics_level" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_training_topics_level",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "training_topics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" numeric DEFAULT 100,
  	"featured" boolean DEFAULT false,
  	"translation_status" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"category" "enum_training_topics_category",
  	"icon_id" integer,
  	"cover_image_id" integer,
  	"uses_simulation" boolean DEFAULT false,
  	"library_subject_key" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_training_topics_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "training_topics_locales" (
  	"slug" varchar,
  	"title" varchar,
  	"summary" varchar,
  	"description" jsonb,
  	"target_audience" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "training_topics_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar,
  	"locale" "_locales"
  );
  
  CREATE TABLE "training_topics_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"simulation_systems_id" integer
  );
  
  CREATE TABLE "_training_topics_v_version_learning_outcomes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_training_topics_v_version_level" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__training_topics_v_version_level",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_training_topics_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_order" numeric DEFAULT 100,
  	"version_featured" boolean DEFAULT false,
  	"version_translation_status" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_category" "enum__training_topics_v_version_category",
  	"version_icon_id" integer,
  	"version_cover_image_id" integer,
  	"version_uses_simulation" boolean DEFAULT false,
  	"version_library_subject_key" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__training_topics_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__training_topics_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_training_topics_v_locales" (
  	"version_slug" varchar,
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_description" jsonb,
  	"version_target_audience" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_training_topics_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar,
  	"locale" "_locales"
  );
  
  CREATE TABLE "_training_topics_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"simulation_systems_id" integer
  );
  
  CREATE TABLE "training_programs_instruction_languages" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_training_programs_instruction_languages",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "training_programs_participant_countries" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_training_programs_participant_countries",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "training_programs_learning_outcomes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "training_programs_schedule_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"time" varchar,
  	"title" varchar,
  	"type" "enum_training_programs_schedule_sessions_type" DEFAULT 'theory',
  	"trainer" varchar
  );
  
  CREATE TABLE "training_programs_schedule" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day_label" varchar
  );
  
  CREATE TABLE "training_programs_trainers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"organization" varchar,
  	"photo_id" integer
  );
  
  CREATE TABLE "training_programs_trainers_locales" (
  	"title_and_role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "training_programs_issuing_bodies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer
  );
  
  CREATE TABLE "training_programs_issuing_bodies_locales" (
  	"name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "training_programs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "program_status" DEFAULT 'planned',
  	"featured" boolean DEFAULT false,
  	"translation_status" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"code" varchar,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"duration_days" numeric,
  	"duration_hours" numeric,
  	"delivery_mode" "enum_training_programs_delivery_mode" DEFAULT 'in-person',
  	"level" "enum_training_programs_level",
  	"quota" numeric,
  	"application_deadline" timestamp(3) with time zone,
  	"application_target_type" "enum_training_programs_application_target_type" DEFAULT 'contact',
  	"application_target_url" varchar,
  	"application_target_portal_path" varchar DEFAULT '/basvuru',
  	"application_target_email" varchar,
  	"uses_simulation" boolean DEFAULT false,
  	"has_field_exercise" boolean DEFAULT false,
  	"certificate_type" "enum_training_programs_certificate_type" DEFAULT 'attendance',
  	"library_collection_key" varchar,
  	"results_participant_count" numeric,
  	"results_video_url" varchar,
  	"results_had_certificate_ceremony" boolean DEFAULT false,
  	"cover_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_training_programs_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "training_programs_locales" (
  	"slug" varchar,
  	"title" varchar,
  	"summary" varchar,
  	"venue" varchar,
  	"target_audience" varchar,
  	"application_requirements" jsonb,
  	"application_target_contact_unit" varchar,
  	"objective" jsonb,
  	"assessment_method" jsonb,
  	"certificate_conditions" jsonb,
  	"results_summary" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "training_programs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"training_topics_id" integer,
  	"simulation_systems_id" integer,
  	"document_files_id" integer,
  	"media_id" integer,
  	"news_id" integer
  );
  
  CREATE TABLE "_training_programs_v_version_instruction_languages" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__training_programs_v_version_instruction_languages",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_training_programs_v_version_participant_countries" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__training_programs_v_version_participant_countries",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_training_programs_v_version_learning_outcomes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_training_programs_v_version_schedule_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"time" varchar,
  	"title" varchar,
  	"type" "enum__training_programs_v_version_schedule_sessions_type" DEFAULT 'theory',
  	"trainer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_training_programs_v_version_schedule" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"day_label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_training_programs_v_version_trainers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"organization" varchar,
  	"photo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_training_programs_v_version_trainers_locales" (
  	"title_and_role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_training_programs_v_version_issuing_bodies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_training_programs_v_version_issuing_bodies_locales" (
  	"name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_training_programs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_status" "program_status" DEFAULT 'planned',
  	"version_featured" boolean DEFAULT false,
  	"version_translation_status" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_code" varchar,
  	"version_start_date" timestamp(3) with time zone,
  	"version_end_date" timestamp(3) with time zone,
  	"version_duration_days" numeric,
  	"version_duration_hours" numeric,
  	"version_delivery_mode" "enum__training_programs_v_version_delivery_mode" DEFAULT 'in-person',
  	"version_level" "enum__training_programs_v_version_level",
  	"version_quota" numeric,
  	"version_application_deadline" timestamp(3) with time zone,
  	"version_application_target_type" "enum__training_programs_v_version_application_target_type" DEFAULT 'contact',
  	"version_application_target_url" varchar,
  	"version_application_target_portal_path" varchar DEFAULT '/basvuru',
  	"version_application_target_email" varchar,
  	"version_uses_simulation" boolean DEFAULT false,
  	"version_has_field_exercise" boolean DEFAULT false,
  	"version_certificate_type" "enum__training_programs_v_version_certificate_type" DEFAULT 'attendance',
  	"version_library_collection_key" varchar,
  	"version_results_participant_count" numeric,
  	"version_results_video_url" varchar,
  	"version_results_had_certificate_ceremony" boolean DEFAULT false,
  	"version_cover_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__training_programs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__training_programs_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_training_programs_v_locales" (
  	"version_slug" varchar,
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_venue" varchar,
  	"version_target_audience" varchar,
  	"version_application_requirements" jsonb,
  	"version_application_target_contact_unit" varchar,
  	"version_objective" jsonb,
  	"version_assessment_method" jsonb,
  	"version_certificate_conditions" jsonb,
  	"version_results_summary" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_training_programs_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"training_topics_id" integer,
  	"simulation_systems_id" integer,
  	"document_files_id" integer,
  	"media_id" integer,
  	"news_id" integer
  );
  
  CREATE TABLE "simulation_systems_use_cases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "simulation_systems_technical_specs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar
  );
  
  CREATE TABLE "simulation_systems_access_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"audience" "enum_simulation_systems_access_links_audience" DEFAULT 'trainer',
  	"url" varchar
  );
  
  CREATE TABLE "simulation_systems_access_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "simulation_systems_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"poster_id" integer,
  	"captions_url" varchar
  );
  
  CREATE TABLE "simulation_systems_videos_locales" (
  	"title" varchar,
  	"transcript" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "simulation_systems" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" numeric DEFAULT 100,
  	"translation_status" jsonb,
  	"short_code" varchar,
  	"capacity" numeric,
  	"supports_remote" boolean DEFAULT false,
  	"cover_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_simulation_systems_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "simulation_systems_locales" (
  	"slug" varchar,
  	"title" varchar,
  	"summary" varchar,
  	"description" jsonb,
  	"benefits_for_international" jsonb,
  	"usage_in_training" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "simulation_systems_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"training_topics_id" integer
  );
  
  CREATE TABLE "_simulation_systems_v_version_use_cases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_simulation_systems_v_version_technical_specs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_simulation_systems_v_version_access_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"audience" "enum__simulation_systems_v_version_access_links_audience" DEFAULT 'trainer',
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_simulation_systems_v_version_access_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_simulation_systems_v_version_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"poster_id" integer,
  	"captions_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_simulation_systems_v_version_videos_locales" (
  	"title" varchar,
  	"transcript" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_simulation_systems_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_order" numeric DEFAULT 100,
  	"version_translation_status" jsonb,
  	"version_short_code" varchar,
  	"version_capacity" numeric,
  	"version_supports_remote" boolean DEFAULT false,
  	"version_cover_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__simulation_systems_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__simulation_systems_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_simulation_systems_v_locales" (
  	"version_slug" varchar,
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_description" jsonb,
  	"version_benefits_for_international" jsonb,
  	"version_usage_in_training" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_simulation_systems_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"training_topics_id" integer
  );
  
  CREATE TABLE "news_countries" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_news_countries",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "news" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_news_kind" DEFAULT 'news',
  	"category" "enum_news_category",
  	"featured" boolean DEFAULT false,
  	"expires_at" timestamp(3) with time zone,
  	"translation_status" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"cover_image_id" integer,
  	"video_url" varchar,
  	"is_project_output" boolean DEFAULT false,
  	"project_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_news_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "news_locales" (
  	"slug" varchar,
  	"title" varchar,
  	"summary" varchar,
  	"content" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "news_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"training_programs_id" integer,
  	"training_topics_id" integer,
  	"document_files_id" integer
  );
  
  CREATE TABLE "_news_v_version_countries" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__news_v_version_countries",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_news_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_kind" "enum__news_v_version_kind" DEFAULT 'news',
  	"version_category" "enum__news_v_version_category",
  	"version_featured" boolean DEFAULT false,
  	"version_expires_at" timestamp(3) with time zone,
  	"version_translation_status" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_cover_image_id" integer,
  	"version_video_url" varchar,
  	"version_is_project_output" boolean DEFAULT false,
  	"version_project_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__news_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__news_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_news_v_locales" (
  	"version_slug" varchar,
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_content" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_news_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"training_programs_id" integer,
  	"training_topics_id" integer,
  	"document_files_id" integer
  );
  
  CREATE TABLE "international_guide_countries" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_international_guide_countries",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "international_guide_country_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"country" "enum_international_guide_country_notes_country"
  );
  
  CREATE TABLE "international_guide_country_notes_locales" (
  	"note" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "international_guide_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"is_external" boolean DEFAULT true
  );
  
  CREATE TABLE "international_guide_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "international_guide" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" numeric DEFAULT 100,
  	"translation_status" jsonb,
  	"section_key" "enum_international_guide_section_key",
  	"image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_international_guide_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "international_guide_locales" (
  	"slug" varchar,
  	"title" varchar,
  	"summary" varchar,
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "international_guide_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"document_files_id" integer,
  	"faqs_id" integer
  );
  
  CREATE TABLE "_international_guide_v_version_countries" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__international_guide_v_version_countries",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_international_guide_v_version_country_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"country" "enum__international_guide_v_version_country_notes_country",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_international_guide_v_version_country_notes_locales" (
  	"note" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_international_guide_v_version_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"is_external" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_international_guide_v_version_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_international_guide_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_order" numeric DEFAULT 100,
  	"version_translation_status" jsonb,
  	"version_section_key" "enum__international_guide_v_version_section_key",
  	"version_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__international_guide_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__international_guide_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_international_guide_v_locales" (
  	"version_slug" varchar,
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_international_guide_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"document_files_id" integer,
  	"faqs_id" integer
  );
  
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"group" "enum_faqs_group" DEFAULT 'applications',
  	"order" numeric DEFAULT 100,
  	"translation_status" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_faqs_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "faqs_locales" (
  	"question" varchar,
  	"answer" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_faqs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_group" "enum__faqs_v_version_group" DEFAULT 'applications',
  	"version_order" numeric DEFAULT 100,
  	"version_translation_status" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__faqs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__faqs_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_faqs_v_locales" (
  	"version_question" varchar,
  	"version_answer" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_media_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"caption" varchar,
  	"width" "enum_pages_blocks_media_block_width" DEFAULT 'container',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_stats_block_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "pages_blocks_stats_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_people_block_people" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"unit" varchar,
  	"photo_id" integer
  );
  
  CREATE TABLE "pages_blocks_people_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_partners_block_partners" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"logo_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "pages_blocks_partners_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_timeline_block_entries" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"year" varchar,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "pages_blocks_timeline_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cta_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"text" varchar,
  	"target" "enum_pages_blocks_cta_block_target" DEFAULT 'internal',
  	"href" varchar,
  	"button_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_faq_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_contact_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"show_map" boolean DEFAULT true,
  	"show_form" boolean DEFAULT true,
  	"form_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"page_type" "enum_pages_page_type" DEFAULT 'standard',
  	"parent_id" integer,
  	"translation_status" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"hero_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pages_locales" (
  	"slug" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"locale" "_locales",
  	"faqs_id" integer
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_media_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"caption" varchar,
  	"width" "enum__pages_v_blocks_media_block_width" DEFAULT 'container',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_stats_block_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_stats_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_people_block_people" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"unit" varchar,
  	"photo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_people_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_partners_block_partners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"logo_id" integer,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_partners_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_timeline_block_entries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"year" varchar,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_timeline_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"text" varchar,
  	"target" "enum__pages_v_blocks_cta_block_target" DEFAULT 'internal',
  	"href" varchar,
  	"button_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_contact_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"show_map" boolean DEFAULT true,
  	"show_form" boolean DEFAULT true,
  	"form_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_page_type" "enum__pages_v_version_page_type" DEFAULT 'standard',
  	"version_parent_id" integer,
  	"version_translation_status" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_hero_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__pages_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_pages_v_locales" (
  	"version_slug" varchar,
  	"version_title" varchar,
  	"version_subtitle" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"locale" "_locales",
  	"faqs_id" integer
  );
  
  CREATE TABLE "gallery_albums_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"poster_id" integer,
  	"duration_seconds" numeric,
  	"captions_url" varchar
  );
  
  CREATE TABLE "gallery_albums_videos_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "gallery_albums" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"album_type" "enum_gallery_albums_album_type" DEFAULT 'photo',
  	"date" timestamp(3) with time zone,
  	"translation_status" jsonb,
  	"cover_image_id" integer,
  	"related_training_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_gallery_albums_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "gallery_albums_locales" (
  	"slug" varchar,
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "gallery_albums_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_gallery_albums_v_version_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"poster_id" integer,
  	"duration_seconds" numeric,
  	"captions_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_gallery_albums_v_version_videos_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_gallery_albums_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_album_type" "enum__gallery_albums_v_version_album_type" DEFAULT 'photo',
  	"version_date" timestamp(3) with time zone,
  	"version_translation_status" jsonb,
  	"version_cover_image_id" integer,
  	"version_related_training_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__gallery_albums_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__gallery_albums_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_gallery_albums_v_locales" (
  	"version_slug" varchar,
  	"version_title" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_gallery_albums_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"credit" varchar,
  	"media_type" "enum_media_media_type" DEFAULT 'photo',
  	"is_decorative" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "document_files_language" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_document_files_language",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "document_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"document_type" "enum_document_files_document_type" DEFAULT 'other' NOT NULL,
  	"version" varchar DEFAULT '1.0',
  	"access_level" "enum_document_files_access_level" DEFAULT 'public' NOT NULL,
  	"is_archived" boolean DEFAULT false,
  	"license" "enum_document_files_license",
  	"copyright_holder" varchar,
  	"human_file_size" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "document_files_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "projects_partners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "projects_partners_locales" (
  	"name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_focus_countries" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_projects_focus_countries",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"is_primary" boolean DEFAULT false,
  	"translation_status" jsonb,
  	"symbol" varchar,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"external_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_projects_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "projects_locales" (
  	"slug" varchar,
  	"title" varchar,
  	"national_counterpart" varchar DEFAULT 'Tarım ve Orman Bakanlığı, Orman Genel Müdürlüğü',
  	"objective" jsonb,
  	"capacity_statement" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "projects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_projects_v_version_partners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_partners_locales" (
  	"name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_projects_v_version_focus_countries" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__projects_v_version_focus_countries",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_projects_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_is_primary" boolean DEFAULT false,
  	"version_translation_status" jsonb,
  	"version_symbol" varchar,
  	"version_start_date" timestamp(3) with time zone,
  	"version_end_date" timestamp(3) with time zone,
  	"version_external_url" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__projects_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__projects_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_projects_v_locales" (
  	"version_slug" varchar,
  	"version_title" varchar,
  	"version_national_counterpart" varchar DEFAULT 'Tarım ve Orman Bakanlığı, Orman Genel Müdürlüğü',
  	"version_objective" jsonb,
  	"version_capacity_statement" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_projects_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"unit" varchar,
  	"preferred_admin_language" "enum_users_preferred_admin_language" DEFAULT 'tr',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "search_index" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"priority" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "search_index_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "search_index_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"training_programs_id" integer,
  	"training_topics_id" integer,
  	"news_id" integer,
  	"simulation_systems_id" integer,
  	"faqs_id" integer
  );
  
  CREATE TABLE "forms_blocks_checkbox" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"width" numeric,
  	"required" boolean,
  	"default_value" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_checkbox_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "forms_blocks_country" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"width" numeric,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_country_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "forms_blocks_email" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"width" numeric,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_email_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "forms_blocks_message" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_message_locales" (
  	"message" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "forms_blocks_number" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"width" numeric,
  	"default_value" numeric,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_number_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "forms_blocks_select_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "forms_blocks_select_options_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "forms_blocks_select" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"width" numeric,
  	"placeholder" varchar,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_select_locales" (
  	"label" varchar,
  	"default_value" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "forms_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"width" numeric,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_text_locales" (
  	"label" varchar,
  	"default_value" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "forms_blocks_textarea" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"width" numeric,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_textarea_locales" (
  	"label" varchar,
  	"default_value" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "forms_emails" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email_to" varchar,
  	"cc" varchar,
  	"bcc" varchar,
  	"reply_to" varchar,
  	"email_from" varchar
  );
  
  CREATE TABLE "forms_emails_locales" (
  	"subject" varchar DEFAULT 'You''ve received a new message.' NOT NULL,
  	"message" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "forms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"confirmation_type" "enum_forms_confirmation_type" DEFAULT 'message',
  	"redirect_url" varchar,
  	"retention_days" numeric DEFAULT 180,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "forms_locales" (
  	"submit_button_label" varchar,
  	"confirmation_message" jsonb,
  	"consent_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "form_submissions_submission_data" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "form_submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"form_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to_type" "enum_redirects_to_type" DEFAULT 'reference',
  	"to_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "redirects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"news_id" integer,
  	"training_programs_id" integer
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"training_topics_id" integer,
  	"training_programs_id" integer,
  	"simulation_systems_id" integer,
  	"news_id" integer,
  	"international_guide_id" integer,
  	"faqs_id" integer,
  	"pages_id" integer,
  	"gallery_albums_id" integer,
  	"media_id" integer,
  	"document_files_id" integer,
  	"projects_id" integer,
  	"users_id" integer,
  	"search_index_id" integer,
  	"forms_id" integer,
  	"form_submissions_id" integer,
  	"redirects_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_logos_partner_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"image_id" integer NOT NULL,
  	"url" varchar,
  	"order" numeric DEFAULT 100
  );
  
  CREATE TABLE "site_settings_contact_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_short_name" varchar DEFAULT 'AIFTC',
  	"logos_primary_id" integer,
  	"logos_primary_dark_id" integer,
  	"logos_favicon_id" integer,
  	"logos_og_image_id" integer,
  	"contact_phone" varchar,
  	"contact_fax" varchar,
  	"contact_email" varchar,
  	"contact_training_email" varchar,
  	"contact_map_latitude" numeric,
  	"contact_map_longitude" numeric,
  	"contact_map_static_map_image_id" integer,
  	"primary_project_id" integer,
  	"cookie_banner_enabled" boolean DEFAULT true,
  	"cookie_banner_policy_page_id" integer,
  	"cookie_banner_allow_preference_management" boolean DEFAULT true,
  	"privacy_notice_page_id" integer,
  	"accessibility_statement_page_id" integer,
  	"analytics_enabled" boolean DEFAULT false,
  	"analytics_anonymize_ip" boolean DEFAULT true,
  	"analytics_requires_consent" boolean DEFAULT true,
  	"maintenance_mode_enabled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"site_name" varchar DEFAULT 'Antalya Uluslararası Ormancılık Eğitim Merkezi' NOT NULL,
  	"tagline" varchar,
  	"default_description" varchar,
  	"contact_organization_name" varchar,
  	"contact_address" varchar,
  	"contact_map_directions" jsonb,
  	"visibility_statement" jsonb,
  	"cookie_banner_text" varchar,
  	"maintenance_mode_message" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_site_settings_v_version_logos_partner_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"image_id" integer NOT NULL,
  	"url" varchar,
  	"order" numeric DEFAULT 100,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_contact_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"platform" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_site_short_name" varchar DEFAULT 'AIFTC',
  	"version_logos_primary_id" integer,
  	"version_logos_primary_dark_id" integer,
  	"version_logos_favicon_id" integer,
  	"version_logos_og_image_id" integer,
  	"version_contact_phone" varchar,
  	"version_contact_fax" varchar,
  	"version_contact_email" varchar,
  	"version_contact_training_email" varchar,
  	"version_contact_map_latitude" numeric,
  	"version_contact_map_longitude" numeric,
  	"version_contact_map_static_map_image_id" integer,
  	"version_primary_project_id" integer,
  	"version_cookie_banner_enabled" boolean DEFAULT true,
  	"version_cookie_banner_policy_page_id" integer,
  	"version_cookie_banner_allow_preference_management" boolean DEFAULT true,
  	"version_privacy_notice_page_id" integer,
  	"version_accessibility_statement_page_id" integer,
  	"version_analytics_enabled" boolean DEFAULT false,
  	"version_analytics_anonymize_ip" boolean DEFAULT true,
  	"version_analytics_requires_consent" boolean DEFAULT true,
  	"version_maintenance_mode_enabled" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_site_settings_v_locales" (
  	"version_site_name" varchar DEFAULT 'Antalya Uluslararası Ormancılık Eğitim Merkezi' NOT NULL,
  	"version_tagline" varchar,
  	"version_default_description" varchar,
  	"version_contact_organization_name" varchar,
  	"version_contact_address" varchar,
  	"version_contact_map_directions" jsonb,
  	"version_visibility_statement" jsonb,
  	"version_cookie_banner_text" varchar,
  	"version_maintenance_mode_message" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "navigation_main_menu_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_navigation_main_menu_children_type" DEFAULT 'page' NOT NULL,
  	"page_id" integer,
  	"route" "enum_navigation_main_menu_children_route",
  	"path" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "navigation_main_menu_children_locales" (
  	"label" varchar NOT NULL,
  	"aria_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_main_menu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_navigation_main_menu_type" DEFAULT 'page' NOT NULL,
  	"page_id" integer,
  	"route" "enum_navigation_main_menu_route",
  	"path" varchar,
  	"url" varchar,
  	"highlight" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation_main_menu_locales" (
  	"label" varchar NOT NULL,
  	"aria_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_navigation_footer_columns_links_type" DEFAULT 'page' NOT NULL,
  	"page_id" integer,
  	"route" "enum_navigation_footer_columns_links_route",
  	"path" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "navigation_footer_columns_links_locales" (
  	"label" varchar NOT NULL,
  	"aria_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "navigation_footer_columns_locales" (
  	"heading" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer_legal_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_navigation_footer_legal_links_type" DEFAULT 'page' NOT NULL,
  	"page_id" integer,
  	"route" "enum_navigation_footer_legal_links_route",
  	"path" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "navigation_footer_legal_links_locales" (
  	"label" varchar NOT NULL,
  	"aria_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_quick_access" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_navigation_quick_access_type" DEFAULT 'page' NOT NULL,
  	"page_id" integer,
  	"route" "enum_navigation_quick_access_route",
  	"path" varchar,
  	"url" varchar,
  	"icon_id" integer
  );
  
  CREATE TABLE "navigation_quick_access_locales" (
  	"label" varchar NOT NULL,
  	"aria_label" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_navigation_v_version_main_menu_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__navigation_v_version_main_menu_children_type" DEFAULT 'page' NOT NULL,
  	"page_id" integer,
  	"route" "enum__navigation_v_version_main_menu_children_route",
  	"path" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v_version_main_menu_children_locales" (
  	"label" varchar NOT NULL,
  	"aria_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_navigation_v_version_main_menu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__navigation_v_version_main_menu_type" DEFAULT 'page' NOT NULL,
  	"page_id" integer,
  	"route" "enum__navigation_v_version_main_menu_route",
  	"path" varchar,
  	"url" varchar,
  	"highlight" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v_version_main_menu_locales" (
  	"label" varchar NOT NULL,
  	"aria_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_navigation_v_version_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__navigation_v_version_footer_columns_links_type" DEFAULT 'page' NOT NULL,
  	"page_id" integer,
  	"route" "enum__navigation_v_version_footer_columns_links_route",
  	"path" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v_version_footer_columns_links_locales" (
  	"label" varchar NOT NULL,
  	"aria_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_navigation_v_version_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v_version_footer_columns_locales" (
  	"heading" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_navigation_v_version_footer_legal_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__navigation_v_version_footer_legal_links_type" DEFAULT 'page' NOT NULL,
  	"page_id" integer,
  	"route" "enum__navigation_v_version_footer_legal_links_route",
  	"path" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v_version_footer_legal_links_locales" (
  	"label" varchar NOT NULL,
  	"aria_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_navigation_v_version_quick_access" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__navigation_v_version_quick_access_type" DEFAULT 'page' NOT NULL,
  	"page_id" integer,
  	"route" "enum__navigation_v_version_quick_access_route",
  	"path" varchar,
  	"url" varchar,
  	"icon_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v_version_quick_access_locales" (
  	"label" varchar NOT NULL,
  	"aria_label" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_navigation_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "feat_cols" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"path" varchar NOT NULL,
  	"icon_id" integer
  );
  
  CREATE TABLE "feat_cols_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "external_services_additional" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "external_services_additional_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "external_services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"library_status" "enum_external_services_library_status" DEFAULT 'coming-soon' NOT NULL,
  	"library_base_url" varchar DEFAULT 'https://kutuphane.aiftc.org' NOT NULL,
  	"library_search_path_template" varchar DEFAULT '/search?lang={locale}',
  	"library_subject_path_template" varchar DEFAULT '/search?subject={subject}&lang={locale}',
  	"library_training_materials_path_template" varchar DEFAULT '/collections/{trainingCode}?lang={locale}',
  	"library_open_in_new_tab" boolean DEFAULT true,
  	"library_track_clicks" boolean DEFAULT true,
  	"portal_status" "enum_external_services_portal_status" DEFAULT 'coming-soon' NOT NULL,
  	"portal_base_url" varchar DEFAULT 'https://portal.aiftc.org' NOT NULL,
  	"portal_login_path" varchar DEFAULT '/login',
  	"portal_application_path" varchar DEFAULT '/basvuru',
  	"portal_certificate_verify_path" varchar DEFAULT '/dogrulama',
  	"portal_show_staff_login_in_header" boolean DEFAULT true,
  	"virtual_classroom_enabled" boolean DEFAULT false,
  	"virtual_classroom_base_url" varchar,
  	"ogm_url" varchar DEFAULT 'https://www.ogm.gov.tr',
  	"ogm_legacy_page_url" varchar DEFAULT 'https://www.ogm.gov.tr/sfm',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "external_services_locales" (
  	"library_label" varchar DEFAULT 'Dijital Kütüphane' NOT NULL,
  	"library_notice" varchar,
  	"virtual_classroom_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_feat_cols_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"path" varchar NOT NULL,
  	"icon_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_feat_cols_v_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_external_services_v_version_additional" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_external_services_v_version_additional_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_external_services_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_library_status" "enum__external_services_v_version_library_status" DEFAULT 'coming-soon' NOT NULL,
  	"version_library_base_url" varchar DEFAULT 'https://kutuphane.aiftc.org' NOT NULL,
  	"version_library_search_path_template" varchar DEFAULT '/search?lang={locale}',
  	"version_library_subject_path_template" varchar DEFAULT '/search?subject={subject}&lang={locale}',
  	"version_library_training_materials_path_template" varchar DEFAULT '/collections/{trainingCode}?lang={locale}',
  	"version_library_open_in_new_tab" boolean DEFAULT true,
  	"version_library_track_clicks" boolean DEFAULT true,
  	"version_portal_status" "enum__external_services_v_version_portal_status" DEFAULT 'coming-soon' NOT NULL,
  	"version_portal_base_url" varchar DEFAULT 'https://portal.aiftc.org' NOT NULL,
  	"version_portal_login_path" varchar DEFAULT '/login',
  	"version_portal_application_path" varchar DEFAULT '/basvuru',
  	"version_portal_certificate_verify_path" varchar DEFAULT '/dogrulama',
  	"version_portal_show_staff_login_in_header" boolean DEFAULT true,
  	"version_virtual_classroom_enabled" boolean DEFAULT false,
  	"version_virtual_classroom_base_url" varchar,
  	"version_ogm_url" varchar DEFAULT 'https://www.ogm.gov.tr',
  	"version_ogm_legacy_page_url" varchar DEFAULT 'https://www.ogm.gov.tr/sfm',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_external_services_v_locales" (
  	"version_library_label" varchar DEFAULT 'Dijital Kütüphane' NOT NULL,
  	"version_library_notice" varchar,
  	"version_virtual_classroom_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "simulation_center_capacity_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "simulation_center" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_image_id" integer,
  	"intro_video_url" varchar,
  	"intro_video_poster_id" integer,
  	"intro_video_captions_url" varchar,
  	"cdn_enabled" boolean DEFAULT false,
  	"cdn_base_url" varchar,
  	"_status" "enum_simulation_center_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "simulation_center_locales" (
  	"title" varchar DEFAULT 'Simülasyon Merkezi',
  	"purpose" jsonb,
  	"role_in_fire_training" jsonb,
  	"relation_to_training" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_simulation_center_v_version_capacity_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_simulation_center_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_image_id" integer,
  	"version_intro_video_url" varchar,
  	"version_intro_video_poster_id" integer,
  	"version_intro_video_captions_url" varchar,
  	"version_cdn_enabled" boolean DEFAULT false,
  	"version_cdn_base_url" varchar,
  	"version__status" "enum__simulation_center_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__simulation_center_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_simulation_center_v_locales" (
  	"version_title" varchar DEFAULT 'Simülasyon Merkezi',
  	"version_purpose" jsonb,
  	"version_role_in_fire_training" jsonb,
  	"version_relation_to_training" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "training_topics_learning_outcomes" ADD CONSTRAINT "training_topics_learning_outcomes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."training_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_topics_level" ADD CONSTRAINT "training_topics_level_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."training_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_topics" ADD CONSTRAINT "training_topics_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "training_topics" ADD CONSTRAINT "training_topics_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "training_topics_locales" ADD CONSTRAINT "training_topics_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "training_topics_locales" ADD CONSTRAINT "training_topics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."training_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_topics_texts" ADD CONSTRAINT "training_topics_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."training_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_topics_rels" ADD CONSTRAINT "training_topics_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."training_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_topics_rels" ADD CONSTRAINT "training_topics_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_topics_rels" ADD CONSTRAINT "training_topics_rels_simulation_systems_fk" FOREIGN KEY ("simulation_systems_id") REFERENCES "public"."simulation_systems"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_topics_v_version_learning_outcomes" ADD CONSTRAINT "_training_topics_v_version_learning_outcomes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_training_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_topics_v_version_level" ADD CONSTRAINT "_training_topics_v_version_level_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_training_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_topics_v" ADD CONSTRAINT "_training_topics_v_parent_id_training_topics_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."training_topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_training_topics_v" ADD CONSTRAINT "_training_topics_v_version_icon_id_media_id_fk" FOREIGN KEY ("version_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_training_topics_v" ADD CONSTRAINT "_training_topics_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_training_topics_v_locales" ADD CONSTRAINT "_training_topics_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_training_topics_v_locales" ADD CONSTRAINT "_training_topics_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_training_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_topics_v_texts" ADD CONSTRAINT "_training_topics_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_training_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_topics_v_rels" ADD CONSTRAINT "_training_topics_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_training_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_topics_v_rels" ADD CONSTRAINT "_training_topics_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_topics_v_rels" ADD CONSTRAINT "_training_topics_v_rels_simulation_systems_fk" FOREIGN KEY ("simulation_systems_id") REFERENCES "public"."simulation_systems"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_programs_instruction_languages" ADD CONSTRAINT "training_programs_instruction_languages_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_programs_participant_countries" ADD CONSTRAINT "training_programs_participant_countries_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_programs_learning_outcomes" ADD CONSTRAINT "training_programs_learning_outcomes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_programs_schedule_sessions" ADD CONSTRAINT "training_programs_schedule_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."training_programs_schedule"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_programs_schedule" ADD CONSTRAINT "training_programs_schedule_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_programs_trainers" ADD CONSTRAINT "training_programs_trainers_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "training_programs_trainers" ADD CONSTRAINT "training_programs_trainers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_programs_trainers_locales" ADD CONSTRAINT "training_programs_trainers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."training_programs_trainers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_programs_issuing_bodies" ADD CONSTRAINT "training_programs_issuing_bodies_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "training_programs_issuing_bodies" ADD CONSTRAINT "training_programs_issuing_bodies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_programs_issuing_bodies_locales" ADD CONSTRAINT "training_programs_issuing_bodies_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."training_programs_issuing_bodies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_programs" ADD CONSTRAINT "training_programs_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "training_programs_locales" ADD CONSTRAINT "training_programs_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "training_programs_locales" ADD CONSTRAINT "training_programs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_programs_rels" ADD CONSTRAINT "training_programs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_programs_rels" ADD CONSTRAINT "training_programs_rels_training_topics_fk" FOREIGN KEY ("training_topics_id") REFERENCES "public"."training_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_programs_rels" ADD CONSTRAINT "training_programs_rels_simulation_systems_fk" FOREIGN KEY ("simulation_systems_id") REFERENCES "public"."simulation_systems"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_programs_rels" ADD CONSTRAINT "training_programs_rels_document_files_fk" FOREIGN KEY ("document_files_id") REFERENCES "public"."document_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_programs_rels" ADD CONSTRAINT "training_programs_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "training_programs_rels" ADD CONSTRAINT "training_programs_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_programs_v_version_instruction_languages" ADD CONSTRAINT "_training_programs_v_version_instruction_languages_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_training_programs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_programs_v_version_participant_countries" ADD CONSTRAINT "_training_programs_v_version_participant_countries_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_training_programs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_programs_v_version_learning_outcomes" ADD CONSTRAINT "_training_programs_v_version_learning_outcomes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_training_programs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_programs_v_version_schedule_sessions" ADD CONSTRAINT "_training_programs_v_version_schedule_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_training_programs_v_version_schedule"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_programs_v_version_schedule" ADD CONSTRAINT "_training_programs_v_version_schedule_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_training_programs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_programs_v_version_trainers" ADD CONSTRAINT "_training_programs_v_version_trainers_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_training_programs_v_version_trainers" ADD CONSTRAINT "_training_programs_v_version_trainers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_training_programs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_programs_v_version_trainers_locales" ADD CONSTRAINT "_training_programs_v_version_trainers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_training_programs_v_version_trainers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_programs_v_version_issuing_bodies" ADD CONSTRAINT "_training_programs_v_version_issuing_bodies_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_training_programs_v_version_issuing_bodies" ADD CONSTRAINT "_training_programs_v_version_issuing_bodies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_training_programs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_programs_v_version_issuing_bodies_locales" ADD CONSTRAINT "_training_programs_v_version_issuing_bodies_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_training_programs_v_version_issuing_bodies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_programs_v" ADD CONSTRAINT "_training_programs_v_parent_id_training_programs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."training_programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_training_programs_v" ADD CONSTRAINT "_training_programs_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_training_programs_v_locales" ADD CONSTRAINT "_training_programs_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_training_programs_v_locales" ADD CONSTRAINT "_training_programs_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_training_programs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_programs_v_rels" ADD CONSTRAINT "_training_programs_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_training_programs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_programs_v_rels" ADD CONSTRAINT "_training_programs_v_rels_training_topics_fk" FOREIGN KEY ("training_topics_id") REFERENCES "public"."training_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_programs_v_rels" ADD CONSTRAINT "_training_programs_v_rels_simulation_systems_fk" FOREIGN KEY ("simulation_systems_id") REFERENCES "public"."simulation_systems"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_programs_v_rels" ADD CONSTRAINT "_training_programs_v_rels_document_files_fk" FOREIGN KEY ("document_files_id") REFERENCES "public"."document_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_programs_v_rels" ADD CONSTRAINT "_training_programs_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_training_programs_v_rels" ADD CONSTRAINT "_training_programs_v_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulation_systems_use_cases" ADD CONSTRAINT "simulation_systems_use_cases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulation_systems"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulation_systems_technical_specs" ADD CONSTRAINT "simulation_systems_technical_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulation_systems"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulation_systems_access_links" ADD CONSTRAINT "simulation_systems_access_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulation_systems"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulation_systems_access_links_locales" ADD CONSTRAINT "simulation_systems_access_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulation_systems_access_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulation_systems_videos" ADD CONSTRAINT "simulation_systems_videos_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "simulation_systems_videos" ADD CONSTRAINT "simulation_systems_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulation_systems"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulation_systems_videos_locales" ADD CONSTRAINT "simulation_systems_videos_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulation_systems_videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulation_systems" ADD CONSTRAINT "simulation_systems_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "simulation_systems_locales" ADD CONSTRAINT "simulation_systems_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "simulation_systems_locales" ADD CONSTRAINT "simulation_systems_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulation_systems"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulation_systems_rels" ADD CONSTRAINT "simulation_systems_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."simulation_systems"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulation_systems_rels" ADD CONSTRAINT "simulation_systems_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulation_systems_rels" ADD CONSTRAINT "simulation_systems_rels_training_topics_fk" FOREIGN KEY ("training_topics_id") REFERENCES "public"."training_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_simulation_systems_v_version_use_cases" ADD CONSTRAINT "_simulation_systems_v_version_use_cases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_simulation_systems_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_simulation_systems_v_version_technical_specs" ADD CONSTRAINT "_simulation_systems_v_version_technical_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_simulation_systems_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_simulation_systems_v_version_access_links" ADD CONSTRAINT "_simulation_systems_v_version_access_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_simulation_systems_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_simulation_systems_v_version_access_links_locales" ADD CONSTRAINT "_simulation_systems_v_version_access_links_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_simulation_systems_v_version_access_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_simulation_systems_v_version_videos" ADD CONSTRAINT "_simulation_systems_v_version_videos_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_simulation_systems_v_version_videos" ADD CONSTRAINT "_simulation_systems_v_version_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_simulation_systems_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_simulation_systems_v_version_videos_locales" ADD CONSTRAINT "_simulation_systems_v_version_videos_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_simulation_systems_v_version_videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_simulation_systems_v" ADD CONSTRAINT "_simulation_systems_v_parent_id_simulation_systems_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."simulation_systems"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_simulation_systems_v" ADD CONSTRAINT "_simulation_systems_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_simulation_systems_v_locales" ADD CONSTRAINT "_simulation_systems_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_simulation_systems_v_locales" ADD CONSTRAINT "_simulation_systems_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_simulation_systems_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_simulation_systems_v_rels" ADD CONSTRAINT "_simulation_systems_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_simulation_systems_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_simulation_systems_v_rels" ADD CONSTRAINT "_simulation_systems_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_simulation_systems_v_rels" ADD CONSTRAINT "_simulation_systems_v_rels_training_topics_fk" FOREIGN KEY ("training_topics_id") REFERENCES "public"."training_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_countries" ADD CONSTRAINT "news_countries_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_locales" ADD CONSTRAINT "news_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_locales" ADD CONSTRAINT "news_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_training_programs_fk" FOREIGN KEY ("training_programs_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_training_topics_fk" FOREIGN KEY ("training_topics_id") REFERENCES "public"."training_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_document_files_fk" FOREIGN KEY ("document_files_id") REFERENCES "public"."document_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_version_countries" ADD CONSTRAINT "_news_v_version_countries_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_parent_id_news_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_project_id_projects_id_fk" FOREIGN KEY ("version_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v_locales" ADD CONSTRAINT "_news_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v_locales" ADD CONSTRAINT "_news_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_training_programs_fk" FOREIGN KEY ("training_programs_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_training_topics_fk" FOREIGN KEY ("training_topics_id") REFERENCES "public"."training_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_document_files_fk" FOREIGN KEY ("document_files_id") REFERENCES "public"."document_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "international_guide_countries" ADD CONSTRAINT "international_guide_countries_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."international_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "international_guide_country_notes" ADD CONSTRAINT "international_guide_country_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."international_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "international_guide_country_notes_locales" ADD CONSTRAINT "international_guide_country_notes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."international_guide_country_notes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "international_guide_links" ADD CONSTRAINT "international_guide_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."international_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "international_guide_links_locales" ADD CONSTRAINT "international_guide_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."international_guide_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "international_guide" ADD CONSTRAINT "international_guide_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "international_guide_locales" ADD CONSTRAINT "international_guide_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."international_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "international_guide_rels" ADD CONSTRAINT "international_guide_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."international_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "international_guide_rels" ADD CONSTRAINT "international_guide_rels_document_files_fk" FOREIGN KEY ("document_files_id") REFERENCES "public"."document_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "international_guide_rels" ADD CONSTRAINT "international_guide_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_international_guide_v_version_countries" ADD CONSTRAINT "_international_guide_v_version_countries_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_international_guide_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_international_guide_v_version_country_notes" ADD CONSTRAINT "_international_guide_v_version_country_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_international_guide_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_international_guide_v_version_country_notes_locales" ADD CONSTRAINT "_international_guide_v_version_country_notes_locales_pare_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_international_guide_v_version_country_notes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_international_guide_v_version_links" ADD CONSTRAINT "_international_guide_v_version_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_international_guide_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_international_guide_v_version_links_locales" ADD CONSTRAINT "_international_guide_v_version_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_international_guide_v_version_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_international_guide_v" ADD CONSTRAINT "_international_guide_v_parent_id_international_guide_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."international_guide"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_international_guide_v" ADD CONSTRAINT "_international_guide_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_international_guide_v_locales" ADD CONSTRAINT "_international_guide_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_international_guide_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_international_guide_v_rels" ADD CONSTRAINT "_international_guide_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_international_guide_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_international_guide_v_rels" ADD CONSTRAINT "_international_guide_v_rels_document_files_fk" FOREIGN KEY ("document_files_id") REFERENCES "public"."document_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_international_guide_v_rels" ADD CONSTRAINT "_international_guide_v_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "faqs_locales" ADD CONSTRAINT "faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_faqs_v" ADD CONSTRAINT "_faqs_v_parent_id_faqs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."faqs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_faqs_v_locales" ADD CONSTRAINT "_faqs_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_faqs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text" ADD CONSTRAINT "pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_block" ADD CONSTRAINT "pages_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_block" ADD CONSTRAINT "pages_blocks_media_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats_block_items" ADD CONSTRAINT "pages_blocks_stats_block_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_stats_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats_block" ADD CONSTRAINT "pages_blocks_stats_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_people_block_people" ADD CONSTRAINT "pages_blocks_people_block_people_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_people_block_people" ADD CONSTRAINT "pages_blocks_people_block_people_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_people_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_people_block" ADD CONSTRAINT "pages_blocks_people_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_partners_block_partners" ADD CONSTRAINT "pages_blocks_partners_block_partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_partners_block_partners" ADD CONSTRAINT "pages_blocks_partners_block_partners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_partners_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_partners_block" ADD CONSTRAINT "pages_blocks_partners_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_timeline_block_entries" ADD CONSTRAINT "pages_blocks_timeline_block_entries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_timeline_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_timeline_block" ADD CONSTRAINT "pages_blocks_timeline_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_block" ADD CONSTRAINT "pages_blocks_cta_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_block" ADD CONSTRAINT "pages_blocks_faq_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact_block" ADD CONSTRAINT "pages_blocks_contact_block_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact_block" ADD CONSTRAINT "pages_blocks_contact_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD CONSTRAINT "_pages_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_block" ADD CONSTRAINT "_pages_v_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_block" ADD CONSTRAINT "_pages_v_blocks_media_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats_block_items" ADD CONSTRAINT "_pages_v_blocks_stats_block_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_stats_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats_block" ADD CONSTRAINT "_pages_v_blocks_stats_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_people_block_people" ADD CONSTRAINT "_pages_v_blocks_people_block_people_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_people_block_people" ADD CONSTRAINT "_pages_v_blocks_people_block_people_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_people_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_people_block" ADD CONSTRAINT "_pages_v_blocks_people_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_partners_block_partners" ADD CONSTRAINT "_pages_v_blocks_partners_block_partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_partners_block_partners" ADD CONSTRAINT "_pages_v_blocks_partners_block_partners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_partners_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_partners_block" ADD CONSTRAINT "_pages_v_blocks_partners_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_timeline_block_entries" ADD CONSTRAINT "_pages_v_blocks_timeline_block_entries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_timeline_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_timeline_block" ADD CONSTRAINT "_pages_v_blocks_timeline_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_block" ADD CONSTRAINT "_pages_v_blocks_cta_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_block" ADD CONSTRAINT "_pages_v_blocks_faq_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact_block" ADD CONSTRAINT "_pages_v_blocks_contact_block_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact_block" ADD CONSTRAINT "_pages_v_blocks_contact_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_parent_id_pages_id_fk" FOREIGN KEY ("version_parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gallery_albums_videos" ADD CONSTRAINT "gallery_albums_videos_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gallery_albums_videos" ADD CONSTRAINT "gallery_albums_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."gallery_albums"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gallery_albums_videos_locales" ADD CONSTRAINT "gallery_albums_videos_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."gallery_albums_videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gallery_albums" ADD CONSTRAINT "gallery_albums_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gallery_albums" ADD CONSTRAINT "gallery_albums_related_training_id_training_programs_id_fk" FOREIGN KEY ("related_training_id") REFERENCES "public"."training_programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gallery_albums_locales" ADD CONSTRAINT "gallery_albums_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."gallery_albums"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gallery_albums_rels" ADD CONSTRAINT "gallery_albums_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."gallery_albums"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gallery_albums_rels" ADD CONSTRAINT "gallery_albums_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_gallery_albums_v_version_videos" ADD CONSTRAINT "_gallery_albums_v_version_videos_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_gallery_albums_v_version_videos" ADD CONSTRAINT "_gallery_albums_v_version_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_gallery_albums_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_gallery_albums_v_version_videos_locales" ADD CONSTRAINT "_gallery_albums_v_version_videos_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_gallery_albums_v_version_videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_gallery_albums_v" ADD CONSTRAINT "_gallery_albums_v_parent_id_gallery_albums_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."gallery_albums"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_gallery_albums_v" ADD CONSTRAINT "_gallery_albums_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_gallery_albums_v" ADD CONSTRAINT "_gallery_albums_v_version_related_training_id_training_programs_id_fk" FOREIGN KEY ("version_related_training_id") REFERENCES "public"."training_programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_gallery_albums_v_locales" ADD CONSTRAINT "_gallery_albums_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_gallery_albums_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_gallery_albums_v_rels" ADD CONSTRAINT "_gallery_albums_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_gallery_albums_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_gallery_albums_v_rels" ADD CONSTRAINT "_gallery_albums_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "document_files_language" ADD CONSTRAINT "document_files_language_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."document_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "document_files_locales" ADD CONSTRAINT "document_files_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."document_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_partners" ADD CONSTRAINT "projects_partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_partners" ADD CONSTRAINT "projects_partners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_partners_locales" ADD CONSTRAINT "projects_partners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_focus_countries" ADD CONSTRAINT "projects_focus_countries_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_locales" ADD CONSTRAINT "projects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_partners" ADD CONSTRAINT "_projects_v_version_partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_version_partners" ADD CONSTRAINT "_projects_v_version_partners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_partners_locales" ADD CONSTRAINT "_projects_v_version_partners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v_version_partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_focus_countries" ADD CONSTRAINT "_projects_v_version_focus_countries_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_parent_id_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_locales" ADD CONSTRAINT "_projects_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_index_locales" ADD CONSTRAINT "search_index_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search_index"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_index_rels" ADD CONSTRAINT "search_index_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."search_index"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_index_rels" ADD CONSTRAINT "search_index_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_index_rels" ADD CONSTRAINT "search_index_rels_training_programs_fk" FOREIGN KEY ("training_programs_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_index_rels" ADD CONSTRAINT "search_index_rels_training_topics_fk" FOREIGN KEY ("training_topics_id") REFERENCES "public"."training_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_index_rels" ADD CONSTRAINT "search_index_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_index_rels" ADD CONSTRAINT "search_index_rels_simulation_systems_fk" FOREIGN KEY ("simulation_systems_id") REFERENCES "public"."simulation_systems"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_index_rels" ADD CONSTRAINT "search_index_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_checkbox" ADD CONSTRAINT "forms_blocks_checkbox_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_checkbox_locales" ADD CONSTRAINT "forms_blocks_checkbox_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_checkbox"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_country" ADD CONSTRAINT "forms_blocks_country_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_country_locales" ADD CONSTRAINT "forms_blocks_country_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_country"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_email" ADD CONSTRAINT "forms_blocks_email_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_email_locales" ADD CONSTRAINT "forms_blocks_email_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_email"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_message" ADD CONSTRAINT "forms_blocks_message_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_message_locales" ADD CONSTRAINT "forms_blocks_message_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_message"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_number" ADD CONSTRAINT "forms_blocks_number_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_number_locales" ADD CONSTRAINT "forms_blocks_number_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_number"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_select_options" ADD CONSTRAINT "forms_blocks_select_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_select"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_select_options_locales" ADD CONSTRAINT "forms_blocks_select_options_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_select_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_select" ADD CONSTRAINT "forms_blocks_select_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_select_locales" ADD CONSTRAINT "forms_blocks_select_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_select"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_text" ADD CONSTRAINT "forms_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_text_locales" ADD CONSTRAINT "forms_blocks_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_textarea" ADD CONSTRAINT "forms_blocks_textarea_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_textarea_locales" ADD CONSTRAINT "forms_blocks_textarea_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_textarea"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_emails" ADD CONSTRAINT "forms_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_emails_locales" ADD CONSTRAINT "forms_emails_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_emails"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_locales" ADD CONSTRAINT "forms_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "form_submissions_submission_data" ADD CONSTRAINT "form_submissions_submission_data_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_training_programs_fk" FOREIGN KEY ("training_programs_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_training_topics_fk" FOREIGN KEY ("training_topics_id") REFERENCES "public"."training_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_training_programs_fk" FOREIGN KEY ("training_programs_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_simulation_systems_fk" FOREIGN KEY ("simulation_systems_id") REFERENCES "public"."simulation_systems"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_international_guide_fk" FOREIGN KEY ("international_guide_id") REFERENCES "public"."international_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gallery_albums_fk" FOREIGN KEY ("gallery_albums_id") REFERENCES "public"."gallery_albums"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_document_files_fk" FOREIGN KEY ("document_files_id") REFERENCES "public"."document_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_search_index_fk" FOREIGN KEY ("search_index_id") REFERENCES "public"."search_index"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_forms_fk" FOREIGN KEY ("forms_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_form_submissions_fk" FOREIGN KEY ("form_submissions_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_logos_partner_logos" ADD CONSTRAINT "site_settings_logos_partner_logos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_logos_partner_logos" ADD CONSTRAINT "site_settings_logos_partner_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_contact_social_links" ADD CONSTRAINT "site_settings_contact_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logos_primary_id_media_id_fk" FOREIGN KEY ("logos_primary_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logos_primary_dark_id_media_id_fk" FOREIGN KEY ("logos_primary_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logos_favicon_id_media_id_fk" FOREIGN KEY ("logos_favicon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logos_og_image_id_media_id_fk" FOREIGN KEY ("logos_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_contact_map_static_map_image_id_media_id_fk" FOREIGN KEY ("contact_map_static_map_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_primary_project_id_projects_id_fk" FOREIGN KEY ("primary_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_cookie_banner_policy_page_id_pages_id_fk" FOREIGN KEY ("cookie_banner_policy_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_privacy_notice_page_id_pages_id_fk" FOREIGN KEY ("privacy_notice_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_accessibility_statement_page_id_pages_id_fk" FOREIGN KEY ("accessibility_statement_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_logos_partner_logos" ADD CONSTRAINT "_site_settings_v_version_logos_partner_logos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_logos_partner_logos" ADD CONSTRAINT "_site_settings_v_version_logos_partner_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_contact_social_links" ADD CONSTRAINT "_site_settings_v_version_contact_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_logos_primary_id_media_id_fk" FOREIGN KEY ("version_logos_primary_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_logos_primary_dark_id_media_id_fk" FOREIGN KEY ("version_logos_primary_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_logos_favicon_id_media_id_fk" FOREIGN KEY ("version_logos_favicon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_logos_og_image_id_media_id_fk" FOREIGN KEY ("version_logos_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_contact_map_static_map_image_id_media_id_fk" FOREIGN KEY ("version_contact_map_static_map_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_primary_project_id_projects_id_fk" FOREIGN KEY ("version_primary_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_cookie_banner_policy_page_id_pages_id_fk" FOREIGN KEY ("version_cookie_banner_policy_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_privacy_notice_page_id_pages_id_fk" FOREIGN KEY ("version_privacy_notice_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_accessibility_statement_page_id_pages_id_fk" FOREIGN KEY ("version_accessibility_statement_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v_locales" ADD CONSTRAINT "_site_settings_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_main_menu_children" ADD CONSTRAINT "navigation_main_menu_children_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_main_menu_children" ADD CONSTRAINT "navigation_main_menu_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_main_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_main_menu_children_locales" ADD CONSTRAINT "navigation_main_menu_children_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_main_menu_children"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_main_menu" ADD CONSTRAINT "navigation_main_menu_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_main_menu" ADD CONSTRAINT "navigation_main_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_main_menu_locales" ADD CONSTRAINT "navigation_main_menu_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_main_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns_links" ADD CONSTRAINT "navigation_footer_columns_links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns_links" ADD CONSTRAINT "navigation_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns_links_locales" ADD CONSTRAINT "navigation_footer_columns_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_columns_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns" ADD CONSTRAINT "navigation_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns_locales" ADD CONSTRAINT "navigation_footer_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_legal_links" ADD CONSTRAINT "navigation_footer_legal_links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_footer_legal_links" ADD CONSTRAINT "navigation_footer_legal_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_legal_links_locales" ADD CONSTRAINT "navigation_footer_legal_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_legal_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_quick_access" ADD CONSTRAINT "navigation_quick_access_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_quick_access" ADD CONSTRAINT "navigation_quick_access_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_quick_access" ADD CONSTRAINT "navigation_quick_access_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_quick_access_locales" ADD CONSTRAINT "navigation_quick_access_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_quick_access"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_main_menu_children" ADD CONSTRAINT "_navigation_v_version_main_menu_children_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_main_menu_children" ADD CONSTRAINT "_navigation_v_version_main_menu_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_main_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_main_menu_children_locales" ADD CONSTRAINT "_navigation_v_version_main_menu_children_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_main_menu_children"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_main_menu" ADD CONSTRAINT "_navigation_v_version_main_menu_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_main_menu" ADD CONSTRAINT "_navigation_v_version_main_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_main_menu_locales" ADD CONSTRAINT "_navigation_v_version_main_menu_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_main_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_footer_columns_links" ADD CONSTRAINT "_navigation_v_version_footer_columns_links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_footer_columns_links" ADD CONSTRAINT "_navigation_v_version_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_footer_columns_links_locales" ADD CONSTRAINT "_navigation_v_version_footer_columns_links_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_footer_columns_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_footer_columns" ADD CONSTRAINT "_navigation_v_version_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_footer_columns_locales" ADD CONSTRAINT "_navigation_v_version_footer_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_footer_legal_links" ADD CONSTRAINT "_navigation_v_version_footer_legal_links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_footer_legal_links" ADD CONSTRAINT "_navigation_v_version_footer_legal_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_footer_legal_links_locales" ADD CONSTRAINT "_navigation_v_version_footer_legal_links_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_footer_legal_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_quick_access" ADD CONSTRAINT "_navigation_v_version_quick_access_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_quick_access" ADD CONSTRAINT "_navigation_v_version_quick_access_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_quick_access" ADD CONSTRAINT "_navigation_v_version_quick_access_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_quick_access_locales" ADD CONSTRAINT "_navigation_v_version_quick_access_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_quick_access"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "feat_cols" ADD CONSTRAINT "feat_cols_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "feat_cols" ADD CONSTRAINT "feat_cols_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."external_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "feat_cols_locales" ADD CONSTRAINT "feat_cols_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."feat_cols"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "external_services_additional" ADD CONSTRAINT "external_services_additional_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."external_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "external_services_additional_locales" ADD CONSTRAINT "external_services_additional_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."external_services_additional"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "external_services_locales" ADD CONSTRAINT "external_services_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."external_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_feat_cols_v" ADD CONSTRAINT "_feat_cols_v_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_feat_cols_v" ADD CONSTRAINT "_feat_cols_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_external_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_feat_cols_v_locales" ADD CONSTRAINT "_feat_cols_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_feat_cols_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_external_services_v_version_additional" ADD CONSTRAINT "_external_services_v_version_additional_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_external_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_external_services_v_version_additional_locales" ADD CONSTRAINT "_external_services_v_version_additional_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_external_services_v_version_additional"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_external_services_v_locales" ADD CONSTRAINT "_external_services_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_external_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulation_center_capacity_highlights" ADD CONSTRAINT "simulation_center_capacity_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulation_center"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulation_center" ADD CONSTRAINT "simulation_center_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "simulation_center" ADD CONSTRAINT "simulation_center_intro_video_poster_id_media_id_fk" FOREIGN KEY ("intro_video_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "simulation_center_locales" ADD CONSTRAINT "simulation_center_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulation_center"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_simulation_center_v_version_capacity_highlights" ADD CONSTRAINT "_simulation_center_v_version_capacity_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_simulation_center_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_simulation_center_v" ADD CONSTRAINT "_simulation_center_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_simulation_center_v" ADD CONSTRAINT "_simulation_center_v_version_intro_video_poster_id_media_id_fk" FOREIGN KEY ("version_intro_video_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_simulation_center_v_locales" ADD CONSTRAINT "_simulation_center_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_simulation_center_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "training_topics_learning_outcomes_order_idx" ON "training_topics_learning_outcomes" USING btree ("_order");
  CREATE INDEX "training_topics_learning_outcomes_parent_id_idx" ON "training_topics_learning_outcomes" USING btree ("_parent_id");
  CREATE INDEX "training_topics_learning_outcomes_locale_idx" ON "training_topics_learning_outcomes" USING btree ("_locale");
  CREATE INDEX "training_topics_level_order_idx" ON "training_topics_level" USING btree ("order");
  CREATE INDEX "training_topics_level_parent_idx" ON "training_topics_level" USING btree ("parent_id");
  CREATE INDEX "training_topics_icon_idx" ON "training_topics" USING btree ("icon_id");
  CREATE INDEX "training_topics_cover_image_idx" ON "training_topics" USING btree ("cover_image_id");
  CREATE INDEX "training_topics_updated_at_idx" ON "training_topics" USING btree ("updated_at");
  CREATE INDEX "training_topics_created_at_idx" ON "training_topics" USING btree ("created_at");
  CREATE INDEX "training_topics__status_idx" ON "training_topics" USING btree ("_status");
  CREATE UNIQUE INDEX "training_topics_slug_idx" ON "training_topics_locales" USING btree ("slug","_locale");
  CREATE INDEX "training_topics_meta_meta_image_idx" ON "training_topics_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "training_topics_locales_locale_parent_id_unique" ON "training_topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "training_topics_texts_order_parent" ON "training_topics_texts" USING btree ("order","parent_id");
  CREATE INDEX "training_topics_texts_locale_parent" ON "training_topics_texts" USING btree ("locale","parent_id");
  CREATE INDEX "training_topics_rels_order_idx" ON "training_topics_rels" USING btree ("order");
  CREATE INDEX "training_topics_rels_parent_idx" ON "training_topics_rels" USING btree ("parent_id");
  CREATE INDEX "training_topics_rels_path_idx" ON "training_topics_rels" USING btree ("path");
  CREATE INDEX "training_topics_rels_media_id_idx" ON "training_topics_rels" USING btree ("media_id");
  CREATE INDEX "training_topics_rels_simulation_systems_id_idx" ON "training_topics_rels" USING btree ("simulation_systems_id");
  CREATE INDEX "_training_topics_v_version_learning_outcomes_order_idx" ON "_training_topics_v_version_learning_outcomes" USING btree ("_order");
  CREATE INDEX "_training_topics_v_version_learning_outcomes_parent_id_idx" ON "_training_topics_v_version_learning_outcomes" USING btree ("_parent_id");
  CREATE INDEX "_training_topics_v_version_learning_outcomes_locale_idx" ON "_training_topics_v_version_learning_outcomes" USING btree ("_locale");
  CREATE INDEX "_training_topics_v_version_level_order_idx" ON "_training_topics_v_version_level" USING btree ("order");
  CREATE INDEX "_training_topics_v_version_level_parent_idx" ON "_training_topics_v_version_level" USING btree ("parent_id");
  CREATE INDEX "_training_topics_v_parent_idx" ON "_training_topics_v" USING btree ("parent_id");
  CREATE INDEX "_training_topics_v_version_version_icon_idx" ON "_training_topics_v" USING btree ("version_icon_id");
  CREATE INDEX "_training_topics_v_version_version_cover_image_idx" ON "_training_topics_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_training_topics_v_version_version_updated_at_idx" ON "_training_topics_v" USING btree ("version_updated_at");
  CREATE INDEX "_training_topics_v_version_version_created_at_idx" ON "_training_topics_v" USING btree ("version_created_at");
  CREATE INDEX "_training_topics_v_version_version__status_idx" ON "_training_topics_v" USING btree ("version__status");
  CREATE INDEX "_training_topics_v_created_at_idx" ON "_training_topics_v" USING btree ("created_at");
  CREATE INDEX "_training_topics_v_updated_at_idx" ON "_training_topics_v" USING btree ("updated_at");
  CREATE INDEX "_training_topics_v_snapshot_idx" ON "_training_topics_v" USING btree ("snapshot");
  CREATE INDEX "_training_topics_v_published_locale_idx" ON "_training_topics_v" USING btree ("published_locale");
  CREATE INDEX "_training_topics_v_latest_idx" ON "_training_topics_v" USING btree ("latest");
  CREATE INDEX "_training_topics_v_version_version_slug_idx" ON "_training_topics_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_training_topics_v_version_meta_version_meta_image_idx" ON "_training_topics_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_training_topics_v_locales_locale_parent_id_unique" ON "_training_topics_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_training_topics_v_texts_order_parent" ON "_training_topics_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_training_topics_v_texts_locale_parent" ON "_training_topics_v_texts" USING btree ("locale","parent_id");
  CREATE INDEX "_training_topics_v_rels_order_idx" ON "_training_topics_v_rels" USING btree ("order");
  CREATE INDEX "_training_topics_v_rels_parent_idx" ON "_training_topics_v_rels" USING btree ("parent_id");
  CREATE INDEX "_training_topics_v_rels_path_idx" ON "_training_topics_v_rels" USING btree ("path");
  CREATE INDEX "_training_topics_v_rels_media_id_idx" ON "_training_topics_v_rels" USING btree ("media_id");
  CREATE INDEX "_training_topics_v_rels_simulation_systems_id_idx" ON "_training_topics_v_rels" USING btree ("simulation_systems_id");
  CREATE INDEX "training_programs_instruction_languages_order_idx" ON "training_programs_instruction_languages" USING btree ("order");
  CREATE INDEX "training_programs_instruction_languages_parent_idx" ON "training_programs_instruction_languages" USING btree ("parent_id");
  CREATE INDEX "training_programs_participant_countries_order_idx" ON "training_programs_participant_countries" USING btree ("order");
  CREATE INDEX "training_programs_participant_countries_parent_idx" ON "training_programs_participant_countries" USING btree ("parent_id");
  CREATE INDEX "training_programs_learning_outcomes_order_idx" ON "training_programs_learning_outcomes" USING btree ("_order");
  CREATE INDEX "training_programs_learning_outcomes_parent_id_idx" ON "training_programs_learning_outcomes" USING btree ("_parent_id");
  CREATE INDEX "training_programs_learning_outcomes_locale_idx" ON "training_programs_learning_outcomes" USING btree ("_locale");
  CREATE INDEX "training_programs_schedule_sessions_order_idx" ON "training_programs_schedule_sessions" USING btree ("_order");
  CREATE INDEX "training_programs_schedule_sessions_parent_id_idx" ON "training_programs_schedule_sessions" USING btree ("_parent_id");
  CREATE INDEX "training_programs_schedule_sessions_locale_idx" ON "training_programs_schedule_sessions" USING btree ("_locale");
  CREATE INDEX "training_programs_schedule_order_idx" ON "training_programs_schedule" USING btree ("_order");
  CREATE INDEX "training_programs_schedule_parent_id_idx" ON "training_programs_schedule" USING btree ("_parent_id");
  CREATE INDEX "training_programs_schedule_locale_idx" ON "training_programs_schedule" USING btree ("_locale");
  CREATE INDEX "training_programs_trainers_order_idx" ON "training_programs_trainers" USING btree ("_order");
  CREATE INDEX "training_programs_trainers_parent_id_idx" ON "training_programs_trainers" USING btree ("_parent_id");
  CREATE INDEX "training_programs_trainers_photo_idx" ON "training_programs_trainers" USING btree ("photo_id");
  CREATE UNIQUE INDEX "training_programs_trainers_locales_locale_parent_id_unique" ON "training_programs_trainers_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "training_programs_issuing_bodies_order_idx" ON "training_programs_issuing_bodies" USING btree ("_order");
  CREATE INDEX "training_programs_issuing_bodies_parent_id_idx" ON "training_programs_issuing_bodies" USING btree ("_parent_id");
  CREATE INDEX "training_programs_issuing_bodies_logo_idx" ON "training_programs_issuing_bodies" USING btree ("logo_id");
  CREATE UNIQUE INDEX "training_programs_issuing_bodies_locales_locale_parent_id_un" ON "training_programs_issuing_bodies_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "training_programs_status_idx" ON "training_programs" USING btree ("status");
  CREATE UNIQUE INDEX "training_programs_code_idx" ON "training_programs" USING btree ("code");
  CREATE INDEX "training_programs_start_date_idx" ON "training_programs" USING btree ("start_date");
  CREATE INDEX "training_programs_cover_image_idx" ON "training_programs" USING btree ("cover_image_id");
  CREATE INDEX "training_programs_updated_at_idx" ON "training_programs" USING btree ("updated_at");
  CREATE INDEX "training_programs_created_at_idx" ON "training_programs" USING btree ("created_at");
  CREATE INDEX "training_programs__status_idx" ON "training_programs" USING btree ("_status");
  CREATE UNIQUE INDEX "training_programs_slug_idx" ON "training_programs_locales" USING btree ("slug","_locale");
  CREATE INDEX "training_programs_meta_meta_image_idx" ON "training_programs_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "training_programs_locales_locale_parent_id_unique" ON "training_programs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "training_programs_rels_order_idx" ON "training_programs_rels" USING btree ("order");
  CREATE INDEX "training_programs_rels_parent_idx" ON "training_programs_rels" USING btree ("parent_id");
  CREATE INDEX "training_programs_rels_path_idx" ON "training_programs_rels" USING btree ("path");
  CREATE INDEX "training_programs_rels_training_topics_id_idx" ON "training_programs_rels" USING btree ("training_topics_id");
  CREATE INDEX "training_programs_rels_simulation_systems_id_idx" ON "training_programs_rels" USING btree ("simulation_systems_id");
  CREATE INDEX "training_programs_rels_document_files_id_idx" ON "training_programs_rels" USING btree ("document_files_id");
  CREATE INDEX "training_programs_rels_media_id_idx" ON "training_programs_rels" USING btree ("media_id");
  CREATE INDEX "training_programs_rels_news_id_idx" ON "training_programs_rels" USING btree ("news_id");
  CREATE INDEX "_training_programs_v_version_instruction_languages_order_idx" ON "_training_programs_v_version_instruction_languages" USING btree ("order");
  CREATE INDEX "_training_programs_v_version_instruction_languages_parent_idx" ON "_training_programs_v_version_instruction_languages" USING btree ("parent_id");
  CREATE INDEX "_training_programs_v_version_participant_countries_order_idx" ON "_training_programs_v_version_participant_countries" USING btree ("order");
  CREATE INDEX "_training_programs_v_version_participant_countries_parent_idx" ON "_training_programs_v_version_participant_countries" USING btree ("parent_id");
  CREATE INDEX "_training_programs_v_version_learning_outcomes_order_idx" ON "_training_programs_v_version_learning_outcomes" USING btree ("_order");
  CREATE INDEX "_training_programs_v_version_learning_outcomes_parent_id_idx" ON "_training_programs_v_version_learning_outcomes" USING btree ("_parent_id");
  CREATE INDEX "_training_programs_v_version_learning_outcomes_locale_idx" ON "_training_programs_v_version_learning_outcomes" USING btree ("_locale");
  CREATE INDEX "_training_programs_v_version_schedule_sessions_order_idx" ON "_training_programs_v_version_schedule_sessions" USING btree ("_order");
  CREATE INDEX "_training_programs_v_version_schedule_sessions_parent_id_idx" ON "_training_programs_v_version_schedule_sessions" USING btree ("_parent_id");
  CREATE INDEX "_training_programs_v_version_schedule_sessions_locale_idx" ON "_training_programs_v_version_schedule_sessions" USING btree ("_locale");
  CREATE INDEX "_training_programs_v_version_schedule_order_idx" ON "_training_programs_v_version_schedule" USING btree ("_order");
  CREATE INDEX "_training_programs_v_version_schedule_parent_id_idx" ON "_training_programs_v_version_schedule" USING btree ("_parent_id");
  CREATE INDEX "_training_programs_v_version_schedule_locale_idx" ON "_training_programs_v_version_schedule" USING btree ("_locale");
  CREATE INDEX "_training_programs_v_version_trainers_order_idx" ON "_training_programs_v_version_trainers" USING btree ("_order");
  CREATE INDEX "_training_programs_v_version_trainers_parent_id_idx" ON "_training_programs_v_version_trainers" USING btree ("_parent_id");
  CREATE INDEX "_training_programs_v_version_trainers_photo_idx" ON "_training_programs_v_version_trainers" USING btree ("photo_id");
  CREATE UNIQUE INDEX "_training_programs_v_version_trainers_locales_locale_parent_" ON "_training_programs_v_version_trainers_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_training_programs_v_version_issuing_bodies_order_idx" ON "_training_programs_v_version_issuing_bodies" USING btree ("_order");
  CREATE INDEX "_training_programs_v_version_issuing_bodies_parent_id_idx" ON "_training_programs_v_version_issuing_bodies" USING btree ("_parent_id");
  CREATE INDEX "_training_programs_v_version_issuing_bodies_logo_idx" ON "_training_programs_v_version_issuing_bodies" USING btree ("logo_id");
  CREATE UNIQUE INDEX "_training_programs_v_version_issuing_bodies_locales_locale_p" ON "_training_programs_v_version_issuing_bodies_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_training_programs_v_parent_idx" ON "_training_programs_v" USING btree ("parent_id");
  CREATE INDEX "_training_programs_v_version_version_status_idx" ON "_training_programs_v" USING btree ("version_status");
  CREATE INDEX "_training_programs_v_version_version_code_idx" ON "_training_programs_v" USING btree ("version_code");
  CREATE INDEX "_training_programs_v_version_version_start_date_idx" ON "_training_programs_v" USING btree ("version_start_date");
  CREATE INDEX "_training_programs_v_version_version_cover_image_idx" ON "_training_programs_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_training_programs_v_version_version_updated_at_idx" ON "_training_programs_v" USING btree ("version_updated_at");
  CREATE INDEX "_training_programs_v_version_version_created_at_idx" ON "_training_programs_v" USING btree ("version_created_at");
  CREATE INDEX "_training_programs_v_version_version__status_idx" ON "_training_programs_v" USING btree ("version__status");
  CREATE INDEX "_training_programs_v_created_at_idx" ON "_training_programs_v" USING btree ("created_at");
  CREATE INDEX "_training_programs_v_updated_at_idx" ON "_training_programs_v" USING btree ("updated_at");
  CREATE INDEX "_training_programs_v_snapshot_idx" ON "_training_programs_v" USING btree ("snapshot");
  CREATE INDEX "_training_programs_v_published_locale_idx" ON "_training_programs_v" USING btree ("published_locale");
  CREATE INDEX "_training_programs_v_latest_idx" ON "_training_programs_v" USING btree ("latest");
  CREATE INDEX "_training_programs_v_version_version_slug_idx" ON "_training_programs_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_training_programs_v_version_meta_version_meta_image_idx" ON "_training_programs_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_training_programs_v_locales_locale_parent_id_unique" ON "_training_programs_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_training_programs_v_rels_order_idx" ON "_training_programs_v_rels" USING btree ("order");
  CREATE INDEX "_training_programs_v_rels_parent_idx" ON "_training_programs_v_rels" USING btree ("parent_id");
  CREATE INDEX "_training_programs_v_rels_path_idx" ON "_training_programs_v_rels" USING btree ("path");
  CREATE INDEX "_training_programs_v_rels_training_topics_id_idx" ON "_training_programs_v_rels" USING btree ("training_topics_id");
  CREATE INDEX "_training_programs_v_rels_simulation_systems_id_idx" ON "_training_programs_v_rels" USING btree ("simulation_systems_id");
  CREATE INDEX "_training_programs_v_rels_document_files_id_idx" ON "_training_programs_v_rels" USING btree ("document_files_id");
  CREATE INDEX "_training_programs_v_rels_media_id_idx" ON "_training_programs_v_rels" USING btree ("media_id");
  CREATE INDEX "_training_programs_v_rels_news_id_idx" ON "_training_programs_v_rels" USING btree ("news_id");
  CREATE INDEX "simulation_systems_use_cases_order_idx" ON "simulation_systems_use_cases" USING btree ("_order");
  CREATE INDEX "simulation_systems_use_cases_parent_id_idx" ON "simulation_systems_use_cases" USING btree ("_parent_id");
  CREATE INDEX "simulation_systems_use_cases_locale_idx" ON "simulation_systems_use_cases" USING btree ("_locale");
  CREATE INDEX "simulation_systems_technical_specs_order_idx" ON "simulation_systems_technical_specs" USING btree ("_order");
  CREATE INDEX "simulation_systems_technical_specs_parent_id_idx" ON "simulation_systems_technical_specs" USING btree ("_parent_id");
  CREATE INDEX "simulation_systems_technical_specs_locale_idx" ON "simulation_systems_technical_specs" USING btree ("_locale");
  CREATE INDEX "simulation_systems_access_links_order_idx" ON "simulation_systems_access_links" USING btree ("_order");
  CREATE INDEX "simulation_systems_access_links_parent_id_idx" ON "simulation_systems_access_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "simulation_systems_access_links_locales_locale_parent_id_uni" ON "simulation_systems_access_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "simulation_systems_videos_order_idx" ON "simulation_systems_videos" USING btree ("_order");
  CREATE INDEX "simulation_systems_videos_parent_id_idx" ON "simulation_systems_videos" USING btree ("_parent_id");
  CREATE INDEX "simulation_systems_videos_poster_idx" ON "simulation_systems_videos" USING btree ("poster_id");
  CREATE UNIQUE INDEX "simulation_systems_videos_locales_locale_parent_id_unique" ON "simulation_systems_videos_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "simulation_systems_short_code_idx" ON "simulation_systems" USING btree ("short_code");
  CREATE INDEX "simulation_systems_cover_image_idx" ON "simulation_systems" USING btree ("cover_image_id");
  CREATE INDEX "simulation_systems_updated_at_idx" ON "simulation_systems" USING btree ("updated_at");
  CREATE INDEX "simulation_systems_created_at_idx" ON "simulation_systems" USING btree ("created_at");
  CREATE INDEX "simulation_systems__status_idx" ON "simulation_systems" USING btree ("_status");
  CREATE UNIQUE INDEX "simulation_systems_slug_idx" ON "simulation_systems_locales" USING btree ("slug","_locale");
  CREATE INDEX "simulation_systems_meta_meta_image_idx" ON "simulation_systems_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "simulation_systems_locales_locale_parent_id_unique" ON "simulation_systems_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "simulation_systems_rels_order_idx" ON "simulation_systems_rels" USING btree ("order");
  CREATE INDEX "simulation_systems_rels_parent_idx" ON "simulation_systems_rels" USING btree ("parent_id");
  CREATE INDEX "simulation_systems_rels_path_idx" ON "simulation_systems_rels" USING btree ("path");
  CREATE INDEX "simulation_systems_rels_media_id_idx" ON "simulation_systems_rels" USING btree ("media_id");
  CREATE INDEX "simulation_systems_rels_training_topics_id_idx" ON "simulation_systems_rels" USING btree ("training_topics_id");
  CREATE INDEX "_simulation_systems_v_version_use_cases_order_idx" ON "_simulation_systems_v_version_use_cases" USING btree ("_order");
  CREATE INDEX "_simulation_systems_v_version_use_cases_parent_id_idx" ON "_simulation_systems_v_version_use_cases" USING btree ("_parent_id");
  CREATE INDEX "_simulation_systems_v_version_use_cases_locale_idx" ON "_simulation_systems_v_version_use_cases" USING btree ("_locale");
  CREATE INDEX "_simulation_systems_v_version_technical_specs_order_idx" ON "_simulation_systems_v_version_technical_specs" USING btree ("_order");
  CREATE INDEX "_simulation_systems_v_version_technical_specs_parent_id_idx" ON "_simulation_systems_v_version_technical_specs" USING btree ("_parent_id");
  CREATE INDEX "_simulation_systems_v_version_technical_specs_locale_idx" ON "_simulation_systems_v_version_technical_specs" USING btree ("_locale");
  CREATE INDEX "_simulation_systems_v_version_access_links_order_idx" ON "_simulation_systems_v_version_access_links" USING btree ("_order");
  CREATE INDEX "_simulation_systems_v_version_access_links_parent_id_idx" ON "_simulation_systems_v_version_access_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_simulation_systems_v_version_access_links_locales_locale_pa" ON "_simulation_systems_v_version_access_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_simulation_systems_v_version_videos_order_idx" ON "_simulation_systems_v_version_videos" USING btree ("_order");
  CREATE INDEX "_simulation_systems_v_version_videos_parent_id_idx" ON "_simulation_systems_v_version_videos" USING btree ("_parent_id");
  CREATE INDEX "_simulation_systems_v_version_videos_poster_idx" ON "_simulation_systems_v_version_videos" USING btree ("poster_id");
  CREATE UNIQUE INDEX "_simulation_systems_v_version_videos_locales_locale_parent_i" ON "_simulation_systems_v_version_videos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_simulation_systems_v_parent_idx" ON "_simulation_systems_v" USING btree ("parent_id");
  CREATE INDEX "_simulation_systems_v_version_version_short_code_idx" ON "_simulation_systems_v" USING btree ("version_short_code");
  CREATE INDEX "_simulation_systems_v_version_version_cover_image_idx" ON "_simulation_systems_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_simulation_systems_v_version_version_updated_at_idx" ON "_simulation_systems_v" USING btree ("version_updated_at");
  CREATE INDEX "_simulation_systems_v_version_version_created_at_idx" ON "_simulation_systems_v" USING btree ("version_created_at");
  CREATE INDEX "_simulation_systems_v_version_version__status_idx" ON "_simulation_systems_v" USING btree ("version__status");
  CREATE INDEX "_simulation_systems_v_created_at_idx" ON "_simulation_systems_v" USING btree ("created_at");
  CREATE INDEX "_simulation_systems_v_updated_at_idx" ON "_simulation_systems_v" USING btree ("updated_at");
  CREATE INDEX "_simulation_systems_v_snapshot_idx" ON "_simulation_systems_v" USING btree ("snapshot");
  CREATE INDEX "_simulation_systems_v_published_locale_idx" ON "_simulation_systems_v" USING btree ("published_locale");
  CREATE INDEX "_simulation_systems_v_latest_idx" ON "_simulation_systems_v" USING btree ("latest");
  CREATE INDEX "_simulation_systems_v_version_version_slug_idx" ON "_simulation_systems_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_simulation_systems_v_version_meta_version_meta_image_idx" ON "_simulation_systems_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_simulation_systems_v_locales_locale_parent_id_unique" ON "_simulation_systems_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_simulation_systems_v_rels_order_idx" ON "_simulation_systems_v_rels" USING btree ("order");
  CREATE INDEX "_simulation_systems_v_rels_parent_idx" ON "_simulation_systems_v_rels" USING btree ("parent_id");
  CREATE INDEX "_simulation_systems_v_rels_path_idx" ON "_simulation_systems_v_rels" USING btree ("path");
  CREATE INDEX "_simulation_systems_v_rels_media_id_idx" ON "_simulation_systems_v_rels" USING btree ("media_id");
  CREATE INDEX "_simulation_systems_v_rels_training_topics_id_idx" ON "_simulation_systems_v_rels" USING btree ("training_topics_id");
  CREATE INDEX "news_countries_order_idx" ON "news_countries" USING btree ("order");
  CREATE INDEX "news_countries_parent_idx" ON "news_countries" USING btree ("parent_id");
  CREATE INDEX "news_kind_idx" ON "news" USING btree ("kind");
  CREATE INDEX "news_category_idx" ON "news" USING btree ("category");
  CREATE INDEX "news_cover_image_idx" ON "news" USING btree ("cover_image_id");
  CREATE INDEX "news_project_idx" ON "news" USING btree ("project_id");
  CREATE INDEX "news_updated_at_idx" ON "news" USING btree ("updated_at");
  CREATE INDEX "news_created_at_idx" ON "news" USING btree ("created_at");
  CREATE INDEX "news__status_idx" ON "news" USING btree ("_status");
  CREATE UNIQUE INDEX "news_slug_idx" ON "news_locales" USING btree ("slug","_locale");
  CREATE INDEX "news_meta_meta_image_idx" ON "news_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "news_locales_locale_parent_id_unique" ON "news_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "news_rels_order_idx" ON "news_rels" USING btree ("order");
  CREATE INDEX "news_rels_parent_idx" ON "news_rels" USING btree ("parent_id");
  CREATE INDEX "news_rels_path_idx" ON "news_rels" USING btree ("path");
  CREATE INDEX "news_rels_media_id_idx" ON "news_rels" USING btree ("media_id");
  CREATE INDEX "news_rels_training_programs_id_idx" ON "news_rels" USING btree ("training_programs_id");
  CREATE INDEX "news_rels_training_topics_id_idx" ON "news_rels" USING btree ("training_topics_id");
  CREATE INDEX "news_rels_document_files_id_idx" ON "news_rels" USING btree ("document_files_id");
  CREATE INDEX "_news_v_version_countries_order_idx" ON "_news_v_version_countries" USING btree ("order");
  CREATE INDEX "_news_v_version_countries_parent_idx" ON "_news_v_version_countries" USING btree ("parent_id");
  CREATE INDEX "_news_v_parent_idx" ON "_news_v" USING btree ("parent_id");
  CREATE INDEX "_news_v_version_version_kind_idx" ON "_news_v" USING btree ("version_kind");
  CREATE INDEX "_news_v_version_version_category_idx" ON "_news_v" USING btree ("version_category");
  CREATE INDEX "_news_v_version_version_cover_image_idx" ON "_news_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_news_v_version_version_project_idx" ON "_news_v" USING btree ("version_project_id");
  CREATE INDEX "_news_v_version_version_updated_at_idx" ON "_news_v" USING btree ("version_updated_at");
  CREATE INDEX "_news_v_version_version_created_at_idx" ON "_news_v" USING btree ("version_created_at");
  CREATE INDEX "_news_v_version_version__status_idx" ON "_news_v" USING btree ("version__status");
  CREATE INDEX "_news_v_created_at_idx" ON "_news_v" USING btree ("created_at");
  CREATE INDEX "_news_v_updated_at_idx" ON "_news_v" USING btree ("updated_at");
  CREATE INDEX "_news_v_snapshot_idx" ON "_news_v" USING btree ("snapshot");
  CREATE INDEX "_news_v_published_locale_idx" ON "_news_v" USING btree ("published_locale");
  CREATE INDEX "_news_v_latest_idx" ON "_news_v" USING btree ("latest");
  CREATE INDEX "_news_v_version_version_slug_idx" ON "_news_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_news_v_version_meta_version_meta_image_idx" ON "_news_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_news_v_locales_locale_parent_id_unique" ON "_news_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_news_v_rels_order_idx" ON "_news_v_rels" USING btree ("order");
  CREATE INDEX "_news_v_rels_parent_idx" ON "_news_v_rels" USING btree ("parent_id");
  CREATE INDEX "_news_v_rels_path_idx" ON "_news_v_rels" USING btree ("path");
  CREATE INDEX "_news_v_rels_media_id_idx" ON "_news_v_rels" USING btree ("media_id");
  CREATE INDEX "_news_v_rels_training_programs_id_idx" ON "_news_v_rels" USING btree ("training_programs_id");
  CREATE INDEX "_news_v_rels_training_topics_id_idx" ON "_news_v_rels" USING btree ("training_topics_id");
  CREATE INDEX "_news_v_rels_document_files_id_idx" ON "_news_v_rels" USING btree ("document_files_id");
  CREATE INDEX "international_guide_countries_order_idx" ON "international_guide_countries" USING btree ("order");
  CREATE INDEX "international_guide_countries_parent_idx" ON "international_guide_countries" USING btree ("parent_id");
  CREATE INDEX "international_guide_country_notes_order_idx" ON "international_guide_country_notes" USING btree ("_order");
  CREATE INDEX "international_guide_country_notes_parent_id_idx" ON "international_guide_country_notes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "international_guide_country_notes_locales_locale_parent_id_u" ON "international_guide_country_notes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "international_guide_links_order_idx" ON "international_guide_links" USING btree ("_order");
  CREATE INDEX "international_guide_links_parent_id_idx" ON "international_guide_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "international_guide_links_locales_locale_parent_id_unique" ON "international_guide_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "international_guide_section_key_idx" ON "international_guide" USING btree ("section_key");
  CREATE INDEX "international_guide_image_idx" ON "international_guide" USING btree ("image_id");
  CREATE INDEX "international_guide_updated_at_idx" ON "international_guide" USING btree ("updated_at");
  CREATE INDEX "international_guide_created_at_idx" ON "international_guide" USING btree ("created_at");
  CREATE INDEX "international_guide__status_idx" ON "international_guide" USING btree ("_status");
  CREATE UNIQUE INDEX "international_guide_slug_idx" ON "international_guide_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "international_guide_locales_locale_parent_id_unique" ON "international_guide_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "international_guide_rels_order_idx" ON "international_guide_rels" USING btree ("order");
  CREATE INDEX "international_guide_rels_parent_idx" ON "international_guide_rels" USING btree ("parent_id");
  CREATE INDEX "international_guide_rels_path_idx" ON "international_guide_rels" USING btree ("path");
  CREATE INDEX "international_guide_rels_document_files_id_idx" ON "international_guide_rels" USING btree ("document_files_id");
  CREATE INDEX "international_guide_rels_faqs_id_idx" ON "international_guide_rels" USING btree ("faqs_id");
  CREATE INDEX "_international_guide_v_version_countries_order_idx" ON "_international_guide_v_version_countries" USING btree ("order");
  CREATE INDEX "_international_guide_v_version_countries_parent_idx" ON "_international_guide_v_version_countries" USING btree ("parent_id");
  CREATE INDEX "_international_guide_v_version_country_notes_order_idx" ON "_international_guide_v_version_country_notes" USING btree ("_order");
  CREATE INDEX "_international_guide_v_version_country_notes_parent_id_idx" ON "_international_guide_v_version_country_notes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_international_guide_v_version_country_notes_locales_locale_" ON "_international_guide_v_version_country_notes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_international_guide_v_version_links_order_idx" ON "_international_guide_v_version_links" USING btree ("_order");
  CREATE INDEX "_international_guide_v_version_links_parent_id_idx" ON "_international_guide_v_version_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_international_guide_v_version_links_locales_locale_parent_i" ON "_international_guide_v_version_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_international_guide_v_parent_idx" ON "_international_guide_v" USING btree ("parent_id");
  CREATE INDEX "_international_guide_v_version_version_section_key_idx" ON "_international_guide_v" USING btree ("version_section_key");
  CREATE INDEX "_international_guide_v_version_version_image_idx" ON "_international_guide_v" USING btree ("version_image_id");
  CREATE INDEX "_international_guide_v_version_version_updated_at_idx" ON "_international_guide_v" USING btree ("version_updated_at");
  CREATE INDEX "_international_guide_v_version_version_created_at_idx" ON "_international_guide_v" USING btree ("version_created_at");
  CREATE INDEX "_international_guide_v_version_version__status_idx" ON "_international_guide_v" USING btree ("version__status");
  CREATE INDEX "_international_guide_v_created_at_idx" ON "_international_guide_v" USING btree ("created_at");
  CREATE INDEX "_international_guide_v_updated_at_idx" ON "_international_guide_v" USING btree ("updated_at");
  CREATE INDEX "_international_guide_v_snapshot_idx" ON "_international_guide_v" USING btree ("snapshot");
  CREATE INDEX "_international_guide_v_published_locale_idx" ON "_international_guide_v" USING btree ("published_locale");
  CREATE INDEX "_international_guide_v_latest_idx" ON "_international_guide_v" USING btree ("latest");
  CREATE INDEX "_international_guide_v_version_version_slug_idx" ON "_international_guide_v_locales" USING btree ("version_slug","_locale");
  CREATE UNIQUE INDEX "_international_guide_v_locales_locale_parent_id_unique" ON "_international_guide_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_international_guide_v_rels_order_idx" ON "_international_guide_v_rels" USING btree ("order");
  CREATE INDEX "_international_guide_v_rels_parent_idx" ON "_international_guide_v_rels" USING btree ("parent_id");
  CREATE INDEX "_international_guide_v_rels_path_idx" ON "_international_guide_v_rels" USING btree ("path");
  CREATE INDEX "_international_guide_v_rels_document_files_id_idx" ON "_international_guide_v_rels" USING btree ("document_files_id");
  CREATE INDEX "_international_guide_v_rels_faqs_id_idx" ON "_international_guide_v_rels" USING btree ("faqs_id");
  CREATE INDEX "faqs_group_idx" ON "faqs" USING btree ("group");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE INDEX "faqs__status_idx" ON "faqs" USING btree ("_status");
  CREATE UNIQUE INDEX "faqs_locales_locale_parent_id_unique" ON "faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_faqs_v_parent_idx" ON "_faqs_v" USING btree ("parent_id");
  CREATE INDEX "_faqs_v_version_version_group_idx" ON "_faqs_v" USING btree ("version_group");
  CREATE INDEX "_faqs_v_version_version_updated_at_idx" ON "_faqs_v" USING btree ("version_updated_at");
  CREATE INDEX "_faqs_v_version_version_created_at_idx" ON "_faqs_v" USING btree ("version_created_at");
  CREATE INDEX "_faqs_v_version_version__status_idx" ON "_faqs_v" USING btree ("version__status");
  CREATE INDEX "_faqs_v_created_at_idx" ON "_faqs_v" USING btree ("created_at");
  CREATE INDEX "_faqs_v_updated_at_idx" ON "_faqs_v" USING btree ("updated_at");
  CREATE INDEX "_faqs_v_snapshot_idx" ON "_faqs_v" USING btree ("snapshot");
  CREATE INDEX "_faqs_v_published_locale_idx" ON "_faqs_v" USING btree ("published_locale");
  CREATE INDEX "_faqs_v_latest_idx" ON "_faqs_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_faqs_v_locales_locale_parent_id_unique" ON "_faqs_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_rich_text_order_idx" ON "pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_parent_id_idx" ON "pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_path_idx" ON "pages_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_rich_text_locale_idx" ON "pages_blocks_rich_text" USING btree ("_locale");
  CREATE INDEX "pages_blocks_media_block_order_idx" ON "pages_blocks_media_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_media_block_parent_id_idx" ON "pages_blocks_media_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_media_block_path_idx" ON "pages_blocks_media_block" USING btree ("_path");
  CREATE INDEX "pages_blocks_media_block_locale_idx" ON "pages_blocks_media_block" USING btree ("_locale");
  CREATE INDEX "pages_blocks_media_block_media_idx" ON "pages_blocks_media_block" USING btree ("media_id");
  CREATE INDEX "pages_blocks_stats_block_items_order_idx" ON "pages_blocks_stats_block_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_block_items_parent_id_idx" ON "pages_blocks_stats_block_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_block_items_locale_idx" ON "pages_blocks_stats_block_items" USING btree ("_locale");
  CREATE INDEX "pages_blocks_stats_block_order_idx" ON "pages_blocks_stats_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_block_parent_id_idx" ON "pages_blocks_stats_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_block_path_idx" ON "pages_blocks_stats_block" USING btree ("_path");
  CREATE INDEX "pages_blocks_stats_block_locale_idx" ON "pages_blocks_stats_block" USING btree ("_locale");
  CREATE INDEX "pages_blocks_people_block_people_order_idx" ON "pages_blocks_people_block_people" USING btree ("_order");
  CREATE INDEX "pages_blocks_people_block_people_parent_id_idx" ON "pages_blocks_people_block_people" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_people_block_people_locale_idx" ON "pages_blocks_people_block_people" USING btree ("_locale");
  CREATE INDEX "pages_blocks_people_block_people_photo_idx" ON "pages_blocks_people_block_people" USING btree ("photo_id");
  CREATE INDEX "pages_blocks_people_block_order_idx" ON "pages_blocks_people_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_people_block_parent_id_idx" ON "pages_blocks_people_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_people_block_path_idx" ON "pages_blocks_people_block" USING btree ("_path");
  CREATE INDEX "pages_blocks_people_block_locale_idx" ON "pages_blocks_people_block" USING btree ("_locale");
  CREATE INDEX "pages_blocks_partners_block_partners_order_idx" ON "pages_blocks_partners_block_partners" USING btree ("_order");
  CREATE INDEX "pages_blocks_partners_block_partners_parent_id_idx" ON "pages_blocks_partners_block_partners" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_partners_block_partners_locale_idx" ON "pages_blocks_partners_block_partners" USING btree ("_locale");
  CREATE INDEX "pages_blocks_partners_block_partners_logo_idx" ON "pages_blocks_partners_block_partners" USING btree ("logo_id");
  CREATE INDEX "pages_blocks_partners_block_order_idx" ON "pages_blocks_partners_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_partners_block_parent_id_idx" ON "pages_blocks_partners_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_partners_block_path_idx" ON "pages_blocks_partners_block" USING btree ("_path");
  CREATE INDEX "pages_blocks_partners_block_locale_idx" ON "pages_blocks_partners_block" USING btree ("_locale");
  CREATE INDEX "pages_blocks_timeline_block_entries_order_idx" ON "pages_blocks_timeline_block_entries" USING btree ("_order");
  CREATE INDEX "pages_blocks_timeline_block_entries_parent_id_idx" ON "pages_blocks_timeline_block_entries" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_timeline_block_entries_locale_idx" ON "pages_blocks_timeline_block_entries" USING btree ("_locale");
  CREATE INDEX "pages_blocks_timeline_block_order_idx" ON "pages_blocks_timeline_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_timeline_block_parent_id_idx" ON "pages_blocks_timeline_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_timeline_block_path_idx" ON "pages_blocks_timeline_block" USING btree ("_path");
  CREATE INDEX "pages_blocks_timeline_block_locale_idx" ON "pages_blocks_timeline_block" USING btree ("_locale");
  CREATE INDEX "pages_blocks_cta_block_order_idx" ON "pages_blocks_cta_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_block_parent_id_idx" ON "pages_blocks_cta_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_block_path_idx" ON "pages_blocks_cta_block" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_block_locale_idx" ON "pages_blocks_cta_block" USING btree ("_locale");
  CREATE INDEX "pages_blocks_faq_block_order_idx" ON "pages_blocks_faq_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_block_parent_id_idx" ON "pages_blocks_faq_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_block_path_idx" ON "pages_blocks_faq_block" USING btree ("_path");
  CREATE INDEX "pages_blocks_faq_block_locale_idx" ON "pages_blocks_faq_block" USING btree ("_locale");
  CREATE INDEX "pages_blocks_contact_block_order_idx" ON "pages_blocks_contact_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_contact_block_parent_id_idx" ON "pages_blocks_contact_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_contact_block_path_idx" ON "pages_blocks_contact_block" USING btree ("_path");
  CREATE INDEX "pages_blocks_contact_block_locale_idx" ON "pages_blocks_contact_block" USING btree ("_locale");
  CREATE INDEX "pages_blocks_contact_block_form_idx" ON "pages_blocks_contact_block" USING btree ("form_id");
  CREATE INDEX "pages_parent_idx" ON "pages" USING btree ("parent_id");
  CREATE INDEX "pages_hero_image_idx" ON "pages" USING btree ("hero_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages_locales" USING btree ("slug","_locale");
  CREATE INDEX "pages_meta_meta_image_idx" ON "pages_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_locale_idx" ON "pages_rels" USING btree ("locale");
  CREATE INDEX "pages_rels_faqs_id_idx" ON "pages_rels" USING btree ("faqs_id","locale");
  CREATE INDEX "_pages_v_blocks_rich_text_order_idx" ON "_pages_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rich_text_parent_id_idx" ON "_pages_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_path_idx" ON "_pages_v_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_rich_text_locale_idx" ON "_pages_v_blocks_rich_text" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_media_block_order_idx" ON "_pages_v_blocks_media_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_media_block_parent_id_idx" ON "_pages_v_blocks_media_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_media_block_path_idx" ON "_pages_v_blocks_media_block" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_media_block_locale_idx" ON "_pages_v_blocks_media_block" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_media_block_media_idx" ON "_pages_v_blocks_media_block" USING btree ("media_id");
  CREATE INDEX "_pages_v_blocks_stats_block_items_order_idx" ON "_pages_v_blocks_stats_block_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_block_items_parent_id_idx" ON "_pages_v_blocks_stats_block_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_block_items_locale_idx" ON "_pages_v_blocks_stats_block_items" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_stats_block_order_idx" ON "_pages_v_blocks_stats_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_block_parent_id_idx" ON "_pages_v_blocks_stats_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_block_path_idx" ON "_pages_v_blocks_stats_block" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_stats_block_locale_idx" ON "_pages_v_blocks_stats_block" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_people_block_people_order_idx" ON "_pages_v_blocks_people_block_people" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_people_block_people_parent_id_idx" ON "_pages_v_blocks_people_block_people" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_people_block_people_locale_idx" ON "_pages_v_blocks_people_block_people" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_people_block_people_photo_idx" ON "_pages_v_blocks_people_block_people" USING btree ("photo_id");
  CREATE INDEX "_pages_v_blocks_people_block_order_idx" ON "_pages_v_blocks_people_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_people_block_parent_id_idx" ON "_pages_v_blocks_people_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_people_block_path_idx" ON "_pages_v_blocks_people_block" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_people_block_locale_idx" ON "_pages_v_blocks_people_block" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_partners_block_partners_order_idx" ON "_pages_v_blocks_partners_block_partners" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_partners_block_partners_parent_id_idx" ON "_pages_v_blocks_partners_block_partners" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_partners_block_partners_locale_idx" ON "_pages_v_blocks_partners_block_partners" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_partners_block_partners_logo_idx" ON "_pages_v_blocks_partners_block_partners" USING btree ("logo_id");
  CREATE INDEX "_pages_v_blocks_partners_block_order_idx" ON "_pages_v_blocks_partners_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_partners_block_parent_id_idx" ON "_pages_v_blocks_partners_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_partners_block_path_idx" ON "_pages_v_blocks_partners_block" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_partners_block_locale_idx" ON "_pages_v_blocks_partners_block" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_timeline_block_entries_order_idx" ON "_pages_v_blocks_timeline_block_entries" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_timeline_block_entries_parent_id_idx" ON "_pages_v_blocks_timeline_block_entries" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_timeline_block_entries_locale_idx" ON "_pages_v_blocks_timeline_block_entries" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_timeline_block_order_idx" ON "_pages_v_blocks_timeline_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_timeline_block_parent_id_idx" ON "_pages_v_blocks_timeline_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_timeline_block_path_idx" ON "_pages_v_blocks_timeline_block" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_timeline_block_locale_idx" ON "_pages_v_blocks_timeline_block" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_cta_block_order_idx" ON "_pages_v_blocks_cta_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_block_parent_id_idx" ON "_pages_v_blocks_cta_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_block_path_idx" ON "_pages_v_blocks_cta_block" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta_block_locale_idx" ON "_pages_v_blocks_cta_block" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_faq_block_order_idx" ON "_pages_v_blocks_faq_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_block_parent_id_idx" ON "_pages_v_blocks_faq_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_block_path_idx" ON "_pages_v_blocks_faq_block" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_faq_block_locale_idx" ON "_pages_v_blocks_faq_block" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_contact_block_order_idx" ON "_pages_v_blocks_contact_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_contact_block_parent_id_idx" ON "_pages_v_blocks_contact_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_contact_block_path_idx" ON "_pages_v_blocks_contact_block" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_contact_block_locale_idx" ON "_pages_v_blocks_contact_block" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_contact_block_form_idx" ON "_pages_v_blocks_contact_block" USING btree ("form_id");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_parent_idx" ON "_pages_v" USING btree ("version_parent_id");
  CREATE INDEX "_pages_v_version_version_hero_image_idx" ON "_pages_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "_pages_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_locale_idx" ON "_pages_v_rels" USING btree ("locale");
  CREATE INDEX "_pages_v_rels_faqs_id_idx" ON "_pages_v_rels" USING btree ("faqs_id","locale");
  CREATE INDEX "gallery_albums_videos_order_idx" ON "gallery_albums_videos" USING btree ("_order");
  CREATE INDEX "gallery_albums_videos_parent_id_idx" ON "gallery_albums_videos" USING btree ("_parent_id");
  CREATE INDEX "gallery_albums_videos_poster_idx" ON "gallery_albums_videos" USING btree ("poster_id");
  CREATE UNIQUE INDEX "gallery_albums_videos_locales_locale_parent_id_unique" ON "gallery_albums_videos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "gallery_albums_album_type_idx" ON "gallery_albums" USING btree ("album_type");
  CREATE INDEX "gallery_albums_cover_image_idx" ON "gallery_albums" USING btree ("cover_image_id");
  CREATE INDEX "gallery_albums_related_training_idx" ON "gallery_albums" USING btree ("related_training_id");
  CREATE INDEX "gallery_albums_updated_at_idx" ON "gallery_albums" USING btree ("updated_at");
  CREATE INDEX "gallery_albums_created_at_idx" ON "gallery_albums" USING btree ("created_at");
  CREATE INDEX "gallery_albums__status_idx" ON "gallery_albums" USING btree ("_status");
  CREATE UNIQUE INDEX "gallery_albums_slug_idx" ON "gallery_albums_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "gallery_albums_locales_locale_parent_id_unique" ON "gallery_albums_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "gallery_albums_rels_order_idx" ON "gallery_albums_rels" USING btree ("order");
  CREATE INDEX "gallery_albums_rels_parent_idx" ON "gallery_albums_rels" USING btree ("parent_id");
  CREATE INDEX "gallery_albums_rels_path_idx" ON "gallery_albums_rels" USING btree ("path");
  CREATE INDEX "gallery_albums_rels_media_id_idx" ON "gallery_albums_rels" USING btree ("media_id");
  CREATE INDEX "_gallery_albums_v_version_videos_order_idx" ON "_gallery_albums_v_version_videos" USING btree ("_order");
  CREATE INDEX "_gallery_albums_v_version_videos_parent_id_idx" ON "_gallery_albums_v_version_videos" USING btree ("_parent_id");
  CREATE INDEX "_gallery_albums_v_version_videos_poster_idx" ON "_gallery_albums_v_version_videos" USING btree ("poster_id");
  CREATE UNIQUE INDEX "_gallery_albums_v_version_videos_locales_locale_parent_id_un" ON "_gallery_albums_v_version_videos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_gallery_albums_v_parent_idx" ON "_gallery_albums_v" USING btree ("parent_id");
  CREATE INDEX "_gallery_albums_v_version_version_album_type_idx" ON "_gallery_albums_v" USING btree ("version_album_type");
  CREATE INDEX "_gallery_albums_v_version_version_cover_image_idx" ON "_gallery_albums_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_gallery_albums_v_version_version_related_training_idx" ON "_gallery_albums_v" USING btree ("version_related_training_id");
  CREATE INDEX "_gallery_albums_v_version_version_updated_at_idx" ON "_gallery_albums_v" USING btree ("version_updated_at");
  CREATE INDEX "_gallery_albums_v_version_version_created_at_idx" ON "_gallery_albums_v" USING btree ("version_created_at");
  CREATE INDEX "_gallery_albums_v_version_version__status_idx" ON "_gallery_albums_v" USING btree ("version__status");
  CREATE INDEX "_gallery_albums_v_created_at_idx" ON "_gallery_albums_v" USING btree ("created_at");
  CREATE INDEX "_gallery_albums_v_updated_at_idx" ON "_gallery_albums_v" USING btree ("updated_at");
  CREATE INDEX "_gallery_albums_v_snapshot_idx" ON "_gallery_albums_v" USING btree ("snapshot");
  CREATE INDEX "_gallery_albums_v_published_locale_idx" ON "_gallery_albums_v" USING btree ("published_locale");
  CREATE INDEX "_gallery_albums_v_latest_idx" ON "_gallery_albums_v" USING btree ("latest");
  CREATE INDEX "_gallery_albums_v_version_version_slug_idx" ON "_gallery_albums_v_locales" USING btree ("version_slug","_locale");
  CREATE UNIQUE INDEX "_gallery_albums_v_locales_locale_parent_id_unique" ON "_gallery_albums_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_gallery_albums_v_rels_order_idx" ON "_gallery_albums_v_rels" USING btree ("order");
  CREATE INDEX "_gallery_albums_v_rels_parent_idx" ON "_gallery_albums_v_rels" USING btree ("parent_id");
  CREATE INDEX "_gallery_albums_v_rels_path_idx" ON "_gallery_albums_v_rels" USING btree ("path");
  CREATE INDEX "_gallery_albums_v_rels_media_id_idx" ON "_gallery_albums_v_rels" USING btree ("media_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "document_files_language_order_idx" ON "document_files_language" USING btree ("order");
  CREATE INDEX "document_files_language_parent_idx" ON "document_files_language" USING btree ("parent_id");
  CREATE INDEX "document_files_updated_at_idx" ON "document_files" USING btree ("updated_at");
  CREATE INDEX "document_files_created_at_idx" ON "document_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "document_files_filename_idx" ON "document_files" USING btree ("filename");
  CREATE UNIQUE INDEX "document_files_locales_locale_parent_id_unique" ON "document_files_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_partners_order_idx" ON "projects_partners" USING btree ("_order");
  CREATE INDEX "projects_partners_parent_id_idx" ON "projects_partners" USING btree ("_parent_id");
  CREATE INDEX "projects_partners_logo_idx" ON "projects_partners" USING btree ("logo_id");
  CREATE UNIQUE INDEX "projects_partners_locales_locale_parent_id_unique" ON "projects_partners_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_focus_countries_order_idx" ON "projects_focus_countries" USING btree ("order");
  CREATE INDEX "projects_focus_countries_parent_idx" ON "projects_focus_countries" USING btree ("parent_id");
  CREATE UNIQUE INDEX "projects_symbol_idx" ON "projects" USING btree ("symbol");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE INDEX "projects__status_idx" ON "projects" USING btree ("_status");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "projects_locales_locale_parent_id_unique" ON "projects_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
  CREATE INDEX "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
  CREATE INDEX "projects_rels_path_idx" ON "projects_rels" USING btree ("path");
  CREATE INDEX "projects_rels_media_id_idx" ON "projects_rels" USING btree ("media_id");
  CREATE INDEX "_projects_v_version_partners_order_idx" ON "_projects_v_version_partners" USING btree ("_order");
  CREATE INDEX "_projects_v_version_partners_parent_id_idx" ON "_projects_v_version_partners" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_partners_logo_idx" ON "_projects_v_version_partners" USING btree ("logo_id");
  CREATE UNIQUE INDEX "_projects_v_version_partners_locales_locale_parent_id_unique" ON "_projects_v_version_partners_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_version_focus_countries_order_idx" ON "_projects_v_version_focus_countries" USING btree ("order");
  CREATE INDEX "_projects_v_version_focus_countries_parent_idx" ON "_projects_v_version_focus_countries" USING btree ("parent_id");
  CREATE INDEX "_projects_v_parent_idx" ON "_projects_v" USING btree ("parent_id");
  CREATE INDEX "_projects_v_version_version_symbol_idx" ON "_projects_v" USING btree ("version_symbol");
  CREATE INDEX "_projects_v_version_version_updated_at_idx" ON "_projects_v" USING btree ("version_updated_at");
  CREATE INDEX "_projects_v_version_version_created_at_idx" ON "_projects_v" USING btree ("version_created_at");
  CREATE INDEX "_projects_v_version_version__status_idx" ON "_projects_v" USING btree ("version__status");
  CREATE INDEX "_projects_v_created_at_idx" ON "_projects_v" USING btree ("created_at");
  CREATE INDEX "_projects_v_updated_at_idx" ON "_projects_v" USING btree ("updated_at");
  CREATE INDEX "_projects_v_snapshot_idx" ON "_projects_v" USING btree ("snapshot");
  CREATE INDEX "_projects_v_published_locale_idx" ON "_projects_v" USING btree ("published_locale");
  CREATE INDEX "_projects_v_latest_idx" ON "_projects_v" USING btree ("latest");
  CREATE INDEX "_projects_v_version_version_slug_idx" ON "_projects_v_locales" USING btree ("version_slug","_locale");
  CREATE UNIQUE INDEX "_projects_v_locales_locale_parent_id_unique" ON "_projects_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_rels_order_idx" ON "_projects_v_rels" USING btree ("order");
  CREATE INDEX "_projects_v_rels_parent_idx" ON "_projects_v_rels" USING btree ("parent_id");
  CREATE INDEX "_projects_v_rels_path_idx" ON "_projects_v_rels" USING btree ("path");
  CREATE INDEX "_projects_v_rels_media_id_idx" ON "_projects_v_rels" USING btree ("media_id");
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "search_index_updated_at_idx" ON "search_index" USING btree ("updated_at");
  CREATE INDEX "search_index_created_at_idx" ON "search_index" USING btree ("created_at");
  CREATE UNIQUE INDEX "search_index_locales_locale_parent_id_unique" ON "search_index_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "search_index_rels_order_idx" ON "search_index_rels" USING btree ("order");
  CREATE INDEX "search_index_rels_parent_idx" ON "search_index_rels" USING btree ("parent_id");
  CREATE INDEX "search_index_rels_path_idx" ON "search_index_rels" USING btree ("path");
  CREATE INDEX "search_index_rels_pages_id_idx" ON "search_index_rels" USING btree ("pages_id");
  CREATE INDEX "search_index_rels_training_programs_id_idx" ON "search_index_rels" USING btree ("training_programs_id");
  CREATE INDEX "search_index_rels_training_topics_id_idx" ON "search_index_rels" USING btree ("training_topics_id");
  CREATE INDEX "search_index_rels_news_id_idx" ON "search_index_rels" USING btree ("news_id");
  CREATE INDEX "search_index_rels_simulation_systems_id_idx" ON "search_index_rels" USING btree ("simulation_systems_id");
  CREATE INDEX "search_index_rels_faqs_id_idx" ON "search_index_rels" USING btree ("faqs_id");
  CREATE INDEX "forms_blocks_checkbox_order_idx" ON "forms_blocks_checkbox" USING btree ("_order");
  CREATE INDEX "forms_blocks_checkbox_parent_id_idx" ON "forms_blocks_checkbox" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_checkbox_path_idx" ON "forms_blocks_checkbox" USING btree ("_path");
  CREATE UNIQUE INDEX "forms_blocks_checkbox_locales_locale_parent_id_unique" ON "forms_blocks_checkbox_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "forms_blocks_country_order_idx" ON "forms_blocks_country" USING btree ("_order");
  CREATE INDEX "forms_blocks_country_parent_id_idx" ON "forms_blocks_country" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_country_path_idx" ON "forms_blocks_country" USING btree ("_path");
  CREATE UNIQUE INDEX "forms_blocks_country_locales_locale_parent_id_unique" ON "forms_blocks_country_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "forms_blocks_email_order_idx" ON "forms_blocks_email" USING btree ("_order");
  CREATE INDEX "forms_blocks_email_parent_id_idx" ON "forms_blocks_email" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_email_path_idx" ON "forms_blocks_email" USING btree ("_path");
  CREATE UNIQUE INDEX "forms_blocks_email_locales_locale_parent_id_unique" ON "forms_blocks_email_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "forms_blocks_message_order_idx" ON "forms_blocks_message" USING btree ("_order");
  CREATE INDEX "forms_blocks_message_parent_id_idx" ON "forms_blocks_message" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_message_path_idx" ON "forms_blocks_message" USING btree ("_path");
  CREATE UNIQUE INDEX "forms_blocks_message_locales_locale_parent_id_unique" ON "forms_blocks_message_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "forms_blocks_number_order_idx" ON "forms_blocks_number" USING btree ("_order");
  CREATE INDEX "forms_blocks_number_parent_id_idx" ON "forms_blocks_number" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_number_path_idx" ON "forms_blocks_number" USING btree ("_path");
  CREATE UNIQUE INDEX "forms_blocks_number_locales_locale_parent_id_unique" ON "forms_blocks_number_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "forms_blocks_select_options_order_idx" ON "forms_blocks_select_options" USING btree ("_order");
  CREATE INDEX "forms_blocks_select_options_parent_id_idx" ON "forms_blocks_select_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "forms_blocks_select_options_locales_locale_parent_id_unique" ON "forms_blocks_select_options_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "forms_blocks_select_order_idx" ON "forms_blocks_select" USING btree ("_order");
  CREATE INDEX "forms_blocks_select_parent_id_idx" ON "forms_blocks_select" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_select_path_idx" ON "forms_blocks_select" USING btree ("_path");
  CREATE UNIQUE INDEX "forms_blocks_select_locales_locale_parent_id_unique" ON "forms_blocks_select_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "forms_blocks_text_order_idx" ON "forms_blocks_text" USING btree ("_order");
  CREATE INDEX "forms_blocks_text_parent_id_idx" ON "forms_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_text_path_idx" ON "forms_blocks_text" USING btree ("_path");
  CREATE UNIQUE INDEX "forms_blocks_text_locales_locale_parent_id_unique" ON "forms_blocks_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "forms_blocks_textarea_order_idx" ON "forms_blocks_textarea" USING btree ("_order");
  CREATE INDEX "forms_blocks_textarea_parent_id_idx" ON "forms_blocks_textarea" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_textarea_path_idx" ON "forms_blocks_textarea" USING btree ("_path");
  CREATE UNIQUE INDEX "forms_blocks_textarea_locales_locale_parent_id_unique" ON "forms_blocks_textarea_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "forms_emails_order_idx" ON "forms_emails" USING btree ("_order");
  CREATE INDEX "forms_emails_parent_id_idx" ON "forms_emails" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "forms_emails_locales_locale_parent_id_unique" ON "forms_emails_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "forms_updated_at_idx" ON "forms" USING btree ("updated_at");
  CREATE INDEX "forms_created_at_idx" ON "forms" USING btree ("created_at");
  CREATE UNIQUE INDEX "forms_locales_locale_parent_id_unique" ON "forms_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "form_submissions_submission_data_order_idx" ON "form_submissions_submission_data" USING btree ("_order");
  CREATE INDEX "form_submissions_submission_data_parent_id_idx" ON "form_submissions_submission_data" USING btree ("_parent_id");
  CREATE INDEX "form_submissions_form_idx" ON "form_submissions" USING btree ("form_id");
  CREATE INDEX "form_submissions_updated_at_idx" ON "form_submissions" USING btree ("updated_at");
  CREATE INDEX "form_submissions_created_at_idx" ON "form_submissions" USING btree ("created_at");
  CREATE UNIQUE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE INDEX "redirects_rels_order_idx" ON "redirects_rels" USING btree ("order");
  CREATE INDEX "redirects_rels_parent_idx" ON "redirects_rels" USING btree ("parent_id");
  CREATE INDEX "redirects_rels_path_idx" ON "redirects_rels" USING btree ("path");
  CREATE INDEX "redirects_rels_pages_id_idx" ON "redirects_rels" USING btree ("pages_id");
  CREATE INDEX "redirects_rels_news_id_idx" ON "redirects_rels" USING btree ("news_id");
  CREATE INDEX "redirects_rels_training_programs_id_idx" ON "redirects_rels" USING btree ("training_programs_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_training_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("training_topics_id");
  CREATE INDEX "payload_locked_documents_rels_training_programs_id_idx" ON "payload_locked_documents_rels" USING btree ("training_programs_id");
  CREATE INDEX "payload_locked_documents_rels_simulation_systems_id_idx" ON "payload_locked_documents_rels" USING btree ("simulation_systems_id");
  CREATE INDEX "payload_locked_documents_rels_news_id_idx" ON "payload_locked_documents_rels" USING btree ("news_id");
  CREATE INDEX "payload_locked_documents_rels_international_guide_id_idx" ON "payload_locked_documents_rels" USING btree ("international_guide_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_gallery_albums_id_idx" ON "payload_locked_documents_rels" USING btree ("gallery_albums_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_document_files_id_idx" ON "payload_locked_documents_rels" USING btree ("document_files_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_search_index_id_idx" ON "payload_locked_documents_rels" USING btree ("search_index_id");
  CREATE INDEX "payload_locked_documents_rels_forms_id_idx" ON "payload_locked_documents_rels" USING btree ("forms_id");
  CREATE INDEX "payload_locked_documents_rels_form_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("form_submissions_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_logos_partner_logos_order_idx" ON "site_settings_logos_partner_logos" USING btree ("_order");
  CREATE INDEX "site_settings_logos_partner_logos_parent_id_idx" ON "site_settings_logos_partner_logos" USING btree ("_parent_id");
  CREATE INDEX "site_settings_logos_partner_logos_image_idx" ON "site_settings_logos_partner_logos" USING btree ("image_id");
  CREATE INDEX "site_settings_contact_social_links_order_idx" ON "site_settings_contact_social_links" USING btree ("_order");
  CREATE INDEX "site_settings_contact_social_links_parent_id_idx" ON "site_settings_contact_social_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_logos_logos_primary_idx" ON "site_settings" USING btree ("logos_primary_id");
  CREATE INDEX "site_settings_logos_logos_primary_dark_idx" ON "site_settings" USING btree ("logos_primary_dark_id");
  CREATE INDEX "site_settings_logos_logos_favicon_idx" ON "site_settings" USING btree ("logos_favicon_id");
  CREATE INDEX "site_settings_logos_logos_og_image_idx" ON "site_settings" USING btree ("logos_og_image_id");
  CREATE INDEX "site_settings_contact_map_contact_map_static_map_image_idx" ON "site_settings" USING btree ("contact_map_static_map_image_id");
  CREATE INDEX "site_settings_primary_project_idx" ON "site_settings" USING btree ("primary_project_id");
  CREATE INDEX "site_settings_cookie_banner_cookie_banner_policy_page_idx" ON "site_settings" USING btree ("cookie_banner_policy_page_id");
  CREATE INDEX "site_settings_privacy_notice_page_idx" ON "site_settings" USING btree ("privacy_notice_page_id");
  CREATE INDEX "site_settings_accessibility_statement_page_idx" ON "site_settings" USING btree ("accessibility_statement_page_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_site_settings_v_version_logos_partner_logos_order_idx" ON "_site_settings_v_version_logos_partner_logos" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_logos_partner_logos_parent_id_idx" ON "_site_settings_v_version_logos_partner_logos" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_logos_partner_logos_image_idx" ON "_site_settings_v_version_logos_partner_logos" USING btree ("image_id");
  CREATE INDEX "_site_settings_v_version_contact_social_links_order_idx" ON "_site_settings_v_version_contact_social_links" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_contact_social_links_parent_id_idx" ON "_site_settings_v_version_contact_social_links" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_logos_version_logos_primary_idx" ON "_site_settings_v" USING btree ("version_logos_primary_id");
  CREATE INDEX "_site_settings_v_version_logos_version_logos_primary_dar_idx" ON "_site_settings_v" USING btree ("version_logos_primary_dark_id");
  CREATE INDEX "_site_settings_v_version_logos_version_logos_favicon_idx" ON "_site_settings_v" USING btree ("version_logos_favicon_id");
  CREATE INDEX "_site_settings_v_version_logos_version_logos_og_image_idx" ON "_site_settings_v" USING btree ("version_logos_og_image_id");
  CREATE INDEX "_site_settings_v_version_contact_map_version_contact_map_idx" ON "_site_settings_v" USING btree ("version_contact_map_static_map_image_id");
  CREATE INDEX "_site_settings_v_version_version_primary_project_idx" ON "_site_settings_v" USING btree ("version_primary_project_id");
  CREATE INDEX "_site_settings_v_version_cookie_banner_version_cookie_ba_idx" ON "_site_settings_v" USING btree ("version_cookie_banner_policy_page_id");
  CREATE INDEX "_site_settings_v_version_version_privacy_notice_page_idx" ON "_site_settings_v" USING btree ("version_privacy_notice_page_id");
  CREATE INDEX "_site_settings_v_version_version_accessibility_statement_idx" ON "_site_settings_v" USING btree ("version_accessibility_statement_page_id");
  CREATE INDEX "_site_settings_v_created_at_idx" ON "_site_settings_v" USING btree ("created_at");
  CREATE INDEX "_site_settings_v_updated_at_idx" ON "_site_settings_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "_site_settings_v_locales_locale_parent_id_unique" ON "_site_settings_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_main_menu_children_order_idx" ON "navigation_main_menu_children" USING btree ("_order");
  CREATE INDEX "navigation_main_menu_children_parent_id_idx" ON "navigation_main_menu_children" USING btree ("_parent_id");
  CREATE INDEX "navigation_main_menu_children_page_idx" ON "navigation_main_menu_children" USING btree ("page_id");
  CREATE UNIQUE INDEX "navigation_main_menu_children_locales_locale_parent_id_uniqu" ON "navigation_main_menu_children_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_main_menu_order_idx" ON "navigation_main_menu" USING btree ("_order");
  CREATE INDEX "navigation_main_menu_parent_id_idx" ON "navigation_main_menu" USING btree ("_parent_id");
  CREATE INDEX "navigation_main_menu_page_idx" ON "navigation_main_menu" USING btree ("page_id");
  CREATE UNIQUE INDEX "navigation_main_menu_locales_locale_parent_id_unique" ON "navigation_main_menu_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_footer_columns_links_order_idx" ON "navigation_footer_columns_links" USING btree ("_order");
  CREATE INDEX "navigation_footer_columns_links_parent_id_idx" ON "navigation_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_columns_links_page_idx" ON "navigation_footer_columns_links" USING btree ("page_id");
  CREATE UNIQUE INDEX "navigation_footer_columns_links_locales_locale_parent_id_uni" ON "navigation_footer_columns_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_footer_columns_order_idx" ON "navigation_footer_columns" USING btree ("_order");
  CREATE INDEX "navigation_footer_columns_parent_id_idx" ON "navigation_footer_columns" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_footer_columns_locales_locale_parent_id_unique" ON "navigation_footer_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_footer_legal_links_order_idx" ON "navigation_footer_legal_links" USING btree ("_order");
  CREATE INDEX "navigation_footer_legal_links_parent_id_idx" ON "navigation_footer_legal_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_legal_links_page_idx" ON "navigation_footer_legal_links" USING btree ("page_id");
  CREATE UNIQUE INDEX "navigation_footer_legal_links_locales_locale_parent_id_uniqu" ON "navigation_footer_legal_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_quick_access_order_idx" ON "navigation_quick_access" USING btree ("_order");
  CREATE INDEX "navigation_quick_access_parent_id_idx" ON "navigation_quick_access" USING btree ("_parent_id");
  CREATE INDEX "navigation_quick_access_page_idx" ON "navigation_quick_access" USING btree ("page_id");
  CREATE INDEX "navigation_quick_access_icon_idx" ON "navigation_quick_access" USING btree ("icon_id");
  CREATE UNIQUE INDEX "navigation_quick_access_locales_locale_parent_id_unique" ON "navigation_quick_access_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_navigation_v_version_main_menu_children_order_idx" ON "_navigation_v_version_main_menu_children" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_main_menu_children_parent_id_idx" ON "_navigation_v_version_main_menu_children" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_main_menu_children_page_idx" ON "_navigation_v_version_main_menu_children" USING btree ("page_id");
  CREATE UNIQUE INDEX "_navigation_v_version_main_menu_children_locales_locale_pare" ON "_navigation_v_version_main_menu_children_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_navigation_v_version_main_menu_order_idx" ON "_navigation_v_version_main_menu" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_main_menu_parent_id_idx" ON "_navigation_v_version_main_menu" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_main_menu_page_idx" ON "_navigation_v_version_main_menu" USING btree ("page_id");
  CREATE UNIQUE INDEX "_navigation_v_version_main_menu_locales_locale_parent_id_uni" ON "_navigation_v_version_main_menu_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_navigation_v_version_footer_columns_links_order_idx" ON "_navigation_v_version_footer_columns_links" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_footer_columns_links_parent_id_idx" ON "_navigation_v_version_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_footer_columns_links_page_idx" ON "_navigation_v_version_footer_columns_links" USING btree ("page_id");
  CREATE UNIQUE INDEX "_navigation_v_version_footer_columns_links_locales_locale_pa" ON "_navigation_v_version_footer_columns_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_navigation_v_version_footer_columns_order_idx" ON "_navigation_v_version_footer_columns" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_footer_columns_parent_id_idx" ON "_navigation_v_version_footer_columns" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_navigation_v_version_footer_columns_locales_locale_parent_i" ON "_navigation_v_version_footer_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_navigation_v_version_footer_legal_links_order_idx" ON "_navigation_v_version_footer_legal_links" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_footer_legal_links_parent_id_idx" ON "_navigation_v_version_footer_legal_links" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_footer_legal_links_page_idx" ON "_navigation_v_version_footer_legal_links" USING btree ("page_id");
  CREATE UNIQUE INDEX "_navigation_v_version_footer_legal_links_locales_locale_pare" ON "_navigation_v_version_footer_legal_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_navigation_v_version_quick_access_order_idx" ON "_navigation_v_version_quick_access" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_quick_access_parent_id_idx" ON "_navigation_v_version_quick_access" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_quick_access_page_idx" ON "_navigation_v_version_quick_access" USING btree ("page_id");
  CREATE INDEX "_navigation_v_version_quick_access_icon_idx" ON "_navigation_v_version_quick_access" USING btree ("icon_id");
  CREATE UNIQUE INDEX "_navigation_v_version_quick_access_locales_locale_parent_id_" ON "_navigation_v_version_quick_access_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_navigation_v_created_at_idx" ON "_navigation_v" USING btree ("created_at");
  CREATE INDEX "_navigation_v_updated_at_idx" ON "_navigation_v" USING btree ("updated_at");
  CREATE INDEX "feat_cols_order_idx" ON "feat_cols" USING btree ("_order");
  CREATE INDEX "feat_cols_parent_id_idx" ON "feat_cols" USING btree ("_parent_id");
  CREATE INDEX "feat_cols_icon_idx" ON "feat_cols" USING btree ("icon_id");
  CREATE UNIQUE INDEX "feat_cols_locales_locale_parent_id_unique" ON "feat_cols_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "external_services_additional_order_idx" ON "external_services_additional" USING btree ("_order");
  CREATE INDEX "external_services_additional_parent_id_idx" ON "external_services_additional" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "external_services_additional_locales_locale_parent_id_unique" ON "external_services_additional_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "external_services_locales_locale_parent_id_unique" ON "external_services_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_feat_cols_v_order_idx" ON "_feat_cols_v" USING btree ("_order");
  CREATE INDEX "_feat_cols_v_parent_id_idx" ON "_feat_cols_v" USING btree ("_parent_id");
  CREATE INDEX "_feat_cols_v_icon_idx" ON "_feat_cols_v" USING btree ("icon_id");
  CREATE UNIQUE INDEX "_feat_cols_v_locales_locale_parent_id_unique" ON "_feat_cols_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_external_services_v_version_additional_order_idx" ON "_external_services_v_version_additional" USING btree ("_order");
  CREATE INDEX "_external_services_v_version_additional_parent_id_idx" ON "_external_services_v_version_additional" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_external_services_v_version_additional_locales_locale_paren" ON "_external_services_v_version_additional_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_external_services_v_created_at_idx" ON "_external_services_v" USING btree ("created_at");
  CREATE INDEX "_external_services_v_updated_at_idx" ON "_external_services_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "_external_services_v_locales_locale_parent_id_unique" ON "_external_services_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "simulation_center_capacity_highlights_order_idx" ON "simulation_center_capacity_highlights" USING btree ("_order");
  CREATE INDEX "simulation_center_capacity_highlights_parent_id_idx" ON "simulation_center_capacity_highlights" USING btree ("_parent_id");
  CREATE INDEX "simulation_center_capacity_highlights_locale_idx" ON "simulation_center_capacity_highlights" USING btree ("_locale");
  CREATE INDEX "simulation_center_hero_image_idx" ON "simulation_center" USING btree ("hero_image_id");
  CREATE INDEX "simulation_center_intro_video_intro_video_poster_idx" ON "simulation_center" USING btree ("intro_video_poster_id");
  CREATE INDEX "simulation_center__status_idx" ON "simulation_center" USING btree ("_status");
  CREATE UNIQUE INDEX "simulation_center_locales_locale_parent_id_unique" ON "simulation_center_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_simulation_center_v_version_capacity_highlights_order_idx" ON "_simulation_center_v_version_capacity_highlights" USING btree ("_order");
  CREATE INDEX "_simulation_center_v_version_capacity_highlights_parent_id_idx" ON "_simulation_center_v_version_capacity_highlights" USING btree ("_parent_id");
  CREATE INDEX "_simulation_center_v_version_capacity_highlights_locale_idx" ON "_simulation_center_v_version_capacity_highlights" USING btree ("_locale");
  CREATE INDEX "_simulation_center_v_version_version_hero_image_idx" ON "_simulation_center_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_simulation_center_v_version_intro_video_version_intro_v_idx" ON "_simulation_center_v" USING btree ("version_intro_video_poster_id");
  CREATE INDEX "_simulation_center_v_version_version__status_idx" ON "_simulation_center_v" USING btree ("version__status");
  CREATE INDEX "_simulation_center_v_created_at_idx" ON "_simulation_center_v" USING btree ("created_at");
  CREATE INDEX "_simulation_center_v_updated_at_idx" ON "_simulation_center_v" USING btree ("updated_at");
  CREATE INDEX "_simulation_center_v_snapshot_idx" ON "_simulation_center_v" USING btree ("snapshot");
  CREATE INDEX "_simulation_center_v_published_locale_idx" ON "_simulation_center_v" USING btree ("published_locale");
  CREATE INDEX "_simulation_center_v_latest_idx" ON "_simulation_center_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_simulation_center_v_locales_locale_parent_id_unique" ON "_simulation_center_v_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "training_topics_learning_outcomes" CASCADE;
  DROP TABLE "training_topics_level" CASCADE;
  DROP TABLE "training_topics" CASCADE;
  DROP TABLE "training_topics_locales" CASCADE;
  DROP TABLE "training_topics_texts" CASCADE;
  DROP TABLE "training_topics_rels" CASCADE;
  DROP TABLE "_training_topics_v_version_learning_outcomes" CASCADE;
  DROP TABLE "_training_topics_v_version_level" CASCADE;
  DROP TABLE "_training_topics_v" CASCADE;
  DROP TABLE "_training_topics_v_locales" CASCADE;
  DROP TABLE "_training_topics_v_texts" CASCADE;
  DROP TABLE "_training_topics_v_rels" CASCADE;
  DROP TABLE "training_programs_instruction_languages" CASCADE;
  DROP TABLE "training_programs_participant_countries" CASCADE;
  DROP TABLE "training_programs_learning_outcomes" CASCADE;
  DROP TABLE "training_programs_schedule_sessions" CASCADE;
  DROP TABLE "training_programs_schedule" CASCADE;
  DROP TABLE "training_programs_trainers" CASCADE;
  DROP TABLE "training_programs_trainers_locales" CASCADE;
  DROP TABLE "training_programs_issuing_bodies" CASCADE;
  DROP TABLE "training_programs_issuing_bodies_locales" CASCADE;
  DROP TABLE "training_programs" CASCADE;
  DROP TABLE "training_programs_locales" CASCADE;
  DROP TABLE "training_programs_rels" CASCADE;
  DROP TABLE "_training_programs_v_version_instruction_languages" CASCADE;
  DROP TABLE "_training_programs_v_version_participant_countries" CASCADE;
  DROP TABLE "_training_programs_v_version_learning_outcomes" CASCADE;
  DROP TABLE "_training_programs_v_version_schedule_sessions" CASCADE;
  DROP TABLE "_training_programs_v_version_schedule" CASCADE;
  DROP TABLE "_training_programs_v_version_trainers" CASCADE;
  DROP TABLE "_training_programs_v_version_trainers_locales" CASCADE;
  DROP TABLE "_training_programs_v_version_issuing_bodies" CASCADE;
  DROP TABLE "_training_programs_v_version_issuing_bodies_locales" CASCADE;
  DROP TABLE "_training_programs_v" CASCADE;
  DROP TABLE "_training_programs_v_locales" CASCADE;
  DROP TABLE "_training_programs_v_rels" CASCADE;
  DROP TABLE "simulation_systems_use_cases" CASCADE;
  DROP TABLE "simulation_systems_technical_specs" CASCADE;
  DROP TABLE "simulation_systems_access_links" CASCADE;
  DROP TABLE "simulation_systems_access_links_locales" CASCADE;
  DROP TABLE "simulation_systems_videos" CASCADE;
  DROP TABLE "simulation_systems_videos_locales" CASCADE;
  DROP TABLE "simulation_systems" CASCADE;
  DROP TABLE "simulation_systems_locales" CASCADE;
  DROP TABLE "simulation_systems_rels" CASCADE;
  DROP TABLE "_simulation_systems_v_version_use_cases" CASCADE;
  DROP TABLE "_simulation_systems_v_version_technical_specs" CASCADE;
  DROP TABLE "_simulation_systems_v_version_access_links" CASCADE;
  DROP TABLE "_simulation_systems_v_version_access_links_locales" CASCADE;
  DROP TABLE "_simulation_systems_v_version_videos" CASCADE;
  DROP TABLE "_simulation_systems_v_version_videos_locales" CASCADE;
  DROP TABLE "_simulation_systems_v" CASCADE;
  DROP TABLE "_simulation_systems_v_locales" CASCADE;
  DROP TABLE "_simulation_systems_v_rels" CASCADE;
  DROP TABLE "news_countries" CASCADE;
  DROP TABLE "news" CASCADE;
  DROP TABLE "news_locales" CASCADE;
  DROP TABLE "news_rels" CASCADE;
  DROP TABLE "_news_v_version_countries" CASCADE;
  DROP TABLE "_news_v" CASCADE;
  DROP TABLE "_news_v_locales" CASCADE;
  DROP TABLE "_news_v_rels" CASCADE;
  DROP TABLE "international_guide_countries" CASCADE;
  DROP TABLE "international_guide_country_notes" CASCADE;
  DROP TABLE "international_guide_country_notes_locales" CASCADE;
  DROP TABLE "international_guide_links" CASCADE;
  DROP TABLE "international_guide_links_locales" CASCADE;
  DROP TABLE "international_guide" CASCADE;
  DROP TABLE "international_guide_locales" CASCADE;
  DROP TABLE "international_guide_rels" CASCADE;
  DROP TABLE "_international_guide_v_version_countries" CASCADE;
  DROP TABLE "_international_guide_v_version_country_notes" CASCADE;
  DROP TABLE "_international_guide_v_version_country_notes_locales" CASCADE;
  DROP TABLE "_international_guide_v_version_links" CASCADE;
  DROP TABLE "_international_guide_v_version_links_locales" CASCADE;
  DROP TABLE "_international_guide_v" CASCADE;
  DROP TABLE "_international_guide_v_locales" CASCADE;
  DROP TABLE "_international_guide_v_rels" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "faqs_locales" CASCADE;
  DROP TABLE "_faqs_v" CASCADE;
  DROP TABLE "_faqs_v_locales" CASCADE;
  DROP TABLE "pages_blocks_rich_text" CASCADE;
  DROP TABLE "pages_blocks_media_block" CASCADE;
  DROP TABLE "pages_blocks_stats_block_items" CASCADE;
  DROP TABLE "pages_blocks_stats_block" CASCADE;
  DROP TABLE "pages_blocks_people_block_people" CASCADE;
  DROP TABLE "pages_blocks_people_block" CASCADE;
  DROP TABLE "pages_blocks_partners_block_partners" CASCADE;
  DROP TABLE "pages_blocks_partners_block" CASCADE;
  DROP TABLE "pages_blocks_timeline_block_entries" CASCADE;
  DROP TABLE "pages_blocks_timeline_block" CASCADE;
  DROP TABLE "pages_blocks_cta_block" CASCADE;
  DROP TABLE "pages_blocks_faq_block" CASCADE;
  DROP TABLE "pages_blocks_contact_block" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text" CASCADE;
  DROP TABLE "_pages_v_blocks_media_block" CASCADE;
  DROP TABLE "_pages_v_blocks_stats_block_items" CASCADE;
  DROP TABLE "_pages_v_blocks_stats_block" CASCADE;
  DROP TABLE "_pages_v_blocks_people_block_people" CASCADE;
  DROP TABLE "_pages_v_blocks_people_block" CASCADE;
  DROP TABLE "_pages_v_blocks_partners_block_partners" CASCADE;
  DROP TABLE "_pages_v_blocks_partners_block" CASCADE;
  DROP TABLE "_pages_v_blocks_timeline_block_entries" CASCADE;
  DROP TABLE "_pages_v_blocks_timeline_block" CASCADE;
  DROP TABLE "_pages_v_blocks_cta_block" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_block" CASCADE;
  DROP TABLE "_pages_v_blocks_contact_block" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;
  DROP TABLE "_pages_v_rels" CASCADE;
  DROP TABLE "gallery_albums_videos" CASCADE;
  DROP TABLE "gallery_albums_videos_locales" CASCADE;
  DROP TABLE "gallery_albums" CASCADE;
  DROP TABLE "gallery_albums_locales" CASCADE;
  DROP TABLE "gallery_albums_rels" CASCADE;
  DROP TABLE "_gallery_albums_v_version_videos" CASCADE;
  DROP TABLE "_gallery_albums_v_version_videos_locales" CASCADE;
  DROP TABLE "_gallery_albums_v" CASCADE;
  DROP TABLE "_gallery_albums_v_locales" CASCADE;
  DROP TABLE "_gallery_albums_v_rels" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "document_files_language" CASCADE;
  DROP TABLE "document_files" CASCADE;
  DROP TABLE "document_files_locales" CASCADE;
  DROP TABLE "projects_partners" CASCADE;
  DROP TABLE "projects_partners_locales" CASCADE;
  DROP TABLE "projects_focus_countries" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "projects_locales" CASCADE;
  DROP TABLE "projects_rels" CASCADE;
  DROP TABLE "_projects_v_version_partners" CASCADE;
  DROP TABLE "_projects_v_version_partners_locales" CASCADE;
  DROP TABLE "_projects_v_version_focus_countries" CASCADE;
  DROP TABLE "_projects_v" CASCADE;
  DROP TABLE "_projects_v_locales" CASCADE;
  DROP TABLE "_projects_v_rels" CASCADE;
  DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "search_index" CASCADE;
  DROP TABLE "search_index_locales" CASCADE;
  DROP TABLE "search_index_rels" CASCADE;
  DROP TABLE "forms_blocks_checkbox" CASCADE;
  DROP TABLE "forms_blocks_checkbox_locales" CASCADE;
  DROP TABLE "forms_blocks_country" CASCADE;
  DROP TABLE "forms_blocks_country_locales" CASCADE;
  DROP TABLE "forms_blocks_email" CASCADE;
  DROP TABLE "forms_blocks_email_locales" CASCADE;
  DROP TABLE "forms_blocks_message" CASCADE;
  DROP TABLE "forms_blocks_message_locales" CASCADE;
  DROP TABLE "forms_blocks_number" CASCADE;
  DROP TABLE "forms_blocks_number_locales" CASCADE;
  DROP TABLE "forms_blocks_select_options" CASCADE;
  DROP TABLE "forms_blocks_select_options_locales" CASCADE;
  DROP TABLE "forms_blocks_select" CASCADE;
  DROP TABLE "forms_blocks_select_locales" CASCADE;
  DROP TABLE "forms_blocks_text" CASCADE;
  DROP TABLE "forms_blocks_text_locales" CASCADE;
  DROP TABLE "forms_blocks_textarea" CASCADE;
  DROP TABLE "forms_blocks_textarea_locales" CASCADE;
  DROP TABLE "forms_emails" CASCADE;
  DROP TABLE "forms_emails_locales" CASCADE;
  DROP TABLE "forms" CASCADE;
  DROP TABLE "forms_locales" CASCADE;
  DROP TABLE "form_submissions_submission_data" CASCADE;
  DROP TABLE "form_submissions" CASCADE;
  DROP TABLE "redirects" CASCADE;
  DROP TABLE "redirects_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings_logos_partner_logos" CASCADE;
  DROP TABLE "site_settings_contact_social_links" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TABLE "_site_settings_v_version_logos_partner_logos" CASCADE;
  DROP TABLE "_site_settings_v_version_contact_social_links" CASCADE;
  DROP TABLE "_site_settings_v" CASCADE;
  DROP TABLE "_site_settings_v_locales" CASCADE;
  DROP TABLE "navigation_main_menu_children" CASCADE;
  DROP TABLE "navigation_main_menu_children_locales" CASCADE;
  DROP TABLE "navigation_main_menu" CASCADE;
  DROP TABLE "navigation_main_menu_locales" CASCADE;
  DROP TABLE "navigation_footer_columns_links" CASCADE;
  DROP TABLE "navigation_footer_columns_links_locales" CASCADE;
  DROP TABLE "navigation_footer_columns" CASCADE;
  DROP TABLE "navigation_footer_columns_locales" CASCADE;
  DROP TABLE "navigation_footer_legal_links" CASCADE;
  DROP TABLE "navigation_footer_legal_links_locales" CASCADE;
  DROP TABLE "navigation_quick_access" CASCADE;
  DROP TABLE "navigation_quick_access_locales" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TABLE "_navigation_v_version_main_menu_children" CASCADE;
  DROP TABLE "_navigation_v_version_main_menu_children_locales" CASCADE;
  DROP TABLE "_navigation_v_version_main_menu" CASCADE;
  DROP TABLE "_navigation_v_version_main_menu_locales" CASCADE;
  DROP TABLE "_navigation_v_version_footer_columns_links" CASCADE;
  DROP TABLE "_navigation_v_version_footer_columns_links_locales" CASCADE;
  DROP TABLE "_navigation_v_version_footer_columns" CASCADE;
  DROP TABLE "_navigation_v_version_footer_columns_locales" CASCADE;
  DROP TABLE "_navigation_v_version_footer_legal_links" CASCADE;
  DROP TABLE "_navigation_v_version_footer_legal_links_locales" CASCADE;
  DROP TABLE "_navigation_v_version_quick_access" CASCADE;
  DROP TABLE "_navigation_v_version_quick_access_locales" CASCADE;
  DROP TABLE "_navigation_v" CASCADE;
  DROP TABLE "feat_cols" CASCADE;
  DROP TABLE "feat_cols_locales" CASCADE;
  DROP TABLE "external_services_additional" CASCADE;
  DROP TABLE "external_services_additional_locales" CASCADE;
  DROP TABLE "external_services" CASCADE;
  DROP TABLE "external_services_locales" CASCADE;
  DROP TABLE "_feat_cols_v" CASCADE;
  DROP TABLE "_feat_cols_v_locales" CASCADE;
  DROP TABLE "_external_services_v_version_additional" CASCADE;
  DROP TABLE "_external_services_v_version_additional_locales" CASCADE;
  DROP TABLE "_external_services_v" CASCADE;
  DROP TABLE "_external_services_v_locales" CASCADE;
  DROP TABLE "simulation_center_capacity_highlights" CASCADE;
  DROP TABLE "simulation_center" CASCADE;
  DROP TABLE "simulation_center_locales" CASCADE;
  DROP TABLE "_simulation_center_v_version_capacity_highlights" CASCADE;
  DROP TABLE "_simulation_center_v" CASCADE;
  DROP TABLE "_simulation_center_v_locales" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_training_topics_level";
  DROP TYPE "public"."enum_training_topics_category";
  DROP TYPE "public"."enum_training_topics_status";
  DROP TYPE "public"."enum__training_topics_v_version_level";
  DROP TYPE "public"."enum__training_topics_v_version_category";
  DROP TYPE "public"."enum__training_topics_v_version_status";
  DROP TYPE "public"."enum__training_topics_v_published_locale";
  DROP TYPE "public"."enum_training_programs_instruction_languages";
  DROP TYPE "public"."enum_training_programs_participant_countries";
  DROP TYPE "public"."enum_training_programs_schedule_sessions_type";
  DROP TYPE "public"."program_status";
  DROP TYPE "public"."enum_training_programs_delivery_mode";
  DROP TYPE "public"."enum_training_programs_level";
  DROP TYPE "public"."enum_training_programs_application_target_type";
  DROP TYPE "public"."enum_training_programs_certificate_type";
  DROP TYPE "public"."enum_training_programs_status";
  DROP TYPE "public"."enum__training_programs_v_version_instruction_languages";
  DROP TYPE "public"."enum__training_programs_v_version_participant_countries";
  DROP TYPE "public"."enum__training_programs_v_version_schedule_sessions_type";
  DROP TYPE "public"."enum__training_programs_v_version_delivery_mode";
  DROP TYPE "public"."enum__training_programs_v_version_level";
  DROP TYPE "public"."enum__training_programs_v_version_application_target_type";
  DROP TYPE "public"."enum__training_programs_v_version_certificate_type";
  DROP TYPE "public"."enum__training_programs_v_version_status";
  DROP TYPE "public"."enum__training_programs_v_published_locale";
  DROP TYPE "public"."enum_simulation_systems_access_links_audience";
  DROP TYPE "public"."enum_simulation_systems_status";
  DROP TYPE "public"."enum__simulation_systems_v_version_access_links_audience";
  DROP TYPE "public"."enum__simulation_systems_v_version_status";
  DROP TYPE "public"."enum__simulation_systems_v_published_locale";
  DROP TYPE "public"."enum_news_countries";
  DROP TYPE "public"."enum_news_kind";
  DROP TYPE "public"."enum_news_category";
  DROP TYPE "public"."enum_news_status";
  DROP TYPE "public"."enum__news_v_version_countries";
  DROP TYPE "public"."enum__news_v_version_kind";
  DROP TYPE "public"."enum__news_v_version_category";
  DROP TYPE "public"."enum__news_v_version_status";
  DROP TYPE "public"."enum__news_v_published_locale";
  DROP TYPE "public"."enum_international_guide_countries";
  DROP TYPE "public"."enum_international_guide_country_notes_country";
  DROP TYPE "public"."enum_international_guide_section_key";
  DROP TYPE "public"."enum_international_guide_status";
  DROP TYPE "public"."enum__international_guide_v_version_countries";
  DROP TYPE "public"."enum__international_guide_v_version_country_notes_country";
  DROP TYPE "public"."enum__international_guide_v_version_section_key";
  DROP TYPE "public"."enum__international_guide_v_version_status";
  DROP TYPE "public"."enum__international_guide_v_published_locale";
  DROP TYPE "public"."enum_faqs_group";
  DROP TYPE "public"."enum_faqs_status";
  DROP TYPE "public"."enum__faqs_v_version_group";
  DROP TYPE "public"."enum__faqs_v_version_status";
  DROP TYPE "public"."enum__faqs_v_published_locale";
  DROP TYPE "public"."enum_pages_blocks_media_block_width";
  DROP TYPE "public"."enum_pages_blocks_cta_block_target";
  DROP TYPE "public"."enum_pages_page_type";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_media_block_width";
  DROP TYPE "public"."enum__pages_v_blocks_cta_block_target";
  DROP TYPE "public"."enum__pages_v_version_page_type";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum__pages_v_published_locale";
  DROP TYPE "public"."enum_gallery_albums_album_type";
  DROP TYPE "public"."enum_gallery_albums_status";
  DROP TYPE "public"."enum__gallery_albums_v_version_album_type";
  DROP TYPE "public"."enum__gallery_albums_v_version_status";
  DROP TYPE "public"."enum__gallery_albums_v_published_locale";
  DROP TYPE "public"."enum_media_media_type";
  DROP TYPE "public"."enum_document_files_language";
  DROP TYPE "public"."enum_document_files_document_type";
  DROP TYPE "public"."enum_document_files_access_level";
  DROP TYPE "public"."enum_document_files_license";
  DROP TYPE "public"."enum_projects_focus_countries";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum__projects_v_version_focus_countries";
  DROP TYPE "public"."enum__projects_v_version_status";
  DROP TYPE "public"."enum__projects_v_published_locale";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_users_preferred_admin_language";
  DROP TYPE "public"."enum_forms_confirmation_type";
  DROP TYPE "public"."enum_redirects_to_type";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_navigation_main_menu_children_type";
  DROP TYPE "public"."enum_navigation_main_menu_children_route";
  DROP TYPE "public"."enum_navigation_main_menu_type";
  DROP TYPE "public"."enum_navigation_main_menu_route";
  DROP TYPE "public"."enum_navigation_footer_columns_links_type";
  DROP TYPE "public"."enum_navigation_footer_columns_links_route";
  DROP TYPE "public"."enum_navigation_footer_legal_links_type";
  DROP TYPE "public"."enum_navigation_footer_legal_links_route";
  DROP TYPE "public"."enum_navigation_quick_access_type";
  DROP TYPE "public"."enum_navigation_quick_access_route";
  DROP TYPE "public"."enum__navigation_v_version_main_menu_children_type";
  DROP TYPE "public"."enum__navigation_v_version_main_menu_children_route";
  DROP TYPE "public"."enum__navigation_v_version_main_menu_type";
  DROP TYPE "public"."enum__navigation_v_version_main_menu_route";
  DROP TYPE "public"."enum__navigation_v_version_footer_columns_links_type";
  DROP TYPE "public"."enum__navigation_v_version_footer_columns_links_route";
  DROP TYPE "public"."enum__navigation_v_version_footer_legal_links_type";
  DROP TYPE "public"."enum__navigation_v_version_footer_legal_links_route";
  DROP TYPE "public"."enum__navigation_v_version_quick_access_type";
  DROP TYPE "public"."enum__navigation_v_version_quick_access_route";
  DROP TYPE "public"."enum_external_services_library_status";
  DROP TYPE "public"."enum_external_services_portal_status";
  DROP TYPE "public"."enum__external_services_v_version_library_status";
  DROP TYPE "public"."enum__external_services_v_version_portal_status";
  DROP TYPE "public"."enum_simulation_center_status";
  DROP TYPE "public"."enum__simulation_center_v_version_status";
  DROP TYPE "public"."enum__simulation_center_v_published_locale";`)
}
