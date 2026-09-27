import { createLocalReq, getFieldsToSign, jwtSign } from 'payload'
import { addSessionToUser, generatePayloadCookie } from 'payload/shared'
import { NextResponse, type NextRequest } from 'next/server'

import { isLocale, type Locale } from '@/i18n/locales'
import { authHref, href as routeHref } from '@/i18n/routes'
import {
  EDEVLET_STATE_COOKIE,
  edevletKullanilabilir,
  kimlikOzeti,
  mockModuAktif,
  rastgeleParola,
  stateEslesiyor,
  tcknBicimiGecerli,
} from '@/lib/edevlet'
import { payloadClient } from '@/lib/queries'
import { hizSinirinaBak, limitYaniti } from '@/lib/rateLimit'

/**
 * e-DEVLET DÖNÜŞÜ — OTURUM AÇAN UÇ
 * ============================================================================
 * Kimlik kapısından (kum havuzunda sahte ekrandan) dönen veriyi alır, Payload
 * `users` koleksiyonunda eşleştirir ve OTURUM AÇAR.
 *
 * Projedeki en hassas uç noktadır: parola sormadan çerez veren tek yerdir.
 * Aşağıdaki her kontrol o yüzden vardır ve hiçbiri "fazlalık" değildir.
 *
 * ============================================================================
 * SAVUNMA KATMANLARI
 * ============================================================================
 *  1. AKIŞ KAPALIYSA 404. `edevletKullanilabilir()` false ise uç nokta yok.
 *     Kum havuzu ayrıca YEREL ADRES şartına bağlıdır (bkz. lib/edevlet.ts) —
 *     üretimde bayrak açık kalsa bile bu uç oturum açtırmaz.
 *
 *  2. HIZ SINIRI. `login` sınıfı kullanılır: bu uç de bir giriş ucudur ve aynı
 *     bütçeyi paylaşması doğrudur.
 *
 *  3. `state` DOĞRULAMASI. Çerezdeki değerle gelen değer sabit süreli
 *     karşılaştırmayla eşleşmezse istek reddedilir. Böylece uç nokta yalnızca
 *     BU TARAYICIDA başlamış bir akışı tamamlayabilir.
 *
 *  4. BİÇİM DENETİMİ. Kimlik numarası resmî algoritmayla, e-posta basit bir
 *     desenle denetlenir. Bu bir KİMLİK DOĞRULAMASI DEĞİLDİR (kum havuzunda
 *     öyle bir merci yok); amaç, veritabanına anlamsız kayıt yazmamak.
 *
 *  5. E-POSTA ÇAKIŞMASINDA BİRLEŞTİRME YOK — en önemli karar, aşağıda.
 *
 * ============================================================================
 * NEDEN E-POSTAYLA HESAP BİRLEŞTİRİLMİYOR
 * ============================================================================
 * "Bu e-postayla bir hesap var, o hâlde aynı kişidir" varsayımı bir HESAP
 * DEVRALMA yoludur: e-Devlet'ten dönen e-posta, e-Devlet tarafından
 * DOĞRULANMIŞ değildir (kum havuzunda kullanıcı onu kendi yazar; gerçek kipte
 * de kapı e-posta doğrulamaz). Saldırgan, hedefin e-postasını girerek onun
 * parolalı hesabına oturum açabilirdi.
 *
 * Bu yüzden eşleşme YALNIZCA `edevletSubject` üzerinden yapılır. E-posta
 * başka bir hesapta kullanılıyorsa istek REDDEDİLİR ve kullanıcı parolasıyla
 * girmeye yönlendirilir. Hesap birleştirme, oturum AÇTIKTAN SONRA ve kullanıcı
 * onayıyla yapılacak ayrı bir iştir.
 *
 * ============================================================================
 * OTURUM NASIL AÇILIYOR — `payload.login()` KULLANILAMAZ
 * ============================================================================
 * `payload.login()` PAROLA ister; e-Devlet akışında parola yoktur. Kullanıcının
 * parolasını geçici bir değere çevirip giriş yapmak düşünülebilirdi ama bu,
 * kendi parolasıyla da giren bir kullanıcının parolasını SESSİZCE bozardı.
 *
 * Bunun yerine Payload'ın giriş işleminin yaptığı adımlar aynen tekrarlanır
 * (bkz. payload/dist/auth/operations/login.js):
 *
 *   addSessionToUser()  → oturum satırı ve `sid`
 *   getFieldsToSign()   → JWT içeriği (`saveToJWT` alanlarıyla)
 *   jwtSign()           → imzalı jeton
 *   generatePayloadCookie() → `aiftc-token` çerezi
 *
 * `sid` ZORUNLUDUR: koleksiyonda `auth.useSessions` varsayılan olarak açıktır
 * ve JWT stratejisi, jetondaki `sid` ile kullanıcının `sessions` dizisinde
 * eşleşen bir kayıt arar; bulamazsa jetonu REDDEDER (ölçüldü). Yani yalnızca
 * jeton imzalamak yetmez.
 *
 * Bu yaklaşımın getirisi: açılan oturum sıradan bir Payload oturumudur.
 * `/api/users/me`, `/api/users/refresh-token` ve `/api/users/logout` — yani
 * başlık, oturum zaman aşımı uyarısı ve çıkış düğmesi — hiçbir değişiklik
 * gerektirmeden çalışır.
 * ============================================================================
 */

