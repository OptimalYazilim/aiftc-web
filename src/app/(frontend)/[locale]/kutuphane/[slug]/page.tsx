import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import type { LibraryResource } from '@/payload-types'

import {
  LibraryDetailActions,
  type LibraryActionLabels,
} from '@/components/library/LibraryDetailActions'
import { formatOf } from '@/components/library/LibraryResourceCard'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import {
  FOCUS_COUNTRIES,
  INSTRUCTION_LANGUAGES,
  LIBRARY_ALBUM_TYPE,
  LIBRARY_FILE_FORMATS,
  LIBRARY_RESOURCE_TYPES,
  LIBRARY_VIDEO_TYPE,
  LICENSE_TYPES,
} from '@/fields/options'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { DETAIL_ROUTES, detailHref, href } from '@/i18n/routes'
import {
  resolveAttachment,
  resolveFullImage,
  resolveMedia,
  resolveVideo,
  type ResolvedImage,
} from '@/lib/media'
import { buildMetadata } from '@/lib/metadata'
import { optionLabel, optionLabels } from '@/lib/optionLabel'
import { payloadClient } from '@/lib/queries'

/**
 * KÜTÜPHANE KÜNYE (DETAY) SAYFASI  (Şartname EK-2 Madde 1.5)
 * ============================================================================
 * ROTA: `DETAIL_ROUTES['library-resource']`
 *   /tr/kutuphane/[slug] · /en/library/[slug] · /ru/biblioteka/[slug]
 *
 * ---------------------------------------------------------------------------
 * NEDEN VAR — LİSTE KARTI BİR KÜNYE TAŞIYAMAZ
 * ---------------------------------------------------------------------------
 * EK-2 Madde 1.2'nin saydığı alanlar (kurum, ülke, dil, sürüm, lisans, telif,
 * DOI/ISBN/ISSN, anahtar kelimeler, eğitim ve proje bağlantıları) bir liste
 * kartına sığmaz; sığdırılmaya çalışılsaydı kart okunmaz olurdu. Bu yüzden
 * kart artık dosyayı DOĞRUDAN İNDİRMEZ, buraya getirir: ziyaretçi neyi
 * indirdiğini — hangi kurumun, hangi dilde, hangi lisansla yayımladığını —
 * indirmeden ÖNCE görür.
 *
 * Sayaç da bu yüzden buraya taşındı (bkz. components/library/
 * LibraryDetailActions): sayı artık "listeyi kim gördü"yü değil "kim
 * indirdi/izledi"yi ölçer.
 *
 * ---------------------------------------------------------------------------
 * ERİŞİM DENETİMİ — `overrideAccess: false` ZORUNLUDUR
 * ---------------------------------------------------------------------------
 * Local API'de `overrideAccess` VARSAYILAN OLARAK `true`'dur; bu satır
 * olmadan koleksiyonun `read` kuralı (access/index.ts → `libraryReadAccess`)
 * HİÇ ÇALIŞMAZ ve `accessLevel` alanı bir etikete dönüşür. Liste sayfasında
 * bu satır eksikti ve `trainee` seviyeli bir kayıt anonim ziyaretçiye
 * görünüyordu; ölçülüp düzeltildi (bkz. kutuphane/page.tsx).
 *
 * Kısıtlı bir kayıt anonim ziyaretçiye 404 döner — "yetkiniz yok" DEMEZ.
 * Var olduğunu söylemek, başlığını sızdırmaktır.
 *
 * SINIR: bu kural KAYDI korur, ekli dosyanın doğrudan adresini korumaz
 * (bkz. docs/access-control-guide.md).
 *
 * ---------------------------------------------------------------------------
 * SLUG ÇÖZÜMLEMESİ — haber/eğitim detayıyla AYNI üç adım
 * ---------------------------------------------------------------------------
 *   1. Slug bu dilde bulundu   → sayfa basılır.
 *   2. Slug başka bir dile ait → bu dildeki doğru adrese YÖNLENDİRİLİR,
 *      404 verilmez; paylaşılan karışık bağlantılar çalışır.
 *   3. Hiçbir dilde yok        → 404.
 *
 * ---------------------------------------------------------------------------
 * YÜKLEYEN KULLANICI BİLEREK GÖSTERİLMEZ
 * ---------------------------------------------------------------------------
 * `uploadedBy` künyede vardır ve panelde görünür, ama bu SAYFAYA BASILMAZ.
 * Bir personelin adının, herkese açık bir sayfada yayın yayın dolaşması
 * kurumsal bir gereklilik değildir ve KVKK açısından ayrı bir gerekçe ister.
 * Alan iç izlenebilirlik içindir; kamuya açık künye kurumu (`institution`)
 * gösterir.
 * ============================================================================
 */
