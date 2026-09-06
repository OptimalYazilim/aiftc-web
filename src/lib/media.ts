import type { Media } from '@/payload-types'

/**
 * MEDYA ÇÖZÜCÜ
 * ============================================================================
 * Payload'in `upload` alanları iki biçimde gelebilir:
 *   depth: 0 → yalnızca id (sayı)
 *   depth ≥1 → tam Media nesnesi
 * Bileşenlerin her seferinde bu ayrımı yapması gerekmesin diye tek yerde
 * çözülür.
 *
 * BOYUT SEÇİMİ
 * `collections/Media.ts` dört türev üretir: thumbnail, card, hero, og.
 * Kart görselinde orijinal dosyayı basmak (çoğu zaman 3–4 MB) hem Şartname
 * 14.1 performans maddesine hem de mobil veri kullanımına aykırıdır; bu
 * yüzden istenen türev yoksa bile ÖNCE daha küçük türevlere düşülür,
 * orijinal en son çare olarak kullanılır.
 *
 * `alt` ZORUNLU bir alandır (WCAG 2.2 — 1.1.1) ama veri bozulmasına karşı
 * boş dize ile korunur: eksik alt metin, alt niteliğinin hiç olmamasından
 * iyidir — ikincisi ekran okuyucuya dosya adını okutur.
 * ============================================================================
 */

export type ResolvedImage = {
  url: string
  width: number
  height: number
  alt: string
}

type SizeName = 'thumbnail' | 'card' | 'hero' | 'og'

/** Küçükten büyüğe: istenen boyut yoksa sıradaki denenir. */
const FALLBACK_ORDER: SizeName[] = ['thumbnail', 'card', 'hero', 'og']

export const resolveMedia = (
  value: unknown,
  preferred: SizeName = 'card',
): ResolvedImage | null => {
  if (!value || typeof value !== 'object') return null

  const media = value as Media
  const sizes = media.sizes ?? {}

  const candidates: SizeName[] = [
    preferred,
    ...FALLBACK_ORDER.filter((name) => name !== preferred),
  ]

  for (const name of candidates) {
    const size = sizes[name]
    if (size?.url) {
      return {
        url: size.url,
        width: size.width ?? 768,
        height: size.height ?? 512,
        alt: media.alt ?? '',
      }
    }
  }

  if (!media.url) return null

  return {
    url: media.url,
    width: media.width ?? 1200,
    height: media.height ?? 800,
    alt: media.alt ?? '',
  }
}

/**
 * VİDEO ÇÖZÜCÜ
 * ============================================================================
 * `resolveMedia` GÖRSELLER içindir: türev boyutlar arasından seçim yapar ve
 * `ResolvedImage` döner. Video için bu yanlış olurdu — videonun türevi yoktur
 * ve oynatıcının ihtiyacı `width/height` değil MIME TÜRÜDÜR (`<source type>`
 * ile tarayıcı, dosyayı indirmeden oynatabilip oynatamayacağını anlar).
 *
 * MIME KONTROLÜ BURADA DA YAPILIR. Panelde `filterOptions` yalnızca video
 * dosyalarını listeler (bkz. collections/LibraryResources.ts) ama bu bir
 * ARAYÜZ kolaylığıdır: API üzerinden veya içe aktarmayla bir görsel
 * bağlanabilir. O durumda oynatıcı hiç kurulmaz, `null` döner.
 *
 * ÇOK HEDEFLİ İLİŞKİ ZARFI
 * `videoFile` artık hem `media` hem `document-files` koleksiyonuna
 * bakabiliyor. Payload çok hedefli ilişkileri
 *     { relationTo: 'media', value: {...} }
 * biçiminde döndürür; tek hedefli olanları ise doğrudan nesne olarak.
 * `unwrapRelation` iki biçimi de kabul eder, böylece çağıran taraf hangi
 * koleksiyondan geldiğini bilmek zorunda kalmaz.
 * ============================================================================
 */

/**
 * Çok hedefli ilişki zarfını açar. Tek hedefli değeri olduğu gibi geçirir.
 * Derinlik 0'da `value` bir sayıdır (yalnızca id) — o durumda `null` döner,
 * çünkü elde dosya bilgisi yoktur.
 */
export const unwrapRelation = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null

  const maybe = value as { relationTo?: unknown; value?: unknown }
  if (typeof maybe.relationTo === 'string') {
    return maybe.value && typeof maybe.value === 'object'
      ? (maybe.value as Record<string, unknown>)
      : null
  }

  return value as Record<string, unknown>
}

