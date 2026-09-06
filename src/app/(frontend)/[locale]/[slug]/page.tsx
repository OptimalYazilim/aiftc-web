import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import type { Page } from '@/payload-types'

import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { RichTextBlock, hasRichTextContent } from '@/components/ui/RichTextBlock'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { pageHref } from '@/i18n/routes'
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
 * KAPSAM SINIRI — OKUYUN
 * Pages koleksiyonunun `layout` alanı birden çok blok tipi tanımlar
 * (richText, media, stats, people, partners, timeline...). Bu sayfa şu an
 * YALNIZCA `richText` bloğunu render eder; hukuki metinlerin ihtiyacı budur.
 * Diğer blok tipleri sessizce ATLANIR — sayfa çökmez, o bölüm boş kalır.
 *
 * Kurumsal tanıtım sayfaları (istatistik, ekip, ortak logoları) yayına
 * alınmadan önce bu bileşene ilgili blok render'ları eklenmelidir.
 * ---------------------------------------------------------------------------
 *
 * Slug çözümlemesi eğitim ve haber detaylarıyla AYNI üç adımlı mantığı izler:
 * bu dilde bul → başka dilde bulup doğru adrese yönlendir → 404.
 * ============================================================================
 */
export const revalidate = 300

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
        // `home` slug'ı ana sayfadır; bu rotada üretilmez.
        if (slug && slug !== 'home') params.push({ locale, slug })
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
    depth: 2,
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

/** `layout` bloklarından yalnızca metin olanlar. Bkz. kapsam sınırı notu. */
type RichTextLayoutBlock = { blockType?: string | null; content?: unknown; id?: string | null }

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

  const textBlocks = ((doc.layout ?? []) as RichTextLayoutBlock[]).filter(
    (block) => block.blockType === 'richText' && hasRichTextContent(block.content),
  )

  return (
    <>
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page py-8 lg:py-12">
          <Breadcrumbs
            label={tn('breadcrumb')}
            items={[{ label: tn('home'), href: `/${locale}` }, { label: doc.title }]}
          />
          <h1 className="mt-6 max-w-4xl text-3xl font-bold sm:text-4xl">{doc.title}</h1>
          {doc.subtitle ? (
            <p className="mt-4 max-w-3xl text-lg text-ink-600">{doc.subtitle}</p>
          ) : null}
        </div>
      </section>

      <article className="container-page py-10 lg:py-14">
        {/* Okunabilir satır genişliği — haber detayıyla aynı ölçü. */}
        <div className="max-w-prose space-y-8">
          {textBlocks.map((block, index) => (
            <RichTextBlock key={block.id ?? index} data={block.content} />
          ))}
        </div>
      </article>
    </>
  )
}
