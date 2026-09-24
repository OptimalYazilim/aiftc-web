import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { RichTextBlock, hasRichTextContent } from '@/components/ui/RichTextBlock'
import { isLocale, LOCALE_CODES, type Locale } from '@/i18n/locales'
import { detailHref, href, ROUTES } from '@/i18n/routes'
import { formatDateRange } from '@/lib/dates'
import { resolveMedia } from '@/lib/media'
import { buildMetadata } from '@/lib/metadata'
import { payloadClient } from '@/lib/queries'
import { trainingStatusClasses, trainingStatusLabel } from '@/lib/trainingStatus'

/**
 * SİMÜLASYON MERKEZİ  (Şartname 9)
 * ============================================================================
 * ROTA: klasör adı `simulasyon-merkezi`, `ROUTES['simulation-centre'].tr` ile
 * birebir aynıdır.
 * /tr/simulasyon-merkezi · /en/simulation-centre · /ru/tsentr-simulyatsii
 *
 * BU SAYFA YOKTU — üç dilde de 404 dönüyordu. Rota tablosunda ve menüde
 * tanımlıydı, eğitim detay sayfası da sistemlere bağlantı veriyordu; hedefte
 * hiçbir şey olmadığı ölçülerek görüldü.
 *
 * ---------------------------------------------------------------------------
 * SAYFANIN ÜÇ BÖLÜMÜ (şartname 9'un istediği sıra)
 * ---------------------------------------------------------------------------
 *   1. MERKEZİN AMACI      → global: `purpose`, `roleInFireTraining`
 *   2. SİSTEMLER           → `simulation-systems` koleksiyonu, görselleriyle
 *   3. ÇAPRAZ REFERANS     → her sistemin kullanıldığı eğitim programları
 *
 * ---------------------------------------------------------------------------
 * ÇAPRAZ REFERANS NASIL KURULUYOR
 * ---------------------------------------------------------------------------
 * İlişki eğitim tarafında tanımlıdır (`training-programs.simulationSystems`),
 * sistem tarafında ters alan YOKTUR. Bu doğru modeldir — aynı bilgiyi iki
 * yerde tutmak, editörün birini güncelleyip diğerini unutmasına açık kapı
 * bırakır.
 *
 * Bu yüzden eğitimler TEK sorguda çekilir ve sistem id'sine göre bellekte
 * gruplanır. Sistem başına ayrı sorgu atılsaydı N+1 olurdu; iki sistemde
 * fark etmez ama liste büyüdüğünde eder.
 *
 * ISR: 5 dakika. Eğitim veya sistem yayımlandığında `hooks/revalidate.ts`
 * tazeler.
 * ============================================================================
 */
export const revalidate = 300

type Props = { params: Promise<{ locale: Locale }> }

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const t = await getTranslations({ locale, namespace: 'simulation' })

  return buildMetadata({
    locale,
    title: t('metaTitle'),
    description: t('intro'),
    pathByLocale: {
      tr: ROUTES['simulation-centre'].tr,
      en: ROUTES['simulation-centre'].en,
      ru: ROUTES['simulation-centre'].ru,
    },
  })
}

type SystemDoc = {
  id: number
  slug?: string | null
  title?: string | null
  shortCode?: string | null
  summary?: string | null
  capacity?: number | null
  supportsRemote?: boolean | null
  coverImage?: unknown
  useCases?: { text?: string | null }[] | null
}

type TrainingRef = {
  id: number
  title?: string | null
  slug?: string | null
  status?: string | null
  startDate?: string | null
  endDate?: string | null
  simulationSystems?: (number | { id: number })[] | null
}

