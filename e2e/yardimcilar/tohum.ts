import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'

import config from '../../src/payload.config.js'

/**
 * TEST VERİSİ — TOHUMLAMA VE TEMİZLİK
 * ============================================================================
 * Tüm test verisi `TEST_ONEKI` ile işaretlenir. Temizlik bu öneke bakar;
 * elle eklenmiş içeriğe dokunmaz. (Test veritabanı zaten ayrıdır, ama önek
 * yanlış veritabanına bağlanma hâlinde İKİNCİ savunma hattıdır.)
 * ============================================================================
 */
export const TEST_ONEKI = 'e2e'

/** Bir testin kendi e-posta adresi — koşular arasında çakışmaz. */
export const testEpostasi = (ad: string) => `${TEST_ONEKI}-${ad}@example.test`

export const TEST_PAROLASI = 'E2eTestParolasi2026!'

let istemci: Payload | null = null

export const payloadIstemcisi = async (): Promise<Payload> => {
  if (!istemci) istemci = await getPayload({ config })
  return istemci
}

/**
 * YÖNETİCİ BAĞLAMI — ÖLÇÜLMÜŞ BİR TUZAK
 * ---------------------------------------------------------------------------
 * `Users.beforeValidate` kancası, istekte KULLANICI YOKSA kaydı "dışarıdan
 * gelen başvuru" sayar ve `role`, `roles`, `accountStatus`, `subscriptionPlan`
 * alanlarını ZORLA sıfırlar. Kanca `req.user`a bakar; `overrideAccess`e DEĞİL.
 *
 * Yani `payload.create({ ..., overrideAccess: true })` tek başına YETMEZ:
 * hesap yine `pending` + `trainee` doğar ve giriş yapamaz — `beforeLogin`
 * onaysız hesabı 403 ile geri çevirir. Bu oturumda iki kez ölçüldü.
 *
 * Bu yüzden her yazma işlemine sentetik bir yönetici bağlamı geçilir. Gerçek
 * bir yönetici kaydı GEREKMEZ (boş veritabanında zaten yoktur): kanca yalnızca
 * `req.user`ın varlığına, alan düzeyi erişim ise `roles` içeriğine bakar.
 */
const YONETICI_BAGLAMI = {
  id: 0,
  email: 'e2e-tohumlayici@example.test',
  roles: ['admin'],
  role: 'admin',
  collection: 'users',
} as unknown as Parameters<Payload['create']>[0]['user']

/** Her yazmada TAZE nesne: paylaşılan `context` sonraki çağrıları bozar. */
const ctx = () => ({ skipRevalidate: true })

/**
 * YAZMA BAĞLAMI — SENTETİK YÖNETİCİ YALNIZCA İLK YAZMADA KULLANILIR
 * ---------------------------------------------------------------------------
 * ÖLÇÜLMÜŞ HATA (2026-09-26):
 *   insert or update on table "library_resources" violates foreign key
 *   constraint "library_resources_uploaded_by_id_users_id_fk"
 *   params: ... uploaded_by_id = 0
 *
 * `LibraryResources.uploadedBy` alanının `beforeChange` kancası
 * `req.user?.id` yazar. Sentetik yöneticinin `id: 0` değeri VERİTABANINDA
 * YOKTUR, dolayısıyla yabancı anahtar kısıtı kaydı reddetti. Kancanın
 * docblock'u "tohum betikleri kullanıcısız çalışır, alan boş kalır" diyor —
 * sentetik bir kullanıcı tam olarak o varsayımı bozuyor.
 *
 * Çözüm: önce GERÇEK bir yönetici kaydı üretilir, sonra bütün yazmalar onun
 * kimliğiyle yapılır. Böylece `req.user.id`den türeyen her alan geçerli bir
 * satıra işaret eder. Sentetik bağlam yalnızca o ilk kaydı oluştururken
 * gerekir (yumurta-tavuk: `beforeValidate` rolleri sıyırmasın diye).
 *
 * `uploadedBy: null` vermek de mümkündü ama kanca değeri yine ezerdi ve
 * çözüm ileride eklenecek benzer alanlarda sessizce tekrar kırılırdı.
 */
let yazanKullanici: Parameters<Payload['create']>[0]['user'] = YONETICI_BAGLAMI

