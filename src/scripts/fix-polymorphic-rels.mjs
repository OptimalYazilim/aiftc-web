/**
 * videoFile / file → ÇOK HEDEFLİ İLİŞKİ ŞEMA GEÇİŞİ (yalnızca GELİŞTİRME)
 * ============================================================================
 * NEDEN
 * ---------------------------------------------------------------------------
 * `LibraryResources.videoFile` ve `.file` alanları TEK hedefli ilişkiydi
 * (`media` ve `document-files`). Video her iki koleksiyona da yüklenebildiği
 * için editörün yüklediği dosya seçicide görünmüyordu — ölçüldü:
 *     document-files: 1 kayıt (video/mp4)   media: 0 kayıt   seçici: 0 sonuç
 *
 * Alanlar `relationTo: ['media','document-files']` biçimine geçirildi.
 *
 * ŞEMA ETKİSİ
 * ---------------------------------------------------------------------------
 * Payload tek hedefli ilişkiyi ana tabloda DOĞRUDAN SÜTUN olarak tutar
 * (`video_file_id`, `file_id`). Çok hedefli ilişkiyi ise `_rels` yan
 * tablosunda `path` sütunuyla ayırarak tutar. Yani:
 *     library_resources.video_file_id   → DÜŞER
 *     library_resources.file_id         → DÜŞER
 *     library_resources_rels.document_files_id → EKLENİR
 *                                        (media_id zaten var: `gallery` alanı)
 * Aynısı sürüm (draft) tabloları için de geçerlidir.
 *
 * NEDEN ELLE
 * ---------------------------------------------------------------------------
 * `push: true` bir sütunun düşüp başkasının eklendiğini görünce drizzle-kit
 * ETKİLEŞİMLİ "yeniden adlandırma mı?" sorusunu sorar; stdin'i olmayan dev
 * sunucusu o soruda çürür (bkz. src/scripts/fix-video-schema.mjs — aynı
 * arıza bir kez yaşandı, sunucu 5,2 GB'a çıkıp yanıt süreleri dakikalara
 * uzadı). DDL önceden uygulanınca fark kalmaz ve soru sorulmaz.
 *
 * GÜVENLİK
 * ---------------------------------------------------------------------------
 * Betik önce satır sayar. `library_resources` boş değilse DURUR: sütun
 * düşürmek o durumda ilişki verisini yok ederdi. Tüm DDL tek transaction.
 *
 * ÜRETİM: bu betik üretimde ÇALIŞTIRILMAZ; orada aynı değişiklik
 * `pnpm migrate:create` ile üretilecek migration dosyasına girmelidir.
 * ============================================================================
 */
import 'dotenv/config'
import pg from './../../node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js'

const { Client } = pg
const client = new Client({
  connectionString: process.env.DATABASE_URI,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  statement_timeout: 30000,
})
await client.connect()
const rows = async (sql) => (await client.query(sql)).rows

for (const table of ['library_resources', '_library_resources_v']) {
  const [{ n }] = await rows(`select count(*)::int as n from "${table}"`)
  if (n > 0) {
    console.error(`DURDURULDU: "${table}" içinde ${n} satır var; ilişki verisi kaybolurdu.`)
    await client.end()
    process.exit(1)
  }
}
console.log('Emniyet kontrolü: tablolar boş, devam ediliyor.')

const DDL = [
  // --- doğrudan sütunlar düşer ---------------------------------------------
  `ALTER TABLE "library_resources" DROP COLUMN IF EXISTS "video_file_id"`,
  `ALTER TABLE "library_resources" DROP COLUMN IF EXISTS "file_id"`,
  `ALTER TABLE "_library_resources_v" DROP COLUMN IF EXISTS "version_video_file_id"`,
  `ALTER TABLE "_library_resources_v" DROP COLUMN IF EXISTS "version_file_id"`,

  // --- _rels tablolarına document_files_id eklenir --------------------------
  `ALTER TABLE "library_resources_rels" ADD COLUMN IF NOT EXISTS "document_files_id" integer`,
  `DO $$ BEGIN
     ALTER TABLE "library_resources_rels"
       ADD CONSTRAINT "library_resources_rels_document_files_fk"
       FOREIGN KEY ("document_files_id") REFERENCES "public"."document_files"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "library_resources_rels_document_files_id_idx"
     ON "library_resources_rels" USING btree ("document_files_id")`,

  `ALTER TABLE "_library_resources_v_rels" ADD COLUMN IF NOT EXISTS "document_files_id" integer`,
  `DO $$ BEGIN
     ALTER TABLE "_library_resources_v_rels"
       ADD CONSTRAINT "_library_resources_v_rels_document_files_fk"
       FOREIGN KEY ("document_files_id") REFERENCES "public"."document_files"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "_library_resources_v_rels_document_files_id_idx"
     ON "_library_resources_v_rels" USING btree ("document_files_id")`,
]

await client.query('BEGIN')
try {
  for (const sql of DDL) {
    await client.query(sql)
    console.log('  ok  ' + sql.replace(/\s+/g, ' ').slice(0, 74))
  }
  await client.query('COMMIT')
  console.log('\nDDL uygulandı.')
} catch (error) {
  await client.query('ROLLBACK')
  console.error('\nGERİ ALINDI:', error.message)
  await client.end()
  process.exit(1)
}

console.log('\nSonuç:')
console.table(
  await rows(`select table_name, column_name from information_schema.columns
              where table_name in ('library_resources','_library_resources_v',
                                   'library_resources_rels','_library_resources_v_rels')
                and (column_name like '%file%' or column_name like '%media%')
              order by table_name, column_name`),
)

await client.end()
