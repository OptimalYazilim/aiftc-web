/**
 * ŞEMA SORULARINI CEVAPLAYAN SÜRÜCÜ
 * ============================================================================
 * `run-migrate-create.mjs` ile aynı sorunu çözer ama HERHANGİ bir komut için:
 * drizzle `push` sırasında bir sütun/enum düşüp başkası eklendiğinde
 * ETKİLEŞİMLİ soru sorar:
 *
 *     Is <yeni_enum> enum created or renamed from another enum?
 *     ❯ + <yeni_enum>            create enum
 *       ~ <eski> › <yeni>        rename enum
 *
 * Bağlı bir terminal yoksa süreç o soruda ASILI KALIR. Bu projede bir kez
 * dev sunucusunu çürüttü; ölçüldü: istekler yanıtlanmaya devam ediyordu ama
 * süre 521 saniyeye ve bellek 5.2 GB'a çıkmıştı.
 *
 * NASIL CEVAPLIYOR
 * ---------------------------------------------------------------------------
 * Varsayılan seçenek "create" olduğu için Enter yeterlidir. Bu, adları
 * benzeşen ama İLGİSİZ nesneler için DOĞRU cevaptır — örneğin
 * `enum_training_programs_review_status` (iş akışı) ile
 * `enum_library_resources_access_level` (görünürlük) arasında hiçbir ilişki
 * yoktur; "rename" denseydi drizzle var olan bir enum'u yeniden adlandırmaya
 * çalışır ve veriyi bozardı.
 *
 * "rename" cevabı YALNIZCA aynı verinin adı değiştiğinde doğrudur ve o karar
 * ELLE verilmelidir — bu betik onu asla seçmez.
 *
 * KORUNAN TANIMLAR
 * ---------------------------------------------------------------------------
 * Aşağıdaki adlar bir soruda geçerse betik CEVAP VERMEZ, ekrana yazıp durur:
 *   ExternalServices  → dbName: 'feat_cols'
 *   TrainingPrograms  → dbName: 'program_status', enumName: 'enum_tp_custom_status'
 *
 * Kullanım:
 *   node src/scripts/run-with-schema-prompts.mjs <komut> [argümanlar...]
 * Örnek:
 *   node src/scripts/run-with-schema-prompts.mjs npx tsx src/scripts/x.ts
 * ============================================================================
 */
import { spawn } from 'child_process'

const [komut, ...argumanlar] = process.argv.slice(2)

if (!komut) {
  console.error('Kullanım: node src/scripts/run-with-schema-prompts.mjs <komut> [argümanlar...]')
  process.exit(1)
}

const PROTECTED = ['feat_cols', 'program_status', 'enum_tp_custom_status']

const child = spawn(komut, argumanlar, {
  env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
  shell: process.platform === 'win32',
})

let tampon = ''
let cevaplanan = 0

const isle = (chunk) => {
  const metin = chunk.toString()
  process.stdout.write(metin)
  tampon += metin

  if (PROTECTED.some((ad) => metin.includes(ad))) {
    console.error('\n\n[SÜRÜCÜ] KORUNAN TANIM SORULDU — otomatik cevap verilmiyor.')
    console.error('[SÜRÜCÜ] Bu soru elle yanıtlanmalıdır. Süreç sonlandırılıyor.')
    child.kill()
    process.exitCode = 2
    return
  }

  // "created or renamed" → varsayılan (create) seçilir.
  if (/created or renamed/i.test(tampon)) {
    tampon = ''
    cevaplanan += 1
    console.log(`\n[SÜRÜCÜ] soru ${cevaplanan} → "create" (Enter)`)
    child.stdin.write('\n')
  }
}

child.stdout.on('data', isle)
child.stderr.on('data', isle)

child.on('close', (kod) => {
  console.log(`\n[SÜRÜCÜ] bitti. çıkış kodu=${kod}, cevaplanan soru=${cevaplanan}`)
  process.exit(kod ?? 0)
})

setTimeout(() => {
  console.error('\n[SÜRÜCÜ] zaman aşımı — süreç sonlandırılıyor.')
  child.kill()
  process.exit(1)
}, 600000)