/*
  FONKSİYON — NESNE DEĞİL. Aynı `context` nesnesini birden çok Payload
  çağrısına geçirmek ölçülmüş bir veri kaybı tuzağıdır: eklentiler o nesneye
  bayrak yazar (örn. `skipCloudStorage`) ve bayrak sonraki çağrılara sızarak
  işlemleri SESSİZCE atlatır. Her yazma taze bir bağlam alır.
*/
const yaz = () => ({ context: ctx(), user: yazanKullanici, overrideAccess: true }) as const

/**
 * Geçerli bir PNG üretir.
 *
 * Elde yazılmış sahte bir bayt dizisi KULLANILMAZ: Payload yüklenen dosyanın
 * sihirli baytlarını doğrular ve `imageSizes` için sharp'tan geçirir. Bu
 * oturumda bir kez ölçüldü — geçersiz başlıklı bir dosyayı tümden reddetmişti.
 * `sharp` zaten projenin doğrudan bağımlılığıdır.
 */
export const pngUret = (genislik = 96, yukseklik = 72): Promise<Buffer> =>
  sharp({
    create: {
      width: genislik,
      height: yukseklik,
      channels: 3,
      background: { r: 24, g: 64, b: 44 },
    },
  })
    .png()
    .toBuffer()

/**
 * TOHUM ADLARI — TEK KAYNAK
 * ---------------------------------------------------------------------------
 * Hem tohumlama hem testler bu sabitleri kullanır. Başlıklar iki yerde ayrı
 * ayrı yazılsaydı biri değiştiğinde test "kayıt görünmüyor" diye kırılır ve
 * hata erişim kuralında sanılırdı — oysa sebep yalnızca metin farkı olurdu.
 *
 * Türkçe karakterler BİLİNÇLİ OLARAK KULLANILMIYOR: bu değerler `slug`
 * üretimine ve `like` sorgularına giriyor; ASCII kalmaları eşleşmeyi
 * öngörülebilir tutar.
 */
export const ADLAR = {
  egitimSlug: `${TEST_ONEKI}-erken-uyari-calistayi`,
  egitimBasligi: `${TEST_ONEKI} Orman Yangını Erken Uyarı Çalıştayı`,
  acikKayit: `${TEST_ONEKI} Herkese Acik Yangin Raporu`,
  kisitliKayit: `${TEST_ONEKI} Katilimciya Ozel Egitim Rehberi`,
  kisitliSlug: `${TEST_ONEKI}-kisitli-rehber`,
  acikSlug: `${TEST_ONEKI}-acik-rapor`,
  personelSlug: `${TEST_ONEKI}-personel-raporu`,
  personelKaydi: `${TEST_ONEKI} Personele Ozel Ic Rapor`,
  album: `${TEST_ONEKI} Saha Uygulamasi Fotograflari`,
  albumSlug: `${TEST_ONEKI}-saha-fotograflari`,
  personelBelgesi: `${TEST_ONEKI} Personele Ozel Belge`,
  kendiTalep: `${TEST_ONEKI} Kendi Basvurum`,
  yabanciTalep: `${TEST_ONEKI} Baskasinin Basvurusu`,
  katilimciAdi: `${TEST_ONEKI} Test Katilimcisi`,
} as const

export type TohumSonucu = {
  konuId: number
  egitimId: number
  egitimSlug: string
  egitimBasligi: string
  planId: number
  katilimciId: number
  katilimciEpostasi: string
  katilimciAdi: string
  acikKayitBasligi: string
  kisitliKayitBasligi: string
  personelKaydiBasligi: string
  albumSlug: string
  albumBasligi: string
  personelBelgesiAdresi: string
  personelBelgesiDosyaAdi: string
  kendiTalepKonusu: string
  yabanciTalepKonusu: string
}

