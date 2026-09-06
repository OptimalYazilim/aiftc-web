import type { Payload } from 'payload'

import { CONTACT_FORM_TITLE } from './contactForm'

/**
 * KVKK SAKLAMA SÜRESİ TEMİZLİĞİ  (Şartname 12.2 · KVKK m.7, m.12)
 * ============================================================================
 * KVKK, kişisel verinin "işlenmesini gerektiren sebeplerin ortadan kalkması
 * hâlinde" SİLİNMESİNİ zorunlu tutar. Form gönderimleri ad, e-posta, kurum ve
 * serbest metin taşır; süresiz saklanamaz.
 *
 * Bu modül SİLME KARARINI verir; ne zaman çalışacağına karar vermez. Zamanlama
 * `app/api/kvkk/temizlik/route.ts` üzerinden dışarıdan tetiklenir.
 *
 * SÜRE NEREDEN GELİR
 * ---------------------------------------------------------------------------
 * `forms` koleksiyonundaki İletişim Formu kaydının `retentionDays` alanından.
 * Kod içine sabit yazılmaz: saklama süresi kurumun veri envanterine bağlı bir
 * KARARDIR ve hukuk birimi değiştirdiğinde dağıtım beklenmemelidir.
 *
 * Kayıt okunamazsa `FALLBACK_RETENTION_DAYS` kullanılır. Süre BULUNAMADI diye
 * temizliği atlamak, kişisel veriyi süresiz saklamak demektir — KVKK açısından
 * daha kötü sonuç. Yine de rapor hangi sürenin kullanıldığını bildirir.
 *
 * DURUMU DİKKATE ALMAZ — BİLİNÇLİ
 * ---------------------------------------------------------------------------
 * "Bekliyor" durumundaki (henüz yanıtlanmamış) kayıtlar da silinir. Personel
 * geç davrandı diye kişisel veriyi daha uzun tutmak, KVKK'nın tam olarak
 * yasakladığı şeydir. Rapor, silinenlerin kaçının bekliyor olduğunu ayrıca
 * bildirir; bu sayı sürekli yüksekse sorun saklama süresinde değil, iş
 * akışındadır.
 *
 * GERİ ALINAMAZ
 * ---------------------------------------------------------------------------
 * Silme kalıcıdır. Bu yüzden `dryRun` desteklenir ve uç nokta GET ile ÖNCE
 * ne silineceğini gösterir.
 * ============================================================================
 */

/** `forms` kaydı okunamazsa kullanılan süre. Panel varsayılanıyla aynıdır. */
export const FALLBACK_RETENTION_DAYS = 180

/** Tek seferde silinecek azami kayıt. Uzun işlemin isteği zaman aşımına
 *  düşürmemesi için; kalan kayıtlar bir sonraki çalıştırmada silinir. */
const MAX_PER_RUN = 500

export type RetentionReport = {
  dryRun: boolean
  retentionDays: number
  /** Sürenin `forms` kaydından mı yoksa yedek sabitten mi geldiği. */
  retentionSource: 'cms' | 'fallback'
  /** Bu tarihten ESKİ kayıtlar süresi dolmuş sayılır. */
  cutoff: string
  expired: number
  deleted: number
  /** Süresi dolanlardan kaçı hâlâ "Bekliyor" durumundaydı. */
  expiredPending: number
  /** Sınıra takılıp bu turda silinemeyen kayıt kaldı mı. */
  remaining: number
  errors: number
}

const readRetentionDays = async (
  payload: Payload,
): Promise<{ days: number; source: 'cms' | 'fallback' }> => {
  try {
    const forms = await payload.find({
      collection: 'forms',
      where: { title: { equals: CONTACT_FORM_TITLE } },
      limit: 1,
      depth: 0,
    })

    const raw = (forms.docs[0] as { retentionDays?: number | null } | undefined)?.retentionDays
    const days = Number(raw)

    // 0 veya negatif bir süre "her şeyi hemen sil" demek olurdu; kabul edilmez.
    if (Number.isFinite(days) && days >= 1) return { days: Math.floor(days), source: 'cms' }
  } catch {
    // Sessizce yedeğe düşülür; rapor kaynağı 'fallback' olarak bildirir.
  }

  return { days: FALLBACK_RETENTION_DAYS, source: 'fallback' }
}

export const purgeExpiredFormRequests = async (
  payload: Payload,
  options: { dryRun?: boolean } = {},
): Promise<RetentionReport> => {
  const dryRun = options.dryRun ?? false
  const { days, source } = await readRetentionDays(payload)

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  /*
    `createdAt` ölçüt alınır, `updatedAt` DEĞİL. Editörün kaydı "Okundu"
    yapması saklama saatini sıfırlamamalıdır; süre verinin toplandığı andan
    işler.
  */
  const expired = await payload.find({
    collection: 'form-requests',
    where: { createdAt: { less_than: cutoff.toISOString() } },
    limit: MAX_PER_RUN,
    depth: 0,
    sort: 'createdAt',
    select: { status: true } as never,
  })

  const docs = expired.docs as unknown as { id: number; status?: string | null }[]
  const expiredPending = docs.filter((doc) => doc.status === 'pending').length

  const report: RetentionReport = {
    dryRun,
    retentionDays: days,
    retentionSource: source,
    cutoff: cutoff.toISOString(),
    expired: expired.totalDocs,
    deleted: 0,
    expiredPending,
    remaining: Math.max(0, expired.totalDocs - docs.length),
    errors: 0,
  }

  if (dryRun) return report

  /*
    Tek tek silinir, toplu `where` silmesi yerine: bir kayıt hata verirse
    diğerleri yine silinsin ve hata sayısı raporlanabilsin. Toplu silmede
    tek bir hata bütün işlemi düşürürdü.
  */
  for (const doc of docs) {
    try {
      await payload.delete({
        collection: 'form-requests',
        id: doc.id,
        // Silme ISR yenilemesi tetiklemez: bu kayıtlar sitede yayımlanmıyor.
        context: { skipRevalidate: true },
      })
      report.deleted += 1
    } catch {
      report.errors += 1
    }
  }

  /*
    Silme işlemi denetim izine yazılır. KVKK m.12 "gerekli denetimleri yapmak"
    yükümlülüğü açısından, verinin ne zaman ve hangi kurala göre silindiğinin
    kaydı gerekir. Kişisel veri LOGLANMAZ — yalnızca sayılar ve kural.
  */
  payload.logger.info(
    `KVKK temizliği: ${report.deleted} form gönderimi silindi ` +
      `(saklama ${days} gün, kaynak: ${source}, kesme: ${report.cutoff}, ` +
      `bekleyen: ${expiredPending}, hata: ${report.errors}, kalan: ${report.remaining})`,
  )

  return report
}
