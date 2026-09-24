import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { ROUTES, detailHref } from '@/i18n/routes'
import { formatDate } from '@/lib/dates'
import { resolveMedia } from '@/lib/media'
import { buildMetadata } from '@/lib/metadata'
import { payloadClient } from '@/lib/queries'

/**
 * GALERİ — ALBÜM LİSTESİ  (Şartname 6.8)
 * ============================================================================
 * ROTA: klasör adı `galeri`, `ROUTES.gallery.tr` ile HARF HARF aynıdır.
 * /tr/galeri · /en/gallery · /ru/galereya
 *
 * `GalleryAlbums.ts` içindeki `revalidateCollection('/galeri')` de bu yolu
 * tazeler; klasör adı değişirse yayın sonrası hiçbir dil tazelenmez.
 *
 * ---------------------------------------------------------------------------
 * IZGARA, LİSTE DEĞİL — GEREKÇE
 * ---------------------------------------------------------------------------
 * Site genelinde liste sayfaları editoryal SATIR düzenindedir (kütüphane,
 * projeler, haberler). Galeri bilinçli olarak ayrışır: burada aranan şey
 * metin taramak değil, GÖRSELE bakmaktır. Izgara her albüme eşit büyüklükte
 * bir kare verir ve göz kapaklar arasında gezinir.
 *
 * KAPAK YOKSA KART BASILMAZ DEĞİL — nötr bir pano gösterilir. Kapak
 * girilmemiş bir albüm, var olmayan bir albüm değildir; editöre de eksiği
 * söyler.
 *
 * `depth: 1` ZORUNLU: `resolveMedia` derinlik 0'dan gelen sayısal id'ye null
 * döner ve her kart sessizce görselsiz kalırdı.
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

  const t = await getTranslations({ locale, namespace: 'gallery' })

  return buildMetadata({
    locale,
    title: t('metaTitle'),
    description: t('intro'),
    pathByLocale: { tr: ROUTES.gallery.tr, en: ROUTES.gallery.en, ru: ROUTES.gallery.ru },
  })
}

export default async function GalleryPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('gallery')
  const payload = await payloadClient()

  const result = await payload.find({
    collection: 'gallery-albums',
    locale,
    where: { _status: { equals: 'published' } },
    /* Koleksiyonun kendi `defaultSort: '-date'` değeri; açık yazmak niyeti belgeler. */
    sort: '-date',
    limit: 300,
    depth: 1,
    overrideAccess: false,
  })

  return (
    <>
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 className="title-page measure mt-3">{t('title')}</h1>
          <p className="lede measure mt-5">{t('intro')}</p>
        </div>
      </section>

      <section aria-labelledby="gallery-list" className="bg-surface-warm">
        <div className="container-page section-block">
          <h2 id="gallery-list" className="sr-only">
            {t('listHeading')}
          </h2>

          {result.docs.length === 0 ? (
            <p className="rounded-card border border-line bg-surface p-6 text-ink-700">
              {t('empty')}
            </p>
          ) : (
            <>
              <p className="text-sm text-ink-600">
                {t('resultsCount', { count: result.docs.length })}
              </p>

              <ul className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {result.docs.map((doc) => {
                  const link = doc.slug ? detailHref('gallery-album', locale, doc.slug) : null
                  const cover = resolveMedia(doc.coverImage, 'card')
                  const tarih = formatDate(locale, doc.date)

                  const fotograf = Array.isArray(doc.images) ? doc.images.length : 0
                  const video = Array.isArray(doc.videos) ? doc.videos.length : 0
                  const sayim =
                    fotograf > 0
                      ? t('photoCount', { count: fotograf })
                      : video > 0
                        ? t('videoCount', { count: video })
                        : null

                  return (
                    <li
                      key={String(doc.id)}
                      className={`group relative flex flex-col ${link ? 'cursor-pointer' : ''}`}
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden border border-line-soft bg-surface-alt transition-colors duration-500 group-hover:border-shell-900 group-focus-within:border-shell-900">
                        {cover ? (
                          <Image
                            src={cover.url}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04] group-focus-within:scale-[1.04]"
                          />
                        ) : (
                          /* Kapak girilmemiş: nötr pano + albüm işareti. */
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 grid place-items-center text-shell-900/25"
                          >
                            <svg
                              viewBox="0 0 64 64"
                              className="h-12 w-12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="12" y="18" width="40" height="30" rx="3" />
                              <circle cx="24" cy="29" r="4" />
                              <path d="M14 42l11-10 9 8 7-6 11 10" />
                            </svg>
                          </span>
                        )}
                      </div>

                      <p className="mt-3 flex flex-wrap items-center gap-x-2 text-xs font-semibold uppercase tracking-wider text-ink-600">
                        {tarih ? (
                          <time dateTime={doc.date ?? undefined}>{tarih}</time>
                        ) : null}
                        {tarih && sayim ? (
                          <span aria-hidden="true" className="font-normal text-line-strong">
                            |
                          </span>
                        ) : null}
                        {sayim ? <span className="text-brand-700">{sayim}</span> : null}
                      </p>

                      <h3 className="mt-1 text-lg font-bold leading-snug tracking-tight text-shell-900">
                        {link ? (
                          <Link
                            href={link}
                            className="transition-colors duration-500 after:absolute after:inset-0 after:content-[''] group-hover:text-brand-800 focus-visible:text-brand-800 group-focus-within:text-brand-800"
                          >
                            {doc.title}
                          </Link>
                        ) : (
                          doc.title
                        )}
                      </h3>

                      {doc.description ? (
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                          {doc.description}
                        </p>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      </section>
    </>
  )
}