/**
 * Senaryoların ihtiyaç duyduğu asgari içerik.
 *
 * "Asgari" bilinçlidir: testler yalnızca doğruladıkları veriye bağlı olmalıdır.
 * Zengin bir tohum kümesi, bir testin farkında olmadan başka bir kaydın
 * varlığına yaslanmasına ve o kayıt değişince açıklanamaz biçimde kırılmasına
 * yol açar.
 *
 * ---------------------------------------------------------------------------
 * ZORUNLU ALANLAR ŞEMADAN OKUNDU — TAHMİN EDİLMEDİ
 * ---------------------------------------------------------------------------
 * İlk sürüm yalnızca başlık, slug ve durum veriyordu; Payload doğrulaması
 * `summary`, `topics`, `startDate` ve `instructionLanguages` eksik diye
 * kaydı reddetti. Bu alanlar koleksiyonda `required: true` işaretlidir
 * (TrainingPrograms.ts). `topics` bir İLİŞKİ olduğu için önce bir eğitim
 * konusu kaydı üretilir — o da kendi zorunlu alanlarını ister.
 *
 * ---------------------------------------------------------------------------
 * ÜÇ ERİŞİM SEVİYESİ BİLİNÇLİ OLARAK TOHUMLANIR
 * ---------------------------------------------------------------------------
 *   public   → herkes görür
 *   trainee  → yalnızca aboneliği GEÇERLİ katılımcı görür
 *   staff    → katılımcı GÖRMEZ (hesabı onaylı olsa bile)
 *
 * Üçüncüsü olmadan negatif test kurulamaz: yalnızca "public + trainee"
 * tohumlanırsa, erişim kuralı "oturum varsa her şeyi göster" biçiminde bozulsa
 * dahi testler yeşil kalırdı.
 */
/**
 * Slug'a göre GÜNCELLE ya da OLUŞTUR. Var olan kaydın id'si korunur; alanlar
 * her koşuda tohumdaki değere sıfırlanır (bir önceki koşu ne bırakmış olursa
 * olsun içerik deterministiktir). Gerekçe `tohumla` içinde.
 */
const slugaGoreYaz = async (
  collection: 'training-topics' | 'training-programs',
  slug: string,
  args: { locale: 'tr'; data: never },
) => {
  const payload = await payloadIstemcisi()
  const mevcut = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const varOlan = mevcut.docs[0]
  if (varOlan) {
    return payload.update({ ...yaz(), collection, id: varOlan.id, ...args })
  }
  return payload.create({ ...yaz(), collection, ...args })
}

