import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { RegisterForm } from '@/components/auth/RegisterForm'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { AUTH_ROUTES } from '@/i18n/routes'
import { captchaSiteAnahtari } from '@/lib/captcha'
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
 * SPAM KORUMASI — İKİ KATMAN
 * ---------------------------------------------------------------------------
 * Hız sınırlama (middleware.ts) tek bir IP'yi yavaşlatır; CAPTCHA
 * (lib/captcha.ts) dağıtık bir bot ağını durdurur. İkisi birbirinin yerine
 * geçmez. Ters vekil / WAF katmanındaki sınırlama yine de önerilir —
 * bkz. docs/access-control-guide.md, Bölüm 8.
 *
 * SİTE ANAHTARI BURADAN GEÇİRİLİR, `NEXT_PUBLIC_` KULLANILMAZ.
 * Site anahtarı gizli değildir (widget'ı çizmek için tarayıcıya zaten gider),
 * ama `NEXT_PUBLIC_` öneki eklemek ortam değişkeni adını değiştirir ve
 * değeri tüm istemci paketine gömer. Sunucu bileşeninde okunup forma özellik
 * olarak verilmesi hem adı korur hem kapsamı dar tutar.
 * ============================================================================
 */

type Props = { params: Promise<{ locale: Locale }> }

/**
 * BU SAYFA STATİK ÜRETİLEMEZ — ÖLÇÜLEBİLİR BİR DAĞITIM TUZAĞI.
 *
 * `CAPTCHA_SITE_KEY` sunucu bileşeninde okunuyor. Sayfa statik üretilseydi bu
 * değer BUILD ANINDA gömülürdü; Docker imajı anahtarsız derlenip ortam
 * değişkenleri yalnızca ÇALIŞMA ANINDA verildiğinde (bu projenin
 * docker-compose kurulumu tam olarak böyle çalışır) forma `null` giderdi.
 *
 * Sonuç sessiz değil, ama teşhisi zor bir kilit olurdu: widget hiç çizilmez,
 * jeton üretilmez, sunucu ise gizli anahtarı gördüğü için her kaydı 400 ile
 * reddeder — yani kayıt ekranı tamamen çalışmaz hâle gelir.
 *
 * Bedeli küçüktür: bu sayfa veritabanına hiç bakmayan bir formdur, önbelleğe
 * alınmasının kazancı yoktu.
 */
export const dynamic = 'force-dynamic'

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
          <RegisterForm locale={locale} captchaSiteKey={captchaSiteAnahtari()} />
        </div>
      </div>
    </>
  )
}
