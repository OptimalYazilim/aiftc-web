import type { Metadata } from 'next'

import { buildAlternates, PRIMARY_DOMAIN, type Locale } from '@/i18n/locales'

/**
 * META VERİ ÜRETİCİSİ — TEK KAYNAK  (Şartname 3.5)
 * ============================================================================
 * Her sayfanın `generateMetadata` fonksiyonu aynı üç şeyi kurmak zorundadır:
 * OpenGraph, Twitter kartı ve dil alternatifleri (hreflang + canonical).
 * Sayfa sayfa elle yazıldığında biri eksik kalır ve bu SESSİZ bir hatadır —
 * site çalışmaya devam eder, yalnızca paylaşım önizlemesi bozulur ya da
 * arama motoru üç dili birbirinin kopyası sanır.
 *
 * CANONICAL
 * Her sayfa KENDİ dilindeki adresini canonical gösterir; diğer diller
 * `alternates.languages` içinde hreflang olarak durur. Ortak bir canonical
 * verilseydi (örneğin hep TR), EN ve RU sayfalar dizinden düşerdi.
 *
 * GÖRSEL
 * Sıralama: içeriğin kendi kapak görseli → Genel Ayarlar'daki paylaşım
 * görseli → hiç. Görsel yoksa `images` anahtarı HİÇ basılmaz; boş dizi
 * bazı platformlarda kırık önizleme üretir.
 * ============================================================================
 */

export type OgImage = {
  url: string
  width?: number | null
  height?: number | null
  alt?: string | null
}

export type MetadataInput = {
  locale: Locale
  title: string
  description?: string | null
  /**
   * Dil başına, dil öneki OLMADAN yol: `{ tr: '/haberler/x', en: '/news/y' }`.
   * Bir dilde çevirisi yoksa o dil hiç eklenmez — var olmayan bir adrese
   * hreflang vermek arama motoruna 404 gösterir.
   */
  pathByLocale: Partial<Record<Locale, string>>
  image?: OgImage | null
  /** Haber ve eğitim detayları `article`, listeler `website`. */
  type?: 'website' | 'article'
  publishedTime?: string | null
  siteName?: string | null
}

const absolute = (locale: Locale, path: string) => `${PRIMARY_DOMAIN}/${locale}${path}`

export const buildMetadata = ({
  locale,
  title,
  description,
  pathByLocale,
  image,
  type = 'website',
  publishedTime,
  siteName,
}: MetadataInput): Metadata => {
  const currentPath = pathByLocale[locale]
  const alternates = buildAlternates(pathByLocale)

  const images = image?.url
    ? [
        {
          url: image.url.startsWith('http') ? image.url : `${PRIMARY_DOMAIN}${image.url}`,
          ...(image.width ? { width: image.width } : {}),
          ...(image.height ? { height: image.height } : {}),
          alt: image.alt ?? title,
        },
      ]
    : undefined

  return {
    title,
    ...(description ? { description } : {}),
    alternates: {
      ...(currentPath !== undefined ? { canonical: absolute(locale, currentPath) } : {}),
      languages: alternates.languages,
    },
    openGraph: {
      title,
      ...(description ? { description } : {}),
      ...(siteName ? { siteName } : {}),
      type,
      ...(currentPath !== undefined ? { url: absolute(locale, currentPath) } : {}),
      ...(publishedTime ? { publishedTime } : {}),
      ...(images ? { images } : {}),
    },
    twitter: {
      // Görsel varsa büyük kart, yoksa özet kartı: görselsiz "large_image"
      // kartı X/Twitter'da boş bir çerçeve olarak görünür.
      card: images ? 'summary_large_image' : 'summary',
      title,
      ...(description ? { description } : {}),
      ...(images ? { images } : {}),
    },
  }
}
