import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import type { Page } from '@/payload-types'

import { PageBlocks } from '@/components/pages/PageBlocks'
import { ExternalLink } from '@/components/ui/ExternalLink'
import { RichTextBlock, hasRichTextContent } from '@/components/ui/RichTextBlock'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { ROUTES, detailHref, pageHref } from '@/i18n/routes'
import { resolveMedia } from '@/lib/media'
import { buildMetadata } from '@/lib/metadata'
import { getHomepage, getSiteSettings, payloadClient } from '@/lib/queries'

/**
 * KURULUŞ SAYFASI  (Şartname EK-1 / Madde 6)
 * ============================================================================
 * ROTA: klasör adı `kurulus`, `ROUTES.about.tr` ile HARF HARF aynıdır.
 * /tr/kurulus · /en/about · /ru/o-tsentre
 *
 * ============================================================================
 * İÇERİK CMS'TEN GELİR — KOD İÇİNDE KURUMSAL METİN YOKTUR
 * ============================================================================
 * Sayfa, `pages` koleksiyonunda slug'ı bu dilin Kuruluş rotasına eşit olan
 * kaydı arar (`kurulus` / `about` / `o-tsentre`) ve o kaydın BLOKLARINI
 * basar: misyon ve vizyon metni, tarihçe zaman çizelgesi, yönetim ve eğitmen
 * kadrosu, paydaş logoları, kurumsal rakamlar.
 *
 * Bloklar `components/pages/PageBlocks` tarafından render edilir; aynı
 * bileşen `[slug]` sayfasında Kuruluş ALT sayfalarını da basar.
 *
 * ---------------------------------------------------------------------------
 * BU ROTA `[slug]` YAKALAYICISINI GÖLGELER — BİLİNÇLİ
 * ---------------------------------------------------------------------------
 * Next.js statik segmenti her zaman önce eşleştirir. Yani slug'ı `kurulus`
 * olan bir Pages kaydına `[slug]` üzerinden ULAŞILAMAZ; ona yalnızca bu dosya
 * ulaşabilir. Sayfa bu yüzden kaydı KENDİSİ çeker. Aksi hâlde editör kaydı
 * oluşturur, sitemap onu yayımlar ve adres 404 dönerdi.
 *
 * `[slug]/generateStaticParams` bu beş ayrılmış slug'ı zaten atlar.
 *
 * ---------------------------------------------------------------------------
 * KAYIT YOKKEN NE OLUR — DÜRÜST GERİ DÜŞÜŞ
 * ---------------------------------------------------------------------------
 * Koleksiyonda henüz böyle bir kayıt yoksa (ya da kaydın hiç bloğu yoksa)
 * sayfa UYDURMA metin göstermez. Panelde GERÇEKTEN girilmiş globalleri basar
 * — kurum adı, ana sayfadaki tanım cümlesi, kurumsal rakamlar, öne çıkanlar,
 * ortak logoları, görünürlük metni, iletişim — ve eksik başlıkları açıkça
 * söyleyen bir not bırakır. Bu, `scripts/seed.ts`in hukuki sayfalar için
 * kurduğu disiplinin aynısıdır: bir kurumun tarihçesini kod uydurmaz.
 *
 * CMS kaydı geldiği anda geri düşüş TAMAMEN devre dışı kalır; iki kaynak aynı
 * anda basılmaz, aksi hâlde rakamlar iki kez görünürdü.
 *
 * ---------------------------------------------------------------------------
 * GLOBAL DEĞİŞİKLİĞİ ANINDA GÖRÜNMEZ
 * ---------------------------------------------------------------------------
 * SiteSettings/Homepage global'lerinin `afterChange` kancası `revalidateTag`
 * çalıştırır; bu sayfa `payloadClient` + React `cache()` kullandığı için o
 * etiketle tazelenmez. Değişiklik en geç 300 saniyede görünür. Pages kaydı
 * ise `revalidateCollection('')` ile anında tazelenir.
 * ============================================================================
 */
