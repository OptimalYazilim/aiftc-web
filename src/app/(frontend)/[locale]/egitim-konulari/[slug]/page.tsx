import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import type { TrainingTopic } from '@/payload-types'

import { TrainingCard, type TrainingCardItem } from '@/components/training/TrainingCard'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { RichTextBlock, hasRichTextContent } from '@/components/ui/RichTextBlock'
import { TRAINING_LEVELS, TRAINING_TOPIC_CATEGORIES } from '@/fields/options'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { DETAIL_ROUTES, detailHref, href } from '@/i18n/routes'
import { resolveMedia } from '@/lib/media'
import { buildMetadata } from '@/lib/metadata'
import { optionLabel, optionLabels } from '@/lib/optionLabel'
import { payloadClient } from '@/lib/queries'

/**
 * EĞİTİM KONUSU DETAY SAYFASI  (Şartname 6.3 / EK-2 1.3)
 * ============================================================================
 * ROTA: `DETAIL_ROUTES['training-topic']`
 *   /tr/egitim-konulari/[slug] · /en/training-topics/[slug]
 *
 * ---------------------------------------------------------------------------
 * EN ÖNCELİKLİ EKSİK BUYDU
 * ---------------------------------------------------------------------------
 * Bu adres sitemap'te olduğu gibi SİTE İÇİNDE de görünür bağlantılarla
 * çağrılıyordu ve sayfa olmadığı için ziyaretçi 404 alıyordu:
 *   app/(frontend)/[locale]/page.tsx        → ana sayfadaki konu çipleri
 *   egitim-programlari/[slug]/page.tsx      → eğitim künyesindeki konu rozeti
 *   arama/page.tsx                          → arama sonucu bağlantısı
 * Yani sorun yalnızca arama motorunda değil, ziyaretçinin ilk tıklamasındaydı.
 *
 * ---------------------------------------------------------------------------
 * "BU KONUDAKİ EĞİTİMLER" — TERS İLİŞKİDEN
 * ---------------------------------------------------------------------------
 * `training-programs` koleksiyonu konulara `topics` alanıyla bağlanır; konu
 * tarafında karşılık alanı YOKTUR. Bu yüzden liste, program koleksiyonuna
 * `topics: { in: [id] }` sorgusuyla ters yönden çekilir. Ayrı bir "ilgili
 * eğitimler" alanı açmak, editöre aynı bağı iki kez kurdururdu.
 * ============================================================================
 */
export const revalidate = 300

type Props = { params: Promise<{ locale: Locale; slug: string }> }

type AllLocaleSlugs = { id: number; slug?: Partial<Record<Locale, string>> }

