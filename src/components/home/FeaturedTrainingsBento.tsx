import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import type { Locale } from '@/i18n/locales'
import { detailHref, href } from '@/i18n/routes'
import { formatDateRange } from '@/lib/dates'
import { trainingStatusClasses, trainingStatusLabel } from '@/lib/trainingStatus'

import { ArrowLink } from '../ui/ArrowLink'
import { MediaFallback } from '../ui/MediaFallback'
import { SectionHeading } from '../ui/SectionHeading'
import { TrainingCard, type TrainingCardItem } from '../training/TrainingCard'

/**
 * ÖNE ÇIKAN EĞİTİMLER — BENTO GRID  (Şartname 6.1, 6.4)
 * ============================================================================
 * Asimetrik "bento" yerleşim: ilk eğitim büyük görselli kart olarak öne çıkar,
 * kalanlar farklı genişliklerde kartlara yerleşir. Amaç yalnızca görsel değil —
 * merkezin vitrini olan eğitim, ana sayfada açık bir hiyerarşiyle sunulur.
 *
 * YERLEŞİM
 *   12 sütunluk grid, `md` kırılımından itibaren. Kart sayısı editörün
 *   Homepage global'inden seçtiği limite göre 1–6 arasında değişebildiği için
 *   her sayı için ayrı bir desen tanımlanır. Böylece 2 eğitim yayınlandığında
 *   da 5 eğitim yayınlandığında da boşluk kalmaz.
 *
 *   Sınıf adları DİZİDE SABİT METİN olarak durur; Tailwind 4 tarama sırasında
 *   bunları görebilsin diye şablon dizesiyle üretilmez.
 *
 * ERİŞİLEBİLİRLİK
 *   - Liste `<ul>/<li>`: ekran okuyucu kaç eğitim olduğunu söyler.
 *   - Görsel kartta metin, Hero ile aynı güvenli karartma katmanının üzerinde
 *     durur (WCAG 2.2 — 1.4.3).
 *   - Kart tamamen tıklanabilir DEĞİLDİR; odaklanılabilir tek öğe başlıktaki
 *     bağlantıdır (2.4.3 Odak Sırası, 2.4.4 Bağlantı Amacı).
 *   - Durum rozeti renkle birlikte METİN taşır (1.4.1 Rengin Kullanımı) ve
 *     ekran okuyucu için "Eğitim durumu:" ön eki alır.
 * ============================================================================
 */

/** Kart sayısına göre sütun/satır desenleri. 12 sütunluk grid. */
const BENTO_PATTERNS: Record<number, string[]> = {
  1: ['md:col-span-12'],
  2: ['md:col-span-6', 'md:col-span-6'],
  3: ['md:col-span-8 md:row-span-2', 'md:col-span-4', 'md:col-span-4'],
  4: ['md:col-span-8 md:row-span-2', 'md:col-span-4', 'md:col-span-4', 'md:col-span-12'],
  5: [
    'md:col-span-8 md:row-span-2',
    'md:col-span-4',
    'md:col-span-4',
    'md:col-span-6',
    'md:col-span-6',
  ],
  6: [
    'md:col-span-8 md:row-span-2',
    'md:col-span-4',
    'md:col-span-4',
    'md:col-span-4',
    'md:col-span-4',
    'md:col-span-4',
  ],
}

/**
 * Görselli kartın karartması. HomeHero ile AYNI mantık: kartın tamamına
 * brand-950 rengiyle 0.65 taban katman (beyaz metin en kötü durumda 5.28:1 —
 * WCAG 2.2 AA), üzerine metnin durduğu alt bölümü daha da koyulaştıran bir
 * degrade. Degrade yalnızca koyulaştırır; taban değeri hiçbir noktada açmaz.
 */
const CARD_OVERLAY = [
  'linear-gradient(rgba(4, 36, 15, 0) 0%, rgba(4, 36, 15, 0.4) 55%, rgba(4, 36, 15, 0.6) 100%)',
  'linear-gradient(rgba(4, 36, 15, 0.65), rgba(4, 36, 15, 0.65))',
].join(', ')

type MediaLike = { url?: string | null; alt?: string | null }

/** Ortak kartın alanları + yalnızca büyük görselli kartın kullandığı alanlar. */
export type FeaturedTraining = TrainingCardItem & {
  venue?: string | null
  coverImage?: MediaLike | number | string | null
}

type Props = {
  locale: Locale
  items: FeaturedTraining[]
  /** Homepage global'inden gelen başlık; boşsa arayüz çevirisi kullanılır. */
  title?: string | null
  intro?: string | null
  showStatusBadges?: boolean
}

