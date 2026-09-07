import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * HIZ SINIRLAMA — KİMLİK UÇLARI  (Şartname 12.1 · Kılavuz 5.4)
 * ============================================================================
 * ÖNCE DÜRÜST BİR SAPTAMA: PAYLOAD'IN YERLEŞİK SINIRLAMASI YOKTUR.
 * ---------------------------------------------------------------------------
 * Payload 2'de Express tabanlı sunucu bir `rateLimit` ayarı uygulardı.
 * Payload 3 Next.js route handler'ları üzerinde çalışır ve o ayar CONFIG
 * TİPİNDEN TAMAMEN KALDIRILMIŞTIR. Doğrulandı (payload 3.88.0):
 *
 *     grep -rn "rateLimit" node_modules/payload/dist/config/   →  hiç sonuç
 *
 * Yani "yerleşik sınırlamayı aç" diye bir seçenek yok; config'e böyle bir
 * nesne yazmak onu sessizce yok saydırır ve korunuyormuş yanılsaması üretir.
 * Bu dosya gerçek bir sınırlayıcıdır.
 *
 * ---------------------------------------------------------------------------
 * NEYİ KORUR
 * ---------------------------------------------------------------------------
 *   POST /api/users        kayıt   → bot bir gecede binlerce `pending` hesap
 *                                    açabilirdi; erişim açısından zararsız
 *                                    ama yönetici listesini kullanılamaz
 *                                    hâle getirir.
 *   POST /api/users/login  giriş   → Payload'ın `maxLoginAttempts: 5` kilidi
 *                                    HESAP BAZLIDIR. Tek IP'den bin ayrı
 *                                    hesaba birer deneme yapan bir saldırgan
 *                                    o kilidi hiç tetiklemez. Bu katman IP
 *                                    bazlıdır ve o boşluğu kapatır.
 *
 * GET istekleri sınırlanmaz: okuma zaten erişim denetiminden geçiyor ve
 * sayfa gezinmesini yavaşlatmak ziyaretçiye zarar verir.
 *
 * ---------------------------------------------------------------------------
 * SINIRLARI — ABARTILMAMALI
 * ---------------------------------------------------------------------------
 * 1. SAYAÇ BELLEKTEDİR. Süreç yeniden başladığında sıfırlanır ve birden çok
 *    örnek (replica) çalıştırılırsa her biri kendi sayacını tutar. Bu
 *    kurulumda uygulama TEK konteynerde çalışıyor (docker-compose.yml), yani
 *    pratikte etkilidir; yatay ölçeklenmeye geçildiğinde Redis gibi paylaşılan
 *    bir sayaç gerekir.
 * 2. IP, `x-forwarded-for` başlığından okunur. Bu başlık İSTEMCİ TARAFINDAN
 *    UYDURULABİLİR; yalnızca GÜVENİLEN bir ters vekilin arkasında anlamlıdır.
 *    Vekil bu başlığı kendisi yazmalı, gelen değeri geçirmemelidir
 *    (nginx: `proxy_set_header X-Forwarded-For $remote_addr`).
 * 3. Bu katman ters vekil / WAF sınırlamasının YERİNE GEÇMEZ, onu tamamlar.
 *    Uygulamaya hiç ulaşmadan durdurulan istek her zaman daha ucuzdur.
 *
 * Bu üç madde `docs/access-control-guide.md` 5.4'te de yazılıdır.
 *
 * ---------------------------------------------------------------------------
 * NEDEN MIDDLEWARE, NEDEN KOLEKSİYON KANCASI DEĞİL
 * ---------------------------------------------------------------------------
 * Kanca yalnızca `create` işlemini görür; giriş denemesini göremez. Ayrıca
 * kanca çalıştığında istek gövdesi ayrıştırılmış, parola karşılaştırması
 * yapılmıştır — yani iş zaten yapılmıştır. Middleware isteği en erken
 * noktada, veritabanına hiç dokunmadan keser.
 * ============================================================================
 */

type Pencere = { sayac: number; sifirlamaZamani: number }

/**
 * Sayaçlar. Anahtar: `<sınıf>:<ip>`.
 * `globalThis` üzerinde tutulur — geliştirmede Next modülleri sıcak yeniden
 * yüklemede yeniden değerlendirir ve modül düzeyi bir `Map` her seferinde
 * sıfırlanırdı; sınırlayıcı da hiç tetiklenmezdi.
 */
const kovalar: Map<string, Pencere> =
  (globalThis as { __aiftcRateLimit?: Map<string, Pencere> }).__aiftcRateLimit ??
  ((globalThis as { __aiftcRateLimit?: Map<string, Pencere> }).__aiftcRateLimit = new Map())

/** Sayı olarak okunabilen ortam değişkeni; geçersizse varsayılan. */
const sayi = (deger: string | undefined, varsayilan: number): number => {
  const n = Number(deger)
  return Number.isFinite(n) && n > 0 ? n : varsayilan
}

export type LimitSinifi = 'register' | 'login' | 'passwordReset'

/**
 * Sınıf başına kural. Kayıt daha dardır: meşru bir kullanıcı hesabını bir kez
 * açar, girişini ise parolasını yanlış yazarak birkaç kez deneyebilir.
 */
