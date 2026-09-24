import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import type { GalleryAlbum } from '@/payload-types'

import { AlbumGallery, type AlbumGalleryLabels } from '@/components/gallery/AlbumGallery'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ExternalLink } from '@/components/ui/ExternalLink'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { DETAIL_ROUTES, detailHref, href } from '@/i18n/routes'
import { formatDate } from '@/lib/dates'
import { resolveFullImage, resolveMedia, type ResolvedImage } from '@/lib/media'
import { buildMetadata } from '@/lib/metadata'
import { payloadClient } from '@/lib/queries'

/**
 * ALBÜM SAYFASI  (Şartname 6.8)
 * ============================================================================
 * ROTA: `DETAIL_ROUTES['gallery-album']`
 *   /tr/galeri/[slug] · /en/gallery/[slug] · /ru/galereya/[slug]
 *
 * Bu adres `sitemap.ts` tarafından ZATEN yayımlanıyordu; sayfa olmadığı için
 * duyurulan her albüm adresi 404 dönüyordu.
 *
 * ---------------------------------------------------------------------------
 * İKİ ALBÜM TÜRÜ, İKİ FARKLI GÖVDE
 * ---------------------------------------------------------------------------
 * Koleksiyon `albumType`e göre iki ayrı alanı koşullu gösterir:
 *   photo / simulation / infographic → `images` (upload, hasMany)
 *   video / training-video / promo / webinar → `videos` (array)
 * Sayfa da aynı ayrımı izler. Bir albümde ikisi birden dolu olabilir (editör
 * türü sonradan değiştirmişse); o yüzden ikisi de KOŞULLU basılır, tür
 * üzerinden dallanılmaz — veri neyse o gösterilir.
 *
 * ---------------------------------------------------------------------------
 * VİDEO ADRESLERİ GÖMÜLMEZ
 * ---------------------------------------------------------------------------
 * `videos[].url` serbest metindir: site içi bir dosya da olabilir, üçüncü
 * taraf bir platform da. MIME türü bilinmediği için `<video>` etiketiyle
 * oynatmak, oynamayan siyah bir kutu üretme riski taşır. Bunun yerine her
 * kayıt afişi, adı ve süresiyle listelenir ve adrese GİDİLİR. Üçüncü taraf
 * adresleri `ExternalLink` ile açılır — ziyaretçi sitenin dışına çıktığını
 * bilir (KVKK 12.2/12.3 ve WCAG 3.2.5).
 * ============================================================================
 */
export const revalidate = 300

type Props = { params: Promise<{ locale: Locale; slug: string }> }

type AllLocaleSlugs = { id: number; slug?: Partial<Record<Locale, string>> }

