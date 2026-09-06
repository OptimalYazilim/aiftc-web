import type { MetadataRoute } from 'next'
import type { CollectionSlug } from 'payload'

import { DEFAULT_LOCALE, LOCALES, LOCALE_CODES, PRIMARY_DOMAIN, type Locale } from '@/i18n/locales'
import { detailHref, href, pageHref, ROUTE_KEYS, type DetailRouteKey } from '@/i18n/routes'
import { payloadClient } from '@/lib/queries'

/**
 * ÇOK DİLLİ SITEMAP  (Şartname 3.5 — Uluslararası SEO ve Dil Mimarisi)
 * ============================================================================
 * Her URL, diğer iki dildeki karşılığını `alternates.languages` içinde taşır.
 * Bu, arama motorlarına üç sürümün AYNI içerik olduğunu söyler; aksi halde
 * TR/EN/RU sayfalar birbirinin kopyası sayılıp sıralamada birbirini yer.
 *
 * Slug'lar dile göre farklı olduğu için kayıtlar `locale: 'all'` ile okunur;
 * böylece her dilin kendi slug'ıyla doğru alternatif üretilir.
 * ============================================================================
 */

const abs = (path: string) => `${PRIMARY_DOMAIN}${path}`

/** Detay sayfası olan koleksiyonlar ve karşılık gelen rota anahtarları. */
const DETAIL_COLLECTIONS: { collection: CollectionSlug; route: DetailRouteKey }[] = [
  { collection: 'training-topics', route: 'training-topic' },
  { collection: 'training-programs', route: 'training-program' },
  { collection: 'simulation-systems', route: 'simulation-system' },
  { collection: 'news', route: 'news-item' },
  { collection: 'gallery-albums', route: 'gallery-album' },
  { collection: 'projects', route: 'project' },
  /*
    Kütüphane künye sayfaları. Aşağıdaki sorgu `overrideAccess: false`
    geçtiği için erişimi kısıtlı kayıtlar sitemap'e HİÇ girmez — arama
    motoruna yalnızca herkese açık künyeler duyurulur.
  */
  { collection: 'library-resources', route: 'library-resource' },
]

type AllLocaleDoc = {
  slug?: Partial<Record<Locale, string>>
  updatedAt?: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await payloadClient()
  const entries: MetadataRoute.Sitemap = []

  // --- Statik bölümler ------------------------------------------------------
  for (const key of ROUTE_KEYS) {
    const languages = Object.fromEntries(
      LOCALES.map((locale) => [locale.hrefLang, abs(href(key, locale.code))]),
    )
    languages['x-default'] = abs(href(key, DEFAULT_LOCALE))

    for (const locale of LOCALE_CODES) {
      entries.push({
        url: abs(href(key, locale)),
        changeFrequency: key === 'home' || key === 'news' ? 'daily' : 'weekly',
        priority: key === 'home' ? 1 : 0.7,
        alternates: { languages },
      })
    }
  }

  // --- Detay sayfaları ------------------------------------------------------
  for (const { collection, route } of DETAIL_COLLECTIONS) {
    try {
      const result = await payload.find({
        collection,
        locale: 'all',
        where: { _status: { equals: 'published' } },
        limit: 1000,
        pagination: false,
        depth: 0,
        overrideAccess: false,
      })

      for (const doc of result.docs as AllLocaleDoc[]) {
        const slugs = doc.slug ?? {}

        const languages: Record<string, string> = {}
        for (const locale of LOCALES) {
          const slug = slugs[locale.code]
          if (slug) languages[locale.hrefLang] = abs(detailHref(route, locale.code, slug))
        }

        const defaultSlug = slugs[DEFAULT_LOCALE]
        if (defaultSlug) {
          languages['x-default'] = abs(detailHref(route, DEFAULT_LOCALE, defaultSlug))
        }

        for (const locale of LOCALE_CODES) {
          const slug = slugs[locale]
          if (!slug) continue // O dilde çevirisi yoksa sitemap'e eklenmez.

          entries.push({
            url: abs(detailHref(route, locale, slug)),
            lastModified: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
            changeFrequency: 'weekly',
            priority: 0.6,
            alternates: { languages },
          })
        }
      }
    } catch {
      // Koleksiyon henüz oluşmamışsa sitemap üretimi durmaz.
    }
  }

  // --- Serbest sayfalar -----------------------------------------------------
  try {
    const pages = await payload.find({
      collection: 'pages',
      locale: 'all',
      where: { _status: { equals: 'published' } },
      limit: 500,
      pagination: false,
      depth: 0,
      overrideAccess: false,
    })

    for (const doc of pages.docs as AllLocaleDoc[]) {
      const slugs = doc.slug ?? {}

      const languages: Record<string, string> = {}
      for (const locale of LOCALES) {
        const slug = slugs[locale.code]
        if (slug) languages[locale.hrefLang] = abs(pageHref(locale.code, slug))
      }

      for (const locale of LOCALE_CODES) {
        const slug = slugs[locale]
        if (!slug) continue

        entries.push({
          url: abs(pageHref(locale, slug)),
          lastModified: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
          changeFrequency: 'monthly',
          priority: 0.5,
          alternates: { languages },
        })
      }
    }
  } catch {
    /* yok say */
  }

  return entries
}
