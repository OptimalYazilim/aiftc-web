import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import type { News } from '@/payload-types'

import { NewsCard, type NewsCardItem } from '@/components/news/NewsCard'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { RichTextBlock } from '@/components/ui/RichTextBlock'
import { NEWS_CATEGORIES } from '@/fields/options'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { DETAIL_ROUTES, detailHref, href } from '@/i18n/routes'
import { formatDate } from '@/lib/dates'
import { resolveMedia } from '@/lib/media'
import { buildMetadata } from '@/lib/metadata'
import { optionLabel } from '@/lib/optionLabel'
import { payloadClient } from '@/lib/queries'

/**
 * HABER DETAY SAYFASI  (Şartname 6.7)
 * ============================================================================
 * Slug çözümlemesi eğitim detay sayfasıyla AYNI üç adımlı mantığı izler:
 *   1. Slug bu dilde bulundu        → sayfa basılır.
 *   2. Slug başka bir dile ait      → bu dildeki doğru adrese yönlendirilir
 *      (404 yerine), böylece paylaşılan karışık bağlantılar çalışır.
 *   3. Hiçbir dilde yok             → 404.
 *
 * OKUNABİLİR SATIR GENİŞLİĞİ
 * Haber gövdesi `max-w-prose` ile sınırlanır. Şartname 13 "okunabilir yazı
 * boyutları" der; satır uzunluğu bunun ayrılmaz parçasıdır — 1400px genişlikte
 * kesintisiz akan bir metinde göz satır başını kaybeder. `max-w-prose`
 * yaklaşık 65 karakterlik tipografik ölçüyü verir.
 * ============================================================================
 */
export const revalidate = 300

type Props = { params: Promise<{ locale: Locale; slug: string }> }

type AllLocaleSlugs = { id: number; slug?: Partial<Record<Locale, string>> }

export async function generateStaticParams() {
  try {
    const payload = await payloadClient()
    const result = await payload.find({
      collection: 'news',
      locale: 'all',
      where: { _status: { equals: 'published' } },
      limit: 1000,
      pagination: false,
      depth: 0,
      overrideAccess: false,
    })

    const params: { locale: Locale; slug: string }[] = []

    for (const doc of result.docs as unknown as AllLocaleSlugs[]) {
      for (const locale of LOCALE_CODES) {
        const slug = doc.slug?.[locale]
        if (slug) params.push({ locale, slug })
      }
    }

    return params
  } catch {
    // Veritabanı build anında erişilemezse sayfalar istek anında üretilir.
    return []
  }
}

const findBySlug = async (locale: Locale, slug: string): Promise<News | null> => {
  const payload = await payloadClient()

  const result = await payload.find({
    collection: 'news',
    locale,
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 2,
  })

  return (result.docs[0] as News | undefined) ?? null
}

const findInAnyLocale = async (slug: string): Promise<AllLocaleSlugs | null> => {
  const payload = await payloadClient()

  const result = await payload.find({
    collection: 'news',
    locale: 'all',
    where: {
      _status: { equals: 'published' },
      or: LOCALE_CODES.map((locale) => ({ [`slug.${locale}`]: { equals: slug } })),
    },
    limit: 1,
    depth: 0,
    overrideAccess: false,
  })

  return (result.docs[0] as unknown as AllLocaleSlugs | undefined) ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}

  const doc = await findBySlug(locale, slug)
  if (!doc) return {}

  const alternates = await findInAnyLocale(slug)

  /**
   * Dil öneki OLMADAN yollar; `buildMetadata` öneki ve alan adını kendisi
   * ekler. Çevirisi girilmemiş bir dil listeye HİÇ girmez.
   */
  const pathByLocale: Partial<Record<Locale, string>> = {}
  for (const code of LOCALE_CODES) {
    const localeSlug = alternates?.slug?.[code]
    if (localeSlug) pathByLocale[code] = DETAIL_ROUTES['news-item'][code].replace('[slug]', localeSlug)
  }

  const cover = resolveMedia(doc.coverImage, 'og')

  return buildMetadata({
    locale,
    title: doc.title,
    description: doc.summary,
    pathByLocale,
    type: 'article',
    publishedTime: doc.publishedAt,
    image: cover ? { ...cover, alt: cover.alt || doc.title } : null,
  })
}

