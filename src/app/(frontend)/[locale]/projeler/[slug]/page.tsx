import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import type { Project } from '@/payload-types'

import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ExternalLink } from '@/components/ui/ExternalLink'
import { RichTextBlock, hasRichTextContent, richTextExcerpt } from '@/components/ui/RichTextBlock'
import { FOCUS_COUNTRIES } from '@/fields/options'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { DETAIL_ROUTES, detailHref, href } from '@/i18n/routes'
import { formatDate } from '@/lib/dates'
import { resolveMedia } from '@/lib/media'
import { buildMetadata } from '@/lib/metadata'
import { optionLabels } from '@/lib/optionLabel'
import { payloadClient } from '@/lib/queries'

/**
 * PROJE KÜNYE SAYFASI  (Şartname EK-1 / 10.1–10.2)
 * ============================================================================
 * ROTA: `DETAIL_ROUTES.project` — /tr/projeler/[slug] · /en/projects/[slug]
 *
 * NEDEN GEREKLİ: bu adres `sitemap.ts` içindeki `DETAIL_COLLECTIONS`
 * listesinde ZATEN yayımlanıyordu; sayfa olmadığı için arama motoruna
 * duyurulan her proje adresi 404 dönüyordu.
 *
 * KAPSAM SINIRI — DÜRÜST OLMAK GEREKİR:
 * Bu sayfa koleksiyonda GERÇEKTEN olan alanları basar (amaç, kapasite
 * katkısı, ortaklar, odak ülkeler, süre, ulusal muhatap, logolar). Proje
 * çıktıları, bütçe, faaliyet takvimi gibi şemada bulunmayan hiçbir bilgi
 * uydurulmaz.
 * ============================================================================
 */
export const revalidate = 300

type Props = { params: Promise<{ locale: Locale; slug: string }> }

type AllLocaleSlugs = { id: number; slug?: Partial<Record<Locale, string>> }

export async function generateStaticParams() {
  try {
    const payload = await payloadClient()
    const result = await payload.find({
      collection: 'projects',
      locale: 'all',
      where: { _status: { equals: 'published' } },
      limit: 1000,
      pagination: false,
      depth: 0,
      overrideAccess: false,
    })

    const params: { locale: Locale; slug: string }[] = []
    for (const doc of result.docs as unknown as AllLocaleSlugs[]) {
      for (const locale of LOCALE_CODES) {
        const slug = doc.slug?.[locale]
        if (slug) params.push({ locale, slug })
      }
    }
    return params
  } catch {
    return []
  }
}

const findBySlug = async (locale: Locale, slug: string): Promise<Project | null> => {
  const payload = await payloadClient()
  const result = await payload.find({
    collection: 'projects',
    locale,
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 2,
    overrideAccess: false,
  })
  return (result.docs[0] as Project | undefined) ?? null
}

const findInAnyLocale = async (slug: string): Promise<AllLocaleSlugs | null> => {
  const payload = await payloadClient()
  const result = await payload.find({
    collection: 'projects',
    locale: 'all',
    where: {
      _status: { equals: 'published' },
      or: LOCALE_CODES.map((locale) => ({ [`slug.${locale}`]: { equals: slug } })),
    },
    limit: 1,
    depth: 0,
    overrideAccess: false,
  })
  return (result.docs[0] as unknown as AllLocaleSlugs | undefined) ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}

  const doc = await findBySlug(locale, slug)
  if (!doc) return {}

  const alternates = await findInAnyLocale(slug)

  const pathByLocale: Partial<Record<Locale, string>> = {}
  for (const code of LOCALE_CODES) {
    const localeSlug = alternates?.slug?.[code]
    if (localeSlug) pathByLocale[code] = DETAIL_ROUTES.project[code].replace('[slug]', localeSlug)
  }

  return buildMetadata({
    locale,
    title: doc.title,
    description: richTextExcerpt(doc.objective, 155),
    pathByLocale,
  })
}

