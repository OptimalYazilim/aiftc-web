import React from 'react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/locales'
import { getSiteSettings } from '@/lib/queries'

import { ExternalLink } from '../ui/ExternalLink'

/**
 * PROJE GÖRÜNÜRLÜK ŞERİDİ  (Şartname 10.1 ve 10.2)
 * ============================================================================
 * "Web sayfasında kullanılacak logo, isim, proje bilgisi, ortaklık bilgisi ve
 *  görünürlük unsurları FAO, Tarım ve Orman Bakanlığı ve Orman Genel
 *  Müdürlüğü'nün ilgili görünürlük kurallarına uygun olmalıdır."
 *
 * Bu bileşen logoları KODA GÖMMEZ; hepsi CMS'ten gelir ve `order` alanıyla
 * sıralanır. Görünürlük kuralları logo sırasını belirlediği için sıralama
 * içerik yöneticisinin kontrolünde olmalıdır.
 *
 * Erişilebilirlik: logo bağlantısı varsa `alt` kurum adıdır; yoksa logo
 * dekoratiftir ve `alt=""` verilir — yanındaki metin zaten aynı bilgiyi taşır.
 * ============================================================================
 */

type PartnerLogo = {
  name?: string | null
  url?: string | null
  order?: number | null
  image?: { url?: string | null; width?: number | null; height?: number | null } | number | null
}

type ProjectLike = {
  title?: string | null
  symbol?: string | null
  externalUrl?: string | null
}

const imageOf = (value: PartnerLogo['image']) =>
  value && typeof value === 'object' && 'url' in value ? value : null

export const ProjectVisibilityStrip = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations('footer')
  const settings = await getSiteSettings(locale)

  const logos = (
    ((settings as { logos?: { partnerLogos?: PartnerLogo[] } }).logos?.partnerLogos ?? []) as
      PartnerLogo[]
  )
    .slice()
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))

  const project = (settings as { primaryProject?: ProjectLike | number | null }).primaryProject
  const projectData =
    project && typeof project === 'object' ? (project as ProjectLike) : null

  if (logos.length === 0 && !projectData) return null

  return (
    <section
      aria-labelledby="project-visibility"
      className="border-t border-white/10 bg-white/[0.03]"
    >
      <div className="container-page flex flex-col gap-6 py-7 lg:flex-row lg:items-center lg:justify-between">
        {/*
          Proje künyesi: üst etiket, başlık ve simge rozeti solda; proje
          sayfası bağlantısı düğme olarak sağda. Önceden başlık ve bağlantı
          alt alta sola sıkışıyor, sağ taraf boş kalıyordu.
        */}
        <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl">
            <h2
              id="project-visibility"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-100"
            >
              {t('projectHeading')}
            </h2>
            {projectData ? (
              <p className="mt-2 text-balance leading-relaxed text-white">
                {projectData.title}
                {projectData.symbol ? (
                  <span className="ml-2 inline-block whitespace-nowrap rounded-sm border border-white/20 px-2 py-0.5 align-middle font-mono text-xs text-brand-100">
                    {projectData.symbol}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
          {projectData?.externalUrl ? (
            <ExternalLink
              href={projectData.externalUrl}
              trackId="project:fao"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-md border border-white/30 px-4 text-sm font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:border-white/60 focus-visible:bg-white/10 sm:self-auto"
            >
              {t('projectPageLink')}
            </ExternalLink>
          ) : null}
        </div>

        {logos.length > 0 ? (
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-4">
            {logos.map((logo, index) => {
              const image = imageOf(logo.image)
              if (!image?.url) return null

              const img = (
                <Image
                  src={image.url}
                  alt={logo.url ? (logo.name ?? '') : ''}
                  width={image.width ?? 160}
                  height={image.height ?? 56}
                  className="h-12 w-auto bg-white/95 p-1"
                />
              )

              return (
                <li key={`${logo.name}-${index}`}>
                  {logo.url ? (
                    <ExternalLink
                      href={logo.url}
                      trackId={`partner:${logo.name ?? index}`}
                      hideIcon
                      className="inline-flex items-center rounded"
                    >
                      {img}
                    </ExternalLink>
                  ) : (
                    <>
                      {img}
                      <span className="sr-only">{logo.name}</span>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

export default ProjectVisibilityStrip
