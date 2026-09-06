import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

import { DEFAULT_LOCALE, LOCALE_CODES } from './locales'
import { buildPathnames } from './routes'

/**
 * URL yapısı: /tr/... , /en/... , /ru/...
 *
 * localePrefix: 'always' — varsayılan dilde bile /tr öneki korunur.
 * Gerekçe: hreflang tutarlılığı, tek canonical biçim ve "dil seçimi
 * yapılabilmelidir" maddesinin URL'de görünür olması (Şartname 5).
 *
 * pathnames `src/i18n/routes.ts`'ten TÜRETİLİR — burada elle liste tutulmaz.
 */
export const routing = defineRouting({
  locales: LOCALE_CODES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: true,
  pathnames: buildPathnames(),
})

/**
 * next-intl gezinme yardımcıları.
 *
 * KULLANIM KURALI
 *  - Dil değiştirici ve kanonik rota ile çalışan yerlerde bunları kullanın
 *    (`usePathname` kanonik yolu verir, `useRouter().replace(path, {locale})`
 *    aynı sayfanın başka dildeki karşılığına götürür).
 *  - CMS'ten gelen içerik bağlantılarında `src/i18n/routes.ts` içindeki
 *    `href()` / `detailHref()` / `pageHref()` ile HAZIR yerelleştirilmiş URL
 *    üretip düz `next/link` kullanın. İkisini karıştırmayın: next-intl'in
 *    Link'i zaten yerelleştirilmiş bir yolu ikinci kez yerelleştirmeye çalışır.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
