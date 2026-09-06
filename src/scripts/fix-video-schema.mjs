/**
 * videoUrl → videoFile ŞEMA GEÇİŞİ  (yalnızca GELİŞTİRME veritabanı)
 * ============================================================================
 * NEDEN BU BETİK VAR
 * ---------------------------------------------------------------------------
 * `LibraryResources` koleksiyonundan `videoUrl` alanı kaldırılıp yerine
 * `videoFile` (Media ilişkisi) ve `allowVideoDownload` eklendi.
 *
 * `push: true` bir sütunun DÜŞTÜĞÜNÜ ve yenisinin EKLENDİĞİNİ görünce
 * drizzle-kit şunu ETKİLEŞİMLİ olarak sorar:
 *
 *     Is video_url column in library_resources table created or renamed
 *     from another column?
 *       > + video_file_id   create column
 *         ~ video_url › video_file_id   rename column
 *
 * `next dev` sürecinin bağlı bir stdin'i olmadığı için bu soru asla
 * yanıtlanamaz ve SUNUCU KİLİTLENİR (istekler yanıtsız kalır, Ctrl+C gerekir).
 * Aynı şey `tsx` ile çalıştırılan betiklerde de olur.
 *
 * ÇÖZÜM: farkı önceden kapatmak. DDL elle uygulandığında drizzle karşılaştırma
 * yaptığında ortada fark kalmaz ve soru hiç sorulmaz.
 *
 * ---------------------------------------------------------------------------
 * İSİMLENDİRME
 * ---------------------------------------------------------------------------
 * Sütun, kısıt ve indeks adları veritabanındaki mevcut `cover_image_id` ve
 * `file_id` alanlarından BİREBİR kopyalanmıştır — Payload/drizzle'ın ürettiği
 * kalıp budur. Farklı adlandırılırsa drizzle bir sonraki açılışta yine fark
 * görür ve yine sorar.
 *
 * ---------------------------------------------------------------------------
 * GÜVENLİK
 * ---------------------------------------------------------------------------
 * Betik önce satır sayısını kontrol eder. `library_resources` veya
 * `_library_resources_v` tablosunda TEK BİR SATIR bile varsa hiçbir şey
 * yapmadan durur: `video_url` düşürmek o durumda veri kaybı olurdu.
 * Tüm DDL tek bir işlem (transaction) içindedir; bir adım başarısız olursa
 * tamamı geri alınır.
 *
 * ---------------------------------------------------------------------------
 * KULLANIM
 * ---------------------------------------------------------------------------
 *     node src/scripts/fix-video-schema.mjs
 *
 * Çalıştırmadan ÖNCE kilitlenmiş `pnpm dev` sürecini Ctrl+C ile durdurun;
 * sonra `pnpm dev` ile yeniden başlatın.
 *
 * ÜRETİM İÇİN: bu betik üretimde ÇALIŞTIRILMAZ. Orada `push` kapalıdır ve
 * aynı değişiklik `pnpm migrate:create` ile üretilen migration dosyasıyla
 * uygulanmalıdır.
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

// --- Emniyet: veri varsa hiçbir şey yapma ---------------------------------
for (const table of ['library_resources', '_library_resources_v']) {
  const [{ n }] = await rows(`select count(*)::int as n from "${table}"`)
  if (n > 0) {
    console.error(`DURDURULDU: "${table}" içinde ${n} satır var.`)
    console.error('video_url sütununu düşürmek veri kaybına yol açardı; DDL uygulanmadı.')
    await client.end()
    process.exit(1)
  }
}
console.log('Emniyet kontrolü: her iki tablo da boş, devam ediliyor.')

const DDL = [
  // --- ana tablo -----------------------------------------------------------
  `ALTER TABLE "library_resources" DROP COLUMN IF EXISTS "video_url"`,
  `ALTER TABLE "library_resources" ADD COLUMN IF NOT EXISTS "video_file_id" integer`,
  `ALTER TABLE "library_resources" ADD COLUMN IF NOT EXISTS "allow_video_download" boolean DEFAULT true`,
  `DO $$ BEGIN
     ALTER TABLE "library_resources"
       ADD CONSTRAINT "library_resources_video_file_id_media_id_fk"
       FOREIGN KEY ("video_file_id") REFERENCES "public"."media"("id")
       ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "library_resources_video_file_idx"
     ON "library_resources" USING btree ("video_file_id")`,

  // --- sürüm (draft) tablosu ----------------------------------------------
  `ALTER TABLE "_library_resources_v" DROP COLUMN IF EXISTS "version_video_url"`,
  `ALTER TABLE "_library_resources_v" ADD COLUMN IF NOT EXISTS "version_video_file_id" integer`,
  `ALTER TABLE "_library_resources_v" ADD COLUMN IF NOT EXISTS "version_allow_video_download" boolean DEFAULT true`,
  `DO $$ BEGIN
     ALTER TABLE "_library_resources_v"
       ADD CONSTRAINT "_library_resources_v_version_video_file_id_media_id_fk"
       FOREIGN KEY ("version_video_file_id") REFERENCES "public"."media"("id")
       ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "_library_resources_v_version_version_video_file_idx"
     ON "_library_resources_v" USING btree ("version_video_file_id")`,
]

await client.query('BEGIN')
try {
  for (const sql of DDL) {
    await client.query(sql)
    console.log('  ok  ' + sql.replace(/\s+/g, ' ').slice(0, 76))
  }
  await client.query('COMMIT')
  console.log('\nDDL uygulandı.')
} catch (error) {
  await client.query('ROLLBACK')
  console.error('\nGERİ ALINDI:', error.message)
  await client.end()
  process.exit(1)
}

console.log('\nSonuç — video ile ilgili sütunlar:')
console.table(
  await rows(`select table_name, column_name, data_type
              from information_schema.columns
              where table_name in ('library_resources','_library_resources_v')
                and (column_name like '%video%' or column_name like '%allow%')
              order by table_name, column_name`),
)

await client.end()