export const tohumla = async (): Promise<TohumSonucu> => {
  const payload = await payloadIstemcisi()

  /*
    Önceki koşu çökmüşse artık veri kalmış olabilir — TEMİZLENİR; ama eğitim
    ve konu kayıtları KORUNUR ve aşağıda slug'a göre GÜNCELLENİR. Gerekçe
    uzun, çünkü ölçülmüş ve yanıltıcı bir yarışın çözümü:

    DERLEME, TOHUMLAMADAN ÖNCE ÇALIŞIR. Playwright önce `webServer`
    (next build) sonra globalSetup'ı koşturur. Eğitim künyesi sayfası ISR ile
    ÖN ÜRETİLİR ve "Ön Başvuru Yap" düğmesi eğitimin id'sini adrese gömer.
    Önceki koşunun temizliği çökmüşse derleme anında veritabanında ESKİ eğitim
    durur, sayfa onun id'siyle üretilir; tohum sonra eğitimi silip yeniden
    yaratır (YENİ id) ve test, eski id'yi taşıyan düğmeye tıklar. Başvuru
    formu yeni id'yi listeler, eski id'yi bulamaz, ön seçim tutmaz:

        Expected: "21"   Received: ""      (2026-09-28, koşu Q)

    Aynı kod tek başına koştuğunda 5/5 geçiyordu — hata koddaki değil,
    koşular ARASINDAKİ durumdaydı. Sil+yarat yerine slug'a göre güncelleme,
    id'yi koşular arasında SABİT tutar; artık ne bırakılırsa bırakılsın
    ön üretilmiş sayfa doğru id'ye işaret eder. CI'da da geçerli: veritabanı
    koşular arasında yaşar, çöken bir koşu sonrakini zehirleyebilirdi.
  */
  yazanKullanici = YONETICI_BAGLAMI
  await temizle({ egitimleriKoru: true })

  /*
    PANEL ANAHTARLARI BİLİNEN DURUMDAN BAŞLAR.
    Bazı senaryolar global ayarları açıp kapatır ve sonda eski hâline getirir
    (07: vatandaş e-Devlet girişi, 13: konaklama ön başvurusu, 15: genel
    kayıt). Koşu yarıda kesilirse — süreç öldürülür ya da çökerse; bu makinede
    2026-09-30'da koşular bellek yetersizliğinden birkaç kez durduruldu —
    `afterAll` hiç çalışmaz ve anahtar AÇIK kalabilir. Global ayarlar
    `temizle`nin sildiği kayıtlardan değildir; açık kalan anahtar sonraki
    koşuda başka senaryoları bozar: konaklama açık kalırsa başvuru formunda
    ikinci bir onay kutusu belirir ve `getByRole('checkbox')` kullanan
    senaryolar (01, 06, 12) "birden fazla öğe" hatasıyla kırılır — hatanın
    görünen yeri ile sebebi birbirinden çok uzaktır.
  */
  await payload.updateGlobal({
    slug: 'external-services',
    data: { edevlet: { citizenLoginEnabled: false } },
    context: ctx(),
    overrideAccess: true,
  })
  await payload.updateGlobal({
    slug: 'accommodation-settings',
    data: { enabled: false, capacity: null, rateInTraining: null, rateOutsideTraining: null, closedPeriods: [] },
    context: ctx(),
    overrideAccess: true,
  })
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { accounts: { publicRegistrationEnabled: false } },
    context: ctx(),
    overrideAccess: true,
  })

  /* -- GERÇEK yönetici: bundan sonraki her yazma onun kimliğiyle yapılır -- */
  /*
    Gerekçe `yazanKullanici` tanımının üstünde. Kısaca: `req.user.id`den türeyen
    ilişki alanları (örn. `LibraryResources.uploadedBy`) geçerli bir kullanıcı
    satırına işaret etmek ZORUNDADIR.
  */
  const yonetici = await payload.create({
    ...yaz(),
    collection: 'users',
    data: {
      name: `${TEST_ONEKI} Tohumlayici Yonetici`,
      email: testEpostasi('yonetici'),
      password: TEST_PAROLASI,
      roles: ['admin'],
      role: 'admin',
      accountStatus: 'approved',
    } as never,
  })
  yazanKullanici = yonetici as unknown as Parameters<Payload['create']>[0]['user']

  /* -- Eğitim konusu: eğitim programının zorunlu `topics` ilişkisi -------- */
  const konu = await slugaGoreYaz('training-topics', `${TEST_ONEKI}-orman-yanginlari`, {
    locale: 'tr',
    data: {
      title: `${TEST_ONEKI} Orman Yangınlarıyla Mücadele`,
      slug: `${TEST_ONEKI}-orman-yanginlari`,
      summary: 'E2E testleri için üretilmiş konu kaydıdır.',
      category: 'forest-fires',
      _status: 'published',
    } as never,
  })

  const egitimBasligi = ADLAR.egitimBasligi

  /*
    KAPAK GÖRSELİ — kurum kuralı (29.09.2026): yayındaki eğitimde en az bir
    fotoğraf olmalı ve kural kullanıcı adına yapılan yazmalarda işler
    (TrainingPrograms.coverImage). Tohum GERÇEK bir yönetici kimliğiyle
    yazdığı için eğitim de kurala uymak zorundadır.
  */
  const egitimKapagi = await payload.create({
    ...yaz(),
    collection: 'media',
    locale: 'tr',
    data: { alt: `${TEST_ONEKI} egitim kapagi` } as never,
    file: {
      data: await pngUret(),
      mimetype: 'image/png',
      name: `${TEST_ONEKI}-egitim-kapagi.png`,
      size: 0,
    },
  })

  /*
    BAŞVURUYA AÇIK + İLETİŞİM HEDEFLİ bir eğitim.
    İki alan da senaryonun ön koşuludur:
      status = applications-open             -> düğme etkin gelir
      applicationTarget.type = registration  -> düğme site içi başvuru formuna gider
    Başka bir durumda `ApplicationCta` devre dışı düğme ya da harici bağlantı
    basar ve senaryo hiç başlamaz.
  */
  const egitim = await slugaGoreYaz('training-programs', ADLAR.egitimSlug, {
    locale: 'tr',
    data: {
      title: egitimBasligi,
      slug: ADLAR.egitimSlug,
      status: 'applications-open',
      summary: 'E2E testleri için üretilmiş eğitim kaydıdır. Gerçek bir programı temsil etmez.',
      topics: [konu.id],
      /*
        SABİT TARİH — `Date.now()` DEĞİL.
        Göreli bir tarih, koşu tarihine göre eğitimi "geçmiş" yapıp listeleme
        ve durum rozetini değiştirebilirdi; test o zaman takvime bağlı olarak
        açıklanamaz biçimde kırılırdı.
      */
      startDate: '2030-06-10T06:00:00.000Z',
      endDate: '2030-06-14T13:00:00.000Z',
      deliveryMode: 'in-person',
      venue: `${TEST_ONEKI} Test Kampüsü`,
      instructionLanguages: ['tr', 'en'],
      certificateType: 'attendance',
      /* 'registration': düğme site içi başvuru formuna gider (Registrations). */
      applicationTarget: { type: 'registration', contactUnit: `${TEST_ONEKI} Eğitim Birimi` },
      coverImage: egitimKapagi.id,
      _status: 'published',
    } as never,
  })

  /* -- Abonelik paketi ---------------------------------------------------- */
  /*
    Katılımcı hesabının seviyeli içeriği görebilmesi için GEÇERLİ bir abonelik
    ZORUNLUDUR: `libraryReadAccess` içindeki abonelik kapısı, rolü yetse bile
    aboneliği eksik olan katılımcıyı anonim seviyesine düşürür (Kılavuz 5.6).
  */
  const plan = await payload.create({
    ...yaz(),
    collection: 'subscription-plans',
    locale: 'tr',
    data: {
      name: `${TEST_ONEKI} Kurumsal Paket`,
      currency: 'TRY',
      _status: 'published',
    } as never,
  })

  /* -- Onaylı katılımcı hesabı -------------------------------------------- */
  const katilimciEpostasi = testEpostasi('katilimci')
  const katilimciAdi = ADLAR.katilimciAdi

  const katilimci = await payload.create({
    ...yaz(),
    collection: 'users',
    data: {
      name: katilimciAdi,
      email: katilimciEpostasi,
      password: TEST_PAROLASI,
      /*
        `roles` BOŞ KALIR — bilinçli. Panel rolü verilen bir hesap
        `libraryReadAccess` içinde "muaf" sayılır ve HER ŞEYİ görür; o zaman
        seviye kapısı hiç sınanmamış olurdu. Bu hesap dışarıdan gelen sıradan
        bir katılımcıyı temsil eder.
      */
      roles: [],
      role: 'trainee',
      accountStatus: 'approved',
      unit: `${TEST_ONEKI} Test Kurumu`,
      subscriptionPlan: plan.id,
      /* Sabit ve uzak bir tarih: koşu tarihine göre süresi dolmasın. */
      subscriptionEndsAt: '2030-12-31T00:00:00.000Z',
    } as never,
  })

  /*
    OKUYUP DOĞRULA — SESSİZ SIYIRMAYA KARŞI.
    `beforeValidate` kancası alanları sıyırırsa hesap `pending` + `trainee`
    doğar, giriş 403 alır ve testler "giriş yapılamadı" diye kırılır; sebebi
    ise tohumda olur. Burada yükseltilen hata kök nedeni doğrudan söyler.
  */
  const yazilan = await payload.findByID({
    collection: 'users',
    id: katilimci.id,
    overrideAccess: true,
    depth: 0,
  })
  const yazilanDurum = (yazilan as { accountStatus?: unknown }).accountStatus
  const yazilanRol = (yazilan as { role?: unknown }).role
  if (yazilanDurum !== 'approved' || yazilanRol !== 'trainee') {
    throw new Error(
      `[e2e] Tohumlanan hesap beklenen hâlde değil (accountStatus=${String(yazilanDurum)}, ` +
        `role=${String(yazilanRol)}). Users.beforeValidate alanları sıyırmış olabilir — ` +
        'yazma çağrısına yönetici bağlamı geçildiğini doğrulayın.',
    )
  }

  /* -- Kütüphane: üç erişim seviyesi -------------------------------------- */
  /*
    TAM SLUG ALIR, EK ALMAZ.
    Önceki sürüm son eki alıp başına öneki kendisi ekliyordu; sonuç olarak
    aynı slug iki yerde kodlanmış oluyordu (`ADLAR.albumSlug` ve buradaki
    `'saha-fotograflari'`). Biri değişip öteki kalsa test "kayıt yok" diye
    kırılır ve hata erişim kuralında sanılırdı. Artık tek kaynak `ADLAR`.
  */
  const kutuphaneKaydi = (
    slug: string,
    baslik: string,
    accessLevel: string,
    ek: Record<string, unknown> = {},
  ) =>
    payload.create({
      ...yaz(),
      collection: 'library-resources',
      locale: 'tr',
      data: {
        title: baslik,
        slug,
        accessLevel,
        resourceType: 'report',
        publicationYear: 2026,
        _status: 'published',
        ...ek,
      } as never,
    })

  const acikKayitBasligi = ADLAR.acikKayit
  const kisitliKayitBasligi = ADLAR.kisitliKayit
  const personelKaydiBasligi = ADLAR.personelKaydi

  await kutuphaneKaydi(ADLAR.acikSlug, acikKayitBasligi, 'public')
  await kutuphaneKaydi(ADLAR.kisitliSlug, kisitliKayitBasligi, 'trainee')
  await kutuphaneKaydi(ADLAR.personelSlug, personelKaydiBasligi, 'staff')

  /* -- Fotoğraf albümü: modal (lightbox) senaryosu için ------------------- */
  /*
    Modal testinin gerçek bir `<dialog>`a ihtiyacı var. Projede modal yalnızca
    kütüphane künyesinde açılır (galeri ve video oynatıcı), bu yüzden albüm
    kaydı tohumlanır. Seviye `public`: modal davranışı oturumdan BAĞIMSIZ
    sınanmalıdır, aksi hâlde test hem girişe hem modala bağlanırdı ve
    ikisinden hangisinin bozulduğu belirsiz kalırdı.
  */
  const gorseller = await Promise.all(
    [1, 2, 3].map(async (sira) =>
      payload.create({
        ...yaz(),
        collection: 'media',
        locale: 'tr',
        data: { alt: `${TEST_ONEKI} test gorseli ${sira}` } as never,
        file: {
          data: await pngUret(),
          mimetype: 'image/png',
          name: `${TEST_ONEKI}-gorsel-${sira}.png`,
          size: 0,
        },
      }),
    ),
  )

  const albumBasligi = ADLAR.album
  const albumSlug = ADLAR.albumSlug
  await kutuphaneKaydi(ADLAR.albumSlug, albumBasligi, 'public', {
    resourceType: 'photo-album',
    gallery: gorseller.map((gorsel) => gorsel.id),
  })

  /* -- Personele özel BELGE DOSYASI: indirme kapısı senaryosu ------------- */
  /*
    Seviye `staff` seçildi. Katılımcı hesabı ONAYLI ve aboneliği GEÇERLİDİR —
    yani reddedilmesinin tek sebebi belgenin SEVİYESİDİR. "Oturumsuz kullanıcı
    reddedilir" testi bundan çok daha zayıf olurdu: kural "oturum var mı"
    biçimine bozulsa bile o test geçmeye devam ederdi.
  */
  const belge = await payload.create({
    ...yaz(),
    collection: 'document-files',
    locale: 'tr',
    data: {
      title: ADLAR.personelBelgesi,
      documentType: 'report',
      accessLevel: 'staff',
    } as never,
    file: {
      data: await pngUret(48, 48),
      mimetype: 'image/png',
      name: `${TEST_ONEKI}-personel-belgesi.png`,
      size: 0,
    },
  })

  const belgeAdi = (belge as { filename?: string | null }).filename
  if (!belgeAdi) {
    throw new Error('[e2e] Belge dosyası yüklenemedi: filename boş döndü.')
  }

  /* -- Form talepleri: biri katılımcının, biri BAŞKASININ ----------------- */
  /*
    İkinci kayıt testin çekirdeğidir. Profil sayfası yalnızca kendi kayıtlarını
    göstermeli; karşılaştırılacak bir YABANCI kayıt olmadan "sızıntı yok"
    iddiası ölçülemez. (Bu sızıntı gerçekten yaşandı: `FormRequests.read`
    `isAuthenticated` iken her onaylı ziyaretçi herkesin başvurusunu
    görüyordu.)
  */
  const kendiTalepKonusu = ADLAR.kendiTalep
  const yabanciTalepKonusu = ADLAR.yabanciTalep

  const talep = (eposta: string, ad: string, konuMetni: string) =>
    payload.create({
      ...yaz(),
      collection: 'form-requests',
      data: {
        submissionType: 'training-application',
        status: 'pending',
        fullName: ad,
        email: eposta,
        subject: konuMetni,
        message: 'E2E testleri için üretilmiş talep kaydıdır.',
        relatedTraining: egitim.id,
      } as never,
    })

  await talep(katilimciEpostasi, katilimciAdi, kendiTalepKonusu)
  await talep(testEpostasi('yabanci'), `${TEST_ONEKI} Yabanci Kisi`, yabanciTalepKonusu)

  return {
    konuId: Number(konu.id),
    egitimId: Number(egitim.id),
    egitimSlug: String((egitim as { slug?: string }).slug),
    egitimBasligi,
    planId: Number(plan.id),
    katilimciId: Number(katilimci.id),
    katilimciEpostasi,
    katilimciAdi,
    acikKayitBasligi,
    kisitliKayitBasligi,
    personelKaydiBasligi,
    albumSlug,
    albumBasligi,
    personelBelgesiAdresi: `/api/document-files/file/${encodeURIComponent(belgeAdi)}`,
    personelBelgesiDosyaAdi: belgeAdi,
    kendiTalepKonusu,
    yabanciTalepKonusu,
  }
}

