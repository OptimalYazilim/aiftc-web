import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { LoginForm } from '@/components/auth/LoginForm'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { AUTH_ROUTES } from '@/i18n/routes'
import { buildMetadata } from '@/lib/metadata'

/**
 * GİRİŞ SAYFASI  (Şartname 1.7 · Kılavuz 5.2)
 * ============================================================================
 * ROTA: klasör adı `giris`, `AUTH_ROUTES.login.tr` ile HARF HARF aynıdır.
 * /tr/giris · /en/login · /ru/vhod
 *
 * ---------------------------------------------------------------------------
 * SAYFA SUNUCUDA, FORM İSTEMCİDE
 * ---------------------------------------------------------------------------
 * Başlık ve açıklama sunucuda üretilir; tarayıcıya yalnızca formun kendisi
 * JavaScript olarak iner. Formun istemci olması ZORUNLUDUR: oturum çerezi
 * (`aiftc-token`) tarayıcıya `Set-Cookie` ile gelir ve Payload'ın CSRF
 * koruması isteğin `Origin` başlığını arar — ikisini de yalnızca tarayıcının
 * kendi isteği sağlar. Gerekçe: components/auth/LoginForm.tsx
 *
 * ---------------------------------------------------------------------------
 * ARAMA MOTORUNA KAPALI
 * ---------------------------------------------------------------------------
 * `robots: { index: false }`. Giriş ekranının dizine girmesinin faydası yok;
 * kurumsal aramalarda içerik sonuçlarının önüne geçmesi zararı var. Aynı
 * gerekçeyle rota `ROUTES` yerine `AUTH_ROUTES` içindedir ve sitemap'e
 * girmez (bkz. i18n/routes.ts).
 *
 * `follow: true` bırakıldı: sayfadaki iletişim ve kayıt bağlantıları
 * taranabilir kalsın, yalnızca bu sayfa dizine girmesin.
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
      title: t('loginMetaTitle'),
      description: t('loginIntro'),
      pathByLocale: {
        tr: AUTH_ROUTES.login.tr,
        en: AUTH_ROUTES.login.en,
        ru: AUTH_ROUTES.login.ru,
      },
    }),
    robots: { index: false, follow: true },
  }
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('auth')

  return (
    <>
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero-compact">
          <p className="eyebrow">{t('loginEyebrow')}</p>
          <h1 className="title-record measure mt-3">{t('loginTitle')}</h1>
          <p className="lede measure mt-4">{t('loginIntro')}</p>
        </div>
      </section>

      <div className="container-page section-block">
        {/*
          DAR TEK SÜTUN. Form alanları sayfa genişliğine yayılsaydı göz her
          satırda soldan sağa uzun bir yol katederdi; kimlik formları dar
          okunur. `max-w-md` yaklaşık 28rem — beş alanlık bir formun rahatça
          taranabildiği genişlik.
        */}
        <div className="max-w-md">
          <LoginForm locale={locale} />
        </div>
      </div>
    </>
  )
}
