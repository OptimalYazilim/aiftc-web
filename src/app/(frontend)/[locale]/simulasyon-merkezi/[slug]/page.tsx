import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { RichTextBlock, hasRichTextContent } from '@/components/ui/RichTextBlock'
import { isLocale, LOCALE_CODES, type Locale } from '@/i18n/locales'
import { DETAIL_ROUTES, detailHref, href } from '@/i18n/routes'
import { formatDateRange } from '@/lib/dates'
import { resolveMedia } from '@/lib/media'
import { buildMetadata } from '@/lib/metadata'
import { payloadClient } from '@/lib/queries'
import { trainingStatusClasses, trainingStatusLabel } from '@/lib/trainingStatus'

/**
 * SİMÜLASYON SİSTEMİ DETAYI  (Şartname 9)
 * ============================================================================
 * ROTA: `DETAIL_ROUTES['simulation-system']`
 * /tr/simulasyon-merkezi/[slug] · /en/simulation-centre/[slug] · ...
 *
 * BU SAYFA YOKTU ve iki yerden BAĞLANIYORDU:
 *   - eğitim detay sayfasındaki "Uygulama ve Simülasyon" bölümü
 *   - site içi arama (search-index `simulation-systems` koleksiyonunu içerir)
 * Yani her iki bağlantı da 404'e gidiyordu. Ölçülerek görüldü.
 *
 * MERKEZ SAYFASIYLA İŞ BÖLÜMÜ
 *   /simulasyon-merkezi        → merkezin amacı + sistemlerin ÖZETİ
 *   /simulasyon-merkezi/[slug] → TEK sistemin tamamı: açıklama, kullanım
 *                                alanları, teknik özellikler, uluslararası
 *                                katılımcıya faydası, eğitimlerdeki kullanımı
 * İçerik iki sayfada TEKRARLANMAZ; özet kart ile ayrıntı birbirini tamamlar.
 * ============================================================================
 */
export const revalidate = 300

type Props = { params: Promise<{ locale: Locale; slug: string }> }

type AllLocaleSlugs = { id: number; slug?: Partial<Record<Locale, string>> }