const KURALLAR: Record<LimitSinifi, { pencereMs: number; azami: number }> = {
  register: {
    pencereMs: sayi(process.env.RATE_LIMIT_REGISTER_WINDOW_MIN, 60) * 60_000,
    azami: sayi(process.env.RATE_LIMIT_REGISTER_MAX, 5),
  },
  login: {
    pencereMs: sayi(process.env.RATE_LIMIT_LOGIN_WINDOW_MIN, 10) * 60_000,
    azami: sayi(process.env.RATE_LIMIT_LOGIN_MAX, 20),
  },
  /*
    PAROLA SIFIRLAMA — iki uç tek kovada.
    `forgot-password` her çağrıda BİR E-POSTA GÖNDERİR: sınırsız bırakılırsa
    hem posta kotası tüketilir hem de bir kişinin gelen kutusu bombalanabilir.
    `reset-password` ise jeton dener; sınır orada tahmin saldırısını yavaşlatır.

    İkisi aynı kovayı paylaşır çünkü meşru kullanım ikisini de birkaç kez
    aşamaz: bağlantı iste (1), yeni parolayı gönder (1), belki bir-iki
    yanlış deneme. On, rahat bir tavandır.
  */
  passwordReset: {
    pencereMs: sayi(process.env.RATE_LIMIT_RESET_WINDOW_MIN, 60) * 60_000,
    azami: sayi(process.env.RATE_LIMIT_RESET_MAX, 10),
  },
}

/**
 * İstemci IP'si.
 * `x-forwarded-for` virgülle ayrılmış bir zincir olabilir; İLK değer özgün
 * istemcidir. Hiçbiri yoksa `bilinmeyen` anahtarına düşülür — o durumda tüm
 * anonim istekler tek kovayı paylaşır. Bu, kimseyi korumasız bırakmaktan
 * yeğdir ve yalnızca vekil başlığı hiç göndermediğinde oluşur.
 */
const istemciIp = (request: NextRequest): string => {
  const zincir = request.headers.get('x-forwarded-for')
  if (zincir) {
    const ilk = zincir.split(',')[0]?.trim()
    if (ilk) return ilk
  }
  return request.headers.get('x-real-ip')?.trim() || 'bilinmeyen'
}

/**
 * Süresi dolmuş kovaları temizler.
 * Her yazımda TÜM haritayı taramak, sözlük büyüdüğünde isteği yavaşlatır;
 * bu yüzden yalnızca eşiği aştığında süpürülür. Sınır aşıldığında bile
 * bellek kullanımı IP sayısıyla orantılı kalır.
 */
const SUPURME_ESIGI = 5_000

const supur = (simdi: number): void => {
  if (kovalar.size < SUPURME_ESIGI) return
  for (const [anahtar, pencere] of kovalar) {
    if (pencere.sifirlamaZamani <= simdi) kovalar.delete(anahtar)
  }
}

export type LimitSonucu = { asildi: false } | { asildi: true; sonraDeneSaniye: number }

/** Sayacı artırır ve sınırın aşılıp aşılmadığını söyler. */
export const hizSinirinaBak = (request: NextRequest, sinif: LimitSinifi): LimitSonucu => {
  const { pencereMs, azami } = KURALLAR[sinif]
  const simdi = Date.now()
  const anahtar = `${sinif}:${istemciIp(request)}`

  supur(simdi)

  const mevcut = kovalar.get(anahtar)

  /* Pencere yoksa ya da dolmuşsa yenisi açılır. */
  if (!mevcut || mevcut.sifirlamaZamani <= simdi) {
    kovalar.set(anahtar, { sayac: 1, sifirlamaZamani: simdi + pencereMs })
    return { asildi: false }
  }

  mevcut.sayac += 1

  if (mevcut.sayac > azami) {
    return {
      asildi: true,
      sonraDeneSaniye: Math.max(1, Math.ceil((mevcut.sifirlamaZamani - simdi) / 1000)),
    }
  }

  return { asildi: false }
}

/**
 * 429 yanıtı — PAYLOAD'IN HATA BİÇİMİYLE.
 * ---------------------------------------------------------------------------
 * Gövde `{ errors: [{ message, data: { code } }] }` şeklindedir; kimlik
 * formları zaten bu şekli okuyor (bkz. components/auth/*). Farklı bir biçim
 * göndermek, istemcide ikinci bir ayrıştırma dalı gerektirirdi.
 *
 * `Retry-After` standart başlıktır: iyi niyetli istemciler ve tarayıcı
 * geliştirici araçları ne kadar bekleneceğini oradan okur.
 */
export const limitYaniti = (sonraDeneSaniye: number): NextResponse =>
  NextResponse.json(
    {
      errors: [
        {
          message: 'Çok fazla deneme yapıldı. Lütfen bir süre sonra tekrar deneyin.',
          data: { code: 'rate_limited', retryAfter: sonraDeneSaniye },
        },
      ],
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(sonraDeneSaniye),
        /* Sayaç yanıtı önbelleğe alınmamalı. */
        'Cache-Control': 'no-store',
      },
    },
  )
