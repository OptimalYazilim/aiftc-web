import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ExternalLink } from '@/components/ui/ExternalLink'
import { RichTextBlock, hasRichTextContent } from '@/components/ui/RichTextBlock'
import { FOCUS_COUNTRIES } from '@/fields/options'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { ROUTES } from '@/i18n/routes'
import { resolveMedia, unwrapRelation } from '@/lib/media'
import { buildMetadata } from '@/lib/metadata'
import { optionLabel, optionLabels } from '@/lib/optionLabel'
import { payloadClient } from '@/lib/queries'

/**
 * ULUSLARARASI KATILIMCI REHBERİ  (Şartname 8.1 – 8.3)
 * ============================================================================
 * ROTA: klasör adı `uluslararasi-katilimcilar`,
 * `ROUTES['international-guide'].tr` ile HARF HARF aynıdır.
 * /tr/uluslararasi-katilimcilar · /en/international-participants
 * /ru/mezhdunarodnym-uchastnikam
 *
 * ---------------------------------------------------------------------------
 * TEK SAYFA, ÇOK BÖLÜM — DETAY ROTASI YOKTUR
 * ---------------------------------------------------------------------------
 * `international-guide` koleksiyonunda BİR KAYIT = BİR BÖLÜMDÜR (başvuru
 * süreci, konaklama, ulaşım, vize, sertifika…). Hepsi bu tek sayfada,
 * editörün verdiği `order` sırasıyla, her biri kendi çapa bağlantısıyla
 * basılır. `DETAIL_ROUTES` içinde karşılığı bilinçli olarak YOKTUR: bir vize
 * paragrafını kendi başına bir sayfa yapmak, ziyaretçiyi rehberin bütününden
 * koparırdı.
 *
 * SSS (8.3) AYRI BİR KOLEKSİYONDUR (`faqs`) ve aynı sayfayı besler —
 * `Faqs.ts` içindeki `revalidateCollection('/uluslararasi-katilimcilar')`
 * bunu doğrular. Bu yüzden sayfa İKİ sorgu atar.
 *
 * ---------------------------------------------------------------------------
 * ÜLKE SEÇİCİ YAPILMADI
 * ---------------------------------------------------------------------------
 * `countries` alanı bir bölümü belirli ülkelere DARALTIR (örneğin vize
 * bilgisi), bir ülke filtresi kurmaz. Sayfaya ülke seçici koymak, ziyaretçiyi
 * kendi ülkesini seçmeye zorlar ve seçmeyeni bilgisiz bırakırdı. Bunun yerine
 * kapsam, bölümün başında AÇIKÇA yazılır.
 *
 * ---------------------------------------------------------------------------
 * İÇERİK HENÜZ GİRİLMEMİŞSE
 * ---------------------------------------------------------------------------
 * Koleksiyon şu an boş olabilir. Sayfa bu durumda UYDURMA bir rehber metni
 * göstermez; hukuki sayfalarda kurulan dürüst kalıbı izler ve durumu söyler.
 * ============================================================================
 */
export const revalidate = 300

type Props = { params: Promise<{ locale: Locale }> }

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const t = await getTranslations({ locale, namespace: 'guide' })

  return buildMetadata({
    locale,
    title: t('metaTitle'),
    description: t('intro'),
    pathByLocale: {
      tr: ROUTES['international-guide'].tr,
      en: ROUTES['international-guide'].en,
      ru: ROUTES['international-guide'].ru,
    },
  })
}

/** Çapa kimliği: slug varsa ondan, yoksa bölüm anahtarından üretilir. */
const anchorOf = (slug: unknown, sectionKey: unknown, index: number): string => {
  const kaynak = typeof slug === 'string' && slug ? slug : sectionKey
  return typeof kaynak === 'string' && kaynak ? `bolum-${kaynak}` : `bolum-${index + 1}`
}

