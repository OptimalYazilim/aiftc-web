import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { TopicIcon } from '@/components/training/TopicIcon'
import { TRAINING_LEVELS, TRAINING_TOPIC_CATEGORIES } from '@/fields/options'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { ROUTES, detailHref } from '@/i18n/routes'
import { resolveMedia } from '@/lib/media'
import { buildMetadata } from '@/lib/metadata'
import { optionLabel, optionLabels } from '@/lib/optionLabel'
import { payloadClient } from '@/lib/queries'

/**
 * EĞİTİM KONULARI — LİSTE  (Şartname 6.3 / EK-2 1.3)
 * ============================================================================
 * ROTA: klasör adı `egitim-konulari`, `ROUTES['training-topics'].tr` ile HARF
 * HARF aynıdır. /tr/egitim-konulari · /en/training-topics · /ru/temy-obucheniya
 *
 * ---------------------------------------------------------------------------
 * BU SAYFA BİR BOŞLUĞU KAPATIR, YENİ BİR BÖLÜM AÇMAZ
 * ---------------------------------------------------------------------------
 * `training-topics` koleksiyonu, rota sözlüğü ve sitemap girdisi zaten
 * vardı; eksik olan yalnızca sayfa bileşeniydi. Bu yüzden ana sayfadaki konu
 * çipleri ve eğitim detayındaki konu bağlantıları 404'e gidiyordu
 * (app/(frontend)/[locale]/page.tsx ve egitim-programlari/[slug]/page.tsx
 * içindeki `detailHref('training-topic', …)` çağrıları).
 *
 * ---------------------------------------------------------------------------
 * SIRALAMA EDİTÖRÜNDÜR
 * ---------------------------------------------------------------------------
 * Koleksiyonun `defaultSort` değeri `order`dır ve bu bilinçlidir: konular
 * alfabetik değil, kurumun ÖNCELİK sırasına göre dizilir. Sorgu bunu açıkça
 * yineler ki niyet okunur olsun.
 *
 * `depth: 1` ZORUNLU — `resolveMedia` derinlik 0'daki sayısal id'ye null
 * döner ve bütün kapaklar sessizce kaybolurdu.
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

  const t = await getTranslations({ locale, namespace: 'topics' })

  return buildMetadata({
    locale,
    title: t('metaTitle'),
    description: t('intro'),
    pathByLocale: {
      tr: ROUTES['training-topics'].tr,
      en: ROUTES['training-topics'].en,
      ru: ROUTES['training-topics'].ru,
    },
  })
}

export default async function TrainingTopicsPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('topics')
  const payload = await payloadClient()

  const result = await payload.find({
    collection: 'training-topics',
    locale,
    where: { _status: { equals: 'published' } },
    sort: 'order',
    limit: 200,
    depth: 1,
    overrideAccess: false,
  })

  return (
    <>
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 className="title-page measure mt-3">{t('title')}</h1>
          <p className="lede measure mt-5">{t('intro')}</p>
        </div>
      </section>

      <section aria-labelledby="topics-list" className="bg-surface-warm">
        <div className="container-page section-block">
          <h2 id="topics-list" className="sr-only">
            {t('listHeading')}
          </h2>

          {result.docs.length === 0 ? (
            <p className="rounded-card border border-line bg-surface p-6 text-ink-700">
              {t('empty')}
            </p>
          ) : (
            <>
              <p className="text-sm text-ink-600">
                {t('resultsCount', { count: result.docs.length })}
              </p>

              <ul className="mt-6 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {result.docs.map((doc) => {
                  const link = doc.slug ? detailHref('training-topic', locale, doc.slug) : null
                  const cover = resolveMedia(doc.coverImage, 'card')
                  const kategori = optionLabel(TRAINING_TOPIC_CATEGORIES, doc.category, locale)
                  const duzeyler = optionLabels(TRAINING_LEVELS, doc.level, locale)

                  return (
                    <li
                      key={String(doc.id)}
                      className={`group relative flex flex-col ${link ? 'cursor-pointer' : ''}`}
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden border border-line-soft bg-surface-alt transition-colors duration-500 group-hover:border-shell-900 group-focus-within:border-shell-900">
                        {cover ? (
                          <Image
                            src={cover.url}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04] group-focus-within:scale-[1.04]"
                          />
                        ) : (
                          /*
                            Kapak yoksa konunun KENDİ simgesi basılır. Boş gri
                            bir dikdörtgen "eksik görsel" gibi okunur; simge
                            konunun ne olduğunu söyler (bkz. TopicIcon).
                          */
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 grid place-items-center text-shell-900/25"
                          >
                            <TopicIcon category={doc.category} className="h-12 w-12" />
                          </span>
                        )}
                      </div>

                      {kategori ? (
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-brand-700">
                          {kategori}
                        </p>
                      ) : null}

                      <h3 className="mt-1 text-lg font-bold leading-snug tracking-tight text-shell-900">
                        {link ? (
                          <Link
                            href={link}
                            className="transition-colors duration-500 after:absolute after:inset-0 after:content-[''] group-hover:text-brand-800 focus-visible:text-brand-800 group-focus-within:text-brand-800"
                          >
                            {doc.title}
                          </Link>
                        ) : (
                          doc.title
                        )}
                      </h3>

                      {doc.summary ? (
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{doc.summary}</p>
                      ) : null}

                      {duzeyler.length > 0 ? (
                        <p className="mt-3 text-xs text-ink-500">
                          <span className="font-medium">{t('levelLabel')}: </span>
                          {duzeyler.join(', ')}
                        </p>
                      ) : null}
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
