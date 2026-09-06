import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import type { ExternalService, TrainingProgram, TrainingTopic } from '@/payload-types'

import { TrainingSidebar } from '@/components/training/TrainingSidebar'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { RichTextBlock, hasRichTextContent } from '@/components/ui/RichTextBlock'
import { DELIVERY_MODES } from '@/fields/options'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { DETAIL_ROUTES, detailHref, href } from '@/i18n/routes'
import { formatDateRange } from '@/lib/dates'
import { resolveMedia } from '@/lib/media'
import { buildMetadata } from '@/lib/metadata'
import { optionLabel } from '@/lib/optionLabel'
import { getExternalServices, payloadClient } from '@/lib/queries'
import { trainingStatusClasses, trainingStatusLabel } from '@/lib/trainingStatus'

/**
 * EĞİTİM DETAY SAYFASI  (Şartname 6.4, 7.1 + EK-2 2.3)
 * ============================================================================
 * SLUG ÇÖZÜMLEME VE DİLLER ARASI GEÇİŞ
 * Slug her dilde FARKLIDIR. Bu üç durumu birbirinden ayırmak gerekir:
 *
 *   1. Slug bu dilde bulundu           → sayfa basılır.
 *   2. Slug BAŞKA bir dilde bulundu    → kullanıcı, örneğin bir EN sayfada
 *      TR slug'ıyla geldi. 404 basmak yanlış olur; kayıt vardır. Bu dildeki
 *      DOĞRU adrese 308 ile yönlendirilir. Böylece paylaşılan eski/karışık
 *      bağlantılar çalışmaya devam eder ve arama motorunda tek kanonik
 *      adres kalır (Şartname 3.5).
 *   3. Hiçbir dilde yok               → 404.
 *
 * Payload'in `fallback: true` ayarı, çevirisi girilmemiş bir dilde TR
 * değerini döndürür; bu yüzden 1. adım çoğu zaman doğrudan eşleşir.
 * 2. adım, çeviri GİRİLMİŞ kayıtlar için gereklidir.
 *
 * `notFound()` ve `redirect()` içeriden özel bir istisna fırlatır; bu yüzden
 * asla `try` bloğu içinde çağrılmazlar (yakalanırlarsa çalışmazlar).
 * ============================================================================
 */
export const revalidate = 300

type Props = { params: Promise<{ locale: Locale; slug: string }> }

type AllLocaleSlugs = { id: number; slug?: Partial<Record<Locale, string>> }

/**
 * Yayımlanmış her eğitimin HER DİLDEKİ slug'ı önceden üretilir.
 * `locale: 'all'` olmadan yalnızca varsayılan dilin slug'ı bilinirdi ve
 * EN/RU sayfaları build sırasında üretilemezdi.
 */
