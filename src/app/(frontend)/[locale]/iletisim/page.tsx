import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ContactForm } from '@/components/contact/ContactForm'
import { LocationMap } from '@/components/contact/LocationMap'
import { PageHero } from '@/components/ui/PageHero'
import { RichTextBlock, hasRichTextContent } from '@/components/ui/RichTextBlock'
import { isLocale, LOCALE_CODES, type Locale } from '@/i18n/locales'
import { ROUTES } from '@/i18n/routes'
import { CONTACT_FORM_TITLE } from '@/lib/contactForm'
import { resolveMedia } from '@/lib/media'
import { buildMetadata } from '@/lib/metadata'
import { getSiteSettings, payloadClient } from '@/lib/queries'

/**
 * İLETİŞİM VE KURUMSAL BİLGİ  (Şartname 6.9, 12.2, 12.3)
 * ============================================================================
 * ROTA: klasör adı `iletisim`, `ROUTES.contact.tr` ile birebir aynıdır.
 *   /tr/iletisim · /en/contact · /ru/kontakty
 *
 * İçeriğin tamamı Genel Ayarlar > İletişim'den gelir. Bu dosyada tek bir
 * adres, telefon veya e-posta SABİT YAZILMAZ — kurum bilgisi değiştiğinde
 * kod dağıtımı gerekmemelidir.
 *
 * BOŞ ALAN DAVRANIŞI
 * Panelde doldurulmamış alanlar hiç basılmaz; "—" veya boş satır gösterilmez.
 * Yarım dolu bir iletişim bloğu, eksik olduğu belli olmayan bir bloktan iyidir.
 * ============================================================================
 */
export const revalidate = 300

/**
 * SAYFA YENİDEN ISR'DİR (yukarıdaki `revalidate`).
 * Bir dönem `?tur=basvuru&egitim=<id>` okunuyor ve bu sayfa dinamik çalışıyordu;
 * eğitim başvurusu kendi sayfasına (/basvuru) taşındığı için sorgu dizesi
 * artık okunmuyor ve önbellek geri geldi.
 */
type Props = { params: Promise<{ locale: Locale }> }

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const t = await getTranslations({ locale, namespace: 'contact' })

  return buildMetadata({
    locale,
    title: t('metaTitle'),
    description: t('intro'),
    pathByLocale: { tr: ROUTES.contact.tr, en: ROUTES.contact.en, ru: ROUTES.contact.ru },
  })
}

type Contact = {
  organizationName?: string | null
  address?: string | null
  phone?: string | null
  fax?: string | null
  email?: string | null
  trainingEmail?: string | null
  map?: {
    latitude?: number | null
    longitude?: number | null
    directions?: unknown
    staticMapImage?: unknown
  } | null
  socialLinks?: { platform?: string | null; url?: string | null; id?: string | null }[] | null
}

/** Etiket + değer satırı. Değer yoksa satır hiç oluşmaz. */
const InfoRow = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <div className="border-t border-line py-4 first:border-t-0 first:pt-0">
    <dt className="text-sm text-ink-600">{label}</dt>
    <dd className="mt-1 text-ink-900">{children}</dd>
  </div>
)

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const [t, tn, settings, payload] = await Promise.all([
    getTranslations('contact'),
    getTranslations('nav'),
    getSiteSettings(locale),
    payloadClient(),
  ])

  const contact = ((settings as { contact?: Contact }).contact ?? {}) as Contact
  const siteName = (settings as { siteName?: string }).siteName ?? 'AIFTC'

  /**
   * Onay metni formun kendi kaydından gelir (payload.config.ts içinde
   * `consentText` alanı eklenmişti). Form yoksa bileşen varsayılan metne
   * düşer ve gönderim sunucuda reddedilir — sessizce veri toplanmaz.
   */
  const forms = await payload.find({
    collection: 'forms',
    locale,
    where: { title: { equals: CONTACT_FORM_TITLE } },
    limit: 1,
    depth: 0,
  })

  const consentText = (forms.docs[0] as { consentText?: string | null } | undefined)?.consentText
  const staticMap = resolveMedia(contact.map?.staticMapImage, 'hero')


  return (
    <>
      <PageHero
        breadcrumbs={{
          label: tn('breadcrumb'),
          items: [{ label: tn('home'), href: `/${locale}` }, { label: t('title') }],
        }}
        eyebrow={t('eyebrow')}
        title={t('title')}
        intro={t('intro')}
      />

      <div className="container-page section-block grid gap-12 lg:grid-cols-12">
        {/* --- Sol: kurumsal iletişim bilgileri --------------------------- */}
        <section aria-labelledby="contact-details" className="lg:col-span-5">
          <h2 id="contact-details" className="text-2xl font-semibold">
            {t('detailsHeading')}
          </h2>

          <dl className="mt-5">
            {contact.organizationName ? (
              <InfoRow label={t('organization')}>{contact.organizationName}</InfoRow>
            ) : null}

            {contact.address ? (
              <InfoRow label={t('address')}>
                {/* Adres çok satırlıdır; girilen satır sonları korunur. */}
                <span className="whitespace-pre-line">{contact.address}</span>
              </InfoRow>
            ) : null}

            {contact.phone ? (
              <InfoRow label={t('phone')}>
                <a
                  href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}
                  className="text-accent-700 underline underline-offset-4"
                >
                  {contact.phone}
                </a>
              </InfoRow>
            ) : null}

            {contact.fax ? <InfoRow label={t('fax')}>{contact.fax}</InfoRow> : null}

            {contact.email ? (
              <InfoRow label={t('email')}>
                <a
                  href={`mailto:${contact.email}`}
                  className="break-all text-accent-700 underline underline-offset-4"
                >
                  {contact.email}
                </a>
              </InfoRow>
            ) : null}

            {contact.trainingEmail ? (
              <InfoRow label={t('trainingEmail')}>
                <a
                  href={`mailto:${contact.trainingEmail}`}
                  className="break-all text-accent-700 underline underline-offset-4"
                >
                  {contact.trainingEmail}
                </a>
              </InfoRow>
            ) : null}
          </dl>

          {/*
            ULAŞIM VE YERLEŞKE
            Ulaşım tarifi editörün serbest metnidir; girilmemişse başlık ve
            boş bir alan basmak yerine yalnızca konum kartı gösterilir.
            `LocationMap` koordinat yoksa adresten bir konum kartı üretir,
            adres de yoksa hiç render edilmez — bu durumda bölüm tamamen
            atlanır ve sayfada yarım bir başlık kalmaz.
          */}
          {hasRichTextContent(contact.map?.directions) || contact.address ? (
            <div className="mt-8">
              <h3 className="text-lg font-semibold">{t('directionsHeading')}</h3>

              {hasRichTextContent(contact.map?.directions) ? (
                <RichTextBlock data={contact.map?.directions} className="mt-3" />
              ) : null}

              <div className="mt-4">
                <LocationMap
                  latitude={contact.map?.latitude}
                  longitude={contact.map?.longitude}
                  staticImage={staticMap}
                  placeName={siteName}
                  address={contact.address}
                />
              </div>
            </div>
          ) : null}
        </section>

        {/* --- Sağ: ön bilgi formu --------------------------------------- */}
        <section aria-labelledby="contact-form" className="lg:col-span-7">
          <h2 id="contact-form" className="text-2xl font-semibold">
            {t('formHeading')}
          </h2>
          <p className="mt-2 max-w-2xl text-ink-600">{t('formIntro')}</p>

          <div className="mt-6">
            <ContactForm locale={locale} consentText={consentText} />
          </div>
        </section>
      </div>
    </>
  )
}
