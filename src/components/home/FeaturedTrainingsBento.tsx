import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import type { Locale } from '@/i18n/locales'
import { detailHref, href } from '@/i18n/routes'
import { formatDateRange } from '@/lib/dates'
import { resolveMedia } from '@/lib/media'
import { trainingStatusClasses, trainingStatusLabel } from '@/lib/trainingStatus'

import { ArrowLink } from '../ui/ArrowLink'
import { MediaFallback } from '../ui/MediaFallback'
import type { TrainingCardItem } from '../training/TrainingCard'
import { HomeSectionHeader } from './HomeSectionHeader'

/**
 * ÖNE ÇIKAN EĞİTİMLER — VİTRİN + PROGRAM LİSTESİ  (Şartname 6.1, 6.4)
 * ============================================================================
 * İki parçalı düzen:
 *   solda  → VİTRİN KARTI: başvuruya açık ilk eğitim, büyük görselle
 *   sağda  → YAKLAŞAN PROGRAMLAR: takvim kutucuklu kompakt liste
 *
 * NEDEN BENTO'DAN VAZGEÇİLDİ
 * Farklı genişlikteki dört-beş kart, içerik uzunluğuna göre farklı
 * yüksekliklere uzuyor ve ızgarada boşluklar bırakıyordu. Bir eğitim
 * merkezinde ziyaretçinin asıl sorusu "ne zaman, hangi program?"dır; takvim
 * kutucuklu liste bu soruyu tek bakışta yanıtlar.
 *
 * VİTRİN SEÇİMİ
 * Liste başlangıç tarihine göre sıralı gelir; ilk kayıt çoğu zaman TAMAMLANMIŞ
 * bir eğitimdir. Vitrine tamamlanmış bir programı koymak yanlış mesajdır. Bu
 * yüzden önce "başvuruya açık", sonra "devam ediyor" durumundaki ilk kayıt
 * seçilir; hiçbiri yoksa ilk kayıt.
 *
 * ERİŞİLEBİLİRLİK
 *   - Her satırın tamamı tıklanabilir; odak durağı TEK (başlık bağlantısı).
 *   - Takvim kutucuğu `aria-hidden`: aynı tarih satırda metin olarak yazılı.
 *   - Durum rozeti renkle birlikte METİN taşır (1.4.1).
 * ============================================================================
 */

/**
 * Görselli kartın karartması — HomeHero ile aynı ölçüm mantığı: 0.65 taban
 * katman (beyaz metin en kötü durumda 5.28:1), üzerine alt bölgeyi koyulaştıran
 * degrade. Degrade yalnızca koyulaştırır.
 */
const CARD_OVERLAY = [
  'linear-gradient(rgba(4, 32, 27, 0) 0%, rgba(4, 32, 27, 0.45) 50%, rgba(4, 32, 27, 0.85) 100%)',
  'linear-gradient(rgba(4, 32, 27, 0.55), rgba(4, 32, 27, 0.55))',
].join(', ')

export type FeaturedTraining = TrainingCardItem & {
  venue?: string | null
  coverImage?: unknown
}

type Props = {
  locale: Locale
  items: FeaturedTraining[]
  /** Homepage global'inden gelen başlık; boşsa arayüz çevirisi kullanılır. */
  title?: string | null
  intro?: string | null
  showStatusBadges?: boolean
}

const VITRIN_ONCELIGI = ['applications-open', 'ongoing']

/** Takvim kutucuğu için gün ve kısa ay — UTC ile (bkz. lib/dates monthKey notu). */
const takvim = (locale: Locale, value: string | null | undefined) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return {
    gun: new Intl.DateTimeFormat(locale, { day: 'numeric', timeZone: 'UTC' }).format(date),
    ay: new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' })
      .format(date)
      .replace('.', ''),
  }
}

const Ok = ({ className = '' }: { className?: string }) => (
  <svg aria-hidden="true" viewBox="0 0 16 16" width="1em" height="1em" className={className}>
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.5 8h11M9.5 4l4 4-4 4"
    />
  </svg>
)

