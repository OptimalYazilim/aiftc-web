import createMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { routing } from '@/i18n/routing'
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
  { yol: '/api/users', sinif: 'register' },
]

export function middleware(request: NextRequest) {
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
  }

  /*
    ============================================================================
    2) API yolları next-intl'e VERİLMEZ
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
  ],
}
