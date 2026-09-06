import type { CollectionAfterChangeHook } from 'payload'

import { LOCALE_CODES, type Locale } from '@/i18n/locales'

type TranslationStatus = {
  complete: Locale[]
  missing: Locale[]
  updatedAt: string
}

/**
 * Sartname 5. madde:
 *   "Eksik ceviri bulunan icerikler yonetim panelinde gorulebilmelidir."
 *
 * Kayit her degistiginde dokumani `locale: 'all'` ile yeniden okur, izlenen
 * alanlarin hangi dillerde dolu oldugunu hesaplar ve dile bagli olmayan
 * `translationStatus` alanina yazar. Admin listesinde bu alan uzerinden
 * "Eksik ceviri" filtresi kurulabilir.
 *
 * Sonsuz donguyu `req.context` bayragi engeller.
 */
export const syncTranslationStatus =
  (watchedFields: string[] = ['title']): CollectionAfterChangeHook =>
  async ({ doc, req, collection, context }) => {
    if (context?.skipTranslationStatus) return doc

    /**
     * DIKKAT — `req` PAYLASILAN bir nesnedir ve local API cagrilari onu
     * MUTASYONA UGRATIR: asagidaki `locale: 'all'` okumasi `req.locale`
     * degerini kalici olarak 'all' yapar.
     *
     * Bu tek satirlik yan etki iki seyi birden bozar:
     *   1. Sonraki `update` cagrisi da 'all' modunda calisir. O modda TUM
     *      localized alanlar `{ tr: ..., en: ... }` biciminde doner; SEO
     *      eklentisinin `meta.image` yukleme alani da bir OBJE olur ve
     *      iliski dogrulamasindan gecemez. Dogrulama hatasi Payload'in
     *      `killTransaction` cagrisini tetikler ve BU KAYDIN KENDISI GERI
     *      ALINIR — kayit paneldeyken de sessizce kaybolur.
     *   2. Ayni istekte sonra calisan hook'lar (ornegin arama eklentisi)
     *      `req.locale`'i okur ve yanlis dile yazar.
     *
     * Bu yuzden okuma sonrasi orijinal dil GERI YUKLENIR. `finally`:
     * okuma hata verse bile req temiz birakilir.
     */
    const originalLocale = req.locale

    try {
      let full: unknown

      try {
        full = await req.payload.findByID({
          collection: collection.slug,
          id: doc.id,
          locale: 'all',
          depth: 0,
          overrideAccess: true,
          req,
        })
      } finally {
        req.locale = originalLocale
      }

      const complete: Locale[] = []
      const missing: Locale[] = []

      for (const locale of LOCALE_CODES) {
        const filled = watchedFields.every((fieldName) => {
          const perLocale = (full as Record<string, unknown>)[fieldName] as
            | Record<string, unknown>
            | undefined
          const value = perLocale?.[locale]
          return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
        })

        if (filled) complete.push(locale)
        else missing.push(locale)
      }

      const status: TranslationStatus = {
        complete,
        missing,
        updatedAt: new Date().toISOString(),
      }

      const previous = (full as Record<string, unknown>).translationStatus as
        | TranslationStatus
        | undefined

      const unchanged =
        previous &&
        previous.complete?.join(',') === complete.join(',') &&
        previous.missing?.join(',') === missing.join(',')

      if (unchanged) return doc

      await req.payload.update({
        collection: collection.slug,
        id: doc.id,
        data: { translationStatus: status },
        depth: 0,
        overrideAccess: true,
        context: { skipTranslationStatus: true },
        req,
      })
    } catch (error) {
      req.payload.logger.error({ err: error }, 'translationStatus guncellenemedi')
    }

    return doc
  }
