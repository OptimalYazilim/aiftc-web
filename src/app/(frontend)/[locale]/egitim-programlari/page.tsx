import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import {
  TrainingCatalog,
  type CatalogFilterOption,
  type CatalogTraining,
} from '@/components/training/TrainingCatalog'
import { DELIVERY_MODES, TRAINING_LEVELS, TRAINING_STATUSES } from '@/fields/options'
import { isLocale, LOCALE_CODES, type Locale } from '@/i18n/locales'
import { ROUTES } from '@/i18n/routes'
import { buildMetadata } from '@/lib/metadata'
import { optionLabel } from '@/lib/optionLabel'
import { payloadClient } from '@/lib/queries'

/**
 * EĞİTİM KATALOĞU  (Şartname 6.4 — "Eğitimler ve Eğitim Programları")
 * ============================================================================
 * ROTA NOTU
 * Klasör adı `egitim-programlari`'dir çünkü `src/i18n/routes.ts` bu bölümün
 * KANONİK (Türkçe) segmentini böyle tanımlar. next-intl, ziyaretçinin gördüğü
 * yerelleştirilmiş adresi (`/en/training-programmes`, `/ru/programmy-obucheniya`)
 * bu kanonik yola yeniden yazar. Klasör adı ROUTES ile birebir aynı olmak
 * ZORUNDADIR; aksi halde `href('training-programs', locale)` ile üretilen
 * bağlantılar 404 döner ve `hooks/revalidate.ts` yanlış yolu tazeler.
 *
 * VERİ
 * Tüm yayımlanmış eğitimler TEK sorguda gelir; arama ve filtreleme tarayıcıda
 * yapılır (gerekçesi `TrainingCatalog` içinde belgelenmiştir). Filtre
 * seçenekleri de bu listeden türetilir — hiç eğitimi olmayan bir konu için
 * boşuna buton basılmaz.
 * ============================================================================
 */
export const revalidate = 300

type Props = { params: Promise<{ locale: Locale }> }

/** Üç dil de önceden üretilir; ISR yalnızca tazelemek için çalışır. */
export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const t = await getTranslations({ locale, namespace: 'catalog' })

  return buildMetadata({
    locale,
    title: t('metaTitle'),
    description: t('intro'),
    pathByLocale: {
      tr: ROUTES['training-programs'].tr,
      en: ROUTES['training-programs'].en,
      ru: ROUTES['training-programs'].ru,
    },
  })
}

type TopicRef = { id: string | number; title?: string | null; slug?: string | null; category?: string | null }

export default async function TrainingCatalogPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('catalog')
  const payload = await payloadClient()

  const result = await payload.find({
    collection: 'training-programs',
    locale,
    where: { _status: { equals: 'published' } },
    sort: '-startDate',
    // Merkezin yayımladığı eğitim sayısı bu sınırın çok altındadır; sayfalama
    // yerine tek sorgu bilinçli bir tercihtir (bkz. TrainingCatalog).
    limit: 500,
    pagination: false,
    depth: 1,
  })

  const items: CatalogTraining[] = result.docs.map((doc) => {
    const topics = (doc.topics ?? []) as (number | TopicRef)[]

    return {
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      summary: doc.summary,
      status: doc.status,
      startDate: doc.startDate,
      endDate: doc.endDate,
      code: doc.code,
      venue: doc.venue,
      deliveryMode: doc.deliveryMode,
      deliveryModeLabel: optionLabel(DELIVERY_MODES, doc.deliveryMode, locale),
      levelLabel: optionLabel(TRAINING_LEVELS, doc.level, locale),
      applicationDeadline: doc.applicationDeadline,
    quota: doc.quota,
      // Ilk konunun kategorisi karttaki tematik ikonu secer.
      categoryKey:
        topics.map((t) => (typeof t === 'object' ? t.category : null)).find(Boolean) ?? null,
      // depth: 1 ile ilişki nesne olarak gelir; yine de sayı gelme ihtimaline
      // karşı iki biçim de karşılanır.
      topicIds: topics.map((topic) => (typeof topic === 'object' ? topic.id : topic)),
      topicTitles: topics
        .map((topic) => (typeof topic === 'object' ? topic.title : null))
        .filter((title): title is string => Boolean(title)),
    }
  })

  // --- Filtre seçenekleri: yalnızca gerçekten eğitimi olanlar ---------------
  const topicOptions = new Map<string, CatalogFilterOption>()

  for (const doc of result.docs) {
    for (const topic of (doc.topics ?? []) as (number | TopicRef)[]) {
      if (typeof topic !== 'object') continue

      const key = String(topic.id)
      const existing = topicOptions.get(key)

      if (existing) existing.count += 1
      else
        topicOptions.set(key, {
          value: key,
          label: topic.title ?? key,
          count: 1,
          // Footer'daki `?konu=<slug>` bağlantılarının eşleşebilmesi için.
          slug: topic.slug ?? null,
        })
    }
  }

  const statusOptions: CatalogFilterOption[] = TRAINING_STATUSES.map((option) => ({
    value: option.value,
    label: optionLabel(TRAINING_STATUSES, option.value, locale) ?? option.value,
    count: items.filter((item) => item.status === option.value).length,
  })).filter((option) => option.count > 0)

  return (
    <>
      {/* --- Kurumsal başlık alanı ---------------------------------------- */}
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page py-12 lg:py-16">
          <h1 className="text-3xl font-bold sm:text-4xl">{t('title')}</h1>
          <p className="mt-4 max-w-3xl text-lg text-ink-600">{t('intro')}</p>
        </div>
      </section>

      <section aria-labelledby="catalog-list" className="bg-surface-warm">
        <div className="container-page py-10 lg:py-12">
        <h2 id="catalog-list" className="sr-only">
          {t('listHeading')}
        </h2>

        <TrainingCatalog
          locale={locale}
          items={items}
          topics={[...topicOptions.values()].sort((a, b) => a.label.localeCompare(b.label, locale))}
          statuses={statusOptions}
        />
        </div>
      </section>
    </>
  )
}
