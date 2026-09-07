import type { Locale } from './locales'

/**
 * ROTA SÖZLÜĞÜ — TEK KAYNAK
 * ============================================================================
 * Şartname 5: "Sayfa URL yapısı çok dilli kullanıma uygun olmalıdır."
 * Şartname 3.5: "Uluslararası SEO ve Dil Mimarisi."
 *
 * Bölüm segmentleri her dilde YERELLEŞTİRİLİR:
 *   /tr/egitim-programlari/...
 *   /en/training-programmes/...
 *   /ru/programmy-obucheniya/...
 *
 * Buradaki anahtarlar (`training-topics`, `news`, ...) aynı zamanda
 * `globals/Navigation.ts` içindeki "Sistem bölümü" seçeneklerinin değerleridir.
 * İkisi eşleşmezse menüde bağlantı çözülemez — tek yerden yönetildiği için
 * yeni bölüm eklerken HER İKİSİNE de eklenmelidir.
 *
 * app/ klasör adları TÜRKÇE (kanonik) segmentlerdir; next-intl gelen
 * yerelleştirilmiş URL'i bu kanonik yola yeniden yazar.
 * ============================================================================
 */

export const ROUTES = {
  home: { tr: '/', en: '/', ru: '/' },
  about: { tr: '/kurulus', en: '/about', ru: '/o-tsentre' },
  'training-topics': {
    tr: '/egitim-konulari',
    en: '/training-topics',
    ru: '/temy-obucheniya',
  },
  'training-programs': {
    tr: '/egitim-programlari',
    en: '/training-programmes',
    ru: '/programmy-obucheniya',
  },
  'training-calendar': {
    tr: '/egitim-takvimi',
    en: '/training-calendar',
    ru: '/kalendar-obucheniya',
  },
  'simulation-centre': {
    tr: '/simulasyon-merkezi',
    en: '/simulation-centre',
    ru: '/tsentr-simulyatsii',
  },
  /**
   * Dijital kütüphane ARTIK SİTE İÇİ bir bölümdür (eskiden EK-2 subdomain'i).
   * Kayıtlar `library-resources` koleksiyonundan gelir.
   */
  library: { tr: '/kutuphane', en: '/library', ru: '/biblioteka' },
  news: { tr: '/haberler', en: '/news', ru: '/novosti' },
  gallery: { tr: '/galeri', en: '/gallery', ru: '/galereya' },
  'international-guide': {
    tr: '/uluslararasi-katilimcilar',
    en: '/international-participants',
    ru: '/mezhdunarodnym-uchastnikam',
  },
  projects: { tr: '/projeler', en: '/projects', ru: '/proekty' },
  contact: { tr: '/iletisim', en: '/contact', ru: '/kontakty' },
  search: { tr: '/arama', en: '/search', ru: '/poisk' },
} as const satisfies Record<string, Record<Locale, string>>

/**
 * KİMLİK SAYFALARI  (Şartname 1.7 · Kılavuz 5.2)
 * ============================================================================
 * `ROUTES` İÇİNE KONMADI — BİLİNÇLİ.
 *
 * `sitemap.ts` `ROUTE_KEYS`in tamamını dolaşır ve her anahtarı üç dilde
 * yayımlar. Giriş ve kayıt ekranlarının arama motoruna duyurulmasının hiçbir
 * faydası yoktur: içerik taşımazlar, dizine girdiklerinde kurumsal aramalarda
 * "giriş" sonucu içerik sonuçlarının önüne geçer. Bu yüzden ayrı bir haritada
 * dururlar ve sitemap'e girmezler.
 *
 * `buildPathnames()` yine de bu haritayı okur — next-intl'in EN/RU adresleri
 * kanonik TR yola yeniden yazabilmesi için gereklidir. Harita dışarıda
 * bırakılsaydı `/en/login` 404 dönerdi.
 *
 * `globals/Navigation.ts` içindeki "Sistem bölümü" seçeneklerine de
 * EKLENMEDİ: o alan bir Postgres enum'udur ve yeni bir değer eklemek on dört
 * ayrı `ALTER TYPE` satırlık bir migration gerektirir. Editörün bu sayfaları
 * menüye koyması bir gereklilik değildir; bağlantılar üst şeritte sabittir.
 */
export const AUTH_ROUTES = {
  login: { tr: '/giris', en: '/login', ru: '/vhod' },
  register: { tr: '/kayit', en: '/register', ru: '/registratsiya' },
} as const satisfies Record<string, Record<Locale, string>>

export type AuthRouteKey = keyof typeof AUTH_ROUTES

/** Kimlik sayfasının o dildeki tam yolu: `/en/login` */
export const authHref = (key: AuthRouteKey, locale: Locale): string =>
  `/${locale}${AUTH_ROUTES[key][locale]}`