export default async function InternationalGuidePage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('guide')
  const payload = await payloadClient()

  const [bolumler, sorular] = await Promise.all([
    payload.find({
      collection: 'international-guide',
      locale,
      where: { _status: { equals: 'published' } },
      sort: 'order',
      limit: 100,
      /* depth 2: bölüm görseli ve ekli belgelerin `url`/`filename` alanları. */
      depth: 2,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'faqs',
      locale,
      where: { _status: { equals: 'published' } },
      sort: 'order',
      limit: 200,
      depth: 0,
      overrideAccess: false,
    }),
  ])

  const sections = bolumler.docs

  return (
    <>
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 className="title-page measure mt-3">{t('title')}</h1>
          <p className="lede measure mt-5">{t('intro')}</p>
        </div>
      </section>

      <div className="container-page section-block">
        {sections.length === 0 ? (
          <p className="rounded-card border border-line bg-surface p-6 text-ink-700">
            {t('empty')}
          </p>
        ) : (
          <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[18rem_minmax(0,1fr)]">
            {/*
              SAYFA İÇİ GEZİNME — SOLDA, YAPIŞKAN.
              Rehber uzun bir sayfadır; ziyaretçinin aradığı bölüme kaydırmadan
              gitmesi gerekir. `<nav>` etiketlenir, çünkü sayfada birden çok
              gezinme bölgesi vardır (ana menü, kırıntı, bu liste) — WCAG 1.3.1.
            */}
            <nav
              aria-labelledby="guide-toc"
              className="order-2 lg:order-1 lg:sticky lg:top-24 lg:self-start"
            >
              <h2 id="guide-toc" className="eyebrow border-t-2 border-shell-900 pt-4">
                {t('onThisPage')}
              </h2>
              <ol className="mt-2">
                {sections.map((section, index) => (
                  <li key={String(section.id)} className="border-t border-line-soft">
                    <a
                      href={`#${anchorOf(section.slug, section.sectionKey, index)}`}
                      className="block py-2.5 text-sm text-ink-700 transition-colors duration-300 hover:text-brand-800"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
                {sorular.docs.length > 0 ? (
                  <li className="border-t border-line-soft">
                    <a
                      href="#sss"
                      className="block py-2.5 text-sm text-ink-700 transition-colors duration-300 hover:text-brand-800"
                    >
                      {t('faqHeading')}
                    </a>
                  </li>
                ) : null}
              </ol>
            </nav>

            <div className="order-1 min-w-0 lg:order-2">
              {sections.map((section, index) => {
                const anchor = anchorOf(section.slug, section.sectionKey, index)
                const image = resolveMedia(section.image, 'card')
                const ulkeler = optionLabels(FOCUS_COUNTRIES, section.countries, locale)
                const notlar = (section.countryNotes ?? []).filter((note) =>
                  hasRichTextContent(note?.note),
                )
                const links = (section.links ?? []).filter((link) => Boolean(link?.url))

                const ekler = ((section.attachments ?? []) as unknown[])
                  .map((entry) => unwrapRelation(entry))
                  .filter(
                    (file): file is Record<string, unknown> =>
                      file !== null && typeof file.url === 'string',
                  )

                return (
                  <section
                    key={String(section.id)}
                    id={anchor}
                    aria-labelledby={`${anchor}-baslik`}
                    /*
                      `scroll-mt-24`: yapışkan başlık, çapaya atlandığında
                      bölüm başlığını örtüyordu (WCAG 2.4.7 odak görünürlüğü ile
                      aynı gerekçe: hedef gerçekten görünmeli).
                    */
                    className={`scroll-mt-24 border-t border-line-soft pt-8 ${index > 0 ? 'mt-12' : ''}`}
                  >
                    <h2 id={`${anchor}-baslik`} className="title-section">
                      {section.title}
                    </h2>

                    {section.summary ? (
                      <p className="mt-3 max-w-prose text-base text-ink-700">{section.summary}</p>
                    ) : null}

                    {ulkeler.length > 0 ? (
                      <p className="mt-4 border-l-2 border-brand-700 bg-surface-alt px-4 py-2 text-sm text-ink-700">
                        <span className="font-semibold">{t('countryScope')} </span>
                        {ulkeler.join(', ')}
                      </p>
                    ) : null}

                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.alt || ''}
                        width={image.width}
                        height={image.height}
                        sizes="(min-width: 1024px) 640px, 100vw"
                        className="mt-6 w-full border border-line-soft object-cover"
                      />
                    ) : null}

                    <RichTextBlock data={section.content} className="mt-5 max-w-prose" />

                    {notlar.length > 0 ? (
                      <div className="mt-6">
                        <p className="eyebrow">{t('countryNotes')}</p>
                        <dl className="mt-3">
                          {notlar.map((note, noteIndex) => (
                            <div
                              key={`${note.country}-${noteIndex}`}
                              className="border-t border-line-soft py-3"
                            >
                              <dt className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                                {optionLabel(FOCUS_COUNTRIES, note.country, locale)}
                              </dt>
                              <dd className="mt-1">
                                <RichTextBlock data={note.note} className="max-w-prose" />
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ) : null}

                    {ekler.length > 0 ? (
                      <div className="mt-6">
                        <p className="eyebrow">{t('attachmentsHeading')}</p>
                        <ul className="mt-3 space-y-1.5">
                          {ekler.map((file, fileIndex) => (
                            <li key={`${String(file.url)}-${fileIndex}`}>
                              <a
                                href={String(file.url)}
                                className="text-sm font-medium text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700"
                              >
                                {String(file.title ?? file.filename ?? file.url)}
                                {typeof file.humanFileSize === 'string' && file.humanFileSize ? (
                                  <span className="ml-2 font-normal text-ink-500">
                                    {file.humanFileSize}
                                  </span>
                                ) : null}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {links.length > 0 ? (
                      <div className="mt-6">
                        <p className="eyebrow">{t('linksHeading')}</p>
                        <ul className="mt-3 space-y-1.5">
                          {links.map((link, linkIndex) => (
                            <li key={`${link.url}-${linkIndex}`}>
                              {link.isExternal !== false ? (
                                <ExternalLink
                                  href={link.url}
                                  trackId="guide:link"
                                  className="text-sm font-medium text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700"
                                >
                                  {link.label}
                                </ExternalLink>
                              ) : (
                                <a
                                  href={link.url}
                                  className="text-sm font-medium text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700"
                                >
                                  {link.label}
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </section>
                )
              })}

              {/* --- SSS (Şartname 8.3) ------------------------------------ */}
              {sorular.docs.length > 0 ? (
                <section
                  id="sss"
                  aria-labelledby="sss-baslik"
                  className="mt-16 scroll-mt-24 border-t border-line-soft pt-8"
                >
                  <h2 id="sss-baslik" className="title-section">
                    {t('faqHeading')}
                  </h2>

                  {/*
                    `<details>` KULLANILIR, ELLE YAZILMIŞ AKORDİYON DEĞİL.
                    Yerli öğe klavyeyle çalışır, ekran okuyucuya doğru
                    duyurulur, JavaScript kapalıyken de açılır ve tarayıcının
                    "sayfada bul" işlevi kapalı içeriği de bulur (WCAG 2.1.1,
                    4.1.2). Elle yazılan bir akordiyonda bunların hepsi yeniden
                    kurulmak zorundadır.
                  */}
                  <div className="mt-6">
                    {sorular.docs.map((faq) => (
                      <details
                        key={String(faq.id)}
                        className="group border-t border-line-soft py-1"
                      >
                        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 py-2 text-base font-semibold text-shell-900 transition-colors duration-300 hover:text-brand-800">
                          {faq.question}
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
                            className="shrink-0 transition-transform duration-300 ease-editorial group-open:rotate-45"
                          >
                            <path d="M8 3v10M3 8h10" />
                          </svg>
                        </summary>
                        <RichTextBlock data={faq.answer} className="max-w-prose pb-4" />
                      </details>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