export default async function NewsDetailPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  let doc = await findBySlug(locale, slug)

  if (!doc) {
    const anyLocale = await findInAnyLocale(slug)
    const correctSlug = anyLocale?.slug?.[locale]

    if (correctSlug && correctSlug !== slug) {
      redirect(detailHref('news-item', locale, correctSlug))
    }

    if (correctSlug) doc = await findBySlug(locale, correctSlug)
  }

  if (!doc) notFound()

  const [t, tn, payload] = await Promise.all([
    getTranslations('news'),
    getTranslations('nav'),
    payloadClient(),
  ])

  // "Diğer haberler": en yeni üç kayıt, bulunulan haber hariç.
  const others = await payload.find({
    collection: 'news',
    locale,
    where: {
      _status: { equals: 'published' },
      id: { not_equals: doc.id },
    },
    sort: '-publishedAt',
    limit: 3,
    depth: 1,
  })

  const date = formatDate(locale, doc.publishedAt)
  const category = optionLabel(NEWS_CATEGORIES, doc.category, locale)
  const cover = resolveMedia(doc.coverImage, 'hero')

  const suggestions: NewsCardItem[] = others.docs.map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    publishedAt: item.publishedAt,
    categoryLabel: optionLabel(NEWS_CATEGORIES, item.category, locale),
    coverImage: item.coverImage,
  }))

  return (
    <>
      {/* --- Üst alan ------------------------------------------------------ */}
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page py-8 lg:py-10">
          <Breadcrumbs
            label={tn('breadcrumb')}
            items={[
              { label: tn('home'), href: `/${locale}` },
              { label: t('title'), href: href('news', locale) },
              { label: doc.title },
            ]}
          />

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {date ? (
              <time dateTime={doc.publishedAt ?? undefined} className="text-ink-600">
                {date}
              </time>
            ) : null}
            {category ? (
              <span className="rounded-full border border-line-strong px-3 py-1 text-ink-700">
                <span className="sr-only">{t('categoryLabel')}: </span>
                {category}
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 max-w-4xl text-3xl font-bold sm:text-4xl">{doc.title}</h1>
        </div>
      </section>

      {/* --- Gövde --------------------------------------------------------- */}
      <article className="container-page py-10 lg:py-14">
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt}
            width={cover.width}
            height={cover.height}
            priority
            sizes="(min-width: 1280px) 1024px, 100vw"
            className="mb-10 w-full rounded-card object-cover"
          />
        ) : null}

        {/* Okunabilir satır genişliği — bkz. dosya başındaki not. */}
        <div className="max-w-prose">
          <p className="text-lg font-medium text-ink-700">{doc.summary}</p>
          <RichTextBlock data={doc.content} className="mt-6" />
        </div>

        <p className="mt-12">
          <Link
            href={href('news', locale)}
            className="inline-flex min-h-11 items-center rounded border border-line-strong px-5 font-semibold text-brand-800 hover:border-brand-700"
          >
            ← {t('backToList')}
          </Link>
        </p>
      </article>

      {/* --- Diğer haberler ------------------------------------------------ */}
      {suggestions.length > 0 ? (
        <section aria-labelledby="other-news" className="border-t border-line bg-surface-alt">
          <div className="container-page py-12">
            <h2 id="other-news" className="text-2xl font-semibold">
              {t('otherNews')}
            </h2>
            <ul className="mt-6 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((item) => (
                <NewsCard
                  key={String(item.id)}
                  locale={locale}
                  item={item}
                  readMoreLabel={t('readMore')}
                  showImage={false}
                />
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  )
}
