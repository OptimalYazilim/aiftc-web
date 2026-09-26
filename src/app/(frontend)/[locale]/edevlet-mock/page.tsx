import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { EdevletMockForm } from '@/components/auth/EdevletMockForm'
import { isLocale, type Locale } from '@/i18n/locales'
import { mockModuAktif } from '@/lib/edevlet'

/**
 * e-DEVLET KUM HAVUZU EKRANI  (yalnızca yerel geliştirme)
 * ============================================================================
 * Gerçek e-Devlet Kapısı, kayıtlı ve HTTPS bir dönüş adresi ister; `localhost`
 * böyle bir adres değildir ve entegrasyon yerelde çalıştırılamaz. Akışın geri
 * kalanını (dönüş ucu, hesap eşleştirme, oturum açma) yine de geliştirip
 * sınayabilmek için, kapının yerini bu ekran alır.
 *
 * ============================================================================
 * BU EKRAN RESMÎ BİR DEVLET EKRANINI TAKLİT ETMEZ — BİLİNÇLİ
 * ============================================================================
 * Ne amblem, ne resmî renk, ne "e-Devlet Kapısı" başlığı kullanılır. Sayfanın
 * en üstünde ne olduğunu açıkça söyleyen bir uyarı şeridi durur.
 *
 * Gerekçe iki katlı:
 *   1. Kamu kimlik sisteminin görünümünü kopyalayan bir ekran, ekran
 *      görüntüsü alındığında ya da yanlışlıkla erişilebilir kaldığında
 *      KİMLİK AVI MALZEMESİDİR. Kurumun kendi deposunda böyle bir şablon
 *      bulunmamalıdır.
 *   2. Geliştiricinin sahte ile gerçeği karıştırmaması gerekir; ayırt edici
 *      olması bir kusur değil, gereklilik.
 *
 * ============================================================================
 * ÜRETİMDE SAYFA YOKTUR
 * ============================================================================
 * `mockModuAktif()` false ise `notFound()`. O fonksiyon bayrağın YANINDA
 * adresin de yerel olmasını şart koşar; yani bayrak yanlışlıkla üretim
 * ortamına taşınsa bile gerçek alan adında bu sayfa 404 döner
 * (bkz. lib/edevlet.ts).
 *
 * `generateStaticParams` YOK ve sayfa dinamiktir: ön üretim sırasında
 * `mockModuAktif()` derleme ortamına göre değerlendirilir ve sonuç HTML'e
 * dondurulurdu. Karar her istekte yeniden verilmelidir.
 * ============================================================================
 */

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata(): Promise<Metadata> {
  /*
    Başlık bile arama motoruna sızmamalı; `noindex, nofollow` ikisi birden
    verilir (giriş sayfasında `follow` açıktı çünkü orada gerçek bağlantılar
    var — burada yok).
  */
  return {
    title: 'e-Devlet kum havuzu (test)',
    robots: { index: false, follow: false },
  }
}

export default async function EdevletMockPage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  if (!mockModuAktif()) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('edevletMock')

  /*
    `state`, giriş ucunun ürettiği ve çerezde de duran değerdir. Burada yalnızca
    TAŞINIR: forma gizli alan olarak konur ve dönüş ucunda çerezle
    karşılaştırılır. Sayfa onu doğrulamaya ÇALIŞMAZ — doğrulamanın tek yeri
    sunucudaki dönüş ucudur.
  */
  const ham = (await searchParams).state
  const state = (Array.isArray(ham) ? ham[0] : ham) ?? ''

  return (
    <div className="container-page section-block">
      <div className="max-w-md">
        {/*
          UYARI ŞERİDİ — SAYFANIN İLK OKUNAN ÖĞESİ.
          `role="note"` değil düz metin: bu bir uyarı değil, sayfanın KİMLİĞİ.
          Kesikli kenarlık ve tek renk, kurumsal yüzeylerden görsel olarak
          ayrışması içindir.
        */}
        <p className="border-2 border-dashed border-danger-700 bg-badge-danger-bg p-4 text-sm font-bold leading-relaxed text-danger-700">
          {t('sandboxWarning')}
        </p>

        <h1 className="title-record mt-8">{t('title')}</h1>
        <p className="lede measure mt-4">{t('intro')}</p>

        <div className="mt-8">
          <EdevletMockForm locale={locale} state={state} />
        </div>
      </div>
    </div>
  )
}