type Kimlik = {
  tckn: string
  ad: string
  soyad: string
  eposta: string
}

const EPOSTA_DESENI = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const dilOku = (deger: string | null): Locale => (deger && isLocale(deger) ? deger : 'tr')

/**
 * `state` çerezini geçersizleştiren ham başlık.
 *
 * `NextResponse.cookies.delete()` DEĞİL — bilinçli. Bu dosyada aynı yanıta
 * ikinci bir çerez (oturum çerezi) HAM BAŞLIK olarak yazılıyor ve iki
 * mekanizmayı karıştırmak ölçülmüş bir veri kaybına yol açıyor: `cookies` API'si
 * `Set-Cookie` başlığını kendi listesinden yeniden üretip ham değeri siliyor
 * (ayrıntı aşağıda, oturum çerezinin yazıldığı yerde). Karıştırma riskini
 * tümden kaldırmak için bu dosya `cookies` API'sini HİÇ kullanmaz.
 */
const STATE_SIL = `${EDEVLET_STATE_COOKIE}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`

/**
 * HATA İKİ AYRI YERE DÖNER — DÜZELTİLEBİLİR Mİ, DEĞİL Mİ
 * ============================================================================
 * İlk sürüm her hatayı giriş sayfasına yolluyordu. Biçim hatalarında bu yanlış
 * bir davranıştı: kullanıcı bir hanesini yanlış yazdığı için kum havuzundan
 * tümden atılıyor, hangi alanın hatalı olduğunu göremiyor ve akışa baştan
 * girmek zorunda kalıyordu.
 *
 * Artık ayrım şudur:
 *
 *   DÜZELTİLEBİLİR (alan hatası)  -> kum havuzu ekranına geri döner, `state`
 *                                    KORUNUR, kullanıcı düzeltip tekrar
 *                                    gönderir.
 *   DÜZELTİLEMEZ (state, hesap    -> giriş sayfasına döner, `state` SİLİNİR.
 *   durumu, yapılandırma)
 *
 * `state`in korunması tek kullanımlılığı zayıflatmaz: değer hâlâ httpOnly
 * çereze bağlıdır, on dakikada söner ve başarılı akışta silinir. Alan hatasında
 * hiçbir oturum açılmadığı için tekrar denemenin bir bedeli yoktur.
 */

