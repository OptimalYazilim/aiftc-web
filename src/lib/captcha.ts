/**
 * BOT KORUMASI — CLOUDFLARE TURNSTILE  (Şartname 12.1 · Kılavuz 5.2 / 8)
 * ============================================================================
 * Kayıt ucu (`POST /api/users`) anonim isteğe açıktır. Erişim açısından bu
 * zararsızdır — her kayıt `pending` + rolsüz doğar, hiçbiri giriş yapamaz —
 * ama bir bot ağı sınırsız sayıda sahte hesap açıp yönetici listesini
 * kirletebilir ve veritabanını şişirebilir. Hız sınırlama (lib/rateLimit.ts)
 * tek bir IP'yi yavaşlatır; dağıtık bir ağı durdurmaz. CAPTCHA o boşluğu
 * kapatır.
 *
 * ---------------------------------------------------------------------------
 * NEDEN TURNSTILE, NEDEN reCAPTCHA DEĞİL
 * ---------------------------------------------------------------------------
 * Bu proje ziyaretçi verisini üçüncü taraflara açmamak için zaten bilinçli
 * kararlar veriyor: yazı tipleri Google'dan çalışma anında çekilmez, kendi
 * origin'imizden servis edilir (bkz. [locale]/layout.tsx). reCAPTCHA v3
 * eklemek, o kararı sessizce geri alıp her ziyaretçiyi Google'ın reklam
 * altyapısına bağlı bir izleyiciyle karşılaştırırdı — üstelik KVKK
 * aydınlatma metni buna göre yazılmamışken.
 *
 * Turnstile çerez kullanmaz, kişisel veri toplamadığını beyan eder ve
 * davranışsal profilleme yapmaz. Kurumun hukuki yükü ölçülebilir biçimde
 * daha hafiftir. Yine de bir ÜÇÜNCÜ TARAFTIR: KVKK aydınlatma metnine
 * eklenmesi gerekir — bu bir yazılım kararı değil, hukuk biriminin işidir.
 *
 * Ek olarak: paket kurulmaz. Turnstile bir <script> etiketi ve bir POST
 * isteğidir; React sarmalayıcı bir bağımlılık eklemek, iki satırlık iş için
 * güncellenmesi gereken bir yüzey daha açardı.
 *
 * ---------------------------------------------------------------------------
 * ÜÇ DURUM — KARIŞTIRMAYIN
 * ---------------------------------------------------------------------------
 *   1. ANAHTAR YOK      -> koruma KAPALI, kayıt eskisi gibi çalışır.
 *      Bu bilinçli bir tercihtir: aksi hâlde anahtar tanımlanana kadar kayıt
 *      ekranı tamamen bozulurdu ve geliştirme ortamı çalışmazdı. Bedeli
 *      şudur: anahtarı doldurmayı UNUTAN bir dağıtımda bot koruması yoktur.
 *      Bu yüzden sunucu açılışında UYARI yazılır ve dağıtım kontrol
 *      listesinde madde olarak durur.
 *
 *   2. ANAHTAR VAR, JETON GEÇERSİZ/YOK  -> 400, istek reddedilir.
 *
 *   3. ANAHTAR VAR, SAĞLAYICIYA ULAŞILAMIYOR (ağ hatası, zaman aşımı, 5xx)
 *      -> KAPALIYA DÜŞER (fail-closed), istek reddedilir.
 *      Alternatifi "ulaşamadım, geçir" olurdu; o da saldırganın Cloudflare'e
 *      giden yolu bozması hâlinde korumayı tamamen devre dışı bırakırdı.
 *      Doğrulanamayan bir jeton, geçerli bir jeton değildir.
 *
 * ---------------------------------------------------------------------------
 * `remoteip` GÖNDERİLMEZ — bilinçli
 * ---------------------------------------------------------------------------
 * Turnstile isteğe bağlı olarak ziyaretçinin IP'sini kabul eder ve jetondaki
 * IP ile karşılaştırır. Göndermiyoruz: ters vekil `X-Forwarded-For`ı doğru
 * yazmadığında (bu kurulumda ayrı bir kontrol listesi maddesidir) eşleşme
 * BAŞARISIZ olur ve gerçek kullanıcılar sessizce reddedilir. Kazancı küçük,
 * yanlış yapılandırmada bedeli büyüktür. Ayrıca bir kişisel veri alanını
 * daha üçüncü tarafa göndermemiş oluruz.
 * ============================================================================
 */

/** Doğrulama sonucunda istemciye dönen makine kodları. */
export const CAPTCHA_KODLARI = {
  /** Jeton hiç gönderilmedi. */
  eksik: 'captcha_required',
  /** Jeton gönderildi ama sağlayıcı reddetti (sahte, süresi geçmiş, harcanmış). */
  gecersiz: 'captcha_failed',
  /** Sağlayıcıya ulaşılamadı — kapalıya düşüldü. */
  ulasilamadi: 'captcha_unavailable',
} as const

export type CaptchaKodu = (typeof CAPTCHA_KODLARI)[keyof typeof CAPTCHA_KODLARI]

const DOGRULAMA_UCU = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Sağlayıcı yanıtı için üst sınır. Sınırsız beklemek, isteği sonsuza kadar
 * açık tutup kaynak tüketirdi; zaman aşımı da bir başarısızlıktır ve
 * KAPALIYA düşer.
 */