export default async function ProjectDetailPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  let doc = await findBySlug(locale, slug)

  if (!doc) {
    const anyLocale = await findInAnyLocale(slug)
    const correctSlug = anyLocale?.slug?.[locale]
    if (correctSlug && correctSlug !== slug) redirect(detailHref('project', locale, correctSlug))
    if (correctSlug) doc = await findBySlug(locale, correctSlug)
  }

  if (!doc) notFound()

  const [t, tn] = await Promise.all([getTranslations('projects'), getTranslations('nav')])

  const baslangic = formatDate(locale, doc.startDate)
  const bitis = formatDate(locale, doc.endDate)
  const donem = baslangic ? `${baslangic} – ${bitis ?? t('ongoing')}` : (bitis ?? null)
  const ulkeler = optionLabels(FOCUS_COUNTRIES, doc.focusCountries, locale)

  const ortaklar = (doc.partners ?? []).filter((partner) => Boolean(partner?.name))
  const logolar = ((doc.logos ?? []) as unknown[])
    .map((logo) => resolveMedia(logo, 'card'))
    .filter((logo): logo is NonNullable<typeof logo> => logo !== null)

  const kunye = [
    { key: 'symbol', label: t('symbolLabel'), value: doc.symbol },
    donem && { key: 'period', label: t('periodLabel'), value: donem },
    doc.nationalCounterpart && {
      key: 'counterpart',
      label: t('counterpartLabel'),
      value: doc.nationalCounterpart,
    },
    ulkeler.length > 0 && {
      key: 'countries',
      label: t('countriesLabel'),
      value: ulkeler.join(', '),
    },
  ].filter((row): row is { key: string; label: string; value: string } => Boolean(row))

  return (
    <>
      {/* --- Üst alan ---------------------------------------------------- */}
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero-compact">
          <Breadcrumbs
            label={tn('breadcrumb')}
            items={[
              { label: tn('home'), href: `/${locale}` },
              { label: t('eyebrow'), href: href('projects', locale) },
              { label: doc.title },
            ]}
          />

          <p className="eyebrow mt-6">{doc.symbol}</p>
          <h1 className="title-record measure mt-3">{doc.title}</h1>
          {donem ? <p className="mt-4 text-base text-ink-600">{donem}</p> : null}
        </div>
      </section>

      {/* --- Gövde: içerik + künye rayı ----------------------------------- */}
      <div className="container-page section-block">
        <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <article className="min-w-0">
            {hasRichTextContent(doc.objective) ? (
              <section aria-labelledby="project-objective">
                <h2 id="project-objective" className="title-section">
                  {t('objectiveHeading')}
                </h2>
                <RichTextBlock data={doc.objective} className="mt-4 max-w-prose" />
              </section>
            ) : null}

            {/*
              `hasRichTextContent` KORUMASI ZORUNLU: boş bir Lexical alanı
              `null` değil, tek boş paragraflı bir ağaçtır. Kontrol edilmezse
              başlığı olup içeriği olmayan bir bölüm basılır.
            */}
            {hasRichTextContent(doc.capacityStatement) ? (
              <section aria-labelledby="project-capacity" className="mt-12">
                <h2 id="project-capacity" className="title-section">
                  {t('capacityHeading')}
                </h2>
                <RichTextBlock data={doc.capacityStatement} className="mt-4 max-w-prose" />
              </section>
            ) : null}

            {ortaklar.length > 0 ? (
              <section aria-labelledby="project-partners" className="mt-12 border-t border-line-soft pt-6">
                <h2 id="project-partners" className="eyebrow">
                  {t('partnersHeading')}
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {ortaklar.map((partner, index) => (
                    <li
                      key={`${partner.name}-${index}`}
                      className="border border-line px-4 py-3 text-sm text-ink-700"
                    >
                      {partner.url ? (
                        <ExternalLink
                          href={partner.url}
                          trackId="project:partner"
                          className="font-medium text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700 focus-visible:decoration-brand-700"
                        >
                          {partner.name}
                        </ExternalLink>
                      ) : (
                        <span className="font-medium">{partner.name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <p className="mt-14">
              <Link
                href={href('projects', locale)}
                className="inline-flex min-h-11 items-center border border-line-strong px-5 text-sm font-semibold text-brand-800 transition-colors duration-300 hover:border-brand-700 focus-visible:border-brand-700"
              >
                ← {t('backToList')}
              </Link>
            </p>
          </article>

          {/* --- Künye rayı ------------------------------------------------ */}
          <aside aria-labelledby="project-colophon" className="lg:sticky lg:top-24 lg:self-start">
            <h2 id="project-colophon" className="eyebrow border-t-2 border-shell-900 pt-4">
              {t('listHeading')}
            </h2>

            <dl className="mt-2">
              {kunye.map((row) => (
                <div
                  key={row.key}
                  className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-4 border-t border-line-soft py-2.5"
                >
                  <dt className="text-xs font-semibold uppercase leading-5 tracking-wider text-ink-500">
                    {row.label}
                  </dt>
                  <dd className="min-w-0 text-sm leading-5 text-shell-900">{row.value}</dd>
                </div>
              ))}
            </dl>

            {doc.externalUrl ? (
              <p className="border-t border-line-soft pt-3">
                <ExternalLink
                  href={doc.externalUrl}
                  trackId="project:external"
                  className="text-sm font-semibold text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700 focus-visible:decoration-brand-700"
                >
                  {t('externalLink')}
                </ExternalLink>
              </p>
            ) : null}

            {/*
              GÖRÜNÜRLÜK LOGOLARI — Şartname 10.2 sırası editörün dizdiği
              sıradır; kod yeniden sıralamaz. `alt` boştur çünkü kurum adı
              zaten künyede ve ortaklar listesinde metin olarak vardır;
              logoyu ikinci kez okutmak ekran okuyucuda tekrar üretir.
            */}
            {logolar.length > 0 ? (
              <ul className="mt-6 flex flex-wrap items-center gap-4 border-t border-line-soft pt-5">
                {logolar.map((logo, index) => (
                  <li key={`${logo.url}-${index}`}>
                    <Image
                      src={logo.url}
                      alt={logo.alt || ''}
                      width={logo.width}
                      height={logo.height}
                      sizes="120px"
                      className="h-10 w-auto object-contain"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </aside>
        </div>
      </div>
    </>
  )
}
