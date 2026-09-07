import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { AUTH_ROUTES } from '@/i18n/routes'
import { buildMetadata } from '@/lib/metadata'

/**
 * YENİ PAROLA BELİRLE  (Kılavuz 5.5)
 * ============================================================================
 * ROTA: klasör adı `sifre-sifirla`, `AUTH_ROUTES.resetPassword.tr` ile HARF
 * HARF aynıdır.
 * /tr/sifre-sifirla · /en/reset-password · /ru/sbros-parolya
 *
 * E-postadaki bağlantı buraya gelir: `?token=…`
 *
 * ---------------------------------------------------------------------------
 * JETON SUNUCUDA OKUNMAZ
 * ---------------------------------------------------------------------------
 * Sayfa `searchParams`ı HİÇ istemez. Jetonu sunucuda okuyup prop olarak
 * geçirmek, onu RSC yüküne gömer ve sunucu günlüklerine düşme olasılığını
 * artırırdı. Jeton yalnızca tarayıcıda, adres çubuğundan okunur.
 *
 * `robots: noindex` de aynı gerekçenin parçasıdır.
 * ============================================================================
 */

type Props = { params: Promise<{ locale: Locale }> }

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const t = await getTranslations({ locale, namespace: 'auth' })

  return {
    ...buildMetadata({
      locale,
      title: t('resetMetaTitle'),
      description: t('resetIntro'),
      pathByLocale: {
        tr: AUTH_ROUTES.resetPassword.tr,
        en: AUTH_ROUTES.resetPassword.en,
        ru: AUTH_ROUTES.resetPassword.ru,
      },
    }),
    robots: { index: false, follow: false },
  }
}

export default async function ResetPasswordPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('auth')

  return (
    <>
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero-compact">
          <p className="eyebrow">{t('loginEyebrow')}</p>
          <h1 className="title-record measure mt-3">{t('resetTitle')}</h1>
          <p className="lede measure mt-4">{t('resetIntro')}</p>
        </div>
      </section>

      <div className="container-page section-block">
        <div className="max-w-md">
          <ResetPasswordForm locale={locale} />
        </div>
      </div>
    </>
  )
}