const mediaOf = (value: FeaturedTraining['coverImage']): MediaLike | null =>
  value && typeof value === 'object' && 'url' in value && value.url ? value : null

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

  const pattern = BENTO_PATTERNS[Math.min(items.length, 6)] ?? BENTO_PATTERNS[6]

  return (
    /*
      ZEMİN AYRIMI
      Bölüm sıcak kırık beyaz (`bg-surface-warm`) zemine oturur; kartlar saf
      beyaz kalır. Fark bilinçli olarak çok küçüktür — kartın sınırını asıl
      taşıyan kenarlık ve gölgedir. Zemini daha koyu yapmak kartları
      "kutu" gibi gösterir ve sayfayı ağırlaştırır.
    */
    <section aria-labelledby="featured-trainings" className="bg-surface-warm">
      <div className="container-page py-12 lg:py-16">
      <SectionHeading
        id="featured-trainings"
        title={title?.trim() || t('featuredTrainings')}
        intro={intro?.trim() || null}
        action={<ArrowLink href={href('training-programs', locale)}>{tc('viewAll')}</ArrowLink>}
      />

      {items.length === 0 ? (
        <p className="mt-6 text-ink-600">{tc('noResults')}</p>
      ) : (
        <ul className="mt-8 grid auto-rows-fr gap-4 md:grid-cols-12">
          {items.map((item, index) => {
            const isFeature = index === 0 && items.length >= 3
            const cover = mediaOf(item.coverImage)

            /*
              --- Büyük vitrin kartı ---------------------------------------
              Ortak karttan ayrı durur: koyu zemin, açık renk metin ve
              `onDark` rozet varyantı.

              Zemin İKİ KAYNAKTAN gelebilir:
                kapak görseli varsa → fotoğraf + güvenli karartma katmanı
                kapak görseli yoksa → kurumsal degrade dokusu (MediaFallback)
              Görsel yüklenmemiş bir kaydın vitrinde düz beyaz bir metin
              bloğu olarak durması, Bento'nun hiyerarşisini düşürüyordu.
              Her iki durumda da metin koyu zemin üzerinde beyazdır.
            */
            if (isFeature) {
              const dateRange = formatDateRange(locale, item.startDate, item.endDate)
              const statusText = showStatusBadges ? trainingStatusLabel(item.status, locale) : null
              const link = detailHref('training-program', locale, item.slug ?? '')

              const badge = statusText ? (
                <p className={trainingStatusClasses(item.status, { onDark: true })}>
                  <span className="sr-only">{tt('statusLabel')}: </span>
                  {statusText}
                </p>
              ) : null

              return (
                <li
                  key={String(item.id)}
                  className={`${pattern[index] ?? ''} relative isolate flex min-h-72 flex-col justify-end overflow-hidden rounded-card`}
                >
                  {cover?.url ? (
                    <>
                      <Image
                        src={cover.url}
                        alt=""
                        aria-hidden="true"
                        fill
                        sizes="(min-width: 768px) 66vw, 100vw"
                        className="-z-20 object-cover"
                      />
                      {/* Fotoğrafta karartma ZORUNLU: parlak bir görselde
                          beyaz metin okunmaz (ölçüm CARD_OVERLAY'de). */}
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 -z-10"
                        style={{ background: CARD_OVERLAY }}
                      />
                    </>
                  ) : (
                    /* Görsel yok: kurumsal degrade + orman dokusu. Zaten koyu
                       olduğu için ayrıca karartma katmanı gerekmez. */
                    <div aria-hidden="true" className="absolute inset-0 -z-10">
                      <MediaFallback variant="panel" />
                    </div>
                  )}

                  <div className="p-6 lg:p-8">
                    {badge ? <div className="mb-3">{badge}</div> : null}
                    {dateRange ? (
                      <time dateTime={item.startDate ?? undefined} className="text-sm text-white/90">
                        {dateRange}
                      </time>
                    ) : null}
                    <h3 className="mt-1 text-xl font-semibold text-white lg:text-2xl">
                      <Link href={link} className="text-white underline-offset-4 hover:underline">
                        {item.title}
                      </Link>
                    </h3>
                    {item.summary ? (
                      <p className="mt-2 max-w-xl text-white/95">{item.summary}</p>
                    ) : null}
                    {item.venue ? (
                      <p className="mt-2 text-sm text-white/90">
                        {tt('venue')}: {item.venue}
                      </p>
                    ) : null}
                  </div>
                </li>
              )
            }

            // --- Standart kart --------------------------------------------
            // Görünüm katalog sayfasıyla ORTAKTIR; bkz. components/training/TrainingCard.
            return (
              <TrainingCard
                key={String(item.id)}
                locale={locale}
                item={item}
                statusPrefix={tt('statusLabel')}
                detailLabel={tt('viewDetails')}
                showStatus={showStatusBadges}
                size={isFeature ? 'large' : 'default'}
                className={pattern[index] ?? ''}
              />
            )
          })}
        </ul>
      )}
      </div>
    </section>
  )
}

export default FeaturedTrainingsBento
