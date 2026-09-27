import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import {
  TrainingCalendar,
  type CalendarTopicOption,
  type TimelineTraining,
} from '@/components/training/TrainingCalendar'
import { PageHero } from '@/components/ui/PageHero'
import { DELIVERY_MODES } from '@/fields/options'
import { isLocale, LOCALE_CODES, type Locale } from '@/i18n/locales'
import { href, ROUTES } from '@/i18n/routes'
import { buildMetadata } from '@/lib/metadata'
import { optionLabel } from '@/lib/optionLabel'
import { payloadClient } from '@/lib/queries'

/**
 * EĞİTİM TAKVİMİ  (Şartname 6.4 / EK-2 2.2)
 * ============================================================================
 * ROTA: klasör adı `egitim-takvimi`, `ROUTES['training-calendar'].tr` ile
 * BİREBİR aynıdır. Ziyaretçi yerelleştirilmiş adresi görür:
 *   /tr/egitim-takvimi · /en/training-calendar · /ru/kalendar-obucheniya
 * Ana sayfadaki Hero'nun "Eğitim takvimi" butonu da bu rota anahtarına
 * bağlıdır (Homepage global'inde `type: 'route', route: 'training-calendar'`),
 * dolayısıyla ayrıca bir adres tanımlanmaz.
 *
 * SIRALAMA: `startDate` ARTAN. Katalog sayfası en yeniden eskiye sıralar
 * (vitrin mantığı); takvim ise kronolojiktir — bir takvimi tersten okumak
 * doğal değildir.
 *
 * SÜZGEÇLER (yıl / ay / tematik konu) istemci tarafındadır; gerekçesi
 * components/training/TrainingCalendar içinde. Bu sayfa yalnızca VERİYİ
 * toplar ve etiketleri ZİYARETÇİNİN DİLİNDE çözer — süzme bileşeni saf
 * sunumdur, `optionLabel` gibi sunucu yardımcılarını çağırmaz.
 *
 * Konu süzgeci seçenekleri SUNUCUDA sayılır: sayaçlar ilk boyamada doğru
 * görünür ve kaydı olmayan konu HİÇ BASILMAZ — ziyaretçi boş sonuç veren bir
 * düğmeye tıklamaz.
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

  const t = await getTranslations({ locale, namespace: 'calendar' })

  return buildMetadata({
    locale,
    title: t('metaTitle'),
    description: t('intro'),
    pathByLocale: {
      tr: ROUTES['training-calendar'].tr,
      en: ROUTES['training-calendar'].en,
      ru: ROUTES['training-calendar'].ru,
    },
  })
}

type TopicRef = { id: string | number; title?: string | null }

export default async function TrainingCalendarPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('calendar')
  const payload = await payloadClient()

  const result = await payload.find({
    collection: 'training-programs',
    locale,
    where: { _status: { equals: 'published' } },
    sort: 'startDate',
    limit: 500,
    pagination: false,
    depth: 1,
  })

  const items: TimelineTraining[] = result.docs.map((doc) => {
    const topics = ((doc.topics ?? []) as (number | TopicRef)[]).filter(
      (topic): topic is TopicRef => typeof topic === 'object',
    )

    return {
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      status: doc.status,
      startDate: doc.startDate,
      endDate: doc.endDate,
      deliveryModeLabel: optionLabel(DELIVERY_MODES, doc.deliveryMode, locale),
      venue: doc.venue,
      quota: doc.quota,
      topicIds: topics.map((topic) => topic.id),
      topicTitles: topics
        .map((topic) => topic.title)
        .filter((title): title is string => Boolean(title)),
    }
  })

  /**
   * Konu süzgeci seçenekleri kayıtlardan toplanır — ayrı bir sorgu atılmaz.
   * Takvimde hiç eğitimi olmayan bir konu çubuğu kalabalıklaştırmamalıdır.
   */
  const topicCounts = new Map<string, { label: string; count: number }>()
  for (const item of items) {
    item.topicIds.forEach((id, index) => {
      const key = String(id)
      const existing = topicCounts.get(key)
      topicCounts.set(key, {
        label: item.topicTitles[index] ?? existing?.label ?? key,
        count: (existing?.count ?? 0) + 1,
      })
    })
  }

  const topicOptions: CalendarTopicOption[] = [...topicCounts.entries()]
    .map(([value, { label, count }]) => ({ value, label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, locale))

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')}>
        <Link
          href={href('training-programs', locale)}
          className="group inline-flex min-h-12 items-center gap-2 font-semibold text-white underline decoration-white/50 decoration-2 underline-offset-8 transition-colors hover:decoration-white focus-within:decoration-white"
        >
          {/* Çeviride sondaki ok, simgeyle çift ok olmasın diye atılır. */}
          {t('goToCatalog').replace(/\s*→\s*$/, '')}
          <svg aria-hidden="true" viewBox="0 0 16 16" width="1em" height="1em" className="transition-transform duration-300 group-hover:translate-x-1 group-focus-within:translate-x-1">
            <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M2.5 8h11M9.5 4l4 4-4 4" />
          </svg>
        </Link>
      </PageHero>

      <section aria-labelledby="calendar-timeline" className="container-page section-block">
        <h2 id="calendar-timeline" className="sr-only">
          {t('timelineHeading')}
        </h2>

        <TrainingCalendar locale={locale} items={items} topics={topicOptions} />
      </section>
    </>
  )
}
