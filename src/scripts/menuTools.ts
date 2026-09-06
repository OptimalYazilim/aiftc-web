import type { Payload } from 'payload'

/**
 * ANA MENÜ ARAÇLARI
 * ============================================================================
 * Bu modül `seed.ts`'ten ÇIKARILDI. Sebep: `seed.ts` içe aktarıldığı anda
 * `run()` çağrısıyla tüm seed'i çalıştırır; oradan tek bir yardımcı fonksiyonu
 * import etmek mümkün değildir. Menüye öğe ekleyen mantık hem seed'de hem de
 * tek işlik `sync-main-menu.ts` betiğinde gerekli olduğu için ortak yere alındı.
 *
 * MENÜNÜN İKİ KAYNAĞI VAR — İKİSİ DE GÜNCELLENMELİDİR
 *   1. `globals/Navigation.ts` (veritabanı)  → SİTEDE GÖRÜNEN menü budur.
 *   2. `lib/defaultNavigation.ts`            → yalnızca global BOŞKEN devreye
 *      girer; yeni kurulan ortamlarda menünün tamamen kaybolmasını önler.
 * Yalnızca (2) düzenlenirse dolu bir veritabanında hiçbir şey değişmez.
 * ============================================================================
 */

const CTX = { context: { skipRevalidate: true } } as const

export type Locale = 'tr' | 'en' | 'ru'
const TRANSLATIONS: Locale[] = ['en', 'ru']

export type MenuRow = {
  id?: string | null
  type?: string | null
  route?: string | null
  label?: string | null
}

type AppendOptions = {
  /**
   * Yeni öğenin HANGİ rotadan SONRA geleceği. Verilmezse menünün sonuna
   * eklenir. "İletişim" için son uygun bir yerdi; ancak Simülasyon Merkezi
   * eğitim bölümlerinin devamıdır ve İletişim'den SONRA gelmesi yanlış olur.
   */
  after?: string
}

/**
 * MENÜYE EKSİK ÖĞE EKLEME — MEVCUT SATIRLARI BOZMADAN
 * ---------------------------------------------------------------------------
 * Menüyü EZMEZ, yalnızca eksik olan rotayı ekler (varsayılan: sona; `after`
 * verilirse o rotanın hemen ardına).
 *
 * Localized dizilerde kritik ayrıntı: her dil güncellemesinde satırlar KENDİ
 * ID'LERİYLE gönderilmelidir. Id gönderilmezse Payload satırları yeniden
 * oluşturur ve diğer dillerdeki etiketler silinir. Bu yüzden önce TR yazılır,
 * oluşan id listesi geri okunur, EN/RU aynı id'lerle güncellenir.
 */
export const appendMenuRoute = async (
  payload: Payload,
  route: string,
  labels: Record<Locale, string>,
  options: AppendOptions = {},
) => {
  const current = await payload.findGlobal({ slug: 'navigation', locale: 'tr', depth: 0 })
  let rows = ((current as { mainMenu?: MenuRow[] }).mainMenu ?? []) as MenuRow[]

  if (rows.length === 0) return false // Menü hiç kurulmamış; seedNavigation'ın işi.

  let changed = false
  let targetId = rows.find((row) => row.route === route)?.id ?? null

  // --- 1) Öğe yoksa TR ile ekle -------------------------------------------
  if (!targetId) {
    const newRow = { type: 'route', route, label: labels.tr }

    /*
      Konumlandırma: `after` ile verilen rotanın hemen ardına yerleştirilir.
      O rota menüde yoksa (editör silmiş olabilir) sona eklenir — öğenin hiç
      görünmemesindense yanlış sırada görünmesi yeğdir.
    */
    const anchorIndex = options.after
      ? rows.findIndex((row) => row.route === options.after)
      : -1
    const next =
      anchorIndex >= 0
        ? [...rows.slice(0, anchorIndex + 1), newRow, ...rows.slice(anchorIndex + 1)]
        : [...rows, newRow]

    const afterTr = await payload.updateGlobal({
      slug: 'navigation',
      locale: 'tr',
      ...CTX,
      data: { mainMenu: next } as never,
    })

    rows = ((afterTr as { mainMenu?: MenuRow[] }).mainMenu ?? []) as MenuRow[]
    targetId = rows.find((row) => row.route === route)?.id ?? null
    changed = true
  }

  if (!targetId) return changed

  /**
   * --- 2) EN/RU etiketleri ------------------------------------------------
   * DİKKAT — `localization.fallback: true`. Bir dilde etiket BOŞSA sorgu o
   * dilde TR değerini döndürür. Bu yüzden "satır zaten var, etiketi de var"
   * kontrolü YAPILAMAZ: gelen değer gerçek çeviri de olabilir, TR'den düşen
   * yedek de. İlk sürümde bu ayrım yapılmadığı için EN/RU menüsüne "İletişim"
   * yazılmıştı.
   *
   * Çözüm: hedef satırın etiketi HER ZAMAN açıkça yazılır. Diğer satırlar
   * okunduğu gibi geri gönderilir — Payload dizi alanlarında kısmi güncelleme
   * kabul etmez, dizinin tamamı gönderilmek zorundadır.
   */
  for (const locale of TRANSLATIONS) {
    const localized = await payload.findGlobal({ slug: 'navigation', locale, depth: 0 })
    const existing = ((localized as { mainMenu?: MenuRow[] }).mainMenu ?? []) as MenuRow[]

    if (existing.find((row) => row.id === targetId)?.label === labels[locale]) continue

    await payload.updateGlobal({
      slug: 'navigation',
      locale,
      ...CTX,
      data: {
        mainMenu: existing.map((row) =>
          row.id === targetId ? { ...row, label: labels[locale] } : row,
        ),
      } as never,
    })

    changed = true
  }

  return changed
}

/** Menüye sonradan eklenen bölümler. Sıra, `after` alanıyla korunur. */
export const MENU_ADDITIONS: {
  route: string
  labels: Record<Locale, string>
  after?: string
}[] = [
  {
    route: 'contact',
    labels: { tr: 'İletişim', en: 'Contact', ru: 'Контакты' },
  },
  {
    // Şartname 9: Simülasyon Merkezi ana navigasyondan doğrudan erişilebilir olmalı.
    route: 'simulation-centre',
    labels: { tr: 'Simülasyon Merkezi', en: 'Simulation Centre', ru: 'Центр симуляции' },
    after: 'training-calendar',
  },
]