const ZAMAN_ASIMI_MS = 8_000

/** Gizli anahtar yalnızca sunucuda okunur; istemci paketine ASLA girmez. */
const gizliAnahtar = (): string => (process.env.CAPTCHA_SECRET_KEY ?? '').trim()

/**
 * Site anahtarı — istemciye verilebilir, gizli değildir (widget'ı çizmek için
 * tarayıcıya zaten gider). Sunucu bileşeninden okunup forma özellik olarak
 * geçirilir; bu sayede `NEXT_PUBLIC_` öneki gerekmez ve ortam değişkeni adı
 * kurumun beklediği gibi kalır.
 */
export const captchaSiteAnahtari = (): string | null => {
  const deger = (process.env.CAPTCHA_SITE_KEY ?? '').trim()
  return deger.length > 0 ? deger : null
}

/** Koruma açık mı? Yalnızca GİZLİ anahtara bakar — doğrulamayı o yapar. */
export const captchaAcikMi = (): boolean => gizliAnahtar().length > 0

/*
  ---------------------------------------------------------------------------
  AÇILIŞ UYARILARI — sessiz yanlış yapılandırmayı görünür kılar
  ---------------------------------------------------------------------------
  İki anahtar AYRI AYRI iş görür ve biri olmadan öteki zarar verir:

    yalnızca GİZLİ var  -> widget çizilmez, jeton üretilmez, sunucu her kaydı
                           reddeder. Kayıt ekranı tamamen kilitlenir.
    yalnızca SİTE var   -> widget çizilir, kullanıcı doğrulama yapar, sunucu
                           hiçbir şey denetlemez. Güvenlik TİYATROSU.

  İkisi de sessizce yanlış çalışır; bu yüzden açılışta yazılır. Bu dosya
  yalnızca sunucudan içeri alınır (Users.ts ve kayıt sayfası), o yüzden
  modül düzeyinde uyarı vermek güvenlidir.
*/
if (typeof window === 'undefined') {
  const gizli = captchaAcikMi()
  const site = captchaSiteAnahtari() !== null

  if (gizli && !site) {
    console.warn(
      '[captcha] CAPTCHA_SECRET_KEY tanımlı ama CAPTCHA_SITE_KEY YOK — kayıt formu jeton üretemez ve her kayıt 400 ile reddedilir.',
    )
  } else if (site && !gizli) {
    console.warn(
      '[captcha] CAPTCHA_SITE_KEY tanımlı ama CAPTCHA_SECRET_KEY YOK — widget görünür fakat sunucu hiçbir şey doğrulamaz.',
    )
  } else if (!gizli && !site) {
    console.warn(
      '[captcha] CAPTCHA anahtarları tanımlı değil — kayıt ucunda bot koruması YOK. Üretimde doldurun (.env.production.example).',
    )
  }
}

export type CaptchaSonucu = { ok: true } | { ok: false; kod: CaptchaKodu; ayrinti?: string }

/**
 * Jetonu Cloudflare'e doğrulatır.
 *
 * Jeton TEK KULLANIMLIKTIR: aynı jeton ikinci kez gönderilirse Cloudflare
 * `timeout-or-duplicate` döner. Bu yüzden istemci her gönderimden sonra
 * widget'ı sıfırlar (bkz. RegisterForm).
 */
export const captchaDogrula = async (jeton: unknown): Promise<CaptchaSonucu> => {
  const gizli = gizliAnahtar()

  // Koruma kapalıysa çağıran taraf buraya hiç gelmemeli; yine de güvenli davran.
  if (!gizli) return { ok: true }

  if (typeof jeton !== 'string' || jeton.trim().length === 0) {
    return { ok: false, kod: CAPTCHA_KODLARI.eksik }
  }

  const govde = new URLSearchParams({ secret: gizli, response: jeton.trim() })

  try {
    const yanit = await fetch(DOGRULAMA_UCU, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: govde,
      signal: AbortSignal.timeout(ZAMAN_ASIMI_MS),
      cache: 'no-store',
    })

    if (!yanit.ok) {
      /* Sağlayıcının 5xx'i de "doğrulanamadı"dır — geçir DEMEK DEĞİLDİR. */
      return { ok: false, kod: CAPTCHA_KODLARI.ulasilamadi, ayrinti: `HTTP ${yanit.status}` }
    }

    const sonuc = (await yanit.json()) as {
      success?: boolean
      'error-codes'?: string[]
    }

    if (sonuc?.success === true) return { ok: true }

    return {
      ok: false,
      kod: CAPTCHA_KODLARI.gecersiz,
      ayrinti: Array.isArray(sonuc?.['error-codes']) ? sonuc['error-codes'].join(',') : undefined,
    }
  } catch (hata) {
    /*
      AĞ HATASI / ZAMAN AŞIMI -> KAPALIYA DÜŞ.
      `ECONNREFUSED`, DNS hatası ve `TimeoutError` buraya düşer. Hiçbiri
      "kullanıcı insandır" anlamına gelmez; ikisi de yalnızca "bilmiyoruz"
      demektir ve bilmemek geçirme sebebi değildir.
    */
    return {
      ok: false,
      kod: CAPTCHA_KODLARI.ulasilamadi,
      ayrinti: hata instanceof Error ? hata.name : undefined,
    }
  }
}
