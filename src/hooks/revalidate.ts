import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import { LOCALE_CODES } from '@/i18n/locales'

/**
 * Icerik yayimlandiginda ilgili Next.js sayfalarini yeniden uretir.
 * Sartname 14.1 (performans) - ISR ile CDN dostu, hizli sayfalar.
 */
export const revalidateCollection =
  (basePath: string): CollectionAfterChangeHook =>
  ({ doc, req, previousDoc }) => {
    if (req.context?.skipRevalidate || req.context?.skipTranslationStatus) return doc

    for (const locale of LOCALE_CODES) {
      revalidatePath(`/${locale}${basePath}`)

      const slug = typeof doc?.slug === 'string' ? doc.slug : undefined
      if (slug) revalidatePath(`/${locale}${basePath}/${slug}`)

      const previousSlug = typeof previousDoc?.slug === 'string' ? previousDoc.slug : undefined
      if (previousSlug && previousSlug !== slug) {
        revalidatePath(`/${locale}${basePath}/${previousSlug}`)
      }
    }

    revalidateTag('sitemap')
    return doc
  }

export const revalidateOnDelete =
  (basePath: string): CollectionAfterDeleteHook =>
  ({ doc, req }) => {
    // `revalidateCollection` ile ayni kacis kapisi: betikten yapilan
    // silmelerde `next/cache` baglami yoktur ve cagri hata firlatir.
    if (req?.context?.skipRevalidate) return doc

    for (const locale of LOCALE_CODES) {
      revalidatePath(`/${locale}${basePath}`)
      if (typeof doc?.slug === 'string') revalidatePath(`/${locale}${basePath}/${doc.slug}`)
    }
    revalidateTag('sitemap')
    return doc
  }

/**
 * Global degistiginde (menu, ayarlar, ana sayfa, dis linkler) layout'u tazele.
 *
 * `skipRevalidate`: koleksiyon hook'lariyla ayni kacis kapisi. `next/cache`
 * fonksiyonlari yalnizca bir Next.js istegi icinde calisir; seed/migration
 * gibi tek basina calisan Node betikleri bu baglami saglayamaz ve cagri
 * hata firlatir. Betikler `context: { skipRevalidate: true }` gecerek
 * tazelemeyi atlar — zaten tazelenecek calisan bir sunucu yoktur.
 */
export const revalidateGlobal =
  (tag: string): GlobalAfterChangeHook =>
  ({ doc, req }) => {
    if (req?.context?.skipRevalidate) return doc

    revalidateTag(tag)
    revalidateTag('layout')
    return doc
  }