export const FeaturedTrainingsBento = async ({
  locale,
  items,
  title,
  intro,
  showStatusBadges = true,
}: Props) => {
  const t = await getTranslations('home')
  const tc = await getTranslations('common')
  const tt = await getTranslations('training')
  const tn = await getTranslations('nav')

  const vitrin =
    VITRIN_ONCELIGI.map((durum) => items.find((item) => item.status === durum)).find(Boolean) ??
    items[0]
  const liste = items.filter((item) => item !== vitrin)

  return (
    <section aria-labelledby="featured-trainings" className="bg-surface-warm">
      <div className="container-page py-16 lg:py-24">
        <HomeSectionHeader
          id="featured-trainings"
          eyebrow={t('featuredEyebrow')}
          title={title?.trim() || t('featuredTrainings')}
          intro={intro?.trim() || null}
          action={
            <ArrowLink href={href('training-programs', locale)}>
              {tc('viewAll')}
              <span className="sr-only">: {tn('trainingPrograms')}</span>
            </ArrowLink>
          }
        />

        {!vitrin ? (
          <p className="mt-8 text-ink-600">{tc('noResults')}</p>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-12">
            {/* --- Vitrin kartı ------------------------------------------- */}
            {(() => {
              const cover = resolveMedia(vitrin.coverImage, 'hero')
              const statusText = showStatusBadges ? trainingStatusLabel(vitrin.status, locale) : null
              const dateRange = formatDateRange(locale, vitrin.startDate, vitrin.endDate)

              return (
                <article
                  className={`group relative isolate flex min-h-[26rem] flex-col justify-end overflow-hidden rounded-card lg:min-h-[32rem] ${
                    liste.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'
                  }`}
                >
                  {cover ? (
                    <Image
                      src={cover.url}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes="(min-width: 1024px) 58vw, 100vw"
                      className="ease-editorial -z-20 object-cover transition-transform duration-1000 group-hover:scale-[1.03] group-focus-within:scale-[1.03]"
                    />
                  ) : (
                    <div aria-hidden="true" className="absolute inset-0 -z-20">
                      <MediaFallback variant="panel" />
                    </div>
                  )}
                  <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: CARD_OVERLAY }} />

                  <div className="p-6 sm:p-8 lg:p-10">
                    {statusText ? (
                      <p className={trainingStatusClasses(vitrin.status, { onDark: true })}>
                        <span className="sr-only">{tt('statusLabel')}: </span>
                        {statusText}
                      </p>
                    ) : null}
                    {dateRange ? (
                      <p className="mt-4 text-sm font-medium text-white/85">
                        <time dateTime={vitrin.startDate ?? undefined}>{dateRange}</time>
                      </p>
                    ) : null}
                    <h3 className="mt-2 max-w-2xl text-balance text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-[2.25rem]">
                      <Link
                        href={detailHref('training-program', locale, vitrin.slug ?? '')}
                        className="text-white underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:underline"
                      >
                        {vitrin.title}
                      </Link>
                    </h3>
                    {vitrin.summary ? (
                      <p className="mt-3 line-clamp-3 max-w-xl leading-relaxed text-white/90">
                        {vitrin.summary}
                      </p>
                    ) : null}
                    {vitrin.venue ? (
                      <p className="mt-3 flex items-center gap-2 text-sm text-white/80">
                        <svg aria-hidden="true" viewBox="0 0 16 16" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M8 14.5s4.5-4.2 4.5-7.8a4.5 4.5 0 1 0-9 0c0 3.6 4.5 7.8 4.5 7.8Z" />
                          <circle cx="8" cy="6.7" r="1.6" />
                        </svg>
                        {vitrin.venue}
                      </p>
                    ) : null}
                    <p
                      aria-hidden="true"
                      className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-shell-950 transition-colors duration-300 group-hover:bg-brand-50 group-focus-within:bg-brand-50"
                    >
                      {tt('viewDetails')}
                      <Ok className="ease-editorial transition-transform duration-500 group-hover:translate-x-1 group-focus-within:translate-x-1" />
                    </p>
                  </div>
                </article>
              )
            })()}

            {/* --- Yaklaşan programlar ------------------------------------ */}
            {liste.length > 0 ? (
              <div className="flex flex-col rounded-card border border-line bg-surface lg:col-span-5">
                <p className="border-b border-line px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
                  {t('upcomingLabel')}
                </p>
                <ul className="flex-1 divide-y divide-line">
                  {liste.map((item) => {
                    const kutu = takvim(locale, item.startDate)
                    const thumb = resolveMedia(item.coverImage, 'thumbnail')
                    const statusText = showStatusBadges ? trainingStatusLabel(item.status, locale) : null
                    const dateRange = formatDateRange(locale, item.startDate, item.endDate)

                    return (
                      <li
                        key={String(item.id)}
                        className="group ease-editorial relative flex items-center gap-4 px-6 py-5 transition-colors duration-300 hover:bg-surface-warm focus-within:bg-surface-warm"
                      >
                        {kutu ? (
                          <div
                            aria-hidden="true"
                            className="flex w-14 shrink-0 flex-col items-center rounded-md border border-line bg-surface py-1.5 text-center transition-colors duration-300 group-hover:border-brand-700 group-focus-within:border-brand-700"
                          >
                            <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-brand-700">
                              {kutu.ay}
                            </span>
                            <span className="text-xl font-bold leading-none tracking-tight text-shell-900">
                              {kutu.gun}
                            </span>
                          </div>
                        ) : null}

                        <div className="min-w-0 flex-1">
                          {statusText ? (
                            <p className={trainingStatusClasses(item.status)}>
                              <span className="sr-only">{tt('statusLabel')}: </span>
                              {statusText}
                            </p>
                          ) : null}
                          <h3 className="mt-1.5 line-clamp-2 font-semibold leading-snug tracking-tight">
                            <Link
                              href={detailHref('training-program', locale, item.slug ?? '')}
                              className="text-shell-900 underline-offset-4 transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-brand-800 group-focus-within:text-brand-800"
                            >
                              {item.title}
                            </Link>
                          </h3>
                          {dateRange ? (
                            <p className="mt-1 text-sm text-ink-600">
                              <time dateTime={item.startDate ?? undefined}>{dateRange}</time>
                            </p>
                          ) : null}
                        </div>

                        {thumb ? (
                          <div className="relative hidden size-16 shrink-0 overflow-hidden rounded-md sm:block">
                            <Image src={thumb.url} alt="" aria-hidden="true" fill sizes="64px" className="object-cover" />
                          </div>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
                <div className="border-t border-line px-6 py-4">
                  <ArrowLink href={href('training-calendar', locale)}>{t('calendarLink')}</ArrowLink>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}

export default FeaturedTrainingsBento