/** Düzeltilebilir alan hatası: kum havuzuna geri döner, `state` korunur. */
const mockaDon = (request: NextRequest, locale: Locale, state: string, kod: string) => {
  const hedef = new URL(authHref('edevletMock', locale), request.nextUrl.origin)
  hedef.searchParams.set('state', state)
  hedef.searchParams.set('hata', kod)

  /*
    GİRİLEN DEĞERLER GERİ YANSITILMAZ. Yansıtmak için adres satırına
    konmaları gerekirdi; kimlik numarası ve ad soyad kişisel veridir ve URL
    tarayıcı geçmişine, sunucu kayıtlarına ve `Referer` başlığına sızar.
    Hangi alanın hatalı olduğunu söylemek yeterlidir.
  */
  return NextResponse.redirect(hedef)
}

/** Düzeltilemez hata: giriş sayfasına döner ve `state` geçersizleştirilir. */
const hataylaDon = (request: NextRequest, locale: Locale, kod: string) => {
  const hedef = new URL(authHref('login', locale), request.nextUrl.origin)
  hedef.searchParams.set('edevlet_hata', kod)

  const yanit = NextResponse.redirect(hedef)
  /* Başarısız akışın `state`i yeniden kullanılamaz. */
  yanit.headers.append('Set-Cookie', STATE_SIL)
  return yanit
}

/**
 * Gelen veriyi okur. GET ve POST'un ikisi de desteklenir: kum havuzu formu
 * POST gönderir, gerçek kapıların çoğu ise dönüşü GET ile yapar. İkisini tek
 * yerde toplamak, gerçek kip açıldığında bu dosyanın yeniden yazılmasını
 * önler.
 */
const veriOku = async (
  request: NextRequest,
): Promise<{ state?: string; locale: Locale; kimlik: Partial<Kimlik> }> => {
  const q = request.nextUrl.searchParams

  if (request.method === 'POST') {
    const govde = await request.formData().catch(() => null)
    const al = (ad: string) => {
      const deger = govde?.get(ad)
      return typeof deger === 'string' ? deger.trim() : undefined
    }

    return {
      state: al('state') ?? q.get('state') ?? undefined,
      locale: dilOku(al('locale') ?? q.get('locale')),
      kimlik: {
        tckn: al('tckn'),
        ad: al('ad'),
        soyad: al('soyad'),
        eposta: al('eposta')?.toLowerCase(),
      },
    }
  }

  return {
    state: q.get('state') ?? undefined,
    locale: dilOku(q.get('locale')),
    kimlik: {
      tckn: q.get('tckn')?.trim(),
      ad: q.get('ad')?.trim(),
      soyad: q.get('soyad')?.trim(),
      eposta: q.get('eposta')?.trim().toLowerCase(),
    },
  }
}