export async function generateStaticParams() {
  try {
    const payload = await payloadClient()
    const result = await payload.find({
      collection: 'training-topics',
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
    return []
  }
}

const findBySlug = async (locale: Locale, slug: string): Promise<TrainingTopic | null> => {
  const payload = await payloadClient()
  const result = await payload.find({
    collection: 'training-topics',
    locale,
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 2,
    overrideAccess: false,
  })
  return (result.docs[0] as TrainingTopic | undefined) ?? null
}

const findInAnyLocale = async (slug: string): Promise<AllLocaleSlugs | null> => {
  const payload = await payloadClient()
  const result = await payload.find({
    collection: 'training-topics',
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

  const pathByLocale: Partial<Record<Locale, string>> = {}
  for (const code of LOCALE_CODES) {
    const localeSlug = alternates?.slug?.[code]
    if (localeSlug) {
      pathByLocale[code] = DETAIL_ROUTES['training-topic'][code].replace('[slug]', localeSlug)
    }
  }

  const cover = resolveMedia(doc.coverImage, 'og')

  return buildMetadata({
    locale,
    title: doc.title,
    description: doc.summary,
    pathByLocale,
    image: cover ? { ...cover, alt: cover.alt || doc.title } : null,
  })
}

export default async function TrainingTopicPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  let doc = await findBySlug(locale, slug)

  if (!doc) {
    const anyLocale = await findInAnyLocale(slug)
    const correctSlug = anyLocale?.slug?.[locale]
    if (correctSlug && correctSlug !== slug) {
      redirect(detailHref('training-topic', locale, correctSlug))
    }
    if (correctSlug) doc = await findBySlug(locale, correctSlug)
  }

  if (!doc) notFound()

  const [t, tt, tn, payload] = await Promise.all([
    getTranslations('topics'),
    getTranslations('training'),
    getTranslations('nav'),
    payloadClient(),
  ])

  /* Ters ilişki: bu konuya bağlı yayımlanmış eğitim programları. */
  const programlar = await payload.find({
    collection: 'training-programs',
    locale,
    where: {
      _status: { equals: 'published' },
      topics: { in: [doc.id] },
    },
    sort: '-startDate',
    limit: 12,
    depth: 1,
    overrideAccess: false,
  })

  const cover = resolveMedia(doc.coverImage, 'hero')
  const kategori = optionLabel(TRAINING_TOPIC_CATEGORIES, doc.category, locale)
  const duzeyler = optionLabels(TRAINING_LEVELS, doc.level, locale)
  const kazanimlar = (doc.learningOutcomes ?? []).filter((item) => Boolean(item?.text?.trim()))
  const keywords = (doc.keywords ?? []).filter((word): word is string => Boolean(word?.trim()))

  const kartlar: TrainingCardItem[] = programlar.docs.map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    startDate: item.startDate,
    endDate: item.endDate,
    status: item.status,
    coverImage: item.coverImage,
  }))

  return (
    <>
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero-compact">
          <Breadcrumbs
            label={tn('breadcrumb')}
            items={[
              { label: tn('home'), href: `/${locale}` },
              { label: t('eyebrow'), href: href('training-topics', locale) },
              { label: doc.title },
            ]}
          />

          {kategori ? <p className="eyebrow mt-6">{kategori}</p> : null}
          <h1 className="title-record measure mt-3">{doc.title}</h1>
          {doc.summary ? <p className="lede measure mt-4">{doc.summary}</p> : null}
        </div>
      </section>

      <div className="container-page section-block">
        <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <article className="min-w-0">
            {cover ? (
              <Image
                src={cover.url}
                alt={cover.alt || ''}
                width={cover.width}
                height={cover.height}
                priority
                sizes="(min-width: 1024px) 720px, 100vw"
                className="mb-10 w-full border border-line-soft object-cover"
              />
            ) : null}

            {/* Boş bir Lexical alanı `null` değildir — koruma zorunlu. */}
            {hasRichTextContent(doc.description) ? (
              <RichTextBlock data={doc.description} className="max-w-prose" />
            ) : null}

            {kazanimlar.length > 0 ? (
              <section aria-labelledby="topic-outcomes" className="mt-12 border-t border-line-soft pt-6">
                <h2 id="topic-outcomes" className="eyebrow">
                  {t('outcomesHeading')}
                </h2>
                <ul className="mt-4 max-w-prose space-y-2">
                  {kazanimlar.map((item, index) => (
                    <li
                      key={`${item.text}-${index}`}
                      className="flex gap-3 text-sm leading-relaxed text-ink-700"
                    >
                      <span aria-hidden="true" className="mt-2 h-1 w-3 shrink-0 bg-brand-700" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {doc.targetAudience ? (
              <section aria-labelledby="topic-audience" className="mt-10 border-t border-line-soft pt-6">
                <h2 id="topic-audience" className="eyebrow">
                  {t('audienceHeading')}
                </h2>
                <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-700">
                  {doc.targetAudience}
                </p>
              </section>
            ) : null}

            <p className="mt-14">
              <Link
                href={href('training-topics', locale)}
                className="inline-flex min-h-11 items-center border border-line-strong px-5 text-sm font-semibold text-brand-800 transition-colors duration-300 hover:border-brand-700"
              >
                ← {t('backToList')}
              </Link>
            </p>
          </article>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            {duzeyler.length > 0 ? (
              <>
                <h2 className="eyebrow border-t-2 border-shell-900 pt-4">{t('levelLabel')}</h2>
                <p className="mt-2 border-t border-line-soft py-2.5 text-sm text-shell-900">
                  {duzeyler.join(', ')}
                </p>
              </>
            ) : null}

            {keywords.length > 0 ? (
              <section aria-labelledby="topic-keywords" className={duzeyler.length > 0 ? 'mt-8' : ''}>
                <h2 id="topic-keywords" className="eyebrow border-t-2 border-shell-900 pt-4">
                  {t('keywordsHeading')}
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {keywords.map((word) => (
                    <li key={word} className="border border-line px-3 py-1 text-xs text-ink-700">
                      {word}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </aside>
        </div>
      </div>

      {/* --- Bu konudaki eğitim programları ------------------------------- */}
      <section aria-labelledby="topic-programs" className="border-t border-line bg-surface-alt">
        <div className="container-page py-12">
          <h2 id="topic-programs" className="title-section">
            {t('programsHeading')}
          </h2>

          {kartlar.length === 0 ? (
            <p className="mt-6 rounded-card border border-line bg-surface p-6 text-ink-700">
              {t('noPrograms')}
            </p>
          ) : (
            <ul className="mt-6 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {kartlar.map((item) => (
                <TrainingCard
                  key={String(item.id)}
                  locale={locale}
                  item={item}
                  statusPrefix={tt('statusLabel')}
                  detailLabel={tt('viewDetails')}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}