export async function generateStaticParams() {
  try {
    const payload = await payloadClient()
    const result = await payload.find({
      collection: 'simulation-systems',
      locale: 'all',
      where: { _status: { equals: 'published' } },
      limit: 200,
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
    // Veritabanı build anında erişilemezse sayfa istek anında üretilir.
    return []
  }
}

type SystemDoc = {
  id: number
  slug?: string | null
  title?: string | null
  shortCode?: string | null
  summary?: string | null
  description?: unknown
  benefitsForInternational?: unknown
  usageInTraining?: unknown
  capacity?: number | null
  supportsRemote?: boolean | null
  coverImage?: unknown
  gallery?: unknown[] | null
  useCases?: { text?: string | null }[] | null
  technicalSpecs?: { label?: string | null; value?: string | null }[] | null
}

const findBySlug = async (locale: Locale, slug: string): Promise<SystemDoc | null> => {
  const payload = await payloadClient()
  const result = await payload.find({
    collection: 'simulation-systems',
    locale,
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 2,
  })
  return (result.docs[0] as unknown as SystemDoc | undefined) ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}

  const doc = await findBySlug(locale, slug)
  if (!doc) return {}

  const cover = resolveMedia(doc.coverImage, 'og')

  return buildMetadata({
    locale,
    title: doc.title ?? slug,
    description: doc.summary,
    pathByLocale: {
      tr: DETAIL_ROUTES['simulation-system'].tr.replace('[slug]', slug),
      en: DETAIL_ROUTES['simulation-system'].en.replace('[slug]', slug),
      ru: DETAIL_ROUTES['simulation-system'].ru.replace('[slug]', slug),
    },
    image: cover ? { ...cover, alt: cover.alt || (doc.title ?? '') } : null,
  })
}

export default async function SimulationSystemPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const doc = await findBySlug(locale, slug)
  if (!doc) notFound()

  const [t, tt, tn] = await Promise.all([
    getTranslations('simulation'),
    getTranslations('training'),
    getTranslations('nav'),
  ])

  const payload = await payloadClient()

  /**
   * Bu sistemi kullanan eğitimler. İlişki EĞİTİM tarafında tutulduğu için
   * sorgu da oradan yapılır — sistem tarafında ters alan yoktur (aynı bilgiyi
   * iki yerde tutmamak için; bkz. simulasyon-merkezi/page.tsx notu).
   */
  const trainings = await payload.find({
    collection: 'training-programs',
    locale,
    where: {
      _status: { equals: 'published' },
      simulationSystems: { in: [doc.id] },
    },
    sort: 'startDate',
    limit: 100,
    depth: 0,
  })

  const cover = resolveMedia(doc.coverImage, 'hero')
  const gallery = (doc.gallery ?? [])
    .map((item) => resolveMedia(item, 'card'))
    .filter((image): image is NonNullable<typeof image> => image !== null)

  const useCases = (doc.useCases ?? []).filter((c) => c.text?.trim())
  const specs = (doc.technicalSpecs ?? []).filter((s) => s.label?.trim() && s.value?.trim())

  return (
    <>
      {/* --- Üst alan ----------------------------------------------------- */}
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero-compact">
          <Breadcrumbs
            label={tn('breadcrumb')}
            items={[
              { label: tn('home'), href: href('home', locale) },
              { label: t('title'), href: href('simulation-centre', locale) },
              { label: doc.title ?? slug },
            ]}
          />

          {doc.shortCode ? (
            <p className="mt-4 inline-flex items-center rounded-sm bg-brand-800 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
              {doc.shortCode}
            </p>
          ) : null}

          <h1 className="title-record measure mt-3">
            {doc.title}
          </h1>

          {doc.summary ? (
            <p className="lede measure mt-5">{doc.summary}</p>
          ) : null}
        </div>
      </section>

      <div className="container-page section-block grid gap-10 lg:grid-cols-12 lg:gap-12">
        {/* --- Ana kolon --------------------------------------------------- */}
        <div className="lg:col-span-8">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt}
              width={cover.width}
              height={cover.height}
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="w-full rounded-2xl object-cover"
              priority
            />
          ) : null}

          {hasRichTextContent(doc.description) ? (
            <section className={cover ? 'mt-8' : ''}>
              <h2 className="text-2xl font-semibold">{t('about')}</h2>
              <RichTextBlock data={doc.description} className="mt-3" />
            </section>
          ) : null}

          {useCases.length > 0 ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">{t('useCases')}</h2>
              <ul className="mt-4 space-y-2">
                {useCases.map((useCase, index) => (
                  <li key={`${useCase.text}-${index}`} className="flex gap-3 leading-relaxed">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-700"
                    />
                    {useCase.text}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {hasRichTextContent(doc.benefitsForInternational) ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">{t('international')}</h2>
              <RichTextBlock data={doc.benefitsForInternational} className="mt-3" />
            </section>
          ) : null}

          {hasRichTextContent(doc.usageInTraining) ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">{t('usageInTraining')}</h2>
              <RichTextBlock data={doc.usageInTraining} className="mt-3" />
            </section>
          ) : null}

          {gallery.length > 0 ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">{t('gallery')}</h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {gallery.map((image, index) => (
                  <li key={`${image.url}-${index}`} className="overflow-hidden rounded-card">
                    <Image
                      src={image.url}
                      alt={image.alt}
                      width={image.width}
                      height={image.height}
                      sizes="(min-width: 640px) 30vw, 100vw"
                      className="aspect-[3/2] w-full object-cover"
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* --- Çapraz referans: bu sistemin kullanıldığı eğitimler -------- */}
          {trainings.docs.length > 0 ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">{t('usedInTrainings')}</h2>
              <ul className="mt-4 divide-y divide-line-soft border-t border-line-soft">
                {trainings.docs.map((training) => {
                  const item = training as unknown as {
                    id: number
                    title?: string | null
                    slug?: string | null
                    status?: string | null
                    startDate?: string | null
                    endDate?: string | null
                  }
                  const range = formatDateRange(locale, item.startDate, item.endDate)
                  const statusText = trainingStatusLabel(item.status, locale)

                  return (
                    <li key={item.id} className="py-4">
                      <p className="font-semibold leading-snug">
                        <Link
                          href={detailHref('training-program', locale, item.slug ?? '')}
                          className="text-shell-900 decoration-2 underline-offset-4 transition-colors hover:text-brand-800 hover:underline"
                        >
                          {item.title}
                        </Link>
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {statusText ? (
                          <span className={trainingStatusClasses(item.status)}>
                            <span className="sr-only">{tt('statusLabel')}: </span>
                            {statusText}
                          </span>
                        ) : null}
                        {range ? <span className="text-sm text-ink-600">{range}</span> : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}

          <p className="mt-12">
            <Link
              href={href('simulation-centre', locale)}
              className="inline-flex min-h-11 items-center text-brand-800 underline underline-offset-4"
            >
              {t('backToCentre')}
            </Link>
          </p>
        </div>

        {/* --- Teknik özellikler kartı ------------------------------------- */}
        <aside aria-labelledby="system-specs" className="lg:col-span-4">
          <div className="rounded-card border border-line bg-surface p-5 lg:sticky lg:top-6">
            <h2 id="system-specs" className="text-lg font-semibold">
              {t('technicalSpecs')}
            </h2>

            <dl className="mt-4">
              {Number(doc.capacity) > 0 ? (
                <div className="border-t border-line py-3 first:border-t-0 first:pt-0">
                  <dt className="text-sm text-ink-600">{t('capacity')}</dt>
                  <dd className="mt-0.5 font-medium text-ink-900">
                    {t('capacityValue', { count: Number(doc.capacity) })}
                  </dd>
                </div>
              ) : null}

              <div className="border-t border-line py-3">
                <dt className="text-sm text-ink-600">{t('remote')}</dt>
                <dd className="mt-0.5 font-medium text-ink-900">
                  {doc.supportsRemote ? t('remoteYes') : t('remoteNo')}
                </dd>
              </div>

              {specs.map((spec, index) => (
                <div key={`${spec.label}-${index}`} className="border-t border-line py-3">
                  <dt className="text-sm text-ink-600">{spec.label}</dt>
                  <dd className="mt-0.5 font-medium text-ink-900">{spec.value}</dd>
                </div>
              ))}
            </dl>

            {/* Temsili içerik uyarısı — merkez sayfasıyla aynı gerekçe. */}
            <p className="mt-4 border-t border-line pt-4 text-sm text-ink-600">
              {t('representativeNotice')}
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