/**
 * Önekli her kaydı siler. Koşu ÖNCESİ ve SONRASI çağrılır:
 *   - öncesi: bir önceki koşu çökmüşse artık veri kalmış olabilir,
 *   - sonrası: veritabanı bir sonraki koşu için temiz kalsın.
 * Yalnızca sonrasında temizlemek, çöken bir koşudan sonra testlerin
 * "zaten var" hatalarıyla kırılmasına yol açardı.
 *
 * ---------------------------------------------------------------------------
 * SIRA İLİŞKİLERE GÖREDİR
 * ---------------------------------------------------------------------------
 * Bağımlı kayıt ÖNCE silinir: kütüphane kaydı galeriye ve belge dosyasına,
 * kullanıcı da abonelik paketine bağlıdır. Ters sırada silmek yetim ilişki
 * satırları bırakır.
 *
 * `subscription-plans` ADA göre silinir, slug'a göre DEĞİL: bu koleksiyonda
 * `slug` alanı YOKTUR (şemadan doğrulandı). Önceki sürüm slug'a bakıyordu ve
 * hiçbir paketi silmiyordu — sessiz bir artık bırakıyordu.
 */
export const temizle = async (secenek: { egitimleriKoru?: boolean } = {}): Promise<void> => {
  const payload = await payloadIstemcisi()

  const sil = async (collection: string, where: Record<string, unknown>) => {
    await payload.delete({ ...yaz(), collection: collection as never, where: where as never })
  }

  await sil('form-requests', {
    or: [{ subject: { like: TEST_ONEKI } }, { email: { like: TEST_ONEKI } }],
  })
  await sil('library-resources', { slug: { like: TEST_ONEKI } })
  /*
    EĞİTİMLERDEN ÖNCE — ÖLÇÜLMÜŞ ZORUNLULUK. `registrations.training` NOT NULL,
    yabancı anahtar ise ON DELETE set null: başvurusu olan eğitim silinince
    Postgres NULL yazamaz, işlem düşer ve temizlik 'transaction is aborted'
    ile kırılır. Üretimde aynı durumu guardRegistrations kancası anlaşılır
    bir mesajla durdurur; burada sıra doğru kurulur.
  */
  /* Konaklama talepleri başvuruya bağlıdır; önce onlar (bağ set null olsa da artık kalmasın). */
  await sil('accommodation-requests', { email: { like: TEST_ONEKI } })
  await sil('registrations', { email: { like: TEST_ONEKI } })
  /*
    Koşu BAŞINDA eğitim ve konu korunur (id sabit kalsın — gerekçe tohumla
    içinde); koşu SONUNDA hepsi silinir, veritabanı temiz kalır.
  */
  if (!secenek.egitimleriKoru) {
    await sil('training-programs', { slug: { like: TEST_ONEKI } })
    /* Programlardan SONRA: ilişki hedefini önce silmek yetim satır bırakırdı. */
    await sil('training-topics', { slug: { like: TEST_ONEKI } })
  }
  await sil('document-files', { title: { like: TEST_ONEKI } })
  await sil('media', { alt: { like: TEST_ONEKI } })
  await sil('users', { email: { like: TEST_ONEKI } })
  /* Kullanıcılardan SONRA: hesaplar pakete bağlıdır. */
  await sil('subscription-plans', { name: { like: TEST_ONEKI } })
}
