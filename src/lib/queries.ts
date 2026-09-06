import { cache } from 'react'
import { getPayload, type CollectionSlug } from 'payload'
import configPromise from '@payload-config'

import type { Locale } from '@/i18n/locales'

/**
 * Payload veri erişim katmanı.
 *
 * React `cache()` aynı istek içinde tekrarlanan çağrıları teklerler:
 * header, footer ve sayfa aynı global'i istese bile veritabanına tek sorgu
 * gider. Sayfa seviyesindeki `revalidate` ile birlikte Neon'a giden yükü
 * düşük tutar (Şartname 14.1).
 *
 * Bileşenler `getPayload`'ı doğrudan çağırmaz; hep buradan geçer.
 */

export const payloadClient = cache(async () => getPayload({ config: configPromise }))

export const getSiteSettings = cache(async (locale: Locale) => {
  const payload = await payloadClient()
  return payload.findGlobal({ slug: 'site-settings', locale, depth: 2 })
})

export const getNavigation = cache(async (locale: Locale) => {
  const payload = await payloadClient()
  return payload.findGlobal({ slug: 'navigation', locale, depth: 2 })
})

/**
 * Ana sayfa Hero'su ve öne çıkan eğitimler şeridinin ayarları.
 * depth: 2 — arka plan görselinin `url`/`width`/`height` alanları ve
 * butonların bağlandığı sayfanın `slug`'ı tek sorguda gelir.
 */
export const getHomepage = cache(async (locale: Locale) => {
  const payload = await payloadClient()
  return payload.findGlobal({ slug: 'homepage', locale, depth: 2 })
})

export const getExternalServices = cache(async (locale: Locale) => {
  const payload = await payloadClient()
  return payload.findGlobal({ slug: 'external-services', locale, depth: 1 })
})

export const getSimulationCenter = cache(async (locale: Locale) => {
  const payload = await payloadClient()
  return payload.findGlobal({ slug: 'simulation-center', locale, depth: 2 })
})

/**
 * Footer'daki "Öne Çıkan Başlıklar" sütunu.
 * Konu adları KOD İÇİNE YAZILMAZ: editör panelden bir konuyu öne çıkardığında
 * footer da onu gösterir. `cache()` sayesinde sayfa başına tek sorgu gider.
 */
export const getFooterTopics = cache(async (locale: Locale) => {
  const payload = await payloadClient()

  const result = await payload.find({
    collection: 'training-topics',
    locale,
    where: { featured: { equals: true }, _status: { equals: 'published' } },
    sort: 'order',
    limit: 4,
    depth: 0,
  })

  return result.docs.map((doc) => ({ id: doc.id, title: doc.title, slug: doc.slug }))
})

/** Header + footer'ın ihtiyaç duyduğu her şeyi tek seferde toplar. */
export const getLayoutData = cache(async (locale: Locale) => {
  const [settings, navigation, services] = await Promise.all([
    getSiteSettings(locale),
    getNavigation(locale),
    getExternalServices(locale),
  ])

  return { settings, navigation, services }
})

/**
 * Bir kaydın diğer dillerdeki slug'larını getirir.
 * Dil değiştirici, detay sayfalarında doğru URL'e gidebilmek için buna
 * ihtiyaç duyar: aynı haber TR'de `orman-yangini-calistayi`, EN'de
 * `forest-fire-workshop` slug'ına sahiptir.
 */
export const getSlugAlternates = cache(
  async (collection: CollectionSlug, id: string | number): Promise<Partial<Record<Locale, string>>> => {
    const payload = await payloadClient()

    const doc = (await payload.findByID({
      collection,
      id,
      locale: 'all',
      depth: 0,
      overrideAccess: false,
    })) as { slug?: Record<string, string> }

    return (doc?.slug ?? {}) as Partial<Record<Locale, string>>
  },
)
