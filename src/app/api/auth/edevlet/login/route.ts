import { NextResponse, type NextRequest } from 'next/server'

import {
  EDEVLET_GERCEK_ALANLAR,
  EDEVLET_STATE_COOKIE,
  EDEVLET_STATE_OMRU_SN,
  gercekKapiHazir,
  mockModuAktif,
  stateUret,
} from '@/lib/edevlet'
import { edevletSitedeAcik } from '@/lib/edevletSite'
import { isLocale, type Locale } from '@/i18n/locales'

/**
 * e-DEVLET GİRİŞİ — AKIŞI BAŞLATAN UÇ
 * ============================================================================
 * Kullanıcı "e-Devlet ile Giriş Yap" düğmesine bastığında buraya gelir. Uç
 * noktanın tek işi akışı BAŞLATMAK: bir `state` üretip çerezine yazmak ve
 * kullanıcıyı kimlik kapısına yönlendirmek.
 *
 * ---------------------------------------------------------------------------
 * NEDEN AYRI BİR UÇ NOKTA — DÜĞME DOĞRUDAN KAPIYA BAĞLANMIYOR
 * ---------------------------------------------------------------------------
 * Düğme doğrudan kapının adresine bağlansaydı `state` istemcide üretilirdi ve
 * istemcide üretilen bir `state` hiçbir şeyi kanıtlamaz: saldırgan onu da
 * kendisi seçebilirdi. `state` sunucuda üretilip httpOnly çerezine yazılır;
 * dönüşte karşılaştırılan iki değerden biri tarayıcının JavaScript'ine HİÇ
 * görünmez.
 *
 * Ayrıca gerçek kapı adresi, istemci kimliği ve kapsam gibi yapılandırma
 * istemci paketine gömülmez.
 *
 * ---------------------------------------------------------------------------
 * KİP KARARI BURADA VERİLMEZ — `lib/edevlet.ts` VERİR
 * ---------------------------------------------------------------------------
 * Kum havuzunun açık olup olmadığına karar veren tek yer `mockModuAktif()`dir
 * ve o fonksiyon, bayrağın yanında ADRESİN DE yerel olmasını şart koşar.
 * Gerekçe orada ayrıntılı yazılı; özeti: bayrak yanlışlıkla üretime taşınsa
 * bile gerçek alan adında kum havuzu açılmaz ve bu uç 404 döner.
 * ============================================================================
 */

/** Yönlendirmelerde kullanılacak dil. Geçersiz değer sessizce TR'ye düşer. */
const dilOku = (request: NextRequest): Locale => {
  const deger = request.nextUrl.searchParams.get('locale')
  return deger && isLocale(deger) ? deger : 'tr'
}

export const GET = async (request: NextRequest) => {
  /*
    AKIŞ KAPALIYSA UÇ NOKTA HİÇ YOKMUŞ GİBİ DAVRANIR.
    403 yerine 404: yapılandırılmamış bir entegrasyonun VARLIĞINI duyurmanın
    kimseye faydası yok, tarama yapan birine yol göstermekten başka.
  */
  if (!(await edevletSitedeAcik())) {
    return new NextResponse(null, { status: 404 })
  }

  const locale = dilOku(request)
  const state = stateUret()

  let hedef: string

  if (mockModuAktif()) {
    /*
      KUM HAVUZU. Gerçek kapı yerine projenin kendi sahte ekranı açılır.
      `state` sorgu dizesinde taşınır — gerçek kapının da aynen böyle
      yapacağı şey budur, yani akışın şekli gerçek kipte değişmez.
    */
    hedef = `/${locale}/edevlet-mock?state=${encodeURIComponent(state)}`
  } else if (gercekKapiHazir()) {
    /*
      ======================================================================
      GERÇEK KAPI — HENÜZ KURULMADI, UYDURULMADI
      ======================================================================
      Bu dal bilinçli olarak BOŞTUR ve 501 döner. Sebebi şudur: e-Devlet
      Kapısı'nın kimlik doğrulama akışı kuruma özel bir entegrasyon
      dokümanıyla verilir — parametre adları, kapsam (`scope`) değerleri, imza
      yöntemi ve dönüş adresinin nasıl kaydedileceği o dokümanda yazar.

      Standart bir OAuth2 yönlendirmesi yazıp "çalışıyor" demek, DOĞRULANMAMIŞ
      bir varsayımı çalışan kod gibi göstermek olurdu; entegrasyon günü hata
      burada değil, kapıdan dönen anlaşılmaz bir yanıtta aranırdı.

      KURULUM İÇİN GEREKENLER (hepsi kurum adına e-Devlet'ten alınır):
        ${EDEVLET_GERCEK_ALANLAR.join(', ')}
      ve ayrıca dönüş adresinin (`/api/auth/edevlet/callback`) kapıya KAYITLI
      olması.

      Dört değişken tanımlandığında bu dal devreye girer; o yüzden ilk iş
      burayı gerçek akışla doldurmaktır.
    */
    return NextResponse.json(
      {
        errors: [
          {
            message:
              'e-Devlet gerçek kapı akışı henüz kurulmadı. Kurum entegrasyon dokümanı ' +
              'gelmeden parametreler varsayımla yazılmaz (bkz. bu rotadaki açıklama).',
            data: { code: 'edevlet_real_gateway_not_implemented' },
          },
        ],
      },
      { status: 501 },
    )
  } else {
    /* `edevletKullanilabilir()` true dönmüşse buraya düşülemez. */
    return new NextResponse(null, { status: 404 })
  }

  const yanit = NextResponse.redirect(new URL(hedef, request.nextUrl.origin))

  /*
    `state` ÇEREZİ.
    httpOnly: istemci JavaScript'i okuyamaz — okuyabilseydi dönüşte
      gönderilecek değeri de üretebilir, doğrulama anlamsızlaşırdı.
    sameSite 'Lax': dönüş üst düzey bir GET yönlendirmesiyle gelir; 'Strict'
      bazı tarayıcılarda çerezi o dönüşte GÖNDERMEZ ve akış sessizce kırılır.
    secure: `Users.auth.cookies` ile aynı ölçüt — yerelde http üzerinde
      çalışması gerekir.
  */
  yanit.cookies.set(EDEVLET_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && request.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: EDEVLET_STATE_OMRU_SN,
  })

  return yanit
}
