import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "external_services" ADD COLUMN "edevlet_citizen_login_enabled" boolean DEFAULT false;
  ALTER TABLE "_external_services_v" ADD COLUMN "version_edevlet_citizen_login_enabled" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "external_services" DROP COLUMN "edevlet_citizen_login_enabled";
  ALTER TABLE "_external_services_v" DROP COLUMN "version_edevlet_citizen_login_enabled";`)
}
