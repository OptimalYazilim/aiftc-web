import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { LibraryCta } from '@/components/ek2/LibraryCta'
import {
  FeaturedTrainingsBento,
  type FeaturedTraining,
} from '@/components/home/FeaturedTrainingsBento'
import { HomeHero } from '@/components/home/HomeHero'
import { NewsCard } from '@/components/news/NewsCard'
import { TopicIcon } from '@/components/training/TopicIcon'
import { ArrowLink } from '@/components/ui/ArrowLink'
import { ExternalLink } from '@/components/ui/ExternalLink'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { NEWS_CATEGORIES } from '@/fields/options'
import { buildAlternates, isLocale, type Locale } from '@/i18n/locales'
import { detailHref, href } from '@/i18n/routes'
import { optionLabel } from '@/lib/optionLabel'
import { getHomepage, getLayoutData, payloadClient } from '@/lib/queries'
import { resolveNavItems } from '@/lib/resolveLink'

/**
 * ANA SAYFA  (Şartname 6.1)
 * ============================================================================
 * Bölümler, şartnamedeki sırayla:
 *   Hero            → components/home/HomeHero (Homepage global'inden yönetilir)
 *   Hızlı erişim    → Navigation global'i
 *   Öne çıkan eğitimler → components/home/FeaturedTrainingsBento
 *   Dijital kütüphane   → components/ek2/LibraryCta (EK-2 köprüsü)
 *   Haberler ve duyurular
 *
 * Bu dosya yalnızca VERİYİ TOPLAR ve bölümleri sıralar; sunum kararları
 * bileşenlerin içindedir. Metinlerin tamamı ya CMS'ten ya da `messages/`
 * altındaki arayüz çevirilerinden gelir — burada sabit metin yoktur.
 *
 * ISR: 5 dakika. Neon'un soğuk başlangıcı son kullanıcıya yansımaz;
 * içerik yayımlandığında `hooks/revalidate.ts` anında tazeler.
 * ============================================================================
 */
export const revalidate = 300

