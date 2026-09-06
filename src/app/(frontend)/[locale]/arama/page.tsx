import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { isLocale, LOCALE_CODES, type Locale } from '@/i18n/locales'
import { detailHref, href, ROUTES } from '@/i18n/routes'
import { buildMetadata } from '@/lib/metadata'
import { payloadClient } from '@/lib/queries'

/**
 * SİTE İÇİ ARAMA  (Şartname 6.10)
 * ============================================================================
 * ROTA: klasör adı `arama`, `ROUTES.search.tr` ile birebir aynıdır.
 * /tr/arama · /en/search · /ru/poisk
 *
 * NEDEN VAR
 * Üst hizmet şeridindeki arama düğmesinin gideceği bir yer olmalıydı. Düğmeyi
 * katalogdaki filtre kutusuna bağlamak yanıltıcı olurdu: o kutu YALNIZCA
 * eğitim programlarını süzer, haberleri ve kurumsal sayfaları görmez.
 *
 * NASIL ÇALIŞIYOR
 * Payload'ın `search` eklentisi altı koleksiyonu tek bir dizine yazıyor
 * (bkz. payload.config.ts — `searchPlugin`). Burada o dizinde BAŞLIK üzerinden
 * arama yapılır ve eklentinin `priority` değerine göre sıralanır.
 *
 * SINIR — DÜRÜSTÇE SÖYLENMESİ GEREKEN
 * Bu bir TAM METİN araması değildir; dizinde yalnızca başlık tutuluyor.
 * Sayfanın giriş metni bunu açıkça yazar, ziyaretçi "aradığım kelime içerikte
 * geçiyordu ama çıkmadı" durumuna düşmesin. Gövde metni de aranacaksa
 * `searchPlugin`'in `beforeSync` kancasıyla özet alanları dizine eklenmeli
 * ve yeni bir migration üretilmelidir.
 *
 * FORM
 * GET ile çalışır ve JavaScript GEREKTİRMEZ. Sonuç adresi paylaşılabilir
 * (`/tr/arama?q=yangin`). İstemci bileşeni yoktur.
 *
 * ÖNBELLEK
 * `q` her istekte farklı olabildiği için sayfa istek anında işlenir; sabit
 * bir ISR profili anlamsız olurdu. Parametresiz hâli (boş arama formu)
 * önceden üretilir.
 * ============================================================================
 */

/** Tek sayfada gösterilecek en fazla sonuç. Daha fazlası daraltma ister. */
const LIMIT = 40

/** Dizine yazılan koleksiyonlar → detay rotası eşlemesi. */
const DETAIL_BY_COLLECTION = {
  'training-programs': 'training-program',
  'training-topics': 'training-topic',
  news: 'news-item',
  'simulation-systems': 'simulation-system',
} as const

type IndexedCollection = keyof typeof DETAIL_BY_COLLECTION | 'pages' | 'faqs'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ q?: string }>
}

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const t = await getTranslations({ locale, namespace: 'search' })

  return buildMetadata({
    locale,
    title: t('metaTitle'),
    description: t('intro'),
    pathByLocale: { tr: ROUTES.search.tr, en: ROUTES.search.en, ru: ROUTES.search.ru },
  })
}

type Row = {
  id: string | number
  title: string
  collection: IndexedCollection
  slug: string | null
}

/**
 * Arama kaydını gerçek bir adrese çevirir.
 * `pages` ve `faqs` için detay rotası yoktur: sayfalar `[slug]` altında,
 * SSS'ler ise ilgili sayfanın içinde yaşar. `pages` doğrudan kök slug'a
 * bağlanır; `faqs` bağlantısız gösterilir (bkz. aşağıdaki `rowHref`).
 */