const isle = async (request: NextRequest) => {
  if (!edevletKullanilabilir()) {
    return new NextResponse(null, { status: 404 })
  }

  const limit = hizSinirinaBak(request, 'login')
  if (limit.asildi) return limitYaniti(limit.sonraDeneSaniye)

  const { state, locale, kimlik } = await veriOku(request)

  /* --- 3. katman: `state` ------------------------------------------------ */
  const cerez = request.cookies.get(EDEVLET_STATE_COOKIE)?.value
  if (!stateEslesiyor(state, cerez)) {
    return hataylaDon(request, locale, 'state')
  }

  /*
    --- Gerçek kip henüz yok ---------------------------------------------
    Kum havuzu kapalıysa buraya ancak gerçek kapıdan dönülebilir; o akış
    kurulmadığı için (bkz. login rotası) veri biçimi de bilinmiyor.
  */
  if (!mockModuAktif()) {
    return hataylaDon(request, locale, 'gercek_kapi_kurulmadi')
  }

  /* --- 4. katman: biçim -------------------------------------------------- */
  /*
    Bu üç denetim de DÜZELTİLEBİLİR hatadır: kullanıcı kum havuzu ekranına
    geri döner, hangi alanın yanlış olduğunu görür ve tekrar gönderir.

    Denetim istemcide de yapılıyor (aynı `lib/tckn.ts` fonksiyonu) ama kural
    BURADADIR: istemci denetimi devtools'la silinebilir ve `curl` onu hiç
    görmez.
  */
  const { tckn, ad, soyad, eposta } = kimlik
  if (!tckn || !tcknBicimiGecerli(tckn)) return mockaDon(request, locale, state, 'tckn')
  if (!ad || !soyad) return mockaDon(request, locale, state, 'isim')

  /*
    E-POSTA OPSİYONELDİR — ama girildiyse biçimi tutmak ZORUNDADIR.
    Gerçek e-Devlet Kapısı e-posta döndürmez; alanı zorunlu tutmak, gerçek
    akışta var olmayan bir veriyi şart koşmak olurdu.
  */
  if (eposta && !EPOSTA_DESENI.test(eposta)) {
    return mockaDon(request, locale, state, 'eposta')
  }

  const payload = await payloadClient()
  const ozet = kimlikOzeti(tckn)

  /**
   * E-POSTA VERİLMEDİĞİNDE ÜRETİLEN ADRES
   * ---------------------------------------------------------------------------
   * Payload'ın kimlik koleksiyonu e-posta ZORUNLU ve TEKİL tutar; oturum
   * açabilmek için bir adres gerekir. Kullanıcı vermediyse kimlik özetinden
   * türetilir.
   *
   * `.invalid` SEÇİLDİ — RFC 2606 ile "hiçbir zaman çözümlenmeyecek" diye
   * ayrılmış üst düzey addır. Böylece bu adrese YANLIŞLIKLA posta gönderilmesi
   * imkânsızdır. `.local` kullanılmadı: o mDNS'e ayrılmıştır ve yerel ağda
   * gerçekten çözümlenebilir.
   *
   * ÖZETTEN TÜRETİLİR, RASTGELE DEĞİL: aynı kişi her girişinde aynı adrese
   * düşsün. Rastgele olsaydı ikinci girişte tekillik kısıtı ihlal edilir ya da
   * ikinci bir hesap doğardı.
   *
   * DÜRÜST SINIR: böyle bir hesap parola sıfırlama postası ALAMAZ, yani
   * kullanıcı gerçek bir adres eklemeden parolayla giriş yapamaz. Aşağıdaki
   * yükseltme (`sonradan gerçek adres`) tam olarak bu köşeyi kapatır. Kurum
   * üretimde e-postayı zorunlu tutmak isterse bu bilinçli bir seçenektir.
   */
  const uretilmisEposta = `edevlet-${ozet.slice(0, 16)}@edevlet.invalid`
  const URETILMIS_SONEK = '@edevlet.invalid'

  /* --- Eşleştirme -------------------------------------------------------- */
  const mevcut = await payload.find({
    collection: 'users',
    where: { edevletSubject: { equals: ozet } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  let kullanici = mevcut.docs[0] as unknown as
    | { id: number | string; email: string; accountStatus?: string }
    | undefined

  if (kullanici) {
    /*
      Askıya alınmış hesap e-Devlet'ten de giremez. Aksi hâlde e-Devlet, kurumun
      kendi yaptırımını atlatan bir arka kapı olurdu.
    */
    if (kullanici.accountStatus === 'suspended') {
      return hataylaDon(request, locale, 'hesap_askida')
    }

    if (kullanici.accountStatus !== 'approved') {
      /*
        Kimliği e-Devlet doğruladığı için onay bekleyen bir eşleşme onaylanır.
        Bu duruma normalde düşülmez; yalnızca aşağıdaki iki adımlı oluşturmanın
        ikinci adımı bir kez başarısız olduysa oluşur.
      */
      await payload.update({
        collection: 'users',
        id: kullanici.id,
        data: { accountStatus: 'approved' } as never,
        overrideAccess: true,
        context: { skipRevalidate: true },
      })
    }

    /*
      ÜRETİLMİŞ ADRESİ GERÇEK ADRESLE DEĞİŞTİRME
      -------------------------------------------------------------------
      Kullanıcı ilk girişte e-posta vermemiş olabilir; o zaman hesap
      teslim edilemeyen bir `@edevlet.invalid` adresiyle açıldı ve parola
      sıfırlama postası ALAMAZ. Sonraki bir girişte gerçek bir adres
      yazarsa onu kaydetmek, kullanıcıyı o köşeden çıkarır.

      YALNIZCA ÜRETİLMİŞ ADRES ÜZERİNE YAZILIR. Kullanıcının daha önce
      girdiği gerçek bir adres SESSİZCE değiştirilmez: hesabın iletişim
      adresini habersiz değiştirmek, parola sıfırlamayı başka bir kutuya
      yönlendirmek demektir.

      Hedef adres başkasındaysa dokunulmaz ve akış sürer — kullanıcı zaten
      kendi hesabına giriyor, engellemenin bir faydası olmaz.
    */
    if (eposta && kullanici.email?.endsWith(URETILMIS_SONEK) && eposta !== kullanici.email) {
      const sahipli = await payload.find({
        collection: 'users',
        where: { email: { equals: eposta } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })

      if (sahipli.totalDocs === 0) {
        await payload.update({
          collection: 'users',
          id: kullanici.id,
          data: { email: eposta } as never,
          overrideAccess: true,
          context: { skipRevalidate: true },
        })
      }
    }
  } else {
    /* --- 5. katman: e-posta çakışması -> BİRLEŞTİRME YOK ---------------- */
    /*
      Yalnızca kullanıcı bir adres GİRDİYSE anlamlıdır: üretilmiş adres
      kimlik özetinden türer ve o özet zaten tekildir, dolayısıyla
      çakışamaz.
    */
    if (eposta) {
      const epostaSahibi = await payload.find({
        collection: 'users',
        where: { email: { equals: eposta } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })

      if (epostaSahibi.totalDocs > 0) {
        /*
          DÜZELTİLEBİLİR: kullanıcı kum havuzunda başka bir adres yazabilir
          (ya da alanı boş bırakabilir). Giriş sayfasına atmak, ona bu
          seçeneği hiç göstermezdi.
        */
        return mockaDon(request, locale, state, 'eposta_kullanimda')
      }
    }

    /*
      İKİ ADIMLI OLUŞTURMA — ÖLÇÜLMÜŞ ZORUNLULUK
      ---------------------------------------------------------------------
      `Users.beforeValidate` kancası, istekte KULLANICI YOKSA kaydı "dışarıdan
      gelen başvuru" sayar ve `accountStatus`u ZORLA `pending` yapar. Kanca
      `req.user`a bakar, `overrideAccess`e DEĞİL — bu oturumda ölçüldü:

          create({ overrideAccess: true, data: { accountStatus: 'approved' }})
          -> okunan: accountStatus = "pending"

      Sentetik bir yönetici kullanıcısı geçmek de işe yarardı ama o, güvenlik
      için var olan bir kancaya kod içinden atlanabilen bir kapı açmak olurdu.
      Bunun yerine kayıt kancanın kendi varsayılanıyla doğar ve AYRI bir
      güncellemeyle onaylanır: kanca yalnızca `create` işleminde sıyırır.

      Not: `role` ve `roles` için ayrıca bir şey yapmak GEREKMEZ — kancanın
      zorladığı değerler (`trainee`, `[]`) burada istenen değerlerin aynısıdır.
      Yani e-Devlet'le gelen kullanıcı panel yetkisi olmayan, aboneliği
      bulunmayan sıradan bir katılımcıdır ve yalnızca herkese açık kütüphane
      içeriğini görür.
    */
    const olusan = await payload.create({
      collection: 'users',
      overrideAccess: true,
      context: { skipRevalidate: true },
      data: {
        name: `${ad} ${soyad}`.replace(/\s+/g, ' ').trim(),
        /* Verilmediyse kimlik özetinden türeyen, teslim edilemez adres. */
        email: eposta || uretilmisEposta,
        /* Tahmin edilemez ve hiçbir yerde saklanmayan parola (bkz. lib/edevlet). */
        password: rastgeleParola(),
        edevletSubject: ozet,
      } as never,
    })

    const onaylanan = await payload.update({
      collection: 'users',
      id: olusan.id,
      data: { accountStatus: 'approved' } as never,
      overrideAccess: true,
      context: { skipRevalidate: true },
    })

    kullanici = onaylanan as unknown as { id: number | string; email: string }
  }

  /* --- Oturum ----------------------------------------------------------- */
  const collection = payload.collections['users']
  if (!collection) {
    /* Yapılandırma bozuksa sessizce oturum açmaktan iyidir. */
    return hataylaDon(request, locale, 'genel')
  }

  const req = await createLocalReq({ context: { skipRevalidate: true } }, payload)

  /*
    Oturum satırı yazılabilmesi için kullanıcının TAM kaydı gerekir
    (`sessions` dizisi dahil); yukarıdaki sorgular `depth: 0` ile geldi ama
    alan seçimi yapılmadı, yine de güvenli olması için kayıt yeniden okunur.
  */
  const tamKayit = await payload.findByID({
    collection: 'users',
    id: kullanici.id,
    overrideAccess: true,
    depth: 0,
  })

  const { sid } = await addSessionToUser({
    collectionConfig: collection.config,
    payload,
    req,
    user: tamKayit as never,
  })

  const fieldsToSign = getFieldsToSign({
    collectionConfig: collection.config,
    email: String((tamKayit as { email?: string }).email ?? kullanici.email),
    sid,
    user: tamKayit as never,
  })

  const { token } = await jwtSign({
    fieldsToSign,
    secret: payload.secret,
    tokenExpiration: collection.config.auth.tokenExpiration,
  })

  const cerezMetni = generatePayloadCookie({
    collectionAuthConfig: collection.config.auth,
    cookiePrefix: payload.config.cookiePrefix,
    token,
  })

  /*
    Giriş sonrası hedef, parolayla girişle AYNIDIR: kütüphane. İki yolun
    farklı yerlere düşmesi, kullanıcıya girişin farklı bir şey yaptığını
    düşündürürdü (bkz. LoginForm).
  */
  const yanit = NextResponse.redirect(
    new URL(routeHref('library', locale), request.nextUrl.origin),
  )

  /*
    ======================================================================
    İKİ ÇEREZ, TEK MEKANİZMA — ÖLÇÜLMÜŞ VE SESSİZ BİR TUZAK
    ======================================================================
    İlk sürüm şöyleydi:

        yanit.headers.append('Set-Cookie', cerezMetni)   // oturum çerezi
        yanit.cookies.delete(EDEVLET_STATE_COOKIE)       // state'i temizle

    Sonuç ÖLÇÜLDÜ (2026-09-26, akış HTTP katmanında tekrarlandı):

        set-cookie: aiftc-edevlet-state=; Path=/; Expires=Thu, 01 Jan 1970…

    Oturum çerezi YANITTAN KAYBOLMUŞTU. `NextResponse.cookies`, `Set-Cookie`
    başlığını KENDİ iç listesinden yeniden üretir; ham `append` ile eklenmiş
    bir değeri tanımaz ve üzerine yazar.

    Bu kusurun görünen yüzü çok yanıltıcıydı: yönlendirme doğru çalışıyor,
    kullanıcı kütüphaneye düşüyor, veritabanında hesap ve oturum satırı
    oluşuyordu — ama tarayıcıda oturum YOKTU. "Giriş çalışıyor" diye
    bakılırsa fark edilmez; ancak `/api/users/me` sorulursa görülür.

    Bu yüzden iki çerez de AYNI mekanizmayla, ham başlık olarak yazılır.
    `payload` çerezinin metnini Payload'ın kendi üreticisi verir; `state`
    çerezi ise geçmiş bir tarihle geçersizleştirilir (silmenin standart yolu).
  */
  yanit.headers.append('Set-Cookie', cerezMetni)
  yanit.headers.append('Set-Cookie', STATE_SIL)

  return yanit
}

export const GET = isle
export const POST = isle
