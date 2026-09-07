import createMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { routing } from '@/i18n/routing'
import { parolaGecerliMi, parolaHataGovdesi } from '@/lib/passwordPolicy'
import { hizSinirinaBak, limitYaniti, type LimitSinifi } from '@/lib/rateLimit'

const intlMiddleware = createMiddleware(routing)

/**
 * KİMLİK UÇLARI — HIZ SINIRI UYGULANAN YOLLAR
 * ============================================================================
 * Payload'ın kendi rota adlarıdır ve `matcher` içinde AÇIKÇA sayılırlar.
 * `matcher` bir derleme zamanı sabitidir; buradaki liste ile aşağıdaki
 * `config.matcher` listesi ELDE EŞLEŞTİRİLMEK ZORUNDADIR — biri
 * güncellenip öteki unutulursa yol middleware'e hiç uğramaz ve sınır
 * SESSİZCE devre dışı kalır.
 */
const KORUNAN_UCLAR: { yol: string; sinif: LimitSinifi }[] = [
  { yol: '/api/users/login', sinif: 'login' },
  { yol: '/api/users/forgot-password', sinif: 'passwordReset' },
  { yol: '/api/users/reset-password', sinif: 'passwordReset' },
  { yol: '/api/users', sinif: 'register' },
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  /*
    ============================================================================
    1) HIZ SINIRI — yalnızca POST
    ============================================================================
    Okuma istekleri sınırlanmaz: `GET /api/users` zaten erişim denetiminden
    geçiyor (yalnızca kendi kaydını veya yönetici tümünü görür) ve panel
    gezinmesini yavaşlatmak kimseye fayda sağlamaz.

    Sıra ÖNEMLİ: `/api/users/login` daha uzun yoldur ve önce sınanır; yoksa
    `/api/users` ön eki giriş isteklerini de "kayıt" sınıfına sokardı.
  */
  if (request.method === 'POST') {
    const eslesen = KORUNAN_UCLAR.find((uc) => pathname === uc.yol)

    if (eslesen) {
      const sonuc = hizSinirinaBak(request, eslesen.sinif)
      if (sonuc.asildi) return limitYaniti(sonuc.sonraDeneSaniye)
    }

    /*
      ==========================================================================
      2) PAROLA POLİTİKASI — SIFIRLAMA YOLU
      ==========================================================================
      `Users.hooks.beforeValidate` içindeki kural BU YOLDA ÇALIŞMAZ. Payload'ın
      `resetPassword` işlemi parolayı ÖNCE hash'ler, kancayı sonra çağırır;
      kancaya giden veride `password` yoktur, `salt`/`hash` vardır. Ölçüldü:
      kural yalnızca kancadayken `{ password: '123' }` isteği 200 dönüyordu —
      yani politika sıfırlama üzerinden tümüyle atlanabiliyordu.

      Bu yüzden denetim istek Payload'a ULAŞMADAN önce burada yapılır.
      Gerekçenin tamamı ve tek sayı: lib/passwordPolicy.ts

      GÖVDE `clone()` ÜZERİNDEN OKUNUR. Orijinal isteğin gövdesi bir akıştır ve
      bir kez tüketilir; burada tüketilseydi Payload'a boş gövde giderdi.
    */
    if (pathname === '/api/users/reset-password') {
      try {
        const govde = (await request.clone().json()) as { password?: unknown }
        if (!parolaGecerliMi(govde?.password)) {
          return NextResponse.json(parolaHataGovdesi(), {
            status: 400,
            headers: { 'Cache-Control': 'no-store' },
          })
        }
      } catch {
        /*
          Gövde okunamadı (JSON değil ya da boş). Burada karar VERİLMEZ:
          isteği reddetmek, Payload'ın kendi doğrulamasının üreteceği daha
          doğru hatayı gizlerdi. İstek olduğu gibi geçer.
        */
      }
    }
  }

  /*
    ============================================================================
    3) API yolları next-intl'e VERİLMEZ
    ============================================================================
    `matcher` artık `/api/users*` yollarını da kapsıyor (sınır için gerekli).
    Ama next-intl bu yolları dil önekiyle yeniden yazmaya çalışırsa Payload'ın
    uçları bozulur. Bu yüzden API istekleri buradan olduğu gibi geçer.
  */
  if (pathname.startsWith('/api/')) return NextResponse.next()

  return intlMiddleware(request)
}

export const config = {
  /**
   * İKİ AYRI AMAÇ:
   *
   *  1. Birinci desen — DİL ÖNEKİ. Payload admin (/admin), Payload API (/api)
   *     ve statik dosyalar dil önekinden muaf tutulur.
   *
   *  2. Sonraki iki satır — HIZ SINIRI. Kimlik uçları özellikle geri
   *     çağrılır; birinci desen `/api`'yi dışladığı için onlar olmadan
   *     middleware bu isteklere HİÇ ÇALIŞMAZ ve sınır sessizce devre dışı
   *     kalırdı. Liste `KORUNAN_UCLAR` ile eşleşmelidir.
   */
  matcher: [
    '/((?!api|admin|_next|_vercel|media|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
    '/api/users',
    '/api/users/login',
    '/api/users/forgot-password',
    '/api/users/reset-password',
  ],
}
