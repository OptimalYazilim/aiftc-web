import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { AUTH_ROUTES } from '@/i18n/routes'
import { buildMetadata } from '@/lib/metadata'

/**
 * ŞİFREMİ UNUTTUM  (Kılavuz 5.5)
 * ============================================================================
 * ROTA: klasör adı `sifremi-unuttum`, `AUTH_ROUTES.forgotPassword.tr` ile
 * HARF HARF aynıdır.
 * /tr/sifremi-unuttum · /en/forgot-password · /ru/vosstanovlenie-parolya
 *
 * Giriş ve kayıt sayfalarıyla aynı gerekçelerle arama motoruna kapalıdır ve
 * sitemap'e girmez.
 *
 * Uç nokta hız sınırına tabidir (`passwordReset` sınıfı): her çağrı bir
 * e-posta gönderir, sınırsız bırakılsaydı bir kişinin gelen kutusu
 * bombalanabilirdi (bkz. lib/rateLimit.ts).
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
      title: t('forgotMetaTitle'),
      description: t('forgotIntro'),
      pathByLocale: {
        tr: AUTH_ROUTES.forgotPassword.tr,
        en: AUTH_ROUTES.forgotPassword.en,
        ru: AUTH_ROUTES.forgotPassword.ru,
      },
    }),
    robots: { index: false, follow: true },
  }
}

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('auth')

  return (
    <>
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero-compact">
          <p className="eyebrow">{t('loginEyebrow')}</p>
          <h1 className="title-record measure mt-3">{t('forgotTitle')}</h1>
          <p className="lede measure mt-4">{t('forgotIntro')}</p>
        </div>
      </section>

      <div className="container-page section-block">
        <div className="max-w-md">
          <ForgotPasswordForm locale={locale} />
        </div>
      </div>
    </>
  )
}
