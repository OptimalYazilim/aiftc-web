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
      <div className="container-page flex flex-col gap-6 py-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 id="project-visibility" className="text-sm font-semibold uppercase tracking-wide text-brand-100">
            {t('projectHeading')}
          </h2>
          {projectData ? (
            <p className="mt-2 leading-relaxed text-white">
              {projectData.title}
              {projectData.symbol ? (
                <span className="ml-2 whitespace-nowrap text-brand-100">
                  ({projectData.symbol})
                </span>
              ) : null}
            </p>
          ) : null}
          {projectData?.externalUrl ? (
            <ExternalLink
              href={projectData.externalUrl}
              trackId="project:fao"
              className="mt-1 inline-block py-1.5 text-brand-100 underline underline-offset-4 hover:text-white focus-visible:text-white"
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