type Props = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })

  return {
    title: t('metaTitle'),
    alternates: buildAlternates({ tr: '', en: '', ru: '' }),
  }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params

  /**
   * `layout.tsx` ile AYNI koruma — burada da gereklidir.
   *
   * `favicon.ico` gibi middleware matcher'ından muaf tutulan yollar dil
   * önekine sahip olmadan doğrudan bu dinamik rotaya düşer ve `locale`
   * "favicon.ico" olur. Next, layout ile page'i EŞZAMANLI render ettiği
   * için layout'un `notFound()` çağrısı page'in çalışmasını engellemez:
   * `detailHref` bilinmeyen dil için `undefined` döner ve sayfa çöker.
   * Yanıt yine 404 olur, ama her istekte log'a yığın izi düşer.
   */
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('home')
  const tc = await getTranslations('common')

  const payload = await payloadClient()
  const [{ services, navigation }, homepage] = await Promise.all([
    getLayoutData(locale),
    getHomepage(locale),
  ])

  /**
   * Bento şeridinin sunum ayarları Homepage global'inden gelir; şeritte hangi
   * eğitimin görüneceğini ise eğitim kaydındaki `featured` kutusu belirler.
   * Limit editörden geldiği için 1–6 aralığına sıkıştırılır: bozuk bir değer
   * ne sorguyu ne de yerleşimi kırabilsin.
   */
  const featuredConfig = (homepage as {
    featuredTrainings?: {
      title?: string | null
      intro?: string | null
      limit?: number | null
      showStatusBadges?: boolean | null
    }
  }).featuredTrainings

  const featuredLimit = Math.min(6, Math.max(1, Number(featuredConfig?.limit) || 5))

  const [featuredTrainings, latestNews, topics] = await Promise.all([
    payload.find({
      collection: 'training-programs',
      locale,
      where: { featured: { equals: true }, _status: { equals: 'published' } },
      sort: 'startDate',
      limit: featuredLimit,
      depth: 1,
    }),
    payload.find({
      collection: 'news',
      locale,
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 4,
      depth: 1,
    }),
    payload.find({
      collection: 'training-topics',
      locale,
      where: { featured: { equals: true }, _status: { equals: 'published' } },
      sort: 'order',
      limit: 6,
      depth: 0,
    }),
  ])

  const quickAccess = resolveNavItems(
    (navigation as { quickAccess?: unknown[] }).quickAccess as never,
    { locale, services: services as never },
  )

  return (
    <>
      {/* --- Karşılama alanı (6.1) ---------------------------------------- */}
      <HomeHero locale={locale} />

      {/* --- Hızlı erişim (6.1) ------------------------------------------- */}
      {quickAccess.length > 0 ? (
        <section aria-labelledby="quick-access" className="container-page py-12">
          <h2 id="quick-access" className="sr-only">
            {t('quickAccess')}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickAccess.map((item, index) => (
              <li
                key={`${item.label}-${index}`}
                className="rounded-card border border-line p-5 transition-shadow hover:shadow-md"
              >
                <h3 className="text-lg font-semibold">
                  {item.available && item.href ? (
                    item.isExternal ? (
                      <ExternalLink
                        href={item.href}
                        trackId={item.trackId}
                        className="text-brand-800 underline-offset-4 hover:underline"
                      >
                        {item.label}
                      </ExternalLink>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-brand-800 underline-offset-4 hover:underline"
                      >
                        {item.label}
                      </Link>
                    )
                  ) : (
                    <span className="text-ink-500">{item.label}</span>
                  )}
                </h3>
                {item.description ? (
                  <p className="mt-1 text-ink-600">{item.description}</p>
                ) : null}
                {!item.available && item.notice ? (
                  <p className="mt-2 text-sm text-ink-600">{item.notice}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* --- Öne çıkan eğitimler: Bento Grid (6.1, 6.4) ------------------- */}
      <FeaturedTrainingsBento
        locale={locale}
        items={featuredTrainings.docs.map((doc) => ({
          ...doc,
          // Ilk konunun kategorisi karttaki tematik ikonu secer.
          categoryKey:
            (doc.topics ?? []).map((t) => (typeof t === 'object' ? t.category : null)).find(Boolean) ??
            null,
        })) as unknown as FeaturedTraining[]}
        title={featuredConfig?.title}
        intro={featuredConfig?.intro}
        showStatusBadges={featuredConfig?.showStatusBadges !== false}
      />

      {/* --- Eğitim konuları (6.1, 6.3) ----------------------------------- */}
      {topics.docs.length > 0 ? (
        <section aria-labelledby="topics" className="container-page py-12">
          <SectionHeading id="topics" title={t('trainingTopics')} />
          <ul className="mt-6 flex flex-wrap gap-3">
            {topics.docs.map((item) => {
              const doc = item as {
                id: string | number
                title?: string
                slug?: string
                category?: string
              }
              return (
                <li key={String(doc.id)}>
                  {/*
                    Konu etiketi: beyaz zemin, yumuşak kenarlık, konusuna göre
                    tematik ikon. İkon dekoratiftir — konu adı zaten metinde.
                    `min-h-11`: dokunma hedefi 44px (WCAG 2.2 — 2.5.8).
                  */}
                  <Link
                    href={detailHref('training-topic', locale, doc.slug ?? '')}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-soft bg-surface px-4 text-sm font-medium text-ink-700 shadow-xs transition-all duration-200 hover:border-brand-700 hover:bg-brand-50/60 hover:text-brand-800"
                  >
                    <TopicIcon category={doc.category} className="text-brand-700" />
                    {doc.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {/* --- Dijital kütüphane: EK-2 köprüsü (6.1, 6.6) -------------------- */}
      <LibraryCta locale={locale} />

      {/* --- Güncel duyurular (6.1, 6.7) ---------------------------------- */}
      <section aria-labelledby="latest-news" className="container-page py-12">
        <SectionHeading
          id="latest-news"
          title={t('latestNews')}
          action={<ArrowLink href={href('news', locale)}>{tc('viewAll')}</ArrowLink>}
        />

        {latestNews.docs.length === 0 ? (
          <p className="mt-4 text-ink-600">{tc('noResults')}</p>
        ) : (
          /*
            Haber listesi sayfasıyla AYNI kartı kullanır: kenarlık, gölge,
            hover mikro esnemesi ve kapak görseli yoksa kurumsal doku
            (bkz. components/news/NewsCard). Önceden burada ayrı bir
            "üst çizgili liste" markup'ı vardı; iki yerde iki farklı haber
            görünümü olması kurumsal tutarlılığı bozuyordu.
          */
          <ul className="mt-6 grid auto-rows-fr gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {latestNews.docs.map((doc) => (
              <NewsCard
                key={String(doc.id)}
                locale={locale}
                item={{
                  id: doc.id,
                  title: doc.title,
                  slug: doc.slug,
                  summary: doc.summary,
                  publishedAt: doc.publishedAt,
                  categoryLabel: optionLabel(NEWS_CATEGORIES, doc.category, locale),
                  coverImage: doc.coverImage,
                }}
                readMoreLabel={tc('readMore')}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
