import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { NEWS_CATEGORIES } from '@/fields/options'
import type { Locale } from '@/i18n/locales'
import { detailHref, href } from '@/i18n/routes'
import { formatDate } from '@/lib/dates'
import { resolveMedia } from '@/lib/media'
import { optionLabel } from '@/lib/optionLabel'

import { ArrowLink } from '../ui/ArrowLink'
import { MediaFallback } from '../ui/MediaFallback'
import { HomeSectionHeader } from './HomeSectionHeader'

/**
 * ANA SAYFA — HABERLER VE DUYURULAR  (Şartname 6.1, 6.7)
 * ============================================================================
 * Gazete düzeni: en yeni haber MANŞET olarak solda büyük, sonraki üç haber
 * sağda görselli kompakt satırlar. Dört eşit kart yerine hiyerarşi kurar —
 * en güncel duyuru ilk bakışta öne çıkar.
 *
 * Haber listesi sayfası kendi `NewsCard` bileşenini kullanmaya devam eder;
 * bu düzen yalnızca ana sayfanın vitrinidir.
 *
 * Her öğenin tamamı tıklanabilir; odak durağı TEK (başlık bağlantısı).
 * ============================================================================
 */

type Haber = {
  id: string | number
  title?: string | null
  slug?: string | null
  summary?: string | null
  publishedAt?: string | null
  category?: string | null
  coverImage?: unknown
}

const Kunye = ({ locale, item, onDark = false }: { locale: Locale; item: Haber; onDark?: boolean }) => {
  const date = formatDate(locale, item.publishedAt)
  const kategori = optionLabel(NEWS_CATEGORIES, item.category, locale)
  if (!date && !kategori) return null
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-xs font-semibold uppercase tracking-wider">
      {kategori ? <span className={onDark ? 'text-brand-100' : 'text-brand-700'}>{kategori}</span> : null}
      {date && kategori ? (
        <span aria-hidden="true" className={onDark ? 'text-white/40' : 'text-line-strong'}>
          ·
        </span>
      ) : null}
      {date ? (
        <time dateTime={item.publishedAt ?? undefined} className={onDark ? 'text-white/75' : 'text-ink-600'}>
          {date}
        </time>
      ) : null}
    </p>
  )
}

export const NewsShowcase = async ({ locale, items }: { locale: Locale; items: Haber[] }) => {
  const t = await getTranslations('home')
  const tc = await getTranslations('common')
  const tn = await getTranslations('nav')

  const [manset, ...digerleri] = items

  return (
    <section aria-labelledby="latest-news" className="bg-surface">
      <div className="container-page py-16 lg:py-24">
        <HomeSectionHeader
          id="latest-news"
          eyebrow={t('newsEyebrow')}
          title={t('latestNews')}
          action={
            <ArrowLink href={href('news', locale)}>
              {tc('viewAll')}
              <span className="sr-only">: {tn('news')}</span>
            </ArrowLink>
          }
        />

        {!manset ? (
          <p className="mt-8 text-ink-600">{tc('noResults')}</p>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-12">
            {/* --- Manşet ------------------------------------------------- */}
            {(() => {
              const cover = resolveMedia(manset.coverImage, 'hero')
              return (
                <article
                  className={`group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors duration-500 hover:border-shell-900 focus-within:border-shell-900 ${
                    digerleri.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'
                  }`}
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-surface-alt">
                    {cover ? (
                      <Image
                        src={cover.url}
                        alt=""
                        aria-hidden="true"
                        fill
                        sizes="(min-width: 1024px) 58vw, 100vw"
                        className="ease-editorial object-cover transition-transform duration-1000 group-hover:scale-[1.03] group-focus-within:scale-[1.03]"
                      />
                    ) : (
                      <MediaFallback variant="card" className="h-full" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6 sm:p-8">
                    <Kunye locale={locale} item={manset} />
                    <h3 className="mt-3 text-balance text-2xl font-bold leading-tight tracking-tight sm:text-[1.75rem]">
                      <Link
                        href={detailHref('news-item', locale, manset.slug ?? '')}
                        className="text-shell-900 underline-offset-4 transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-brand-800 group-focus-within:text-brand-800"
                      >
                        {manset.title}
                      </Link>
                    </h3>
                    {manset.summary ? (
                      <p className="mt-3 line-clamp-3 leading-relaxed text-ink-600">{manset.summary}</p>
                    ) : null}
                    <p
                      aria-hidden="true"
                      className="mt-auto flex items-center gap-1.5 pt-6 text-sm font-semibold text-brand-800 transition-colors group-hover:text-shell-950 group-focus-within:text-shell-950"
                    >
                      {tc('readMore')}
                      <svg viewBox="0 0 16 16" width="1em" height="1em" className="ease-editorial transition-transform duration-500 group-hover:translate-x-1 group-focus-within:translate-x-1">
                        <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M2.5 8h11M9.5 4l4 4-4 4" />
                      </svg>
                    </p>
                  </div>
                </article>
              )
            })()}

            {/* --- Diğer haberler ----------------------------------------- */}
            {digerleri.length > 0 ? (
              <ul className="flex flex-col gap-4 lg:col-span-5">
                {digerleri.map((item) => {
                  const thumb = resolveMedia(item.coverImage, 'card')
                  return (
                    <li
                      key={String(item.id)}
                      className="group relative flex flex-1 gap-5 overflow-hidden rounded-card border border-line bg-surface p-4 transition-colors duration-500 hover:border-shell-900 focus-within:border-shell-900"
                    >
                      <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-md bg-surface-alt sm:w-36">
                        {thumb ? (
                          <Image
                            src={thumb.url}
                            alt=""
                            aria-hidden="true"
                            fill
                            sizes="144px"
                            className="ease-editorial object-cover transition-transform duration-700 group-hover:scale-[1.05] group-focus-within:scale-[1.05]"
                          />
                        ) : null}
                      </div>
                      <div className="flex min-w-0 flex-col justify-center">
                        <Kunye locale={locale} item={item} />
                        <h3 className="mt-2 line-clamp-3 font-semibold leading-snug tracking-tight">
                          <Link
                            href={detailHref('news-item', locale, item.slug ?? '')}
                            className="text-shell-900 underline-offset-4 transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-brand-800 group-focus-within:text-brand-800"
                          >
                            {item.title}
                          </Link>
                        </h3>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}

export default NewsShowcase