export async function generateStaticParams() {
  try {
    const payload = await payloadClient()
    const result = await payload.find({
      collection: 'training-programs',
      locale: 'all',
      where: { _status: { equals: 'published' } },
      limit: 500,
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

/** Slug'ı verilen dilde arar. Bulamazsa null. */
const findBySlug = async (locale: Locale, slug: string): Promise<TrainingProgram | null> => {
  const payload = await payloadClient()

  const result = await payload.find({
    collection: 'training-programs',
    locale,
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 2,
  })

  return (result.docs[0] as TrainingProgram | undefined) ?? null
}

/** Slug hangi dilde olursa olsun kaydı bulur; tüm dillerdeki slug'ları döner. */
const findInAnyLocale = async (slug: string): Promise<AllLocaleSlugs | null> => {
  const payload = await payloadClient()

  const result = await payload.find({
    collection: 'training-programs',
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
      pathByLocale[code] = DETAIL_ROUTES['training-program'][code].replace('[slug]', localeSlug)
    }
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

/**
 * Onay işareti — "bu eğitim şunu içeriyor" listesinin madde imi.
 * `aria-hidden`: bilgiyi yanındaki metin taşıyor, ikon ikinci kez
 * duyurulmamalı (WCAG 2.2 — 1.1.1).
 */
const CheckMark: React.FC = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 20 20"
    className="mt-0.5 h-5 w-5 shrink-0 text-brand-700"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="10" cy="10" r="8.2" strokeWidth="1.5" />
    <path d="m6.4 10.2 2.5 2.5 4.7-5" />
  </svg>
)

export default async function TrainingDetailPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  let doc = await findBySlug(locale, slug)

  // 2. durum: slug başka bir dile ait — bu dildeki doğru adrese yönlendir.
  if (!doc) {
    const anyLocale = await findInAnyLocale(slug)
    const correctSlug = anyLocale?.slug?.[locale]

    if (correctSlug && correctSlug !== slug) {
      redirect(detailHref('training-program', locale, correctSlug))
    }

    // Slug bu dilde de aynıysa ama sorgu bulamıyorsa kayıt yayında değildir.
    if (correctSlug) doc = await findBySlug(locale, correctSlug)
  }

  if (!doc) notFound()

  const [t, tc, tn, services] = await Promise.all([
    getTranslations('training'),
    getTranslations('common'),
    getTranslations('nav'),
    getExternalServices(locale),
  ])

  const dateRange = formatDateRange(locale, doc.startDate, doc.endDate)
  const statusText = trainingStatusLabel(doc.status, locale)
  const deliveryMode = optionLabel(DELIVERY_MODES, doc.deliveryMode, locale)

  const topics = (doc.topics ?? []).filter(
    (topic): topic is TrainingTopic => typeof topic === 'object' && topic !== null,
  )

  const outcomes = (doc.learningOutcomes ?? []).filter((item) => item.text?.trim())
  const schedule = (doc.schedule ?? []).filter((day) => day.dayLabel?.trim())
  const trainers = (doc.trainers ?? []).filter((trainer) => trainer.name?.trim())

  /**
   * Kullanılan simülasyon sistemleri. `depth: 2` ile çözülmüş gelir; yalnızca
   * id olarak dönen (çözülmemiş) kayıtlar elenir — başlıksız bir bağlantı
   * basmanın anlamı yok.
   */
  const simulationSystems = (doc.simulationSystems ?? []).filter(
    (system): system is Extract<typeof system, { id: number }> =>
      typeof system === 'object' && system !== null,
  )

  return (
    <>
      {/* --- Üst alan ------------------------------------------------------ */}
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page py-8 lg:py-10">
          <Breadcrumbs
            label={tn('breadcrumb')}
            items={[
              { label: tn('home'), href: `/${locale}` },
              { label: t('catalogTitle'), href: href('training-programs', locale) },
              { label: doc.title },
            ]}
          />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {statusText ? (
              <p className={trainingStatusClasses(doc.status)}>
                <span className="sr-only">{t('statusLabel')}: </span>
                {statusText}
              </p>
            ) : null}
            {doc.code ? <span className="text-sm text-ink-600">{doc.code}</span> : null}
          </div>

          <h1 className="mt-3 max-w-4xl text-3xl font-bold sm:text-4xl">{doc.title}</h1>

          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-ink-700">
            {dateRange ? (
              <div className="flex gap-2">
                <dt className="text-ink-600">{t('dates')}:</dt>
                <dd>
                  <time dateTime={doc.startDate}>{dateRange}</time>
                </dd>
              </div>
            ) : null}
            {deliveryMode ? (
              <div className="flex gap-2">
                <dt className="text-ink-600">{t('deliveryMode')}:</dt>
                <dd>{deliveryMode}</dd>
              </div>
            ) : null}
            {doc.venue ? (
              <div className="flex gap-2">
                <dt className="text-ink-600">{t('venue')}:</dt>
                <dd>{doc.venue}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>

      {/* --- İki kolonlu asimetrik yerleşim -------------------------------- */}
      <div className="container-page grid gap-10 py-10 lg:grid-cols-12 lg:py-14">
        {/* Sol: geniş içerik alanı */}
        <div className="lg:col-span-8">
          <p className="text-lg text-ink-700">{doc.summary}</p>

          {topics.length > 0 ? (
            <div className="mt-6">
              <h2 className="sr-only">{t('topics')}</h2>
              <ul className="flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <li key={String(topic.id)}>
                    <Link
                      href={detailHref('training-topic', locale, topic.slug ?? '')}
                      className="inline-flex min-h-11 items-center rounded-full border border-line-strong px-4 text-sm text-ink-700 hover:border-brand-700 hover:text-brand-800"
                    >
                      {topic.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {hasRichTextContent(doc.objective) ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">{t('objective')}</h2>
              <RichTextBlock data={doc.objective} className="mt-3" />
            </section>
          ) : null}

          {doc.targetAudience ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">{t('targetAudience')}</h2>
              <p className="mt-3 text-ink-700">{doc.targetAudience}</p>
            </section>
          ) : null}

          {outcomes.length > 0 ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">{t('outcomes')}</h2>
              <ul className="mt-3 list-disc space-y-2 ps-6 text-ink-700">
                {outcomes.map((item, index) => (
                  <li key={item.id ?? index}>{item.text}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {schedule.length > 0 ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">{t('schedule')}</h2>
              <ol className="mt-4 space-y-4">
                {schedule.map((day, index) => (
                  <li key={day.id ?? index} className="rounded-card border border-line p-5">
                    <h3 className="font-semibold">{day.dayLabel}</h3>
                    {(day.sessions ?? []).length > 0 ? (
                      <ul className="mt-3 space-y-2 text-ink-700">
                        {(day.sessions ?? []).map((session, sessionIndex) => (
                          <li
                            key={session.id ?? sessionIndex}
                            className="flex flex-wrap gap-x-3 border-t border-line pt-2 first:border-t-0 first:pt-0"
                          >
                            {session.time ? (
                              <span className="text-ink-600">{session.time}</span>
                            ) : null}
                            <span>{session.title}</span>
                            {session.trainer ? (
                              <span className="text-ink-600">— {session.trainer}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {trainers.length > 0 ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">{t('trainers')}</h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {trainers.map((trainer, index) => (
                  <li key={trainer.id ?? index} className="rounded-card border border-line p-5">
                    <p className="font-semibold text-ink-900">{trainer.name}</p>
                    {trainer.titleAndRole ? (
                      <p className="text-ink-600">{trainer.titleAndRole}</p>
                    ) : null}
                    {trainer.organization ? (
                      <p className="text-sm text-ink-600">{trainer.organization}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {hasRichTextContent(doc.applicationRequirements) ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">{t('requirements')}</h2>
              <RichTextBlock data={doc.applicationRequirements} className="mt-3" />
            </section>
          ) : null}

          {/*
            UYGULAMA VE SİMÜLASYON  (Şartname EK-2 2.3)
            ------------------------------------------------------------------
            Bu iki alan (`usesSimulation`, `hasFieldExercise`) şemada VARDI ama
            detay sayfasında HİÇ BASILMIYORDU — ölçüldü. Oysa "bu eğitimde
            simülatör kullanılıyor mu, sahaya çıkılıyor mu?" katılımcının
            hazırlık yaparken (ekipman, sağlık durumu, süre planı) ihtiyaç
            duyduğu bilgidir.

            Blok yalnızca ikisinden biri işaretliyse basılır; ikisi de kapalıysa
            "simülasyon yok / saha yok" diye olumsuz bir liste gösterilmez.

            Simülasyon sistemleri kendi detay sayfalarına bağlanır: ziyaretçi
            hangi sistemle çalışacağını okuyabilir.
          */}
          {doc.usesSimulation || doc.hasFieldExercise ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">{t('practiceHeading')}</h2>

              <ul className="mt-4 space-y-3">
                {doc.usesSimulation ? (
                  <li className="flex gap-3">
                    <CheckMark />
                    <div className="min-w-0">
                      <p className="font-medium text-ink-900">{t('usesSimulation')}</p>
                      {simulationSystems.length > 0 ? (
                        <p className="mt-1 text-ink-600">
                          <span className="sr-only">{t('simulationSystems')}: </span>
                          {simulationSystems.map((system, index) => (
                            <React.Fragment key={String(system.id)}>
                              {index > 0 ? ', ' : null}
                              {system.slug ? (
                                <Link
                                  href={detailHref('simulation-system', locale, system.slug)}
                                  className="text-brand-800 underline underline-offset-4"
                                >
                                  {system.title}
                                </Link>
                              ) : (
                                system.title
                              )}
                            </React.Fragment>
                          ))}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ) : null}

                {doc.hasFieldExercise ? (
                  <li className="flex gap-3">
                    <CheckMark />
                    <p className="font-medium text-ink-900">{t('hasFieldExercise')}</p>
                  </li>
                ) : null}
              </ul>
            </section>
          ) : null}

          {hasRichTextContent(doc.assessmentMethod) ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">{t('assessment')}</h2>
              <RichTextBlock data={doc.assessmentMethod} className="mt-3" />
            </section>
          ) : null}

          {hasRichTextContent(doc.certificateConditions) ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">{t('certificateConditions')}</h2>
              <RichTextBlock data={doc.certificateConditions} className="mt-3" />
            </section>
          ) : null}

          <p className="mt-12">
            <Link
              href={href('training-programs', locale)}
              className="inline-flex min-h-11 items-center text-brand-800 underline underline-offset-4"
            >
              ← {t('backToCatalog')}
            </Link>
          </p>
        </div>

        {/* Sağ: yapışkan özet kartı */}
        <aside aria-labelledby="training-summary" className="lg:col-span-4">
          <h2 id="training-summary" className="sr-only">
            {tc('summary')}
          </h2>
          <TrainingSidebar locale={locale} doc={doc} services={services as ExternalService} />
        </aside>
      </div>
    </>
  )
}
