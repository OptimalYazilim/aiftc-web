import Image from 'next/image'
import React from 'react'

import { Breadcrumbs, type Crumb } from './Breadcrumbs'

/**
 * İÇ SAYFA ÜST ALANI — ANA SAYFA HERO'SUNUN DİLİ
 * ============================================================================
 * Ana sayfa koyu orman tonlu, başlığın altına uzanan bir hero ile açılır.
 * İç sayfalar önceden açık kemik zeminli ayrı bir bant kullanıyordu; ana
 * sayfadan bir menü bağlantısına tıklayan ziyaretçi başka bir siteye geçmiş
 * gibi hissediyordu. Bu bileşen AYNI dili iç sayfalara taşır:
 *
 *   - `hero-under-header`: başlık en üstteyken şeffaflaşır (HeaderShell).
 *   - Görsel varsa: fotoğraf + ölçülmüş taban karartma + `hero-scrim`.
 *     Görsel yoksa: `hero-editorial` katmanlı ışık zemini.
 *   - Üst etiket ana sayfa bölümlerindeki gibi kısa çizgiyle başlar.
 *   - İsteğe bağlı sayaç bandı Hero'nun istatistik şeridiyle aynıdır.
 *
 * KONTRAST — HomeHero.tsx'teki ölçüm tablosu geçerlidir: taban karartma
 * shell-950 %72 (en kötü durumda beyaz metinle 6.6:1), perde yalnızca
 * koyulaştırır. Görselsiz zeminde beyaz metin ≈15.9:1.
 *
 * `variant`:
 *   page   → bölüm/listeleme sayfası (büyük başlık, geniş dolgu)
 *   record → kayıt/detay sayfası (bir kademe küçük başlık, sıkı dolgu)
 * ============================================================================
 */

type Stat = { value?: string | null; label?: string | null }

type Props = {
  title: React.ReactNode
  eyebrow?: React.ReactNode
  intro?: React.ReactNode
  breadcrumbs?: { items: Crumb[]; label: string }
  /** Arka plan görseli (dekoratif — anlamı başlık taşır). */
  image?: { url: string } | null
  variant?: 'page' | 'record'
  /** Başlığın ÜSTÜNDE, üst etiketle aynı satırda duran ek bilgi (tarih, rozet). */
  meta?: React.ReactNode
  /** Girişin altında duran serbest içerik (aksiyonlar, künye). */
  children?: React.ReactNode
  stats?: Stat[]
  /** Başlığa verilecek id (ör. `aria-labelledby` için). */
  titleId?: string
}

export const PageHero: React.FC<Props> = ({
  title,
  eyebrow,
  intro,
  breadcrumbs,
  image,
  variant = 'page',
  meta,
  children,
  stats,
  titleId,
}) => {
  const record = variant === 'record'
  const sayaclar = (stats ?? []).filter((item) => item.value && item.label)

  return (
    <section className="hero-under-header relative isolate overflow-hidden bg-shell-950 text-white">
      {image?.url ? (
        <>
          <Image
            src={image.url}
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10"
            style={{ backgroundColor: 'rgba(4, 32, 27, 0.72)' }}
          />
          <div aria-hidden="true" className="hero-scrim absolute inset-0 -z-10" />
        </>
      ) : (
        <>
          <div aria-hidden="true" className="hero-editorial absolute inset-0 -z-20" />
          {/* Eş yükselti çizgileri — ana sayfanın kapanış bandıyla aynı motif. */}
          <svg
            aria-hidden="true"
            className="absolute -right-32 -top-40 -z-10 h-[40rem] w-[40rem] text-white/[0.06]"
            viewBox="0 0 400 400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            {[40, 70, 100, 130, 160, 190, 220].map((r, i) => (
              <path
                key={r}
                d={`M ${200 - r} 200 C ${200 - r} ${200 - r * 0.9 - i * 4}, ${200 + r * 0.8} ${200 - r - i * 6}, ${200 + r} ${200 - i * 3} S ${200 + r * 0.3} ${200 + r * 1.05}, ${200 - r * 0.2} ${200 + r * 0.95} S ${200 - r} ${200 + r * 0.4}, ${200 - r} 200 Z`}
              />
            ))}
          </svg>
        </>
      )}

      <div
        className={`container-page flex flex-col justify-end ${
          record
            ? 'min-h-[clamp(16rem,36vh,22rem)] pb-10 pt-10 sm:pb-12'
            : 'min-h-[clamp(20rem,46vh,28rem)] pb-12 pt-14 sm:pb-16'
        }`}
      >
        {breadcrumbs ? (
          <div className={record ? 'mb-8' : 'mb-10'}>
            <Breadcrumbs items={breadcrumbs.items} label={breadcrumbs.label} tone="dark" />
          </div>
        ) : null}

        <div className="max-w-4xl">
          {eyebrow || meta ? (
            <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
              {eyebrow ? (
                <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-100 sm:text-[0.8125rem]">
                  <span aria-hidden="true" className="h-px w-8 bg-brand-100/70" />
                  {eyebrow}
                </p>
              ) : null}
              {meta}
            </div>
          ) : null}

          <h1
            id={titleId}
            className={`text-balance font-bold text-white [text-shadow:0_2px_18px_rgba(4,32,27,0.45)] ${
              record
                ? 'text-[clamp(1.875rem,1.3rem+2vw,2.875rem)] leading-[1.1] tracking-[-0.022em]'
                : 'text-[clamp(2.25rem,1.1rem+4.6vw,4.25rem)] leading-[1.04] tracking-[-0.032em]'
            }`}
          >
            {title}
          </h1>

          {intro ? (
            <div className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85">{intro}</div>
          ) : null}

          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </div>

      {sayaclar.length > 0 ? (
        <div className="relative border-t border-white/20 bg-shell-950/45 backdrop-blur-sm">
          <div className="container-page">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-6 py-8 md:grid-cols-4">
              {sayaclar.map((item, index) => (
                <div key={`${item.value}-${index}`} className="flex flex-col">
                  <dt className="order-2 mt-1 text-sm leading-snug text-white/80">{item.label}</dt>
                  <dd className="order-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : null}
    </section>
  )
}

/**
 * Koyu hero içinde kullanılacak hap/rozet. Beyaz metin, yarı saydam zemin,
 * ≥3:1 kenarlık (1.4.11) — metin kontrastı shell-950 üzerinde ≥ 12:1.
 */
export const HeroChip: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <span
    className={`inline-flex items-center rounded-full border border-white/35 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white sm:text-sm ${className}`}
  >
    {children}
  </span>
)

/** Koyu hero içindeki birincil aksiyon — ana sayfa Hero butonu ile aynı. */
export const heroButtonClass =
  'ease-editorial inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-white px-6 text-base font-bold text-shell-900 transition-colors duration-300 hover:bg-brand-50 focus-visible:bg-brand-50'

export default PageHero