export const revalidate = 300

type Props = { params: Promise<{ locale: Locale }> }

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }))
}

/** Bu dilin Kuruluş rotasına karşılık gelen sayfa slug'ı: kurulus / about / o-tsentre */
const aboutSlug = (locale: Locale): string => ROUTES.about[locale].replace(/^\//, '')

const findAboutPage = async (locale: Locale): Promise<Page | null> => {
  const payload = await payloadClient()

  const result = await payload.find({
    collection: 'pages',
    locale,
    where: { slug: { equals: aboutSlug(locale) }, _status: { equals: 'published' } },
    limit: 1,
    /* depth 2 — blok içindeki görseller, SSS ilişkileri ve logolar için. */
    depth: 2,
    overrideAccess: false,
  })

  return (result.docs[0] as Page | undefined) ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const [t, sayfa] = await Promise.all([
    getTranslations({ locale, namespace: 'about' }),
    findAboutPage(locale),
  ])

  return buildMetadata({
    locale,
    /* CMS kaydı varsa başlık ondan gelir; sözlük yalnızca yedektir. */
    title: sayfa?.title || t('metaTitle'),
    description: sayfa?.subtitle || t('intro'),
    pathByLocale: { tr: ROUTES.about.tr, en: ROUTES.about.en, ru: ROUTES.about.ru },
  })
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const [t, sayfa, payload] = await Promise.all([
    getTranslations('about'),
    findAboutPage(locale),
    payloadClient(),
  ])

  const bloklar = sayfa?.layout ?? []
  const cmsIcerikVar = bloklar.length > 0

  /*
    KURULUŞ ALT SAYFALARI.
    `pageType: 'institution'` olan yayımlanmış kayıtlar listelenir. Ana
    Kuruluş kaydı kendi listesinde görünmemelidir; slug'ıyla elenir.
    Bu liste CMS kaydı olsun olmasın gösterilir — alt sayfalar ana sayfadan
    bağımsız açılmış olabilir.
  */
  const altSayfalar = await payload.find({
    collection: 'pages',
    locale,
    where: {
      _status: { equals: 'published' },
      pageType: { equals: 'institution' },
      slug: { not_equals: aboutSlug(locale) },
    },
    sort: 'title',
    limit: 100,
    depth: 0,
    overrideAccess: false,
  })

  // --- Geri düşüş verileri: yalnızca CMS içeriği YOKKEN kullanılır --------
  const [settings, homepage] = cmsIcerikVar
    ? [null, null]
    : await Promise.all([getSiteSettings(locale), getHomepage(locale)])

  const hero = homepage?.hero
  const tanim = hero?.subheadline?.trim() || null
  const oneCikanlar = (hero?.highlights ?? []).filter((item) => Boolean(item?.title?.trim()))
  const rakamlar = (hero?.stats ?? []).filter(
    (item) => Boolean(item?.value?.trim()) && Boolean(item?.label?.trim()),
  )

  const ortakLogolar = [...(settings?.logos?.partnerLogos ?? [])]
    .sort((a, b) => (a?.order ?? 100) - (b?.order ?? 100))
    .map((entry) => ({
      name: entry?.name ?? '',
      url: entry?.url ?? null,
      image: resolveMedia(entry?.image, 'card'),
    }))
    .filter((entry) => Boolean(entry.name))

  const contact = settings?.contact
  const anaProje =
    settings?.primaryProject && typeof settings.primaryProject === 'object'
      ? (settings.primaryProject as { title?: string | null; slug?: string | null })
      : null

  const heroGorsel = resolveMedia(sayfa?.heroImage, 'hero')

  return (
    <>
      {/* --- Üst alan ---------------------------------------------------- */}
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 className="title-page measure mt-3">
            {sayfa?.title || settings?.siteName || t('title')}
          </h1>
          <p className="lede measure mt-5">{sayfa?.subtitle || tanim || t('intro')}</p>
          {!cmsIcerikVar && settings?.tagline ? (
            <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-brand-700">
              {settings.tagline}
            </p>
          ) : null}
        </div>
      </section>

      <div className="section-block">
        {heroGorsel ? (
          <div className="container-page mb-12">
            <Image
              src={heroGorsel.url}
              alt={heroGorsel.alt || ''}
              width={heroGorsel.width}
              height={heroGorsel.height}
              priority
              sizes="(min-width: 1280px) 1024px, 100vw"
              className="w-full border border-line-soft object-cover"
            />
          </div>
        ) : null}

        {cmsIcerikVar ? (
          /* ================= CMS'TEN GELEN BLOKLAR ================= */
          <PageBlocks blocks={sayfa?.layout} locale={locale} />
        ) : (
          /* ================= GERİ DÜŞÜŞ: GLOBALLER ================= */
          <div className="container-page">
            {rakamlar.length > 0 ? (
              <section aria-labelledby="about-figures">
                <h2 id="about-figures" className="eyebrow border-t-2 border-shell-900 pt-4">
                  {t('figuresHeading')}
                </h2>
                {/* Sıralama gerekçesi PageBlocks → StatsSection içinde. */}
                <dl className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                  {rakamlar.map((item, index) => (
                    <div
                      key={`${item.value}-${index}`}
                      className="flex flex-col-reverse border-t border-line-soft pt-4"
                    >
                      <dt className="mt-2 text-sm leading-snug text-ink-600">{item.label}</dt>
                      <dd className="text-4xl font-bold leading-none tracking-tight text-shell-950">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {oneCikanlar.length > 0 ? (
              <section
                aria-labelledby="about-highlights"
                className={rakamlar.length > 0 ? 'mt-16' : ''}
              >
                <h2 id="about-highlights" className="eyebrow border-t-2 border-shell-900 pt-4">
                  {t('highlightsHeading')}
                </h2>
                <ul className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-3">
                  {oneCikanlar.map((item, index) => (
                    <li key={`${item.title}-${index}`} className="border-t border-line-soft pt-4">
                      <p className="text-base font-bold text-shell-900">{item.title}</p>
                      {item.description ? (
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                          {item.description}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {anaProje?.title ? (
              <section aria-labelledby="about-project" className="mt-16">
                <h2 id="about-project" className="eyebrow border-t-2 border-shell-900 pt-4">
                  {t('projectHeading')}
                </h2>
                <p className="mt-4 text-lg font-semibold text-shell-900">
                  {anaProje.slug ? (
                    <Link
                      href={detailHref('project', locale, anaProje.slug)}
                      className="underline decoration-line-strong underline-offset-4 transition-colors duration-300 hover:decoration-brand-700"
                    >
                      {anaProje.title}
                    </Link>
                  ) : (
                    anaProje.title
                  )}
                </p>
              </section>
            ) : null}

            {hasRichTextContent(settings?.visibilityStatement) ? (
              <section aria-labelledby="about-visibility" className="mt-16">
                <h2 id="about-visibility" className="eyebrow border-t-2 border-shell-900 pt-4">
                  {t('visibilityHeading')}
                </h2>
                <RichTextBlock data={settings?.visibilityStatement} className="mt-4 max-w-prose" />
              </section>
            ) : null}

            {ortakLogolar.length > 0 ? (
              <section aria-labelledby="about-partners" className="mt-16">
                <h2 id="about-partners" className="eyebrow border-t-2 border-shell-900 pt-4">
                  {t('partnersHeading')}
                </h2>
                <ul className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-8">
                  {ortakLogolar.map((entry, index) => {
                    const govde = entry.image ? (
                      <>
                        <Image
                          src={entry.image.url}
                          alt=""
                          width={entry.image.width}
                          height={entry.image.height}
                          sizes="140px"
                          className="h-10 w-auto object-contain"
                        />
                        <span className="sr-only">{entry.name}</span>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-ink-700">{entry.name}</span>
                    )

                    return (
                      <li key={`${entry.name}-${index}`}>
                        {entry.url ? (
                          <ExternalLink
                            href={entry.url}
                            trackId="about:partner"
                            className="inline-flex min-h-11 items-center gap-2"
                          >
                            {govde}
                          </ExternalLink>
                        ) : (
                          <span className="inline-flex items-center gap-2">{govde}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : null}

            {contact?.address || contact?.email || contact?.phone ? (
              <section aria-labelledby="about-contact" className="mt-16">
                <h2 id="about-contact" className="eyebrow border-t-2 border-shell-900 pt-4">
                  {t('contactHeading')}
                </h2>
                <dl className="mt-4 max-w-prose">
                  {contact?.address ? (
                    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 border-t border-line-soft py-2.5">
                      <dt className="text-xs font-semibold uppercase leading-5 tracking-wider text-ink-500">
                        {t('addressLabel')}
                      </dt>
                      <dd className="whitespace-pre-line text-sm leading-5 text-shell-900">
                        {contact.address}
                      </dd>
                    </div>
                  ) : null}
                  {contact?.email ? (
                    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 border-t border-line-soft py-2.5">
                      <dt className="text-xs font-semibold uppercase leading-5 tracking-wider text-ink-500">
                        E-posta
                      </dt>
                      <dd className="text-sm leading-5">
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700"
                        >
                          {contact.email}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                  {contact?.phone ? (
                    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 border-t border-line-soft py-2.5">
                      <dt className="text-xs font-semibold uppercase leading-5 tracking-wider text-ink-500">
                        Telefon
                      </dt>
                      <dd className="text-sm leading-5 text-shell-900">{contact.phone}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>
            ) : null}

            {/*
              HAZIRLANMAKTA OLAN BÖLÜMLER — yalnızca CMS içeriği YOKKEN.
              Sarı ünlemli bir "hata" kutusu değil: eksik olan bir arıza değil,
              henüz yazılmamış bir kurum metnidir. `role="status"` ile ekran
              okuyucuya da DURUM olarak bildirilir.
            */}
            <section
              role="status"
              aria-labelledby="about-pending"
              className="mt-16 border border-line bg-surface-alt p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                {t('pendingBadge')}
              </p>
              <h2 id="about-pending" className="mt-2 text-base font-bold text-shell-900">
                {t('pendingHeading')}
              </h2>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-700">
                {t('pendingBody')}
              </p>
            </section>
          </div>
        )}

        {/* --- Kuruluş alt sayfaları --------------------------------------- */}
        {altSayfalar.docs.length > 0 ? (
          <section aria-labelledby="about-subpages" className="container-page mt-16">
            <h2 id="about-subpages" className="eyebrow border-t-2 border-shell-900 pt-4">
              {t('subPagesHeading')}
            </h2>
            <ul className="mt-2">
              {altSayfalar.docs.map((alt) => (
                <li key={String(alt.id)} className="border-t border-line-soft">
                  <Link
                    href={pageHref(locale, alt.slug)}
                    className="group flex min-h-14 items-center justify-between gap-4 py-3 transition-colors duration-500"
                  >
                    <span className="min-w-0">
                      <span className="block text-base font-bold leading-snug text-shell-900 transition-colors duration-500 group-hover:text-brand-800">
                        {alt.title}
                      </span>
                      {alt.subtitle ? (
                        <span className="mt-0.5 block text-sm text-ink-600">{alt.subtitle}</span>
                      ) : null}
                    </span>
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      viewBox="0 0 16 16"
                      width="1em"
                      height="1em"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-brand-800 transition-transform duration-500 ease-editorial group-hover:translate-x-1"
                    >
                      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  )
}