export async function generateStaticParams() {
  try {
    const payload = await payloadClient()
    const result = await payload.find({
      collection: 'gallery-albums',
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

const findBySlug = async (locale: Locale, slug: string): Promise<GalleryAlbum | null> => {
  const payload = await payloadClient()
  const result = await payload.find({
    collection: 'gallery-albums',
    locale,
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 2,
    overrideAccess: false,
  })
  return (result.docs[0] as GalleryAlbum | undefined) ?? null
}

const findInAnyLocale = async (slug: string): Promise<AllLocaleSlugs | null> => {
  const payload = await payloadClient()
  const result = await payload.find({
    collection: 'gallery-albums',
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
    if (localeSlug) {
      pathByLocale[code] = DETAIL_ROUTES['gallery-album'][code].replace('[slug]', localeSlug)
    }
  }

  const cover = resolveMedia(doc.coverImage, 'og')

  return buildMetadata({
    locale,
    title: doc.title,
    description: doc.description,
    pathByLocale,
    image: cover ? { ...cover, alt: cover.alt || doc.title } : null,
  })
}

export default async function GalleryAlbumPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  let doc = await findBySlug(locale, slug)

  if (!doc) {
    const anyLocale = await findInAnyLocale(slug)
    const correctSlug = anyLocale?.slug?.[locale]
    if (correctSlug && correctSlug !== slug) {
      redirect(detailHref('gallery-album', locale, correctSlug))
    }
    if (correctSlug) doc = await findBySlug(locale, correctSlug)
  }

  if (!doc) notFound()

  /*
    LIGHTBOX ETİKETLERİ `library` SÖZLÜĞÜNDEN OKUNUR.
    Aynı bileşen, aynı sözcükler ("Önceki fotoğraf", "Görseli İndir"...).
    Bunları `gallery` sözlüğüne kopyalamak altı anahtarı üç dilde ikizler ve
    zamanla ayrışmalarına davetiye çıkarırdı.
  */
  const [t, tl, tn] = await Promise.all([
    getTranslations('gallery'),
    getTranslations('library'),
    getTranslations('nav'),
  ])

  const images: ResolvedImage[] = ((doc.images ?? []) as unknown[])
    .map((entry) => resolveFullImage(entry))
    .filter((image): image is ResolvedImage => image !== null)

  const videos = (doc.videos ?? []).filter((video) => Boolean(video?.url))
  const tarih = formatDate(locale, doc.date)

  const galleryLabels: AlbumGalleryLabels = {
    close: tl('closeDialog'),
    previous: tl('galleryPrevious'),
    next: tl('galleryNext'),
    /* Fonksiyon RSC sınırını geçemez; ham şablon gönderilir. */
    counterTemplate: tl.raw('galleryCounter') as string,
    downloadImage: tl('galleryDownloadImage'),
    thumbnailsLabel: tl('galleryThumbnails'),
    imageFallbackTemplate: t.raw('imageFallback') as string,
  }

  return (
    <>
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero-compact">
          <Breadcrumbs
            label={tn('breadcrumb')}
            items={[
              { label: tn('home'), href: `/${locale}` },
              { label: t('eyebrow'), href: href('gallery', locale) },
              { label: doc.title },
            ]}
          />

          <p className="mt-6 flex flex-wrap items-center gap-x-3 text-sm text-ink-600">
            {tarih ? <time dateTime={doc.date ?? undefined}>{tarih}</time> : null}
            {images.length > 0 ? <span>{t('photoCount', { count: images.length })}</span> : null}
            {videos.length > 0 ? <span>{t('videoCount', { count: videos.length })}</span> : null}
          </p>

          <h1 className="title-record measure mt-3">{doc.title}</h1>

          {doc.description ? (
            <p className="lede measure mt-4">{doc.description}</p>
          ) : null}
        </div>
      </section>

      <div className="container-page section-block">
        {images.length === 0 && videos.length === 0 ? (
          <p className="rounded-card border border-line bg-surface p-6 text-ink-700">
            {t('emptyAlbum')}
          </p>
        ) : null}

        {images.length > 0 ? <AlbumGallery images={images} title={doc.title} labels={galleryLabels} /> : null}

        {videos.length > 0 ? (
          <section aria-labelledby="album-videos" className={images.length > 0 ? 'mt-14' : ''}>
            <h2 id="album-videos" className="eyebrow border-t-2 border-shell-900 pt-4">
              {t('videoCount', { count: videos.length })}
            </h2>

            <ul className="mt-2">
              {videos.map((video, index) => {
                const poster = resolveMedia(video.poster, 'card')
                const sure =
                  typeof video.durationSeconds === 'number' && video.durationSeconds > 0
                    ? t('durationMinutes', { count: Math.max(1, Math.round(video.durationSeconds / 60)) })
                    : null
                const disAdres = /^https?:\/\//i.test(video.url ?? '')

                return (
                  <li
                    key={`${video.url}-${index}`}
                    className="flex flex-col gap-4 border-t border-line-soft py-5 sm:flex-row sm:items-center"
                  >
                    {poster ? (
                      <Image
                        src={poster.url}
                        alt=""
                        width={poster.width}
                        height={poster.height}
                        sizes="160px"
                        className="aspect-video w-full shrink-0 border border-line-soft object-cover sm:w-40"
                      />
                    ) : null}

                    <div className="min-w-0">
                      <p className="text-base font-semibold text-shell-900">
                        {disAdres ? (
                          <ExternalLink
                            href={video.url}
                            trackId="gallery:video"
                            className="underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700 focus-visible:decoration-brand-700"
                          >
                            {video.title}
                          </ExternalLink>
                        ) : (
                          <a
                            href={video.url}
                            className="underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700 focus-visible:decoration-brand-700"
                          >
                            {video.title}
                          </a>
                        )}
                      </p>
                      {sure ? <p className="mt-1 text-xs text-ink-500">{sure}</p> : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}

        <p className="mt-14">
          <Link
            href={href('gallery', locale)}
            className="inline-flex min-h-11 items-center border border-line-strong px-5 text-sm font-semibold text-brand-800 transition-colors duration-300 hover:border-brand-700 focus-visible:border-brand-700"
          >
            ← {t('backToList')}
          </Link>
        </p>
      </div>
    </>
  )
}
