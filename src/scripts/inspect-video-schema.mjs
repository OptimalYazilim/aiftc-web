/**
 * SALT OKUNUR şema teşhisi — hiçbir şeyi değiştirmez.
 * Kullanım: node src/scripts/inspect-video-schema.mjs
 */
import 'dotenv/config'
import pg from './../../node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js'

const { Client } = pg
const client = new Client({
  connectionString: process.env.DATABASE_URI,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  statement_timeout: 20000,
})
await client.connect()
const rows = async (sql) => (await client.query(sql)).rows

console.log('=== video / allow ile ilgili sütunlar')
console.table(
  await rows(`select table_name, column_name, data_type
              from information_schema.columns
              where table_name in ('library_resources','_library_resources_v',
                                   'library_resources_locales','_library_resources_v_locales')
                and (column_name like '%video%' or column_name like '%allow%')
              order by table_name, column_name`),
)

console.log('=== satır sayıları')
for (const t of ['library_resources', '_library_resources_v', 'media', 'document_files']) {
  const [{ n }] = await rows(`select count(*)::int as n from "${t}"`)
  console.log(' ', t.padEnd(24), n)
}

console.log('=== payload migration kayıtları')
const hasTable = await rows(
  `select to_regclass('public.payload_migrations') is not null as present`,
)
if (hasTable[0].present) {
  console.table(await rows(`select name, batch from payload_migrations order by id`))
} else {
  console.log('  payload_migrations tablosu yok (push modu, migration hiç çalıştırılmamış)')
}

console.log('=== açık bağlantılar')
console.table(
  await rows(`select state, count(*)::int as n from pg_stat_activity
              where datname = current_database() and pid <> pg_backend_pid()
              group by state`),
)

await client.end()
