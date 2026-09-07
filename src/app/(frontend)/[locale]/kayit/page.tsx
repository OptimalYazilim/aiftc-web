import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { RegisterForm } from '@/components/auth/RegisterForm'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { AUTH_ROUTES } from '@/i18n/routes'
import { buildMetadata } from '@/lib/metadata'

/**
 * KAYIT SAYFASI  (Şartname 1.7 · Kılavuz 5.2)
 * ============================================================================
 * ROTA: klasör adı `kayit`, `AUTH_ROUTES.register.tr` ile HARF HARF aynıdır.
 * /tr/kayit · /en/register · /ru/registratsiya
 *
 * Kayıt ucu (`POST /api/users`) anonim isteğe açıktır ama gönderilen rol ve
 * durum yok sayılır: her dış kayıt `trainee` + `pending` doğar. Gerekçe ve
 * ölçüm: components/auth/RegisterForm.tsx
 *
 * Giriş sayfasıyla aynı gerekçelerle arama motoruna kapalıdır.
 *
 * ---------------------------------------------------------------------------
 * AÇIK MADDE — SPAM KORUMASI YOK
 * ---------------------------------------------------------------------------
 * Kayıt ucunda CAPTCHA ve hız sınırlama YOKTUR. Bir bot sınırsız sayıda
 * `pending` hesap açabilir. Erişim açısından zararsızdır (hiçbiri giriş
 * yapamaz, hiçbiri rol taşımaz) ama yönetici listesini kirletir ve
 * veritabanını şişirir. Ters vekil / WAF katmanında sınırlama zorunludur —
 * bkz. docs/access-control-guide.md, Bölüm 8.
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
      title: t('registerMetaTitle'),
      description: t('registerIntro'),
      pathByLocale: {
        tr: AUTH_ROUTES.register.tr,
        en: AUTH_ROUTES.register.en,
        ru: AUTH_ROUTES.register.ru,
      },
    }),
    robots: { index: false, follow: true },
  }
}

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('auth')

  return (
    <>
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero-compact">
          <p className="eyebrow">{t('registerEyebrow')}</p>
          <h1 className="title-record measure mt-3">{t('registerTitle')}</h1>
          <p className="lede measure mt-4">{t('registerIntro')}</p>
        </div>
      </section>

      <div className="container-page section-block">
        <div className="max-w-md">
          <RegisterForm locale={locale} />
        </div>
      </div>
    </>
  )
}