const rowHref = (row: Row, locale: Locale): string | null => {
  if (!row.slug) return null

  if (row.collection === 'pages') return `/${locale}/${row.slug}`
  if (row.collection === 'faqs') return null

  const detailKey = DETAIL_BY_COLLECTION[row.collection]
  return detailKey ? detailHref(detailKey, locale, row.slug) : null
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('search')
  const { q } = await searchParams

  /**
   * Arama terimi KULLANICI GİRDİSİDİR. Payload'ın `like` operatörü değeri
   * parametreli sorguya koyar (SQL enjeksiyonu riski yoktur), ancak çok kısa
   * terimler tüm dizini döndürür ve sayfa anlamsızlaşır: en az iki karakter
   * istenir. Uzunluk da sınırlanır — 200 karakterlik bir "terim" arama değil
   * yük denemesidir.
   */
  const query = (q ?? '').trim().slice(0, 200)
  const isValidQuery = query.length >= 2

  let rows: Row[] = []

  if (isValidQuery) {
    const payload = await payloadClient()

    const result = await payload.find({
      collection: 'search-index' as never,
      locale,
      where: { title: { like: query } },
      sort: '-priority',
      limit: LIMIT,
      // depth 1: `doc` ilişkisinin içindeki kaydın `slug` alanı için gerekli.
      depth: 1,
    })

    rows = (result.docs as unknown as {
      id: string | number
      title?: string | null
      doc?: { relationTo?: string; value?: unknown } | null
    }[])
      .map((doc) => {
        const related = doc.doc?.value
        const slug =
          related && typeof related === 'object' && 'slug' in related
            ? ((related as { slug?: string | null }).slug ?? null)
            : null

        return {
          id: doc.id,
          title: doc.title ?? '',
          collection: (doc.doc?.relationTo ?? 'pages') as IndexedCollection,
          slug,
        }
      })
      .filter((row) => row.title)
  }

  return (
    <>
      {/* --- Başlık ve arama formu --------------------------------------- */}
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page py-12 lg:py-16">
          <h1 className="text-3xl font-bold sm:text-4xl">{t('title')}</h1>
          <p className="mt-4 max-w-3xl text-lg text-ink-600">{t('intro')}</p>

          {/*
            GET formu: JavaScript kapalıyken de çalışır ve sonuç adresi
            paylaşılabilir. `role="search"` bölgeyi ekran okuyucuya tanıtır.
            Etiket `sr-only` değil GÖRÜNMEZ DEĞİL — `label` gerçek bir etiket
            olarak bağlıdır, yalnızca görsel olarak gizlenir; yer tutucu metin
            etiket yerine geçmez (WCAG 2.2 — 3.3.2).
          */}
          <form
            role="search"
            method="get"
            action={href('search', locale)}
            className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="site-search" className="sr-only">
              {t('inputLabel')}
            </label>
            <input
              id="site-search"
              type="search"
              name="q"
              defaultValue={query}
              placeholder={t('placeholder')}
              maxLength={200}
              className="min-h-12 flex-1 rounded-sm bg-surface px-4 text-base text-ink-900 placeholder:text-ink-500"
            />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-sm bg-brand-700 px-7 font-bold text-white transition-colors hover:bg-brand-800"
            >
              {t('submit')}
            </button>
          </form>
        </div>
      </section>

      {/* --- Sonuçlar ----------------------------------------------------- */}
      <section aria-labelledby="search-results" className="bg-surface-warm">
        <div className="container-page py-10 lg:py-14">
          <h2 id="search-results" className="sr-only">
            {t('title')}
          </h2>

          {!isValidQuery ? (
            <p className="text-ink-600">{t('emptyPrompt')}</p>
          ) : rows.length === 0 ? (
            <>
              {/*
                `role="status"`: sonuç yokluğu, formu gönderdikten sonra ekran
                okuyucuya DUYURULMASI gereken bir durumdur.
              */}
              <p role="status" className="font-semibold text-ink-900">
                {t('noResults')}
              </p>
              <p className="mt-2 text-ink-600">{t('noResultsHint')}</p>
            </>
          ) : (
            <>
              <p role="status" className="text-sm font-semibold uppercase tracking-wider text-ink-600">
                {t('resultsCount', { count: rows.length })}
              </p>

              {/*
                Sonuç listesi editoryal bir dizin gibi kurulur: üstte tür
                etiketi, altında kalın başlık. Kart kullanılmaz — arama
                sonuçları taranarak okunur, kart çerçeveleri taramayı
                yavaşlatır.
              */}
              <ul className="mt-6 divide-y divide-line-soft border-t border-line-soft">
                {rows.map((row) => {
                  const target = rowHref(row, locale)

                  return (
                    <li key={`${row.collection}-${row.id}`} className="py-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        {t(`types.${row.collection}`)}
                      </p>
                      <p className="mt-1 text-lg font-bold leading-snug tracking-tight sm:text-xl">
                        {target ? (
                          <Link
                            href={target}
                            className="text-shell-900 decoration-2 underline-offset-4 transition-colors hover:text-brand-800 hover:underline"
                          >
                            {row.title}
                          </Link>
                        ) : (
                          /*
                            Bağlantısı olmayan kayıt (örn. SSS) yine de
                            listelenir: ziyaretçi böyle bir içeriğin VAR
                            olduğunu görür. Tıklanamayan mavi bir başlık
                            göstermek yerine düz metin basılır.
                          */
                          <span className="text-shell-900">{row.title}</span>
                        )}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      </section>
    </>
  )
}