/** Detay sayfaları. `[slug]` yerine kaydın o dildeki slug'ı konur. */
export const DETAIL_ROUTES = {
  'training-topic': {
    tr: '/egitim-konulari/[slug]',
    en: '/training-topics/[slug]',
    ru: '/temy-obucheniya/[slug]',
  },
  'training-program': {
    tr: '/egitim-programlari/[slug]',
    en: '/training-programmes/[slug]',
    ru: '/programmy-obucheniya/[slug]',
  },
  'simulation-system': {
    tr: '/simulasyon-merkezi/[slug]',
    en: '/simulation-centre/[slug]',
    ru: '/tsentr-simulyatsii/[slug]',
  },
  /**
   * SANAL SINIF — parametre `[slug]` DEĞİL `[id]`.
   * Oda kaydının slug’ı yoktur: adres tahmin edilebilir olmamalıdır ve oda
   * bir içerik sayfası değil, korumalı bir katılım ekranıdır. Bu yüzden
   * `detailHref` yerine `classroomHref` kullanılır ve sayfa sitemap'e
   * EKLENMEZ (bkz. app/(frontend)/sitemap.ts içindeki DETAIL_COLLECTIONS).
   */
  'virtual-classroom': {
    tr: '/sanal-sinif/[id]',
    en: '/virtual-classroom/[id]',
    ru: '/virtualnyy-klass/[id]',
  },
  /**
   * KÜTÜPHANE KÜNYE SAYFASI  (Şartname EK-2 Madde 1.5)
   * Liste kartı artık dosyayı doğrudan indirmez, buraya götürür: EK-2'nin
   * saydığı künye alanlarının (kurum, ülke, dil, lisans, DOI/ISBN, sürüm)
   * gösterilebileceği tek yer bir detay sayfasıdır. Kart yüzeyi bir künye
   * taşıyamaz.
   */
  'library-resource': {
    tr: '/kutuphane/[slug]',
    en: '/library/[slug]',
    ru: '/biblioteka/[slug]',
  },
  'news-item': { tr: '/haberler/[slug]', en: '/news/[slug]', ru: '/novosti/[slug]' },
  'gallery-album': { tr: '/galeri/[slug]', en: '/gallery/[slug]', ru: '/galereya/[slug]' },
  project: { tr: '/projeler/[slug]', en: '/projects/[slug]', ru: '/proekty/[slug]' },
} as const satisfies Record<string, Record<Locale, string>>

export type RouteKey = keyof typeof ROUTES
export type DetailRouteKey = keyof typeof DETAIL_ROUTES

export const ROUTE_KEYS = Object.keys(ROUTES) as RouteKey[]

/** Bir bölümün o dildeki tam yolu: `/tr/egitim-konulari` */
export const href = (key: RouteKey, locale: Locale): string => {
  const path = ROUTES[key][locale]
  return path === '/' ? `/${locale}` : `/${locale}${path}`
}

/** Bir detay kaydının o dildeki tam yolu: `/en/news/forest-fire-workshop` */
export const detailHref = (key: DetailRouteKey, locale: Locale, slug: string): string =>
  `/${locale}${DETAIL_ROUTES[key][locale].replace('[slug]', slug)}`

/**
 * Sanal sınıf katılım adresi: `/tr/sanal-sinif/12`
 * Ayrı bir yardımcı, çünkü parametre `[id]`dir ve `detailHref` `[slug]` arar.
 */
export const classroomHref = (locale: Locale, id: number | string): string =>
  `/${locale}${DETAIL_ROUTES['virtual-classroom'][locale].replace('[id]', String(id))}`

/** Serbest sayfa (Pages koleksiyonu): `/ru/kontakty` yerine `/ru/<slug>` */
export const pageHref = (locale: Locale, slug: string): string =>
  slug === 'home' || slug === '' ? `/${locale}` : `/${locale}/${slug}`

/**
 * next-intl `pathnames` yapısı: kanonik (TR) yol → dil bazlı karşılıklar.
 * ROUTES ve DETAIL_ROUTES'tan türetilir; elle güncellenmez.
 */
export const buildPathnames = (): Record<string, Record<Locale, string>> => {
  const entries: [string, Record<Locale, string>][] = []

  for (const route of Object.values(ROUTES)) {
    entries.push([route.tr, { ...route }])
  }
  for (const route of Object.values(DETAIL_ROUTES)) {
    entries.push([route.tr, { ...route }])
  }
  /*
    Kimlik sayfaları next-intl'e VERİLİR (yoksa /en/login 404 döner) ama
    `ROUTE_KEYS` içinde olmadıkları için sitemap'e GİRMEZLER.
  */
  for (const route of Object.values(AUTH_ROUTES)) {
    entries.push([route.tr, { ...route }])
  }

  return Object.fromEntries(entries)
}