/** Bayt → "24,8 MB". Hesaplanamıyorsa null. */
export const humanBytes = (bytes: unknown): string | null => {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return null
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1)
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
export type ResolvedAttachment = {
  url: string
  mimeType: string | null
  humanFileSize: string | null
  filesize: number | null
}

/**
 * İNDİRİLEBİLİR EK — `document-files` VEYA `media`.
 * ============================================================================
 * Kütüphane listesi ve künye sayfası AYNI çözümlemeye ihtiyaç duyar; iki
 * yerde ayrı yazılsaydı biri düzeltilip öteki unutulurdu.
 *
 * ÇOK HEDEFLİ: `file` alanı hem `document-files` hem `media` koleksiyonuna
 * bakabiliyor (ikisi de PDF kabul ediyor). Payload çok hedefli ilişkiyi
 * `{ relationTo, value }` zarfıyla döndürür; `unwrapRelation` onu açar.
 *
 * BOYUT İKİ KAYNAKTAN GELEBİLİR:
 *   document-files → `humanFileSize` alanı (koleksiyonun kendi hook'u doldurur)
 *   media          → böyle bir alan YOK, ham `filesize` bayttan hesaplanır
 * Bu yüzden önce hazır değere bakılır, yoksa hesaplanır.
 */
export const resolveAttachment = (value: unknown): ResolvedAttachment | null => {
  const doc = unwrapRelation(value)
  if (!doc || typeof doc.url !== 'string') return null

  const ready = typeof doc.humanFileSize === 'string' ? doc.humanFileSize.trim() : ''

  return {
    url: doc.url,
    mimeType: typeof doc.mimeType === 'string' ? doc.mimeType : null,
    humanFileSize: ready || humanBytes(doc.filesize),
    filesize: typeof doc.filesize === 'number' ? doc.filesize : null,
  }
}

export type ResolvedVideo = {
  url: string
  mimeType: string
  /** "24,8 MB" gibi okunabilir boyut; hesaplanamıyorsa null. */
  humanSize: string | null
}

export const resolveVideo = (value: unknown): ResolvedVideo | null => {
  const doc = unwrapRelation(value)
  if (!doc) return null

  const url = typeof doc.url === 'string' ? doc.url : null
  const mimeType = typeof doc.mimeType === 'string' ? doc.mimeType : null

  if (!url || !mimeType?.startsWith('video/')) return null

  return { url, mimeType, humanSize: humanBytes(doc.filesize) }
}

/**
 * TAM ÇÖZÜNÜRLÜKLÜ GÖRSEL — TÜREV DEĞİL, ORİJİNAL
 * ============================================================================
 * `resolveMedia` kart ve şerit gibi KÜÇÜK yüzeyler içindir; oraya orijinali
 * basmak Şartname 14.1'e aykırıdır. Tam ekran lightbox'ta ise durum tersine
 * döner: 768×512'lik "card" türevi 1200px genişliğinde bir sahnede yumuşak ve
 * küçük kalır.
 *
 * ÖLÇÜM (1200×1000 pencere, sahne 1200×839):
 *     card türeviyle  → görsel 432×288 CSS px, kaynak 768×512
 *     orijinalle      → sahneyi dolduruyor, kaynak 1920×1080
 *
 * Bu fonksiyon TÜREVLERE HİÇ BAKMAZ, doğrudan yüklenen dosyayı döndürür.
 * Ölçeklendirmeyi `next/image` `sizes` ile yapar: aynı çözümlenmiş görsel
 * hem sahnede (büyük) hem önizleme şeridinde (112px) kullanılabilir, çünkü
 * tarayıcı srcset'ten uygun genişliği seçer.
 *
 * `alt` boş dize ile korunur: eksik alt metin, alt niteliğinin hiç
 * olmamasından iyidir (bkz. dosya başındaki not).
 * ============================================================================
 */
export const resolveFullImage = (value: unknown): ResolvedImage | null => {
  const doc = unwrapRelation(value)
  if (!doc || typeof doc.url !== 'string') return null

  return {
    url: doc.url,
    width: typeof doc.width === 'number' ? doc.width : 1920,
    height: typeof doc.height === 'number' ? doc.height : 1080,
    alt: typeof doc.alt === 'string' ? doc.alt : '',
  }
}
