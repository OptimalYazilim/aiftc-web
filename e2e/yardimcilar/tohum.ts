import { getPayload, type Payload } from 'payload'

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

/*
  FONKSİYON — NESNE DEĞİL. Aynı `context` nesnesini birden çok Payload
  çağrısına geçirmek ölçülmüş bir veri kaybı tuzağıdır: eklentiler o nesneye
  bayrak yazar (örn. `skipCloudStorage`) ve bayrak sonraki çağrılara sızarak
  işlemleri SESSİZCE atlatır. Her yazma taze bir bağlam alır.
*/
const yaz = () => ({ context: ctx(), user: YONETICI_BAGLAMI, overrideAccess: true }) as const

export type TohumSonucu = {
  konuId: number
  egitimId: number
  egitimSlug: string
  egitimBasligi: string
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
 */
export const tohumla = async (): Promise<TohumSonucu> => {
  const payload = await payloadIstemcisi()
  await temizle()

  /* Eğitim programının zorunlu `topics` ilişkisi için önkoşul kayıt. */
  const konu = await payload.create({
    ...yaz(),
    collection: 'training-topics',
    locale: 'tr',
    data: {
      title: `${TEST_ONEKI} Orman Yangınlarıyla Mücadele`,
      slug: `${TEST_ONEKI}-orman-yanginlari`,
      summary: 'E2E testleri için üretilmiş konu kaydıdır.',
      category: 'forest-fires',
      _status: 'published',
    } as never,
  })

  const egitimBasligi = `${TEST_ONEKI} Orman Yangını Erken Uyarı Çalıştayı`

  /*
    BAŞVURUYA AÇIK + İLETİŞİM HEDEFLİ bir eğitim.
    İki alan da senaryonun ön koşuludur:
      status = applications-open  -> düğme etkin gelir
      applicationTarget.type = contact -> düğme iletişim formuna gider
    Başka bir durumda `ApplicationCta` devre dışı düğme ya da harici bağlantı
    basar ve senaryo hiç başlamaz.
  */
  const egitim = await payload.create({
    ...yaz(),
    collection: 'training-programs',
    locale: 'tr',
    data: {
      title: egitimBasligi,
      slug: `${TEST_ONEKI}-erken-uyari-calistayi`,
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
      applicationTarget: { type: 'contact', contactUnit: `${TEST_ONEKI} Eğitim Birimi` },
      _status: 'published',
    } as never,
  })

  return {
    konuId: Number(konu.id),
    egitimId: Number(egitim.id),
    egitimSlug: String((egitim as { slug?: string }).slug),
    egitimBasligi,
  }
}

/**
 * Önekli her kaydı siler. Koşu ÖNCESİ ve SONRASI çağrılır:
 *   - öncesi: bir önceki koşu çökmüşse artık veri kalmış olabilir,
 *   - sonrası: veritabanı bir sonraki koşu için temiz kalsın.
 * Yalnızca sonrasında temizlemek, çöken bir koşudan sonra testlerin
 * "zaten var" hatalarıyla kırılmasına yol açardı.
 */
export const temizle = async (): Promise<void> => {
  const payload = await payloadIstemcisi()

  await payload.delete({
    ...yaz(),
    collection: 'form-requests',
    where: { or: [{ subject: { like: TEST_ONEKI } }, { email: { like: TEST_ONEKI } }] },
  })
  await payload.delete({
    ...yaz(),
    collection: 'training-programs',
    where: { slug: { like: TEST_ONEKI } },
  })
  /* Programlardan SONRA: ilişki hedefini önce silmek yetim satır bırakırdı. */
  await payload.delete({
    ...yaz(),
    collection: 'training-topics',
    where: { slug: { like: TEST_ONEKI } },
  })
  await payload.delete({
    ...yaz(),
    collection: 'library-resources',
    where: { slug: { like: TEST_ONEKI } },
  })
  await payload.delete({
    ...yaz(),
    collection: 'subscription-plans',
    where: { slug: { like: TEST_ONEKI } },
  })
  await payload.delete({
    ...yaz(),
    collection: 'users',
    where: { email: { like: TEST_ONEKI } },
  })
}
