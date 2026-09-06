/**
 * `payload migrate:create` SÜRÜCÜSÜ
 * ============================================================================
 * NEDEN GEREKLİ
 * ---------------------------------------------------------------------------
 * Payload'ın migration üreticisi, bir sütunun düşüp başkasının eklendiğini
 * gördüğünde drizzle-kit üzerinden ETKİLEŞİMLİ soru sorar:
 *
 *     Is <yeni_sutun> column in <tablo> table created or renamed
 *     from another column?
 *       ❯ + <yeni_sutun>            create column
 *         ~ <eski> › <yeni>          rename column
 *
 * Bu betik olmadan komut, bağlı bir terminal olmayan ortamda o soruda
 * takılır ve süreç asla bitmez (bu projede bir kez dev sunucusunu çürüttü).
 *
 * NASIL CEVAPLIYOR
 * ---------------------------------------------------------------------------
 * Varsayılan olarak ilk seçenek işaretlidir (`create column`) ve Enter onu
 * seçer. Bu, bu projedeki tüm bekleyen değişiklikler için DOĞRU cevaptır:
 *
 *   videoUrl → videoFile           farklı tipte alan (metin → ilişki), rename
 *                                  değil; eski sütun gerçekten düşmeli.
 *   videoFile/file → _rels         ilişki yan tabloya taşındı, rename değil.
 *
 * "rename" cevabı YALNIZCA aynı verinin adı değiştiğinde doğrudur. Yanlış
 * cevap verilirse migration, olmayan bir sütunu yeniden adlandırmaya çalışır
 * ve üretimde patlar.
 *
 * KORUNAN TANIMLAR — bu betik bunlara DOKUNMAZ:
 *   ExternalServices  → dbName: 'feat_cols'
 *   TrainingPrograms  → dbName: 'program_status', enumName: 'enum_tp_custom_status'
 * Bu adlarla ilgili bir soru gelirse betik CEVAP VERMEZ, ekrana yazıp durur —
 * o karar elle verilmelidir.
 *
 * Kullanım:
 *   node src/scripts/run-migrate-create.mjs <migration_adi>
 * ============================================================================
 */
import { spawn } from 'child_process'

const name = process.argv[2] ?? 'kutuphane_medya'

/** Bu adlar geçerse otomatik cevap verilmez. */
const PROTECTED = ['feat_cols', 'program_status', 'enum_tp_custom_status']

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['payload', 'migrate:create', name],
  { env: { ...process.env, NODE_OPTIONS: '--no-deprecation' }, shell: process.platform === 'win32' },
)

let buffer = ''
let answered = 0
let noChanges = false

const handle = (chunk) => {
  const text = chunk.toString()
  process.stdout.write(text)
  buffer += text

  if (PROTECTED.some((word) => text.includes(word))) {
    console.error('\n\n[SÜRÜCÜ] KORUNAN TANIM SORULDU — otomatik cevap verilmiyor.')
    console.error('[SÜRÜCÜ] Bu soru elle yanıtlanmalıdır. Süreç sonlandırılıyor.')
    child.kill()
    process.exitCode = 2
    return
  }

  /*
    "Şema değişikliği yok, boş migration ister misin?" — CEVAP HAYIR.
    Bu soru, kod şemasının son migration anlık görüntüsüyle ZATEN eşleştiği
    anlamına gelir; boş bir dosya üretmek migration listesini gereksiz yere
    kalabalıklaştırır ve "bu neyi değiştiriyordu?" sorusunu doğurur.

    Yanıtlanmazsa süreç askıda kalır — bir kez yaşandı ve komut zaman
    aşımına düştü.
  */
  if (/No schema changes detected/i.test(buffer)) {
    buffer = ''
    noChanges = true
    console.log('\n[SÜRÜCÜ] şema değişikliği yok → boş migration OLUŞTURULMUYOR (N)')
    child.stdin.write('n\n')
    return
  }

  // Yeniden adlandırma sorusu: Enter ile varsayılanı (create column) seç.
  if (/created or renamed/i.test(buffer)) {
    buffer = ''
    answered += 1
    console.log(`\n[SÜRÜCÜ] soru ${answered} → "create column" (Enter)`)
    child.stdin.write('\n')
  }
}

child.stdout.on('data', handle)
child.stderr.on('data', handle)

child.on('close', (code) => {
  console.log(`\n[SÜRÜCÜ] bitti. çıkış kodu=${code}, cevaplanan soru=${answered}`)
  process.exit(code ?? 0)
})

// Emniyet: 5 dakika sonra kes.
setTimeout(() => {
  console.error('\n[SÜRÜCÜ] zaman aşımı — süreç sonlandırılıyor.')
  child.kill()
  process.exit(1)
}, 300000)
