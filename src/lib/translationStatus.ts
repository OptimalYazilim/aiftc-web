import { DEFAULT_LOCALE, LOCALE_CODES, type Locale } from '@/i18n/locales'

export type TranslationStatus = {
  complete: Locale[]
  missing: Locale[]
  updatedAt: string
}

/**
 * ÇEVİRİ DURUMU HESABI — SAF FONKSİYON
 * ============================================================================
 * Hem `syncTranslationStatus` kancası hem de mevcut kayıtları yeniden
 * hesaplayan betik (scripts/ceviri-durumu-yenile.ts) bunu kullanır; iki yerde
 * iki farklı kural yaşamasın.
 *
 * ---------------------------------------------------------------------------
 * "EKSİK" NEYE GÖRE?
 * ---------------------------------------------------------------------------
 * Bir dil, ancak KAYNAK DİLDE (tr) dolu olan bir izlenen alan o dilde boşsa
 * eksik sayılır. Türkçede de boş olan isteğe bağlı bir alan (ör. hiç
 * yazılmamış bir "açıklama") çeviri eksiği DEĞİLDİR; öyle sayılsaydı içerik
 * hiç yazılmadığı için her dil "eksik" görünür ve liste anlamını yitirirdi.
 * Türkçenin kendisi yalnızca izlenen alanların HİÇBİRİ dolu değilse eksiktir.
 *
 * ---------------------------------------------------------------------------
 * ZENGİN METİN BOŞ OLSA DA BİR NESNEDİR
 * ---------------------------------------------------------------------------
 * Eski hesap `Boolean(value)` kullanıyordu. Lexical editöründe hiç yazı
 * yazılmamış bir alan bile `{ root: { children: [paragraph] } }` biçiminde
 * bir NESNEDİR ve "dolu" sayılıyordu — yani gövdesi hiç çevrilmemiş bir haber
 * "tamam" görünüyordu. Artık ağaçta en az bir boş olmayan metin düğümü aranır.
 * Blok dizileri (Pages.layout) en az bir blok varsa dolu sayılır.
 * ============================================================================
 */
export const doluMu = (value: unknown): boolean => {
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number' || typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') {
    const root = (value as { root?: unknown }).root
    if (root && typeof root === 'object') return metinVarMi(root)
    return Object.keys(value).length > 0
  }
  return false
}

const metinVarMi = (dugum: unknown): boolean => {
  if (!dugum || typeof dugum !== 'object') return false
  const d = dugum as { text?: unknown; children?: unknown[] }
  if (typeof d.text === 'string' && d.text.trim().length > 0) return true
  return Array.isArray(d.children) && d.children.some(metinVarMi)
}

export const ceviriDurumuHesapla = (
  tumDiller: Record<string, unknown>,
  izlenenAlanlar: string[],
  simdi: string = new Date().toISOString(),
): TranslationStatus => {
  const deger = (alan: string, dil: Locale) =>
    (tumDiller[alan] as Record<string, unknown> | undefined)?.[dil]

  const kaynaktaDolu = izlenenAlanlar.filter((alan) => doluMu(deger(alan, DEFAULT_LOCALE)))

  const complete: Locale[] = []
  const missing: Locale[] = []

  for (const dil of LOCALE_CODES) {
    const tamam =
      dil === DEFAULT_LOCALE
        ? kaynaktaDolu.length > 0
        : kaynaktaDolu.every((alan) => doluMu(deger(alan, dil)))
    ;(tamam ? complete : missing).push(dil)
  }

  return { complete, missing, updatedAt: simdi }
}

/**
 * Koleksiyon başına izlenen alanlar — TEK KAYNAK. Kanca
 * (`syncTranslationStatus(IZLENEN_ALANLAR[slug])`) ve yenileme betiği aynı
 * listeyi okur. Başlığın yanında okuyucunun asıl okuduğu gövde alanı da
 * izlenir: yalnızca başlığı çevrilmiş bir haber "tamam" görünmemeli.
 */
export const IZLENEN_ALANLAR = {
  news: ['title', 'summary', 'content'],
  pages: ['title', 'layout'],
  'training-programs': ['title', 'summary', 'objective'],
  'training-topics': ['title', 'summary', 'description'],
  projects: ['title', 'objective'],
  'simulation-systems': ['title', 'summary', 'description'],
  'gallery-albums': ['title', 'description'],
  'library-resources': ['title', 'description'],
  'international-guide': ['title', 'content'],
  faqs: ['question', 'answer'],
  'subscription-plans': ['name', 'description'],
} as const satisfies Record<string, readonly string[]>

export type IzlenenKoleksiyon = keyof typeof IZLENEN_ALANLAR
