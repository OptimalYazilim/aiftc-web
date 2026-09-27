import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/locales'
import { detailHref, href } from '@/i18n/routes'
import { resolveMedia } from '@/lib/media'
import { payloadClient } from '@/lib/queries'

import { TopicIcon } from '../training/TopicIcon'
import { ArrowLink } from '../ui/ArrowLink'
import { MediaFallback } from '../ui/MediaFallback'
import { HomeSectionHeader } from './HomeSectionHeader'

/**
 * ANA SAYFA — EĞİTİM KONULARI VİTRİNİ  (Şartname 6.1, 6.3)
 * ============================================================================
 * Görsel ağırlıklı kartlar: başlık görselin ÜZERİNDE, alt kenarda. Her kart
 * konunun kaç yayımlanmış programa sahip olduğunu söyler — ziyaretçi hangi
 * alanda eğitim açıldığını tek bakışta görür.
 *
 * PROGRAM SAYISI
 * Yayımlanmış eğitimler tek sorguda, yalnızca `topics` alanıyla çekilir ve
 * bellekte sayılır. Konu başına ayrı sorgu (6 konu = 6 sorgu) atılmaz.
 *
 * KONTRAST
 * Metin, alttan güçlenen shell-950 perdesinin üzerindedir; perdenin metin
 * bölgesindeki opaklığı 0.88 → beyaz metin en parlak görselde bile ≥ 7:1.
 *
 * Kartın tamamı tıklanabilir; odak durağı TEK (başlık bağlantısı).
 * ============================================================================
 */

type Topic = {
  id: string | number
  title?: string
  slug?: string
  category?: string
  summary?: string
  coverImage?: unknown
}

export const TopicShowcase = async ({ locale, topics }: { locale: Locale; topics: Topic[] }) => {
  if (topics.length === 0) return null

  const t = await getTranslations('home')
  const tc = await getTranslations('common')

  const payload = await payloadClient()
  const programs = await payload.find({
    collection: 'training-programs',
    locale,
    where: { _status: { equals: 'published' } },
    limit: 500,
    depth: 0,
    overrideAccess: false,
    select: { topics: true } as never,
  })

  const sayim = new Map<string, number>()
  for (const doc of programs.docs as unknown as { topics?: (number | { id: number })[] }[]) {
    for (const topic of doc.topics ?? []) {
      const id = String(typeof topic === 'object' ? topic.id : topic)
      sayim.set(id, (sayim.get(id) ?? 0) + 1)
    }
  }

  return (
    <section aria-labelledby="topics" className="bg-surface">
      <div className="container-page py-16 lg:py-24">
        <HomeSectionHeader
          id="topics"
          eyebrow={t('topicsEyebrow')}
          title={t('trainingTopics')}
          intro={t('topicsIntro')}
          action={
            <ArrowLink href={href('training-topics', locale)}>
              {tc('viewAll')}
              <span className="sr-only">: {t('trainingTopics')}</span>
            </ArrowLink>
          }
        />

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => {
            const cover = resolveMedia(topic.coverImage, 'card')
            const adet = sayim.get(String(topic.id)) ?? 0

            return (
              <li
                key={String(topic.id)}
                className="group relative isolate flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-card bg-shell-950"
              >
                {cover ? (
                  <Image
                    src={cover.url}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="ease-editorial -z-20 object-cover transition-transform duration-1000 group-hover:scale-[1.05] group-focus-within:scale-[1.05]"
                  />
                ) : (
                  <div aria-hidden="true" className="absolute inset-0 -z-20">
                    <MediaFallback variant="panel" />
                  </div>
                )}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(4,32,27,0.92)_0%,rgba(4,32,27,0.6)_45%,rgba(4,32,27,0.1)_100%)] transition-opacity duration-500"
                />

                {/* Üst: ikon + program sayısı */}
                <div className="absolute inset-x-5 top-5 flex items-center justify-between">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-10 items-center justify-center rounded-full bg-white/95 text-brand-700"
                  >
                    <TopicIcon category={topic.category} />
                  </span>
                  <span className="rounded-full bg-shell-950/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {t('programCount', { count: adet })}
                  </span>
                </div>

                <div className="p-5 sm:p-6">
                  <h3 className="text-xl font-bold leading-tight tracking-tight text-white">
                    <Link
                      href={detailHref('training-topic', locale, topic.slug ?? '')}
                      className="text-white underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:underline"
                    >
                      {topic.title}
                    </Link>
                  </h3>
                  {topic.summary ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/80">{topic.summary}</p>
                  ) : null}
                  <span
                    aria-hidden="true"
                    className="mt-4 block h-0.5 w-10 bg-brand-500 transition-[width] duration-500 ease-out group-hover:w-20 group-focus-within:w-20"
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default TopicShowcase
