import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ExternalLink } from '@/components/ui/ExternalLink'
import { RichTextBlock, hasRichTextContent } from '@/components/ui/RichTextBlock'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { ROUTES, detailHref } from '@/i18n/routes'
import { resolveMedia } from '@/lib/media'
import { buildMetadata } from '@/lib/metadata'
import { getHomepage, getSiteSettings } from '@/lib/queries'

/**
 * KURULUŞ SAYFASI  (Şartname EK-1 / Madde 6)
 * ============================================================================
 * ROTA: klasör adı `kurulus`, `ROUTES.about.tr` ile HARF HARF aynıdır.
 * /tr/kurulus · /en/about · /ru/o-tsentre
 *
 * ============================================================================
 * BU SAYFA NEDEN BU KADAR KISA — OKUYUN
 * ============================================================================
 * Site GERÇEK bir kamu kurumuna aittir. Şartname bu bölüm için tarihçe,
 * misyon, vizyon, kurumsal yapı, yönetim ve eğitmen kadrosu ister. Bu
 * bilgilerin HİÇBİRİ şu an içerik yönetim sisteminde YOKTUR:
 *
 *   - `globals/SiteSettings`  → kimlik, iletişim, logolar, görünürlük metni
 *   - `globals/Homepage`      → hero tanım cümlesi, öne çıkanlar, rakamlar
 *   - `collections/Pages`     → `pageType: 'institution'` ŞEMASI var,
 *                               kaydı YOK (timeline/people/partners blokları
 *                               tanımlı ama hiç doldurulmamış)
 *
 * Bu yüzden sayfa YALNIZCA panelde gerçekten girilmiş verileri basar. Boş
 * kalan başlıklar için örnek metin YAZILMAZ: bir kurumun tarihçesini ya da
 * misyonunu uydurmak, o kurum adına yanlış beyanda bulunmaktır. Depo bu
 * konuda zaten bir duruş almıştır — `scripts/seed.ts` hukuki sayfalar için
 * "kurumun hukuk birimi dışında kimse bu metinleri yazamaz" der ve yalnızca
 * iskelet + açık bir not bırakır. Aynı disiplin burada uygulanır.
 *
 * Sayfanın sonundaki "Hazırlanmakta olan bölümler" notu ziyaretçiye de,
 * editöre de eksiğin NE OLDUĞUNU ve NEREYE girileceğini söyler.
 *
 * ---------------------------------------------------------------------------
 * SONRAKİ ADIM (bu iş kapsamında DEĞİL)
 * ---------------------------------------------------------------------------
 * Kurum metinleri girildiğinde doğru mimari, `Pages` koleksiyonundaki
 * `institution` kayıtlarını okumaktır. Bunun için `[locale]/[slug]/page.tsx`
 * içindeki blok render'ı genişletilmelidir: o dosya şu an yalnızca `richText`
 * bloğunu basar, `statsBlock` / `peopleBlock` / `partnersBlock` /
 * `timelineBlock` SESSİZCE ATLANIR (dosyanın başındaki "KAPSAM SINIRI"
 * kutusu bunu yazıyor).
 *
 * ---------------------------------------------------------------------------
 * GLOBAL DEĞİŞİKLİĞİ ANINDA GÖRÜNMEZ
 * ---------------------------------------------------------------------------
 * SiteSettings/Homepage global'lerinin `afterChange` hook'u `revalidateTag`
 * çalıştırır; bu sayfa `payloadClient` + React `cache()` kullandığı için o
 * etiketle tazelenmez. Editörün değişikliği en geç 300 saniyede görünür.
 * Bilinerek kabul edilmiştir: kurumsal tanıtım metni saniyelik tazelik
 * gerektirmez.
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

  const t = await getTranslations({ locale, namespace: 'about' })

  return buildMetadata({
    locale,
    title: t('metaTitle'),
    description: t('intro'),
    pathByLocale: { tr: ROUTES.about.tr, en: ROUTES.about.en, ru: ROUTES.about.ru },
  })
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const [t, settings, homepage] = await Promise.all([
    getTranslations('about'),
    getSiteSettings(locale),
    getHomepage(locale),
  ])

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
  /* İlişki çözülmüşse nesnedir; derinlik yetmezse yalnızca id gelir. */
  const anaProje =
    settings?.primaryProject && typeof settings.primaryProject === 'object'
      ? (settings.primaryProject as { title?: string | null; slug?: string | null })
      : null

  return (
    <>
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 className="title-page measure mt-3">{settings?.siteName || t('title')}</h1>
          {/*
            Tanım cümlesi ana sayfanın hero alanından gelir — CMS'te kurumu
            anlatan TEK cümle odur. Girilmemişse sözlükteki genel giriş
            kullanılır; ikisi de kurum tarafından yazılmış metinlerdir,
            burada üretilen bir şey yoktur.
          */}
          <p className="lede measure mt-5">{tanim ?? t('intro')}</p>
          {settings?.tagline ? (
            <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-brand-700">
              {settings.tagline}
            </p>
          ) : null}
        </div>
      </section>

      <div className="container-page section-block">
        {/* --- Kurumsal rakamlar ----------------------------------------- */}
        {rakamlar.length > 0 ? (
          <section aria-labelledby="about-figures">
            <h2 id="about-figures" className="eyebrow border-t-2 border-shell-900 pt-4">
              {t('figuresHeading')}
            </h2>
            <dl className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {rakamlar.map((item, index) => (
                <div key={`${item.value}-${index}`} className="border-t border-line-soft pt-4">
                  <dt className="sr-only">{item.label}</dt>
                  <dd>
                    <span className="block text-4xl font-bold leading-none tracking-tight text-shell-950">
                      {item.value}
                    </span>
                    <span className="mt-2 block text-sm leading-snug text-ink-600">
                      {item.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {/* --- Öne çıkanlar ---------------------------------------------- */}
        {oneCikanlar.length > 0 ? (
          <section aria-labelledby="about-highlights" className={rakamlar.length > 0 ? 'mt-16' : ''}>
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

        {/* --- Ana proje --------------------------------------------------- */}
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

        {/* --- Görünürlük metni -------------------------------------------- */}
        {hasRichTextContent(settings?.visibilityStatement) ? (
          <section aria-labelledby="about-visibility" className="mt-16">
            <h2 id="about-visibility" className="eyebrow border-t-2 border-shell-900 pt-4">
              {t('visibilityHeading')}
            </h2>
            <RichTextBlock data={settings?.visibilityStatement} className="mt-4 max-w-prose" />
          </section>
        ) : null}

        {/* --- Kurum ve ortaklar ------------------------------------------- */}
        {ortakLogolar.length > 0 ? (
          <section aria-labelledby="about-partners" className="mt-16">
            <h2 id="about-partners" className="eyebrow border-t-2 border-shell-900 pt-4">
              {t('partnersHeading')}
            </h2>
            <ul className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-8">
              {ortakLogolar.map((entry, index) => {
                const govde = entry.image ? (
                  <>
                    {/*
                      Logo `alt=""` ile basılır ve kurum adı METİN olarak
                      yanında durur. Adı hem `alt`ta hem metinde vermek ekran
                      okuyucuda çift okuma üretir (WCAG 1.1.1).
                    */}
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

        {/* --- İletişim ---------------------------------------------------- */}
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

        {/* ================================================================
            HAZIRLANMAKTA OLAN BÖLÜMLER — DÜRÜST BOŞLUK
            ----------------------------------------------------------------
            Sarı ünlemli bir "hata" kutusu DEĞİL: eksik olan şey bir arıza
            değil, henüz yazılmamış bir kurum metnidir. Bu yüzden nötr, sakin
            bir bilgi bloğu kullanılır ve `role="status"` ile ekran okuyucuya
            da bir DURUM olarak bildirilir.
            ================================================================ */}
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
    </>
  )
}
