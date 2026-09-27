import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/locales'
import { detailHref, href } from '@/i18n/routes'
import { resolveMedia } from '@/lib/media'
import { getSimulationCenter, payloadClient } from '@/lib/queries'

/**
 * ANA SAYFA — SİMÜLASYON MERKEZİ BANDI  (Şartname 6.1, 6.5, 9)
 * ============================================================================
 * Merkezi diğer eğitim kurumlarından ayıran altyapıyı ana sayfada görünür
 * kılar. Önceden simülasyon merkezine yalnızca menüden ulaşılıyordu.
 *
 * İÇERİK CMS'TEN GELİR
 *   başlık ve görsel → Simülasyon Merkezi Sayfası global'i (`title`, `heroImage`)
 *   sistem listesi   → yayımlanmış `simulation-systems` kayıtları
 *   kısa tanım       → arayüz metni (`simulation.intro`), sayfa üst alanıyla aynı
 *
 * Global YAYIMLANMAMIŞSA veya hiç sistem yoksa bant hiç çizilmez: boş bir
 * vitrin, hiç vitrin olmamasından kötüdür.
 *
 * ZEMİN — koyu orman tonu. Sayfanın açık bölümleri arasında ritim kırar ve
 * hero ile aynı görsel dili kullanır. Beyaz metin shell-950 üzerinde 17:1.
 * ============================================================================
 */
export const SimulationBand = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations('home')
  const ts = await getTranslations('simulation')

  const payload = await payloadClient()
  const [page, systems] = await Promise.all([
    getSimulationCenter(locale),
    payload.find({
      collection: 'simulation-systems',
      locale,
      where: { _status: { equals: 'published' } },
      sort: 'order',
      limit: 4,
      depth: 0,
      overrideAccess: false,
      select: { title: true, slug: true, summary: true } as never,
    }),
  ])

  const status = (page as { _status?: string | null })._status
  if (status && status !== 'published') return null
  if (systems.docs.length === 0) return null

  const image = resolveMedia((page as { heroImage?: unknown }).heroImage, 'card')
  const title = (page as { title?: string | null }).title?.trim() || ts('title')
  const olcumler = (
    ((page as { capacityHighlights?: { value?: string | null; label?: string | null }[] | null })
      .capacityHighlights ?? []) as { value?: string | null; label?: string | null }[]
  )
    .filter((item) => item.value && item.label)
    .slice(0, 3)
  const items = systems.docs as unknown as { id: number; title?: string; slug?: string; summary?: string }[]

  return (
    <section aria-labelledby="home-simulation" className="bg-shell-950 text-white">
      <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
        <div className="lg:col-span-6">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-100">
            <span aria-hidden="true" className="h-px w-8 bg-brand-100/70" />
            {t('simulationEyebrow')}
          </p>
          <h2
            id="home-simulation"
            className="mt-3 text-balance text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl"
          >
            {title}
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">{ts('intro')}</p>

          {/* Kapasite göstergeleri — Simülasyon Merkezi Sayfası global'inden. */}
          {olcumler.length > 0 ? (
            <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-white/15 py-5">
              {olcumler.map((item, i) => (
                <div key={i} className="flex flex-col">
                  <dt className="order-2 mt-1 text-xs leading-snug text-white/65">{item.label}</dt>
                  <dd className="order-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {/* Sistemler: her biri kendi detay sayfasına gider. */}
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {items.map((system) => (
              <li key={system.id}>
                <Link
                  href={detailHref('simulation-system', locale, system.slug ?? '')}
                  className="ease-editorial group flex h-full flex-col rounded-card border border-white/15 bg-white/[0.04] p-4 transition-colors duration-500 hover:border-white/40 hover:bg-white/[0.08] focus-within:border-white/40 focus-within:bg-white/[0.08]"
                >
                  <span className="flex items-center justify-between gap-3 font-semibold text-white">
                    {system.title}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      width="1em"
                      height="1em"
                      className="ease-editorial shrink-0 text-brand-100 transition-transform duration-500 group-hover:translate-x-1 group-focus-within:translate-x-1"
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
                  </span>
                  {system.summary ? (
                    <span className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/70">
                      {system.summary}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href={href('simulation-centre', locale)}
            className="ease-editorial mt-8 inline-flex min-h-11 items-center gap-2 rounded-md bg-white px-5 font-semibold text-shell-950 transition-colors duration-300 hover:bg-brand-50 focus-visible:bg-brand-50"
          >
            {t('simulationCta')}
            <svg aria-hidden="true" viewBox="0 0 16 16" width="1em" height="1em">
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
        </div>

        {image ? (
          <div className="lg:col-span-6">
            {/* Dekoratif: görselin anlattığı şey başlıkta ve sistem listesinde yazılı. */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-card ring-1 ring-white/10 lg:aspect-[4/5]">
              <Image
                src={image.url}
                alt=""
                aria-hidden="true"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default SimulationBand
