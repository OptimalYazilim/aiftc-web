/**
 * Tek dogruluk kaynagi (single source of truth) - diller.
 *
 * Sartname 5. madde:
 *  - Diller: Turkce, Ingilizce, Rusca
 *  - "Ilerleyen asamalarda diger dillerin eklenebilmesi icin altyapi esnek olmalidir."
 *  - "Dil ve ulke ISO kodlari tercih edilmelidir."  -> ISO 639-1 kullaniyoruz.
 *
 * Yeni bir dil eklemek icin: asagidaki diziye bir satir ekleyin.
 * Payload localization, next-intl routing, hreflang ve sitemap otomatik olarak
 * bu diziden beslenir; baska hicbir yerde degisiklik gerekmez.
 */

export const LOCALES = [
  {
    code: 'tr',
    /** ISO 639-1 + ISO 3166-1 (hreflang / html lang icin) */
    hrefLang: 'tr-TR',
    /** Admin panelinde gorunecek etiket */
    label: 'Türkçe',
    /** Payload admin arayuz dili (@payloadcms/translations) */
    adminLanguage: 'tr',
    direction: 'ltr',
  },
  {
    code: 'en',
    hrefLang: 'en',
    label: 'English',
    adminLanguage: 'en',
    direction: 'ltr',
  },
  {
    code: 'ru',
    hrefLang: 'ru-RU',
    label: 'Русский',
    adminLanguage: 'ru',
    direction: 'ltr',
  },
] as const

export type Locale = (typeof LOCALES)[number]['code']

export const LOCALE_CODES = LOCALES.map((l) => l.code) as unknown as Locale[]

export const DEFAULT_LOCALE: Locale = 'tr'

/** Sartname 6. madde: aiftc.org birincil alan adi. */
export const PRIMARY_DOMAIN = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALE_CODES as string[]).includes(value)

export const getLocaleMeta = (code: Locale) =>
  LOCALES.find((l) => l.code === code) ?? LOCALES[0]

/**
 * hreflang alternatifleri - uluslararasi SEO (Sartname 3.5).
 * x-default her zaman varsayilan dile isaret eder.
 */
export const buildAlternates = (pathByLocale: Partial<Record<Locale, string>>) => {
  const languages: Record<string, string> = {}

  // DİKKAT: boş dize ('') geçerli bir değerdir — ana sayfa demektir.
  // Bu yüzden truthy kontrolü değil, undefined kontrolü yapılır.
  for (const locale of LOCALES) {
    const path = pathByLocale[locale.code]
    if (path !== undefined) languages[locale.hrefLang] = `${PRIMARY_DOMAIN}/${locale.code}${path}`
  }

  const defaultPath = pathByLocale[DEFAULT_LOCALE]
  if (defaultPath !== undefined) {
    languages['x-default'] = `${PRIMARY_DOMAIN}/${DEFAULT_LOCALE}${defaultPath}`
  }

  return { languages }
}
