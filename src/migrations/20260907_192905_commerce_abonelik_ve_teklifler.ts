import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_subscription_plans_currency" AS ENUM('TRY', 'EUR', 'USD');
  CREATE TYPE "public"."enum_subscription_plans_default_billing_period" AS ENUM('monthly', 'yearly');
  CREATE TYPE "public"."enum_subscription_plans_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__subscription_plans_v_version_currency" AS ENUM('TRY', 'EUR', 'USD');
  CREATE TYPE "public"."enum__subscription_plans_v_version_default_billing_period" AS ENUM('monthly', 'yearly');
  CREATE TYPE "public"."enum__subscription_plans_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__subscription_plans_v_published_locale" AS ENUM('tr', 'en', 'ru');
  CREATE TYPE "public"."enum_quotes_status" AS ENUM('draft', 'pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_quotes_currency" AS ENUM('TRY', 'EUR', 'USD');
  CREATE TABLE "subscription_plans_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "subscription_plans" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" numeric DEFAULT 100,
  	"translation_status" jsonb,
  	"currency" "enum_subscription_plans_currency" DEFAULT 'TRY',
  	"monthly_price" numeric,
  	"yearly_price" numeric,
  	"default_billing_period" "enum_subscription_plans_default_billing_period" DEFAULT 'yearly',
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_subscription_plans_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "subscription_plans_locales" (
  	"slug" varchar,
  	"name" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_subscription_plans_v_version_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_subscription_plans_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_order" numeric DEFAULT 100,
  	"version_translation_status" jsonb,
  	"version_currency" "enum__subscription_plans_v_version_currency" DEFAULT 'TRY',
  	"version_monthly_price" numeric,
  	"version_yearly_price" numeric,
  	"version_default_billing_period" "enum__subscription_plans_v_version_default_billing_period" DEFAULT 'yearly',
  	"version_featured" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__subscription_plans_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__subscription_plans_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_subscription_plans_v_locales" (
  	"version_slug" varchar,
  	"version_name" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "quotes_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"description" varchar NOT NULL,
  	"quantity" numeric DEFAULT 1 NOT NULL,
  	"unit_price" numeric NOT NULL,
  	"line_total" numeric
  );
  
  CREATE TABLE "quotes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"quote_number" varchar NOT NULL,
  	"status" "enum_quotes_status" DEFAULT 'draft' NOT NULL,
  	"valid_until" timestamp(3) with time zone NOT NULL,
  	"customer_name" varchar NOT NULL,
  	"customer_user_id" integer,
  	"contact_person" varchar,
  	"contact_email" varchar,
  	"currency" "enum_quotes_currency" DEFAULT 'TRY' NOT NULL,
  	"total" numeric,
  	"internal_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "subscription_plan_id" integer;
  ALTER TABLE "users" ADD COLUMN "subscription_ends_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "subscription_plans_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "quotes_id" integer;
  ALTER TABLE "subscription_plans_features" ADD CONSTRAINT "subscription_plans_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_plans_locales" ADD CONSTRAINT "subscription_plans_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_subscription_plans_v_version_features" ADD CONSTRAINT "_subscription_plans_v_version_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_subscription_plans_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_subscription_plans_v" ADD CONSTRAINT "_subscription_plans_v_parent_id_subscription_plans_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."subscription_plans"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_subscription_plans_v_locales" ADD CONSTRAINT "_subscription_plans_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_subscription_plans_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "quotes_items" ADD CONSTRAINT "quotes_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "subscription_plans_features_order_idx" ON "subscription_plans_features" USING btree ("_order");
  CREATE INDEX "subscription_plans_features_parent_id_idx" ON "subscription_plans_features" USING btree ("_parent_id");
  CREATE INDEX "subscription_plans_features_locale_idx" ON "subscription_plans_features" USING btree ("_locale");
  CREATE INDEX "subscription_plans_updated_at_idx" ON "subscription_plans" USING btree ("updated_at");
  CREATE INDEX "subscription_plans_created_at_idx" ON "subscription_plans" USING btree ("created_at");
  CREATE INDEX "subscription_plans__status_idx" ON "subscription_plans" USING btree ("_status");
  CREATE UNIQUE INDEX "subscription_plans_slug_idx" ON "subscription_plans_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "subscription_plans_locales_locale_parent_id_unique" ON "subscription_plans_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_subscription_plans_v_version_features_order_idx" ON "_subscription_plans_v_version_features" USING btree ("_order");
  CREATE INDEX "_subscription_plans_v_version_features_parent_id_idx" ON "_subscription_plans_v_version_features" USING btree ("_parent_id");
  CREATE INDEX "_subscription_plans_v_version_features_locale_idx" ON "_subscription_plans_v_version_features" USING btree ("_locale");
  CREATE INDEX "_subscription_plans_v_parent_idx" ON "_subscription_plans_v" USING btree ("parent_id");
  CREATE INDEX "_subscription_plans_v_version_version_updated_at_idx" ON "_subscription_plans_v" USING btree ("version_updated_at");
  CREATE INDEX "_subscription_plans_v_version_version_created_at_idx" ON "_subscription_plans_v" USING btree ("version_created_at");
  CREATE INDEX "_subscription_plans_v_version_version__status_idx" ON "_subscription_plans_v" USING btree ("version__status");
  CREATE INDEX "_subscription_plans_v_created_at_idx" ON "_subscription_plans_v" USING btree ("created_at");
  CREATE INDEX "_subscription_plans_v_updated_at_idx" ON "_subscription_plans_v" USING btree ("updated_at");
  CREATE INDEX "_subscription_plans_v_snapshot_idx" ON "_subscription_plans_v" USING btree ("snapshot");
  CREATE INDEX "_subscription_plans_v_published_locale_idx" ON "_subscription_plans_v" USING btree ("published_locale");
  CREATE INDEX "_subscription_plans_v_latest_idx" ON "_subscription_plans_v" USING btree ("latest");
  CREATE INDEX "_subscription_plans_v_version_version_slug_idx" ON "_subscription_plans_v_locales" USING btree ("version_slug","_locale");
  CREATE UNIQUE INDEX "_subscription_plans_v_locales_locale_parent_id_unique" ON "_subscription_plans_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "quotes_items_order_idx" ON "quotes_items" USING btree ("_order");
  CREATE INDEX "quotes_items_parent_id_idx" ON "quotes_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "quotes_quote_number_idx" ON "quotes" USING btree ("quote_number");
  CREATE INDEX "quotes_status_idx" ON "quotes" USING btree ("status");
  CREATE INDEX "quotes_valid_until_idx" ON "quotes" USING btree ("valid_until");
  CREATE INDEX "quotes_customer_name_idx" ON "quotes" USING btree ("customer_name");
  CREATE INDEX "quotes_customer_user_idx" ON "quotes" USING btree ("customer_user_id");
  CREATE INDEX "quotes_total_idx" ON "quotes" USING btree ("total");
  CREATE INDEX "quotes_updated_at_idx" ON "quotes" USING btree ("updated_at");
  CREATE INDEX "quotes_created_at_idx" ON "quotes" USING btree ("created_at");
  ALTER TABLE "users" ADD CONSTRAINT "users_subscription_plan_id_subscription_plans_id_fk" FOREIGN KEY ("subscription_plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscription_plans_fk" FOREIGN KEY ("subscription_plans_id") REFERENCES "public"."subscription_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quotes_fk" FOREIGN KEY ("quotes_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_subscription_plan_idx" ON "users" USING btree ("subscription_plan_id");
  CREATE INDEX "users_subscription_ends_at_idx" ON "users" USING btree ("subscription_ends_at");
  CREATE INDEX "payload_locked_documents_rels_subscription_plans_id_idx" ON "payload_locked_documents_rels" USING btree ("subscription_plans_id");
  CREATE INDEX "payload_locked_documents_rels_quotes_id_idx" ON "payload_locked_documents_rels" USING btree ("quotes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_plans_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscription_plans" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscription_plans_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_subscription_plans_v_version_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_subscription_plans_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_subscription_plans_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "quotes_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "quotes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "subscription_plans_features" CASCADE;
  DROP TABLE "subscription_plans" CASCADE;
  DROP TABLE "subscription_plans_locales" CASCADE;
  DROP TABLE "_subscription_plans_v_version_features" CASCADE;
  DROP TABLE "_subscription_plans_v" CASCADE;
  DROP TABLE "_subscription_plans_v_locales" CASCADE;
  DROP TABLE "quotes_items" CASCADE;
  DROP TABLE "quotes" CASCADE;
  ALTER TABLE "users" DROP CONSTRAINT "users_subscription_plan_id_subscription_plans_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_subscription_plans_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_quotes_fk";
  
  DROP INDEX "users_subscription_plan_idx";
  DROP INDEX "users_subscription_ends_at_idx";
  DROP INDEX "payload_locked_documents_rels_subscription_plans_id_idx";
  DROP INDEX "payload_locked_documents_rels_quotes_id_idx";
  ALTER TABLE "users" DROP COLUMN "subscription_plan_id";
  ALTER TABLE "users" DROP COLUMN "subscription_ends_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "subscription_plans_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "quotes_id";
  DROP TYPE "public"."enum_subscription_plans_currency";
  DROP TYPE "public"."enum_subscription_plans_default_billing_period";
  DROP TYPE "public"."enum_subscription_plans_status";
  DROP TYPE "public"."enum__subscription_plans_v_version_currency";
  DROP TYPE "public"."enum__subscription_plans_v_version_default_billing_period";
  DROP TYPE "public"."enum__subscription_plans_v_version_status";
  DROP TYPE "public"."enum__subscription_plans_v_published_locale";
  DROP TYPE "public"."enum_quotes_status";
  DROP TYPE "public"."enum_quotes_currency";`)
}
