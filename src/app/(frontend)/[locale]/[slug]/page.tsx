import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import type { Page } from '@/payload-types'

import { PageBlocks } from '@/components/pages/PageBlocks'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { ROUTES, pageHref } from '@/i18n/routes'
import { resolveMedia } from '@/lib/media'
import { buildMetadata } from '@/lib/metadata'
import { payloadClient } from '@/lib/queries'

/**
 * SERBEST SAYFA  (Pages koleksiyonu)
 * ============================================================================
 * `/tr/<slug>` — KVKK aydınlatma metni, gizlilik ilkeleri, erişilebilirlik
 * bildirimi gibi editörün panelden açtığı sayfalar buraya düşer.
 *
 * ROTA ÖNCELİĞİ
 * Bu dinamik segment, `egitim-programlari` / `haberler` / `iletisim` gibi
 * STATİK segmentleri gölgelemez: Next.js statik segmentleri her zaman önce
 * eşleştirir. Yalnızca hiçbir statik rotanın karşılamadığı yollar buraya gelir.
 *
 * ---------------------------------------------------------------------------
 * BLOKLARIN TAMAMI RENDER EDİLİR
 * Sayfa gövdesi `components/pages/PageBlocks` bileşenine devredilmiştir ve o
 * bileşen koleksiyondaki DOKUZ blok tipinin tamamını basar (metin, görsel,
 * sayılar, kişiler, paydaşlar, tarihçe, yönlendirme, SSS, iletişim).
 *
 * Burada bir zamanlar "KAPSAM SINIRI" başlıklı bir not vardı: sayfa yalnızca
 * `richText` bloğunu basıyor, diğer sekizi sessizce atlıyordu. Editör panelde
 * bir "Yönetim Kadrosu" bloğu kurup kaydettiğinde önizlemede hiçbir şey
 * göremiyordu. O sınır kaldırıldı.
 * ---------------------------------------------------------------------------
 *
 * Slug çözümlemesi eğitim ve haber detaylarıyla AYNI üç adımlı mantığı izler:
 * bu dilde bul → başka dilde bulup doğru adrese yönlendir → 404.
 * ============================================================================
 */
export const revalidate = 300

/**
 * STATİK BÖLÜM ADLARI — BU ROTADAN SERVİS EDİLEMEZ.
 * ---------------------------------------------------------------------------
 * Next.js statik segmenti her zaman `[slug]`ten önce eşleştirir. Slug'ı
 * `kurulus` (ya da `haberler`, `galeri` …) olan bir Pages kaydı bu rotaya HİÇ
 * ulaşmaz; onu ilgili bölüm sayfası kendisi çeker (bkz. `kurulus/page.tsx`).
 *
 * Bu yüzden o slug'lar `generateStaticParams`ten elenir. Elenmezse Next boşuna
 * bir HTML üretir; üretilen sayfa hiçbir zaman servis edilmez ama build
 * süresini uzatır ve "bu sayfa neden iki kez var?" sorusunu doğurur.
 *
 * Liste `ROUTES`tan TÜRETİLİR — elle tutulan ikinci bir kopya, yeni bir bölüm
 * eklendiğinde sessizce eskirdi.
 */