export const revalidate = 300

type Props = { params: Promise<{ locale: Locale; slug: string }> }

type AllLocaleSlugs = { id: number; slug?: Partial<Record<Locale, string>> }

export async function generateStaticParams() {
  try {
    const payload = await payloadClient()
    const result = await payload.find({
      collection: 'library-resources',
      locale: 'all',
      where: { _status: { equals: 'published' } },
      limit: 1000,
      pagination: false,
      depth: 0,
      /*
        Erişim denetimi burada da açıktır: yalnızca herkese açık kayıtlar
        ÖNCEDEN üretilir. Kısıtlı kayıtlar istek anında değerlendirilir ve
        yetkisiz ziyaretçiye 404 döner — üretilmiş bir HTML olarak CDN'de
        beklemezler.
      */
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
    // Veritabanı build anında erişilemezse sayfalar istek anında üretilir.
    return []
  }
}

const findBySlug = async (locale: Locale, slug: string): Promise<LibraryResource | null> => {
  const payload = await payloadClient()

  const result = await payload.find({
    collection: 'library-resources',
    locale,
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    /*
      depth 2: dosya → url/mimeType/boyut, kapak → türevler, ilişkili eğitim
      ve projelerin `title`/`slug` alanları tek sorguda gelsin.
    */
    depth: 2,
    overrideAccess: false,
  })

  return (result.docs[0] as LibraryResource | undefined) ?? null
}

const findInAnyLocale = async (slug: string): Promise<AllLocaleSlugs | null> => {
  const payload = await payloadClient()

  const result = await payload.find({
    collection: 'library-resources',
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

  /** Çevirisi girilmemiş bir dil hreflang listesine HİÇ girmez. */
  const pathByLocale: Partial<Record<Locale, string>> = {}
  for (const code of LOCALE_CODES) {
    const localeSlug = alternates?.slug?.[code]
    if (localeSlug) {
      pathByLocale[code] = DETAIL_ROUTES['library-resource'][code].replace('[slug]', localeSlug)
    }
  }

  const cover = resolveMedia(doc.coverImage, 'og')

  return buildMetadata({
    locale,
    title: doc.title,
    description: doc.description,
    pathByLocale,
    type: 'article',
    image: cover ? { ...cover, alt: cover.alt || doc.title } : null,
  })
}

/** Künye satırı: etiket + değer. Değeri boş olan satır HİÇ BASILMAZ. */
type ColophonRow = { label: string; value: string }

/** İlişki alanı çözülmüş bir nesne mi, yoksa yalnızca id mi? */
type LinkedDoc = { id: string | number; title?: string | null; slug?: string | null }

const linkedOf = (value: unknown): LinkedDoc | null =>
  value && typeof value === 'object' && 'id' in value ? (value as LinkedDoc) : null

export default async function LibraryDetailPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  let doc = await findBySlug(locale, slug)

  if (!doc) {
    const anyLocale = await findInAnyLocale(slug)
    const correctSlug = anyLocale?.slug?.[locale]

    if (correctSlug && correctSlug !== slug) {
      redirect(detailHref('library-resource', locale, correctSlug))
    }

    if (correctSlug) doc = await findBySlug(locale, correctSlug)
  }

  if (!doc) notFound()

  const [t, tn] = await Promise.all([getTranslations('library'), getTranslations('nav')])

  // --- Medya ---------------------------------------------------------------
  const isVideo = doc.resourceType === LIBRARY_VIDEO_TYPE
  const isAlbum = doc.resourceType === LIBRARY_ALBUM_TYPE

  const gallery: ResolvedImage[] = isAlbum
    ? ((doc.gallery ?? []) as unknown[])
        .map((entry) => resolveFullImage(entry))
        .filter((image): image is ResolvedImage => image !== null)
    : []

  const video = isVideo ? resolveVideo(doc.videoFile) : null
  const attachment = resolveAttachment(doc.file)
  const explicitCover = resolveMedia(doc.coverImage, 'hero')
  /* Albümde kapak verilmemişse albümün ilk karesi kullanılır (kartla aynı kural). */
  const cover = explicitCover ?? (isAlbum ? (gallery[0] ?? null) : null)

  /*
    BİÇİM VE BOYUT — önce gerçek dosyadan, sonra künyeden.
    Dosya varsa ölçülmüş değer kazanır; dış bağlantılı kayıtlarda tek kaynak
    editörün girdiği künye alanlarıdır (bkz. collections/LibraryResources.ts).
  */
  const format =
    formatOf(attachment) ??
    (doc.fileFormat ? optionLabel(LIBRARY_FILE_FORMATS, doc.fileFormat, locale) : null)
  const size = attachment?.humanFileSize?.trim() || doc.fileSize?.trim() || null

  const resourceTypeLabel = optionLabel(LIBRARY_RESOURCE_TYPES, doc.resourceType, locale)
  const downloads = Number(doc.downloads) || 0

  // --- Künye satırları -----------------------------------------------------
  const languages = optionLabels(INSTRUCTION_LANGUAGES, doc.language, locale)
  const countries = optionLabels(FOCUS_COUNTRIES, doc.countries, locale)

  const rows: ColophonRow[] = (
    [
      { label: t('fieldType'), value: resourceTypeLabel },
      { label: t('fieldYear'), value: doc.publicationYear ? String(doc.publicationYear) : null },
      { label: t('fieldInstitution'), value: doc.institution },
      { label: t('fieldAuthor'), value: doc.author },
      { label: t('fieldLanguage'), value: languages.length > 0 ? languages.join(', ') : null },
      { label: t('fieldCountries'), value: countries.length > 0 ? countries.join(', ') : null },
      { label: t('fieldVersion'), value: doc.version },
      { label: t('fieldFormat'), value: [format, size].filter(Boolean).join(' · ') || null },
      {
        label: t('fieldDuration'),
        value: isVideo ? (doc.videoDuration?.trim() || video?.humanSize || null) : null,
      },
      {
        label: t('fieldPhotoCount'),
        value: isAlbum && gallery.length > 0 ? t('photoCount', { count: gallery.length }) : null,
      },
      { label: t('fieldLicense'), value: optionLabel(LICENSE_TYPES, doc.license, locale) },
      { label: t('fieldCopyright'), value: doc.copyrightHolder },
      { label: t('fieldIdentifier'), value: doc.identifier },
      {
        /* Sıfırken basılmaz: "0 indirme" yeni bir yayını ilgisiz gösterir. */
        label: t('fieldDownloads'),
        value: downloads > 0 ? t('downloadsBadge', { count: downloads }) : null,
      },
    ] as { label: string; value: string | null | undefined }[]
  ).filter((row): row is ColophonRow => Boolean(row.value))

  // --- İlişkiler -----------------------------------------------------------
  const topics = ((doc.topics ?? []) as unknown[]).map(linkedOf).filter(Boolean) as LinkedDoc[]
  const trainings = ((doc.relatedTrainings ?? []) as unknown[])
    .map(linkedOf)
    .filter(Boolean) as LinkedDoc[]
  const projects = ((doc.relatedProjects ?? []) as unknown[])
    .map(linkedOf)
    .filter(Boolean) as LinkedDoc[]

  const keywords = (doc.keywords ?? []).filter((word): word is string => Boolean(word?.trim()))

  const actionLabels: LibraryActionLabels = {
    download: t('download'),
    watch: t('watch'),
    openAlbum: t('openAlbumWithCount', { count: gallery.length }),
    openExternal: t('openExternal'),
    unavailable: t('fileUnavailable'),
    closeDialog: t('closeDialog'),
    downloadVideo: t('downloadVideo'),
    videoUnsupported: t('videoUnsupported'),
    captionsLabel: t('captionsLabel'),
    formatLabel: t('formatLabel'),
    galleryPrevious: t('galleryPrevious'),
    galleryNext: t('galleryNext'),
    /* Ham şablon; yer tutucuları istemci doldurur (fonksiyon RSC sınırını geçemez). */
    galleryCounterTemplate: t.raw('galleryCounter') as string,
    galleryDownloadImage: t('galleryDownloadImage'),
    galleryThumbnails: t('galleryThumbnails'),
  }

  return (
    <>
      {/* --- Üst alan ---------------------------------------------------- */}
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero-compact">
          <Breadcrumbs
            label={tn('breadcrumb')}
            items={[
              { label: tn('home'), href: `/${locale}` },
              { label: t('title'), href: href('library', locale) },
              { label: doc.title },
            ]}
          />

          {resourceTypeLabel ? <p className="eyebrow mt-6">{resourceTypeLabel}</p> : null}

          <h1 className="title-record measure mt-3">{doc.title}</h1>

          {doc.institution || doc.author ? (
            <p className="mt-4 text-base text-ink-600">
              {[doc.institution, doc.author].filter(Boolean).join(' · ')}
            </p>
          ) : null}
        </div>
      </section>

      {/* --- Gövde: sol içerik + sağ künye rayı --------------------------- */}
      <div className="container-page section-block">
        <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* ============ SOL ============ */}
          <article className="min-w-0">
            {cover ? (
              /*
                KAPAK — KESKİN HATLAR, GÖLGESİZ.
                Editoryal çizgide görsel bir "kart" değil, sayfanın parçasıdır:
                yuvarlatma yok, gölge yok, yalnızca ince bir çerçeve çizgisi.
              */
              <Image
                src={cover.url}
                alt={cover.alt || ''}
                width={cover.width}
                height={cover.height}
                priority
                sizes="(min-width: 1024px) 720px, 100vw"
                className="w-full border border-line-soft object-cover"
              />
            ) : null}

            {doc.description ? (
              <p className={`max-w-prose text-lg leading-relaxed text-ink-700 ${cover ? 'mt-10' : ''}`}>
                {doc.description}
              </p>
            ) : null}

            {/* --- Birincil aksiyon --------------------------------------- */}
            <div className="mt-8">
              <LibraryDetailActions
                id={doc.id}
                title={doc.title}
                format={format}
                video={video}
                gallery={gallery}
                poster={cover?.url ?? null}
                fileHref={attachment?.url ?? null}
                externalHref={doc.externalUrl}
                allowVideoDownload={doc.allowVideoDownload !== false}
                captionsUrl={doc.captionsUrl}
                captionsLang={locale}
                labels={actionLabels}
              />
            </div>

            {/* --- Anahtar kelimeler -------------------------------------- */}
            {keywords.length > 0 ? (
              <section aria-labelledby="library-keywords" className="mt-12 border-t border-line-soft pt-6">
                <h2 id="library-keywords" className="eyebrow">
                  {t('keywordsHeading')}
                </h2>
                <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-2">
                  {keywords.map((word) => (
                    <li
                      key={word}
                      className="border border-line px-3 py-1 text-sm text-ink-700"
                    >
                      {word}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* --- İlişkiler ---------------------------------------------- */}
            {topics.length > 0 || trainings.length > 0 || projects.length > 0 ? (
              <section aria-labelledby="library-links" className="mt-10 border-t border-line-soft pt-6">
                <h2 id="library-links" className="sr-only">
                  {t('relatedHeading')}
                </h2>

                <div className="grid gap-8 sm:grid-cols-2">
                  {topics.length > 0 ? (
                    <div>
                      <p className="eyebrow">{t('topicsHeading')}</p>
                      <ul className="mt-3 space-y-1.5">
                        {topics.map((topic) => (
                          <li key={String(topic.id)}>
                            {topic.slug ? (
                              <Link
                                href={detailHref('training-topic', locale, topic.slug)}
                                className="text-sm font-medium text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700"
                              >
                                {topic.title}
                              </Link>
                            ) : (
                              <span className="text-sm text-ink-700">{topic.title}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {trainings.length > 0 ? (
                    <div>
                      <p className="eyebrow">{t('relatedTrainingsHeading')}</p>
                      <ul className="mt-3 space-y-1.5">
                        {trainings.map((item) => (
                          <li key={String(item.id)}>
                            {item.slug ? (
                              <Link
                                href={detailHref('training-program', locale, item.slug)}
                                className="text-sm font-medium text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700"
                              >
                                {item.title}
                              </Link>
                            ) : (
                              <span className="text-sm text-ink-700">{item.title}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {projects.length > 0 ? (
                    <div>
                      <p className="eyebrow">{t('relatedProjectsHeading')}</p>
                      <ul className="mt-3 space-y-1.5">
                        {projects.map((item) => (
                          <li key={String(item.id)}>
                            {item.slug ? (
                              <Link
                                href={detailHref('project', locale, item.slug)}
                                className="text-sm font-medium text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700"
                              >
                                {item.title}
                              </Link>
                            ) : (
                              <span className="text-sm text-ink-700">{item.title}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            <p className="mt-14">
              <Link
                href={href('library', locale)}
                className="inline-flex min-h-11 items-center border border-line-strong px-5 text-sm font-semibold text-brand-800 transition-colors duration-300 hover:border-brand-700"
              >
                ← {t('backToLibrary')}
              </Link>
            </p>
          </article>

          {/* ============ SAĞ: KÜNYE ============ */}
          {/*
            DERGİ KÜNYESİ — kutu değil, RAY.
            Çerçeveli bir kart, sayfaya ikinci bir "yüzey" katmanı ekler ve
            editoryal çizgiyi bozar. Bunun yerine tek bir üst çizgi ve satır
            aralarında saç teli ayraçlar kullanılır; blok sayfanın kendi
            zemininde durur.

            `<dl>` seçildi çünkü bunlar gerçekten etiket–değer çiftleridir;
            ekran okuyucu "Lisans: CC BY 4.0" diye okur, iki ayrı metin
            parçası olarak değil.
          */}
          <aside aria-labelledby="library-colophon" className="lg:sticky lg:top-24 lg:self-start">
            <h2 id="library-colophon" className="eyebrow border-t-2 border-shell-900 pt-4">
              {t('colophon')}
            </h2>

            <dl className="mt-2">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-4 border-t border-line-soft py-2.5"
                >
                  <dt className="text-xs font-semibold uppercase leading-5 tracking-wider text-ink-500">
                    {row.label}
                  </dt>
                  <dd className="min-w-0 text-sm leading-5 text-shell-900">{row.value}</dd>
                </div>
              ))}
            </dl>

            {/*
              Dış bağlantı künyede de görünür: ziyaretçi yayının aslında nerede
              durduğunu, düğmeye basmadan önce bilebilmelidir. Adres kısaltılmaz
              — hangi kuruma gideceği görünsün diye alan adı olduğu gibi yazılır.
            */}
            {doc.externalUrl ? (
              <p className="border-t border-line-soft pt-3 text-xs leading-5 text-ink-500">
                <span className="font-semibold uppercase tracking-wider">{t('fieldSource')}</span>
                <br />
                <span className="break-all">{doc.externalUrl}</span>
              </p>
            ) : null}
          </aside>
        </div>
      </div>
    </>
  )
}