export default async function SimulationCentrePage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('simulation')
  const tt = await getTranslations('training')
  const payload = await payloadClient()

  const [centre, systemsResult, trainingsResult] = await Promise.all([
    payload.findGlobal({ slug: 'simulation-center', locale, depth: 2 }),
    payload.find({
      collection: 'simulation-systems',
      locale,
      where: { _status: { equals: 'published' } },
      sort: 'order',
      limit: 50,
      depth: 1,
    }),
    payload.find({
      collection: 'training-programs',
      locale,
      where: { _status: { equals: 'published' }, usesSimulation: { equals: true } },
      sort: 'startDate',
      limit: 200,
      depth: 0,
    }),
  ])

  const page = centre as unknown as Record<string, unknown>
  const systems = systemsResult.docs as unknown as SystemDoc[]
  const hero = resolveMedia(page.heroImage, 'hero')

  const highlights = ((page.capacityHighlights ?? []) as { value?: string; label?: string }[])
    .filter((item) => item.value?.trim() && item.label?.trim())

  /**
   * Sistem id'si → o sistemi kullanan eğitimler.
   * Tek sorgudan bellekte gruplanır (bkz. dosya başındaki not).
   */
  const trainingsBySystem = new Map<number, TrainingRef[]>()
  for (const doc of trainingsResult.docs as unknown as TrainingRef[]) {
    for (const ref of doc.simulationSystems ?? []) {
      const id = typeof ref === 'object' ? ref.id : ref
      const bucket = trainingsBySystem.get(id) ?? []
      bucket.push(doc)
      trainingsBySystem.set(id, bucket)
    }
  }

  return (
    <>
      {/* --- Üst alan ----------------------------------------------------- */}
      <section className="relative isolate overflow-hidden bg-shell-950 text-white">
        {hero ? (
          <>
            <Image
              src={hero.url}
              alt=""
              aria-hidden="true"
              fill
              priority
              sizes="100vw"
              className="-z-20 object-cover"
            />
            {/*
              Karartma tabanı Hero'dakiyle AYNI ölçüme dayanır: shell-950 %72
              opaklıkta, en kötü durumda (tamamen beyaz fotoğraf) beyaz metinle
              6.6:1 verir (bkz. components/home/HomeHero.tsx ölçüm tablosu).
            */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10"
              style={{ backgroundColor: 'rgba(4, 32, 27, 0.72)' }}
            />
            <div aria-hidden="true" className="hero-scrim absolute inset-0 -z-10" />
          </>
        ) : (
          <div aria-hidden="true" className="hero-editorial absolute inset-0 -z-20" />
        )}

        <div className="container-page page-hero">
          <p className="mb-5 inline-flex items-center bg-brand-800 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] sm:text-sm">
            {t('eyebrow')}
          </p>
          <h1 className="title-page measure text-white">
            {(page.title as string) || t('title')}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90">{t('intro')}</p>
        </div>

        {/* Teknik kapasite özeti — Hero'nun sayaç bandıyla aynı görsel dil. */}
        {highlights.length > 0 ? (
          <div className="relative border-t border-white/20 bg-shell-950/45 backdrop-blur-sm">
            <div className="container-page">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-6 py-8 md:grid-cols-4">
                {highlights.map((item, index) => (
                  <div key={`${item.value}-${index}`} className="flex flex-col">
                    <dt className="order-2 mt-1 text-sm leading-snug text-white/80">
                      {item.label}
                    </dt>
                    <dd className="order-1 text-2xl font-bold tracking-tight sm:text-3xl">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ) : null}
      </section>

      {/* --- 1) Merkezin amacı -------------------------------------------- */}
      <section aria-labelledby="sim-purpose" className="container-page page-hero">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          {hasRichTextContent(page.purpose) ? (
            <div>
              <h2 id="sim-purpose" className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t('purpose')}
              </h2>
              <RichTextBlock data={page.purpose} className="mt-4" />
            </div>
          ) : (
            <h2 id="sim-purpose" className="sr-only">
              {t('purpose')}
            </h2>
          )}

          {hasRichTextContent(page.roleInFireTraining) ? (
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('role')}</h2>
              <RichTextBlock data={page.roleInFireTraining} className="mt-4" />
            </div>
          ) : null}
        </div>

        {hasRichTextContent(page.relationToTraining) ? (
          <div className="mt-10 rounded-2xl border border-line-soft bg-surface-warm p-6 sm:p-8">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{t('relation')}</h2>
            <RichTextBlock data={page.relationToTraining} className="mt-3" />
          </div>
        ) : null}
      </section>

      {/* --- 2) Sistemler + 3) çapraz referans ---------------------------- */}
      <section aria-labelledby="sim-systems" className="bg-surface-alt">
        <div className="container-page page-hero">
          <h2 id="sim-systems" className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t('systemsHeading')}
          </h2>

          {systems.length === 0 ? (
            <p className="mt-6 rounded-card border border-line bg-surface p-6 text-ink-700">
              {t('noSystems')}
            </p>
          ) : (
            <div className="mt-8 space-y-10">
              {systems.map((system) => {
                const cover = resolveMedia(system.coverImage, 'hero')
                const related = trainingsBySystem.get(system.id) ?? []
                const useCases = (system.useCases ?? []).filter((c) => c.text?.trim())

                return (
                  <article
                    key={system.id}
                    /* `scroll-mt`: eğitim sayfasından çıpayla gelindiğinde
                       yapışkan başlık kartı örtmesin. */
                    id={system.slug ?? undefined}
                    className="ease-editorial scroll-mt-24 overflow-hidden rounded-card border border-line bg-surface transition-colors duration-500 hover:border-shell-900 focus-within:border-shell-900"
                  >
                    <div className="grid gap-0 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                      {/* Görsel */}
                      <div className="relative aspect-[16/10] w-full lg:aspect-auto lg:min-h-full">
                        {cover ? (
                          <Image
                            src={cover.url}
                            alt={cover.alt}
                            fill
                            sizes="(min-width: 1024px) 40vw, 100vw"
                            className="object-cover"
                          />
                        ) : (
                          <div aria-hidden="true" className="media-frame-dark absolute inset-0" />
                        )}
                      </div>

                      {/* İçerik */}
                      <div className="p-6 sm:p-8">
                        {system.shortCode ? (
                          <p className="inline-flex items-center rounded-sm bg-brand-800 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                            {system.shortCode}
                          </p>
                        ) : null}

                        <h3 className="mt-3 text-xl font-bold leading-snug tracking-tight text-shell-900 sm:text-2xl">
                          {system.slug ? (
                            <Link
                              href={detailHref('simulation-system', locale, system.slug)}
                              className="decoration-2 underline-offset-4 transition-colors hover:text-brand-800 hover:underline focus-visible:text-brand-800 focus-within:text-brand-800"
                            >
                              {system.title}
                            </Link>
                          ) : (
                            system.title
                          )}
                        </h3>

                        {system.summary ? (
                          <p className="mt-3 leading-relaxed text-ink-600">{system.summary}</p>
                        ) : null}

                        {/* Kapasite ve uzaktan erişim */}
                        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                          {Number(system.capacity) > 0 ? (
                            <div className="flex gap-1.5">
                              <dt className="text-ink-600">{t('capacity')}:</dt>
                              <dd className="font-semibold text-shell-900">
                                {t('capacityValue', { count: Number(system.capacity) })}
                              </dd>
                            </div>
                          ) : null}
                          <div className="flex gap-1.5">
                            <dt className="text-ink-600">{t('remote')}:</dt>
                            <dd className="font-semibold text-shell-900">
                              {system.supportsRemote ? t('remoteYes') : t('remoteNo')}
                            </dd>
                          </div>
                        </dl>

                        {useCases.length > 0 ? (
                          <>
                            <h4 className="mt-6 text-sm font-semibold uppercase tracking-wider text-ink-600">
                              {t('useCases')}
                            </h4>
                            <ul className="mt-2 space-y-1.5">
                              {useCases.slice(0, 4).map((useCase, index) => (
                                <li
                                  key={`${useCase.text}-${index}`}
                                  className="flex gap-2 text-sm leading-relaxed text-ink-700"
                                >
                                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-700" />
                                  {useCase.text}
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : null}

                        {/*
                          ÇAPRAZ REFERANS — "bu sistem hangi eğitimlerde kullanılıyor"
                          Şartname 9'un istediği bağ budur. Hiç eğitim bağlı değilse
                          blok BASILMAZ; "henüz kullanılmıyor" demek sistemin atıl
                          olduğu izlenimi verirdi.
                        */}
                        {related.length > 0 ? (
                          <>
                            <h4 className="mt-6 text-sm font-semibold uppercase tracking-wider text-ink-600">
                              {t('usedInTrainings')}
                            </h4>
                            <ul className="mt-2 space-y-2">
                              {related.map((training) => {
                                const range = formatDateRange(
                                  locale,
                                  training.startDate,
                                  training.endDate,
                                )
                                const statusText = trainingStatusLabel(training.status, locale)

                                return (
                                  <li key={training.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <Link
                                      href={detailHref(
                                        'training-program',
                                        locale,
                                        training.slug ?? '',
                                      )}
                                      className="font-semibold text-brand-800 underline-offset-4 hover:underline"
                                    >
                                      {training.title}
                                    </Link>
                                    {statusText ? (
                                      <span className={trainingStatusClasses(training.status)}>
                                        <span className="sr-only">{tt('statusLabel')}: </span>
                                        {statusText}
                                      </span>
                                    ) : null}
                                    {range ? (
                                      <span className="text-sm text-ink-600">{range}</span>
                                    ) : null}
                                  </li>
                                )
                              })}
                            </ul>
                          </>
                        ) : null}

                        {system.slug ? (
                          <p className="mt-6">
                            <Link
                              href={detailHref('simulation-system', locale, system.slug)}
                              className="group inline-flex min-h-11 items-center gap-2 rounded-sm border border-line-strong px-4 text-sm font-semibold text-shell-900 transition-colors hover:border-brand-700 hover:bg-brand-50/60 hover:text-brand-800 focus-visible:border-brand-700 focus-visible:bg-brand-50/60 focus-visible:text-brand-800 focus-within:border-brand-700 focus-within:bg-brand-50/60 focus-within:text-brand-800"
                            >
                              {t('systemDetails')}
                              <span className="sr-only"> — {system.title}</span>
                              <svg
                                aria-hidden="true"
                                focusable="false"
                                viewBox="0 0 16 16"
                                width="1em"
                                height="1em"
                                className="transition-transform duration-300 group-hover:translate-x-1 group-focus-within:translate-x-1"
                              >
                                <path
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M2.5 8h11M9.5 4l4 4-4 4"
                                />
                              </svg>
                            </Link>
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {/*
            TEMSİLİ İÇERİK UYARISI
            Teknik kapasiteler ve görseller şu an temsilidir (bkz.
            scripts/seed-simulation-centre.ts). Ziyaretçi bu değerleri kesin
            envanter sanmamalı; kurumsal bir sayfada uydurulmuş bir teknik
            özelliği sessizce yayımlamak yanlış olurdu. Gerçek envanter
            panelden girildiğinde bu satır kaldırılmalıdır.
          */}
          <p className="mt-10 rounded-sm border-l-4 border-brand-700 bg-surface px-4 py-3 text-sm text-ink-600">
            {t('representativeNotice')}
          </p>

          <p className="mt-8">
            <Link
              href={href('training-programs', locale)}
              className="inline-flex min-h-11 items-center text-brand-800 underline underline-offset-4"
            >
              {t('goToTrainings')}
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}
