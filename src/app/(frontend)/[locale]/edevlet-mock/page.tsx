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
 * KİMLİK AVINA KARŞI TASARIM — EN ÖNEMLİ KISIM
 * ============================================================================
 * Ekranda resmî amblem, ay-yıldız, e-Devlet sözcük markası ya da kurumun
 * resmî renk kodları KULLANILMAZ. Sayfa bilinçli olarak kaba bir geliştirici
 * arayüzü gibi görünür ve en üstte, sayfadaki en büyük yazıyla ne olduğunu
 * söyler.
 *
 * Gerekçe iki katlı:
 *   1. Kamu kimlik sisteminin görünümünü kopyalayan bir ekran, ekran
 *      görüntüsü alındığında ya da yanlışlıkla erişilebilir kaldığında
 *      KİMLİK AVI MALZEMESİDİR. Kurumun kendi deposunda böyle bir şablon
 *      bulunmamalıdır — kopyalanır, dolaşıma girer.
 *   2. Geliştiricinin sahte ile gerçeği karıştırmaması gerekir; ayırt edici
 *      olması bir kusur değil, gereklilik.
 *
 * SİTE BAŞLIĞI VE ALT BİLGİSİ BİLİNÇLİ OLARAK KALDI. Sayfa uygulamanın kendi
 * kabuğu içinde görünür; bu, ekranın e-Devlet değil AIFTC geliştirme
 * uygulaması olduğunu ayrıca belli eder. Kabuksuz, "tam sayfa giriş ekranı"
 * görünümü tam tersi etkiyi yapardı.
 *
 * RENKLER PROJE BELİRTEÇLERİNDEN: `danger-700`/`badge-danger-bg` (7.09:1) ve
 * `warn-800`/`badge-warn-bg` (6.67:1). İkisi de AA eşiğinin üzerindedir —
 * uyarı şeridi "dikkat çekici" olacak diye okunabilirlikten ödün verilmez.
 *
 * ============================================================================
 * ÜRETİMDE SAYFA YOKTUR
 * ============================================================================
 * `mockModuAktif()` false ise `notFound()`. O fonksiyon bayrağın YANINDA
 * adresin de yerel olmasını şart koşar; yani bayrak yanlışlıkla üretim
 * ortamına taşınsa bile gerçek alan adında bu sayfa 404 döner
 * (bkz. lib/edevlet.ts — 13 adresle ölçüldü).
 *
 * `generateStaticParams` YOK ve sayfa dinamiktir: ön üretim sırasında
 * `mockModuAktif()` derleme ortamına göre değerlendirilip sonuç HTML'e
 * dondurulurdu. Karar her istekte yeniden verilmelidir. (Ön üretilmediği
 * `prerender-manifest.json` üzerinden doğrulandı.)
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
    title: 'SANDBOX — test kimlik doğrulaması',
    robots: { index: false, follow: false },
  }
}

const tek = (deger: string | string[] | undefined): string =>
  (Array.isArray(deger) ? deger[0] : deger) ?? ''

export default async function EdevletMockPage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  if (!mockModuAktif()) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('edevletMock')
  const sorgu = await searchParams

  /*
    `state`, giriş ucunun ürettiği ve httpOnly çerezde de duran değerdir.
    Burada yalnızca TAŞINIR: forma gizli alan olarak konur ve dönüş ucunda
    çerezle karşılaştırılır. Sayfa onu doğrulamaya ÇALIŞMAZ — doğrulamanın tek
    yeri sunucudaki dönüş ucudur.
  */
  const state = tek(sorgu.state)

  /*
    SUNUCUDAN DÖNEN ALAN HATASI.
    Dönüş ucu biçim denetiminde takılan bir isteği bu sayfaya geri yollar
    (`?hata=tckn` gibi) ve kullanıcı hatayı bağlamında görür. Önceki sürüm
    giriş sayfasına atıyordu; orada "hangi alan yanlıştı" bilgisi kayboluyor ve
    kullanıcı kum havuzuna baştan girmek zorunda kalıyordu.

    GİRİLEN DEĞERLER GERİ YANSITILMAZ. Yansıtmak için adres satırına
    taşınmaları gerekirdi; kimlik numarası ve ad soyad kişisel veridir ve
    tarayıcı geçmişine, sunucu kayıtlarına, `Referer` başlığına sızar. Hangi
    alanın hatalı olduğunu söylemek yeterlidir.
  */
  const sunucuHatasi = tek(sorgu.hata) || null

  return (
    <div className="container-page section-block">
      {/*
        UYARI ŞERİDİ — SAYFANIN EN BÜYÜK VE İLK OKUNAN ÖĞESİ.
        `<h1>` olarak işaretlendi: hem görsel olarak hem belge yapısında birinci
        sıradadır. Ekran okuyucu kullanıcısı da sayfanın ne olduğunu ilk
        başlıkta duyar — uyarıyı yalnızca görsel bir şerit yapmak, onu
        görmeyene hiçbir şey söylemezdi.
      */}
      <div className="border-4 border-dashed border-danger-700 bg-badge-danger-bg p-6 sm:p-8">
        <h1 className="text-2xl font-black uppercase leading-tight tracking-tight text-danger-700 sm:text-3xl">
          {t('sandboxHeadline')}
        </h1>
        <p className="mt-4 max-w-2xl text-sm font-bold leading-relaxed text-danger-700 sm:text-base">
          {t('sandboxWarning')}
        </p>
      </div>

      {/* İkinci şerit: ne YAPILMAYACAĞINI söyler. Ayrı durur ki karışmasın. */}
      <p className="mt-3 border-s-4 border-warn-800 bg-badge-warn-bg p-4 text-sm font-semibold leading-relaxed text-warn-800">
        {t('sandboxNoVerification')}
      </p>

      {/*
        İÇERİK DAR VE SÜSSÜZ. Kurumsal sayfalardaki `page-hero` bloğu
        bilinçli olarak kullanılmadı: bu ekranın kurumsal bir sayfa gibi
        görünmesi istenmiyor.
      */}
      <div className="mt-10 max-w-md">
        <h2 className="text-lg font-bold tracking-tight text-shell-900">{t('title')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-700">{t('intro')}</p>

        <div className="mt-8">
          <EdevletMockForm locale={locale} state={state} sunucuHatasi={sunucuHatasi} />
        </div>
      </div>
    </div>
  )
}
