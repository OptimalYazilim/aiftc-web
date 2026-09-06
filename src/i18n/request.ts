import { getRequestConfig } from 'next-intl/server'

import { DEFAULT_LOCALE, isLocale } from './locales'

/**
 * next-intl istek konfigürasyonu.
 * Arayüz metinleri (buton, etiket, form uyarıları) messages/*.json içinde;
 * içerik metinleri Payload'dan gelir.
 *
 * NOT: next-intl'in `hasLocale` yardımcısı yerine kendi type guard'ımız olan
 * `isLocale()` kullanılır — sürümden bağımsızdır ve tip daraltması yapar.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: 'Europe/Istanbul',
  }
})
