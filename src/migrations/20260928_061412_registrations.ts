import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * ŞEMA GÖÇÜ — YENİ ENUM DEĞERİ BU DOSYADA KULLANILMAZ
 * ============================================================================
 * ÖLÇÜLMÜŞ HATA: Payload her göçü tek işlemde (transaction) çalıştırır ve
 * Postgres, aynı işlem içinde eklenen bir enum değerinin KULLANILMASINA izin
 * vermez:
 *
 *     ERROR: unsafe use of new value "registration" of enum type
 *            enum_training_programs_application_target_type
 *
 * Üretilen göç `ADD VALUE 'registration'` ile `SET DEFAULT 'registration'`i
 * aynı işleme koyuyordu ve test veritabanında tam bu hatayla geri alındı.
 * `SET DEFAULT` satırları ve veri dönüşümü bir SONRAKİ göçe taşındı
 * (*_registrations_varsayilan_ve_veri.ts); o göç ayrı işlemde koşar ve değer
 * o zaman "eski" sayılır.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_registrations_status" AS ENUM('pending', 'approved', 'rejected', 'completed');
  CREATE TYPE "public"."enum_registrations_country" AS ENUM('TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'OTHER');
  ALTER TYPE "public"."enum_training_programs_application_target_type" ADD VALUE 'registration' BEFORE 'contact';
  ALTER TYPE "public"."enum__training_programs_v_version_application_target_type" ADD VALUE 'registration' BEFORE 'contact';
  CREATE TABLE "registrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_registrations_status" DEFAULT 'pending' NOT NULL,
  	"training_id" integer NOT NULL,
  	"user_id" integer,
  	"full_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"position" varchar,
  	"organization" varchar,
  	"country" "enum_registrations_country",
  	"notes" varchar,
  	"admin_notes" varchar,
  	"reviewed_by_id" integer,
  	"reviewed_at" timestamp(3) with time zone,
  	"completed_at" timestamp(3) with time zone,
  	"consent_accepted_at" timestamp(3) with time zone,
  	"consent_snapshot" varchar,
  	"locale" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "registrations_id" integer;
  ALTER TABLE "registrations" ADD CONSTRAINT "registrations_training_id_training_programs_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."training_programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "registrations" ADD CONSTRAINT "registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "registrations" ADD CONSTRAINT "registrations_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "registrations_status_idx" ON "registrations" USING btree ("status");
  CREATE INDEX "registrations_training_idx" ON "registrations" USING btree ("training_id");
  CREATE INDEX "registrations_user_idx" ON "registrations" USING btree ("user_id");
  CREATE INDEX "registrations_email_idx" ON "registrations" USING btree ("email");
  CREATE INDEX "registrations_reviewed_by_idx" ON "registrations" USING btree ("reviewed_by_id");
  CREATE INDEX "registrations_updated_at_idx" ON "registrations" USING btree ("updated_at");
  CREATE INDEX "registrations_created_at_idx" ON "registrations" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_registrations_fk" FOREIGN KEY ("registrations_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_registrations_id_idx" ON "payload_locked_documents_rels" USING btree ("registrations_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "registrations" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "registrations" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_registrations_fk";
  
  ALTER TABLE "training_programs" ALTER COLUMN "application_target_type" SET DATA TYPE text;
  ALTER TABLE "training_programs" ALTER COLUMN "application_target_type" SET DEFAULT 'contact'::text;
  DROP TYPE "public"."enum_training_programs_application_target_type";
  CREATE TYPE "public"."enum_training_programs_application_target_type" AS ENUM('contact', 'external', 'portal', 'email', 'none');
  ALTER TABLE "training_programs" ALTER COLUMN "application_target_type" SET DEFAULT 'contact'::"public"."enum_training_programs_application_target_type";
  ALTER TABLE "training_programs" ALTER COLUMN "application_target_type" SET DATA TYPE "public"."enum_training_programs_application_target_type" USING "application_target_type"::"public"."enum_training_programs_application_target_type";
  ALTER TABLE "_training_programs_v" ALTER COLUMN "version_application_target_type" SET DATA TYPE text;
  ALTER TABLE "_training_programs_v" ALTER COLUMN "version_application_target_type" SET DEFAULT 'contact'::text;
  DROP TYPE "public"."enum__training_programs_v_version_application_target_type";
  CREATE TYPE "public"."enum__training_programs_v_version_application_target_type" AS ENUM('contact', 'external', 'portal', 'email', 'none');
  ALTER TABLE "_training_programs_v" ALTER COLUMN "version_application_target_type" SET DEFAULT 'contact'::"public"."enum__training_programs_v_version_application_target_type";
  ALTER TABLE "_training_programs_v" ALTER COLUMN "version_application_target_type" SET DATA TYPE "public"."enum__training_programs_v_version_application_target_type" USING "version_application_target_type"::"public"."enum__training_programs_v_version_application_target_type";
  DROP INDEX "payload_locked_documents_rels_registrations_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "registrations_id";
  DROP TYPE "public"."enum_registrations_status";
  DROP TYPE "public"."enum_registrations_country";`)
}