const isReservedSlug = (slug: string, locale: Locale): boolean =>
  Object.values(ROUTES).some((route) => route[locale].replace(/^\//, '') === slug && slug !== '')

type Props = { params: Promise<{ locale: Locale; slug: string }> }

type AllLocaleSlugs = { id: number; slug?: Partial<Record<Locale, string>> }

export async function generateStaticParams() {
  try {
    const payload = await payloadClient()
    const result = await payload.find({
      collection: 'pages',
      locale: 'all',
      where: { _status: { equals: 'published' } },
      limit: 500,
      pagination: false,
      depth: 0,
      overrideAccess: false,
    })

    const params: { locale: Locale; slug: string }[] = []

    for (const doc of result.docs as unknown as AllLocaleSlugs[]) {
      for (const locale of LOCALE_CODES) {
        const slug = doc.slug?.[locale]
        if (!slug) continue
        // `home` slug'ı ana sayfadır; bu rotada üretilmez.
        if (slug === 'home') continue
        // Statik bir bölümün adını taşıyan kayıt bu rotadan servis EDİLEMEZ.
        if (isReservedSlug(slug, locale)) continue
        params.push({ locale, slug })
      }
    }

    return params
  } catch {
    return []
  }
}

const findBySlug = async (locale: Locale, slug: string): Promise<Page | null> => {
  const payload = await payloadClient()

  const result = await payload.find({
    collection: 'pages',
    locale,
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    /*
      depth 2: `parent` sayfanın başlık/slug'ı, blok içindeki görseller,
      SSS ilişkileri ve ortak logoları tek sorguda gelsin. Derinlik 1'de
      blok içi ilişkiler ham id olarak döner ve bloklar boş görünür.
    */
    depth: 2,
    /*
      Erişim denetimi AÇIK. Local API'de `overrideAccess` varsayılanı
      `true`'dur; sayfanın kendi `where` koşulu zaten yalnızca yayımlanmış
      kayıtları alıyor ama kuralın koleksiyondan gelmesi esastır — bkz.
      docs/access-control-guide.md, Bölüm 9.1.
    */
    overrideAccess: false,
  })

  return (result.docs[0] as Page | undefined) ?? null
}

const findInAnyLocale = async (slug: string): Promise<AllLocaleSlugs | null> => {
  const payload = await payloadClient()

  const result = await payload.find({
    collection: 'pages',
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
    if (localeSlug) pathByLocale[code] = `/${localeSlug}`
  }

  return buildMetadata({
    locale,
    title: doc.title,
    description: doc.subtitle,
    pathByLocale,
  })
}

export default async function FreePage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  let doc = await findBySlug(locale, slug)

  if (!doc) {
    const anyLocale = await findInAnyLocale(slug)
    const correctSlug = anyLocale?.slug?.[locale]

    if (correctSlug && correctSlug !== slug) {
      redirect(pageHref(locale, correctSlug))
    }

    if (correctSlug) doc = await findBySlug(locale, correctSlug)
  }

  if (!doc) notFound()

  const tn = await getTranslations('nav')

  /*
    ÜST SAYFA KIRINTIDA GÖSTERİLİR.
    Kuruluş alt sayfaları (`pageType: 'institution'`) bir `parent` taşır;
    ziyaretçinin "Kuruluş > Tarihçe" hiyerarşisini görmesi gerekir. İlişki
    `depth: 2` ile çözülür, çözülmemişse (ham id) sessizce atlanır.
  */
  const parent =
    doc.parent && typeof doc.parent === 'object'
      ? (doc.parent as { title?: string | null; slug?: string | null })
      : null

  const cover = resolveMedia(doc.heroImage, 'hero')

  return (
    <>
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero-compact">
          <Breadcrumbs
            label={tn('breadcrumb')}
            items={[
              { label: tn('home'), href: `/${locale}` },
              ...(parent?.title && parent.slug
                ? [{ label: parent.title, href: pageHref(locale, parent.slug) }]
                : []),
              { label: doc.title },
            ]}
          />
          <h1 className="title-record measure mt-6">{doc.title}</h1>
          {doc.subtitle ? (
            <p className="lede measure mt-5">{doc.subtitle}</p>
          ) : null}
        </div>
      </section>

      <div className="section-block">
        {cover ? (
          <div className="container-page mb-12">
            <Image
              src={cover.url}
              alt={cover.alt || ''}
              width={cover.width}
              height={cover.height}
              priority
              sizes="(min-width: 1280px) 1024px, 100vw"
              className="w-full border border-line-soft object-cover"
            />
          </div>
        ) : null}

        <PageBlocks blocks={doc.layout} locale={locale} />
      </div>
    </>
  )
}
