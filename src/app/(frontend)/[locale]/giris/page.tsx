import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { LoginForm } from '@/components/auth/LoginForm'
import { PageHero } from '@/components/ui/PageHero'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { AUTH_ROUTES } from '@/i18n/routes'
import { edevletKullanilabilir } from '@/lib/edevlet'
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

/**
 * ---------------------------------------------------------------------------
 * `searchParams` NEDEN OKUNUYOR — VE NEDEN SUNUCUDA
 * ---------------------------------------------------------------------------
 * Başarısız bir e-Devlet akışı kullanıcıyı buraya `?edevlet_hata=<kod>` ile
 * geri gönderir. Kodun okunması ZORUNLUDUR: yoksa kullanıcı hiçbir açıklama
 * görmeden giriş ekranına döner ve neyin olmadığını anlamaz.
 *
 * Okuma SUNUCUDA yapılır, istemcide `useSearchParams()` ile DEĞİL. O kanca,
 * Suspense sınırı olmadan kullanıldığında üretim derlemesini kırıyor — bu
 * projede bir kez ölçüldü ve siteyi tümden derlenemez hâle getirmişti
 * (`/[locale]/egitim-programlari`). Aynı hataya ikinci kez düşülmemesi için
 * değer burada okunup prop olarak geçiliyor.
 * ---------------------------------------------------------------------------
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

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('auth')

  const ham = (await searchParams).edevlet_hata
  const edevletHata = (Array.isArray(ham) ? ham[0] : ham) ?? null

  /*
    KARAR SUNUCUDA. `edevletKullanilabilir()` gerçek kapı ayarlarını da okur;
    o değişkenler `NEXT_PUBLIC_*` DEĞİLDİR ve istemciye gitmemelidir. Form
    yalnızca sonucu (bir boolean) alır.
  */
  const edevletAktif = edevletKullanilabilir()

  return (
    <>
      <PageHero variant="record" eyebrow={t('loginEyebrow')} title={t('loginTitle')} intro={t('loginIntro')} />

      <div className="container-page section-block">
        {/*
          DAR TEK SÜTUN. Form alanları sayfa genişliğine yayılsaydı göz her
          satırda soldan sağa uzun bir yol katederdi; kimlik formları dar
          okunur. `max-w-md` yaklaşık 28rem — beş alanlık bir formun rahatça
          taranabildiği genişlik.
        */}
        <div className="max-w-md">
          <LoginForm locale={locale} edevletAktif={edevletAktif} edevletHata={edevletHata} />
        </div>
      </div>
    </>
  )
}
