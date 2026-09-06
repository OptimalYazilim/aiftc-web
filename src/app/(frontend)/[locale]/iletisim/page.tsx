import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ContactForm } from '@/components/contact/ContactForm'
import { LocationMap } from '@/components/contact/LocationMap'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
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
 * `searchParams` OKUNDUĞU İÇİN SAYFA DİNAMİKTİR.
 * Eğitim detayındaki "Bilgi/başvuru talebi" bağlantısı buraya
 * `?tur=basvuru&egitim=<id>` ile gelir ve form ön seçili açılır.
 * Yukarıdaki `revalidate` bu yüzden artık ISR uygulamaz; form sayfasında
 * istek anında çizim doğru davranıştır — sabit tutulup sorgu yok sayılsaydı
 * ziyaretçi başvurmak istediği eğitimi elle aramak zorunda kalırdı.
 */
type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

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

export default async function ContactPage({ params, searchParams }: Props) {
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

  /*
    --- Başvuru akışı --------------------------------------------------------
    Şartname EK-1 gereği eğitim DETAY sayfası başvuru formu barındırmaz; kişisel
    veri yalnızca bu sayfada, açık rıza metniyle birlikte toplanır. Eğitim
    sayfasındaki buton buraya yönlendirir ve hangi programdan gelindiğini
    sorgu dizesiyle taşır.

    Liste yalnızca YAYINDAKİ eğitimlerden kurulur; başlık ve id dışında alan
    çekilmez (`select`) — form sayfasına eğitim kayıtlarının tamamını
    taşımanın anlamı yok.
  */
  const query = await searchParams
  const readParam = (key: string) => {
    const value = query[key]
    return Array.isArray(value) ? value[0] : value
  }

  const defaultType = readParam('tur') === 'basvuru' ? 'training-application' : undefined
  const rawTraining = readParam('egitim')
  const defaultTrainingId = rawTraining && /^\d+$/.test(rawTraining) ? Number(rawTraining) : null

  const trainingResult = await payload.find({
    collection: 'training-programs',
    locale,
    where: { _status: { equals: 'published' } },
    limit: 100,
    depth: 0,
    sort: '-startDate',
    select: { title: true } as never,
  })

  const trainings = (trainingResult.docs as unknown as { id: number; title?: string | null }[])
    .filter((doc): doc is { id: number; title: string } => Boolean(doc.title))
    .map((doc) => ({ id: doc.id, title: doc.title }))

  return (
    <>
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero">
          <Breadcrumbs
            label={tn('breadcrumb')}
            items={[{ label: tn('home'), href: `/${locale}` }, { label: t('title') }]}
          />
          <p className="eyebrow mt-6">{t('eyebrow')}</p>
          <h1 className="title-page measure mt-3">{t('title')}</h1>
          <p className="lede measure mt-5">{t('intro')}</p>
        </div>
      </section>

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
            <ContactForm
              locale={locale}
              consentText={consentText}
              trainings={trainings}
              defaultType={defaultType}
              defaultTrainingId={defaultTrainingId}
            />
          </div>
        </section>
      </div>
    </>
  )
}
