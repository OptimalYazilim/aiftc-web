import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tp_basvuru_soru_type" AS ENUM('text', 'textarea', 'select', 'checkbox');
  CREATE TYPE "public"."enum__tp_basvuru_soru_v_type" AS ENUM('text', 'textarea', 'select', 'checkbox');
  CREATE TABLE "tp_basvuru_secenek" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "tp_basvuru_secenek_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "tp_basvuru_soru" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_tp_basvuru_soru_type" DEFAULT 'text',
  	"required" boolean DEFAULT false
  );
  
  CREATE TABLE "tp_basvuru_soru_locales" (
  	"label" varchar,
  	"help" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_tp_basvuru_secenek_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_tp_basvuru_secenek_v_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_tp_basvuru_soru_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__tp_basvuru_soru_v_type" DEFAULT 'text',
  	"required" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_tp_basvuru_soru_v_locales" (
  	"label" varchar,
  	"help" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "registrations_extra_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  ALTER TABLE "tp_basvuru_secenek" ADD CONSTRAINT "tp_basvuru_secenek_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tp_basvuru_soru"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tp_basvuru_secenek_locales" ADD CONSTRAINT "tp_basvuru_secenek_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tp_basvuru_secenek"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tp_basvuru_soru" ADD CONSTRAINT "tp_basvuru_soru_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tp_basvuru_soru_locales" ADD CONSTRAINT "tp_basvuru_soru_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tp_basvuru_soru"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tp_basvuru_secenek_v" ADD CONSTRAINT "_tp_basvuru_secenek_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_tp_basvuru_soru_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tp_basvuru_secenek_v_locales" ADD CONSTRAINT "_tp_basvuru_secenek_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_tp_basvuru_secenek_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tp_basvuru_soru_v" ADD CONSTRAINT "_tp_basvuru_soru_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_training_programs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tp_basvuru_soru_v_locales" ADD CONSTRAINT "_tp_basvuru_soru_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_tp_basvuru_soru_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "registrations_extra_answers" ADD CONSTRAINT "registrations_extra_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tp_basvuru_secenek_order_idx" ON "tp_basvuru_secenek" USING btree ("_order");
  CREATE INDEX "tp_basvuru_secenek_parent_id_idx" ON "tp_basvuru_secenek" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "tp_basvuru_secenek_locales_locale_parent_id_unique" ON "tp_basvuru_secenek_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tp_basvuru_soru_order_idx" ON "tp_basvuru_soru" USING btree ("_order");
  CREATE INDEX "tp_basvuru_soru_parent_id_idx" ON "tp_basvuru_soru" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "tp_basvuru_soru_locales_locale_parent_id_unique" ON "tp_basvuru_soru_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_tp_basvuru_secenek_v_order_idx" ON "_tp_basvuru_secenek_v" USING btree ("_order");
  CREATE INDEX "_tp_basvuru_secenek_v_parent_id_idx" ON "_tp_basvuru_secenek_v" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_tp_basvuru_secenek_v_locales_locale_parent_id_unique" ON "_tp_basvuru_secenek_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_tp_basvuru_soru_v_order_idx" ON "_tp_basvuru_soru_v" USING btree ("_order");
  CREATE INDEX "_tp_basvuru_soru_v_parent_id_idx" ON "_tp_basvuru_soru_v" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_tp_basvuru_soru_v_locales_locale_parent_id_unique" ON "_tp_basvuru_soru_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "registrations_extra_answers_order_idx" ON "registrations_extra_answers" USING btree ("_order");
  CREATE INDEX "registrations_extra_answers_parent_id_idx" ON "registrations_extra_answers" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "tp_basvuru_secenek" CASCADE;
  DROP TABLE "tp_basvuru_secenek_locales" CASCADE;
  DROP TABLE "tp_basvuru_soru" CASCADE;
  DROP TABLE "tp_basvuru_soru_locales" CASCADE;
  DROP TABLE "_tp_basvuru_secenek_v" CASCADE;
  DROP TABLE "_tp_basvuru_secenek_v_locales" CASCADE;
  DROP TABLE "_tp_basvuru_soru_v" CASCADE;
  DROP TABLE "_tp_basvuru_soru_v_locales" CASCADE;
  DROP TABLE "registrations_extra_answers" CASCADE;
  DROP TYPE "public"."enum_tp_basvuru_soru_type";
  DROP TYPE "public"."enum__tp_basvuru_soru_v_type";`)
}
