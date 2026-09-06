import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { NewsCard, type NewsCardItem } from '@/components/news/NewsCard'
import { Pagination } from '@/components/ui/Pagination'
import { NEWS_CATEGORIES } from '@/fields/options'
import { isLocale, LOCALE_CODES, type Locale } from '@/i18n/locales'
import { href, ROUTES } from '@/i18n/routes'
import { buildMetadata } from '@/lib/metadata'
import { optionLabel } from '@/lib/optionLabel'
import { payloadClient } from '@/lib/queries'

/**
 * HABERLER VE DUYURULAR — LİSTE  (Şartname 6.7)
 * ============================================================================
 * ROTA: klasör adı `haberler`, `ROUTES.news.tr` ile birebir aynıdır.
 * Ziyaretçi yerelleştirilmiş adresi görür: /tr/haberler · /en/news · /ru/novosti
 * Ana sayfadaki "Tümünü gör" ve menüdeki "Haberler" öğesi zaten bu rota
 * anahtarına (`href('news', locale)` ve `route: 'news'`) bağlıdır; ayrı bir
 * adres tanımlanmaz.
 *
 * SAYFALAMA VE ÖNBELLEK — ÜRETİM DERLEMESİYLE ÖLÇÜLDÜ
 * Rota `generateStaticParams` ile üç dilde ÖNCEDEN ÜRETİLİR (derleme
 * tablosunda `●`). Sorgu parametresi taşımayan istek bu hazır çıktıdan
 * karşılanır; `?page=N` taşıyan istek ise sunucuda yeniden işlenir.
 *
 * Doğrulama (üretim sunucusunda, `next start`):
 *     /tr/haberler          → 200   (önceden üretilmiş)
 *     /tr/haberler?page=99  → 404   (sunucuda değerlendirildi)
 *     /tr/haberler?page=abc → 200   (1'e indirgendi)
 * Yani sayfa numarası istek anında GERÇEKTEN okunuyor; ilk sayfanın statik
 * kalması sayfalamayı bozmuyor.
 *
 * Alternatif `/haberler/sayfa/2` biçiminde bir segment olurdu; bu, ROUTES
 * sözlüğüne üç dil için ayrı kayıt ve dil bazlı "sayfa" kelimesi gerektirirdi.
 * Sorgu parametresi bu maliyeti doğurmadan aynı sonucu veriyor.
 * ============================================================================
 */

/**
 * Diğer sayfalarla aynı ISR aralığı. Bu bildirim EKSİKTİ ve derleme
 * tablosunda bu rota "Revalidate" sütunu boş olan tek satırdı.
 *
 * Not: bildirim eklendikten sonra da sütun boş görünüyor — Next bu rotayı
 * sorgulu isteklerde istek anında işlediği için ona sabit bir yenileme
 * profili atamıyor. Yine de bildirim tutarlılık için bırakıldı; içerik
 * yayımlandığında listeyi asıl tazeleyen `hooks/revalidate.ts` içindeki
 * `revalidateCollection('/haberler')` hook'udur.
 */
export const revalidate = 300

/** Bir sayfada gösterilecek haber sayısı. 12 = 2/3/4 sütunlu ızgarada tam sıra. */
const PER_PAGE = 12

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ page?: string }>
}

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const t = await getTranslations({ locale, namespace: 'news' })

  return buildMetadata({
    locale,
    title: t('metaTitle'),
    description: t('intro'),
    pathByLocale: {
      tr: ROUTES.news.tr,
      en: ROUTES.news.en,
      ru: ROUTES.news.ru,
    },
  })
}

export default async function NewsListPage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const { page: pageParam } = await searchParams

  /**
   * Sayfa numarası KULLANICI GİRDİSİDİR: "abc", "-3", "1e9" gelebilir.
   * Tam sayıya indirgenir ve 1'in altına düşürülmez; üst sınır toplam sayfa
   * sayısı bilindikten sonra uygulanır.
   */
  const requestedPage = Math.max(1, Math.floor(Number(pageParam)) || 1)

  const t = await getTranslations('news')
  const payload = await payloadClient()

  const result = await payload.find({
    collection: 'news',
    locale,
    where: { _status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: PER_PAGE,
    page: requestedPage,
    depth: 1,
  })

  // Var olmayan bir sayfa istendiyse (örn. ?page=99) 404 verilir; boş bir
  // liste göstermek arama motoruna "burada içerik var" demek olurdu.
  if (result.totalDocs > 0 && requestedPage > result.totalPages) notFound()

  const items: NewsCardItem[] = result.docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    summary: doc.summary,
    publishedAt: doc.publishedAt,
    categoryLabel: optionLabel(NEWS_CATEGORIES, doc.category, locale),
    coverImage: doc.coverImage,
  }))

  return (
    <>
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page py-12 lg:py-16">
          <h1 className="text-3xl font-bold sm:text-4xl">{t('title')}</h1>
          <p className="mt-4 max-w-3xl text-lg text-ink-600">{t('intro')}</p>
        </div>
      </section>

      <section aria-labelledby="news-list" className="bg-surface-warm">
        <div className="container-page py-10 lg:py-14">
        <h2 id="news-list" className="sr-only">
          {t('listHeading')}
        </h2>

        {items.length === 0 ? (
          <p className="rounded-card border border-line bg-surface-alt p-6 text-ink-700">
            {t('empty')}
          </p>
        ) : (
          <>
            <p className="text-ink-600">{t('resultsCount', { count: result.totalDocs })}</p>

            <ul className="mt-6 grid auto-rows-fr gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <NewsCard
                  key={String(item.id)}
                  locale={locale}
                  item={item}
                  readMoreLabel={t('readMore')}
                />
              ))}
            </ul>

            <Pagination
              currentPage={result.page ?? requestedPage}
              totalPages={result.totalPages}
              basePath={href('news', locale)}
              labels={{
                navigation: t('paginationLabel'),
                previous: t('previousPage'),
                next: t('nextPage'),
                current: t('currentPage'),
                page: (page) => t('pageNumber', { page }),
              }}
            />
          </>
        )}
        </div>
      </section>
    </>
  )
}
