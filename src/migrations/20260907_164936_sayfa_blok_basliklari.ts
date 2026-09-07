import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_stats_block" ADD COLUMN "heading" varchar;
  ALTER TABLE "pages_blocks_people_block" ADD COLUMN "heading" varchar;
  ALTER TABLE "pages_blocks_partners_block" ADD COLUMN "heading" varchar;
  ALTER TABLE "pages_blocks_timeline_block" ADD COLUMN "heading" varchar;
  ALTER TABLE "_pages_v_blocks_stats_block" ADD COLUMN "heading" varchar;
  ALTER TABLE "_pages_v_blocks_people_block" ADD COLUMN "heading" varchar;
  ALTER TABLE "_pages_v_blocks_partners_block" ADD COLUMN "heading" varchar;
  ALTER TABLE "_pages_v_blocks_timeline_block" ADD COLUMN "heading" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_stats_block" DROP COLUMN "heading";
  ALTER TABLE "pages_blocks_people_block" DROP COLUMN "heading";
  ALTER TABLE "pages_blocks_partners_block" DROP COLUMN "heading";
  ALTER TABLE "pages_blocks_timeline_block" DROP COLUMN "heading";
  ALTER TABLE "_pages_v_blocks_stats_block" DROP COLUMN "heading";
  ALTER TABLE "_pages_v_blocks_people_block" DROP COLUMN "heading";
  ALTER TABLE "_pages_v_blocks_partners_block" DROP COLUMN "heading";
  ALTER TABLE "_pages_v_blocks_timeline_block" DROP COLUMN "heading";`)
}
