import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "edevlet_subject" varchar;
  CREATE UNIQUE INDEX "users_edevlet_subject_idx" ON "users" USING btree ("edevlet_subject");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "users_edevlet_subject_idx";
  ALTER TABLE "users" DROP COLUMN "edevlet_subject";`)
}
