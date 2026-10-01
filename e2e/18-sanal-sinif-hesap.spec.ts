import { expect, test, type Page } from '@playwright/test'

import { epostaAlani, girisYap, parolaAlani } from './yardimcilar/oturum'
import { ADLAR, payloadIstemcisi, TEST_ONEKI, TEST_PAROLASI, testEpostasi } from './yardimcilar/tohum'

/**
 * SENARYO 18 — SANAL SINIF: HESAPLA GİRİŞ, ŞİFRE YEDEK
 * ============================================================================
 * Proje kararı (2026-10-01): sanal sınıfa hesapla girilir, katılım şifresi
 * yedek yol olarak kalır; her giriş kayda alınır (`classroom-attendance`).
 *
 * Kurgu — tohum eğitimine bağlı iki oda, ikisi de ŞU AN saat içinde:
 *   A: açık   ·   B: kapalı (oda kapalıyken hiçbir yol kapı açmaz)
 * Üç hesap:
 *   ONAYLI   başvurusu hesaba bağlı, onaylı      → şifresiz girer
 *   EPOSTA   başvurusu hesaba BAĞLI DEĞİL, e-posta BÜYÜK harfle yazılmış,
 *            onaylı                               → e-posta eşleşmesiyle girer
 *   BEKLEYEN başvurusu hesaba bağlı ama bekliyor  → düğme yok, şifreyle girer
 *
 * Olumlu her iddianın yanında olumsuzu var: düğme bir davettir, karar
 * sunucudadır — bu yüzden başvuru düğme göründükten SONRA geri çekilir ve
 * tıklamanın reddedildiği ölçülür.
 * ============================================================================
 */

const ctx = () => ({ skipRevalidate: true })

const ONAYLI = testEpostasi('sinif-onayli')
const EPOSTA = testEpostasi('sinif-eposta')
const BEKLEYEN = testEpostasi('sinif-bekleyen')
/* Test değerleri — kurumun şifreleri değil; sonda silinir. */
const KATILIMCI_SIFRESI = 'E2E-katilimci-sifre-2026'
const EGITMEN_SIFRESI = 'E2E-egitmen-sifre-2026'
const TOPLANTI = 'https://meet.example.test/e2e-oda'

type Ileti = { to?: unknown; subject?: unknown; text?: unknown }
type GirisSatiri = {
  method?: string
  role?: string
  fullName?: string | null
  email?: string | null
  user?: number | null
  registration?: number | null
}

const k = {
  egitimId: 0,
  odaA: 0,
  odaB: 0,
  odaABasligi: `${TEST_ONEKI} Canli Oturum A`,
  odaBBasligi: `${TEST_ONEKI} Canli Oturum B`,
  onayliId: 0,
  epostaId: 0,
  bekleyenId: 0,
  onayliKayit: 0,
  epostaKayit: 0,
  yoneticiBaglami: null as unknown,
  iletiler: [] as Ileti[],
}

const odaAdresi = (id: number) => `/tr/sanal-sinif/${id}`

const girisler = async (odaId: number, where: Record<string, unknown> = {}) => {
  const payload = await payloadIstemcisi()
  const r = await payload.find({
    collection: 'classroom-attendance',
    where: { and: [{ room: { equals: odaId } }, where] } as never,
    depth: 0,
    limit: 50,
    overrideAccess: true,
  })
  return r.docs as unknown as GirisSatiri[]
}

const sahne = (page: Page) => page.getByText('Doğrulandı. Aşağıdaki bağlantıdan oturuma katılabilirsiniz.')
const hesapDugmesi = (page: Page) => page.getByRole('button', { name: 'Hesabımla sınıfa gir' })

test.beforeAll(async () => {
  const payload = await payloadIstemcisi()

  k.egitimId = (
    await payload.find({ collection: 'training-programs', where: { slug: { equals: ADLAR.egitimSlug } }, limit: 1, depth: 0, overrideAccess: true })
  ).docs[0]!.id as number
  const yonetici = (
    await payload.find({ collection: 'users', where: { email: { equals: testEpostasi('yonetici') } }, limit: 1, depth: 0, overrideAccess: true })
  ).docs[0]!
  /* `Users.beforeValidate` istekte kullanıcı yoksa rolleri sıyırır (tohum.ts → YONETICI_BAGLAMI). */
  k.yoneticiBaglami = { ...yonetici, collection: 'users' }

  const simdi = Date.now()
  const oda = async (baslik: string, roomStatus: 'active' | 'closed') =>
    (
      await payload.create({
        collection: 'virtual-classrooms',
        locale: 'tr',
        data: {
          title: baslik,
          training: k.egitimId,
          roomStatus,
          platform: 'jitsi',
          startsAt: new Date(simdi - 10 * 60_000).toISOString(),
          endsAt: new Date(simdi + 3 * 60 * 60_000).toISOString(),
          joinWindowMinutes: 15,
          meetingUrl: TOPLANTI,
          moderatorPassword: EGITMEN_SIFRESI,
          attendeePassword: KATILIMCI_SIFRESI,
        } as never,
        context: ctx(),
        overrideAccess: true,
      })
    ).id as number
  k.odaA = await oda(k.odaABasligi, 'active')
  k.odaB = await oda(k.odaBBasligi, 'closed')

  const hesap = async (eposta: string, ad: string) =>
    (
      await payload.create({
        collection: 'users',
        data: { name: ad, email: eposta, password: TEST_PAROLASI, roles: [], role: 'trainee', accountStatus: 'approved' } as never,
        user: k.yoneticiBaglami as never,
        context: ctx(),
        overrideAccess: true,
      })
    ).id as number
  k.onayliId = await hesap(ONAYLI, `${TEST_ONEKI} Sinif Onayli`)
  k.epostaId = await hesap(EPOSTA, `${TEST_ONEKI} Sinif Eposta`)
  k.bekleyenId = await hesap(BEKLEYEN, `${TEST_ONEKI} Sinif Bekleyen`)

  const basvuru = async (eposta: string, ad: string, kullanici: number | null) =>
    (
      await payload.create({
        collection: 'registrations',
        data: { status: 'pending', training: k.egitimId, fullName: ad, email: eposta, user: kullanici, locale: 'tr' } as never,
        context: ctx(),
        overrideAccess: true,
      })
    ).id as number
  k.onayliKayit = await basvuru(ONAYLI, `${TEST_ONEKI} Sinif Onayli Basvuru`, k.onayliId)
  /*
    BÜYÜK HARF, İÇİNDE `I` — BİLİNÇLİ. `toLocaleLowerCase('tr')` bu `I`yı
    noktasız `ı` yapar ve eşleşme düşer; bu hata ilk koşuda yakalandı
    (lib/classroomAccess.ts → kucuk).
  */
  k.epostaKayit = await basvuru(EPOSTA.toUpperCase(), `${TEST_ONEKI} Sinif Eposta Basvuru`, null)
  await basvuru(BEKLEYEN, `${TEST_ONEKI} Sinif Bekleyen Basvuru`, k.bekleyenId)

  /*
    ONAY — personel kimliğiyle, odalar VARKEN. Onay e-postası kancası bu
    süreçte çalışır; ileti yakalanır (test ortamında SMTP yok, adaptör yalnızca
    günlüğe basar) ve son testte içeriği ölçülür.
  */
  const asil = payload.sendEmail
  payload.sendEmail = (async (ileti: Ileti) => {
    k.iletiler.push(ileti)
    return asil.call(payload, ileti as never)
  }) as typeof payload.sendEmail
  try {
    for (const id of [k.onayliKayit, k.epostaKayit]) {
      await payload.update({
        collection: 'registrations',
        id,
        data: { status: 'approved' } as never,
        user: k.yoneticiBaglami as never,
        overrideAccess: false,
        context: ctx(),
      })
    }
  } finally {
    payload.sendEmail = asil
  }
})

test.afterAll(async () => {
  const payload = await payloadIstemcisi()
  await payload.delete({ collection: 'classroom-attendance', where: { room: { in: [k.odaA, k.odaB] } } as never, overrideAccess: true })
  await payload.delete({ collection: 'virtual-classrooms', where: { id: { in: [k.odaA, k.odaB] } }, context: ctx(), overrideAccess: true })
  await payload.delete({ collection: 'registrations', where: { email: { like: `${TEST_ONEKI}-sinif-` } }, context: ctx(), overrideAccess: true })
  await payload.delete({ collection: 'users', where: { email: { like: `${TEST_ONEKI}-sinif-` } }, context: ctx(), overrideAccess: true })
})

test.describe('Sanal sınıf — hesapla giriş, şifre yedek', () => {
  test('onaylı başvurusu olan hesap şifresiz girer; karar sunucuda yeniden verilir; giriş kaydedilir', async ({ page }) => {
    const payload = await payloadIstemcisi()
    await girisYap(page, ONAYLI)
    await page.goto(odaAdresi(k.odaA))

    await expect(page.getByRole('heading', { name: 'Hesabınızla girin' })).toBeVisible()
    /* Şifre formu YEDEK olarak altında kalır. */
    await expect(page.getByRole('heading', { name: 'Katılım şifresiyle giriş' })).toBeVisible()
    /* Kapı geçilmeden toplantı adresi sayfaya inmez. */
    expect(await page.content()).not.toContain(TOPLANTI)

    /* Düğme göründükten SONRA başvuru geri çekilir: tıklama reddedilmeli. */
    const durumYaz = (status: string) =>
      payload.update({
        collection: 'registrations',
        id: k.onayliKayit,
        data: { status } as never,
        overrideAccess: true,
        context: { skipRevalidate: true, skipApprovalEmail: true },
      })
    await durumYaz('rejected')
    await hesapDugmesi(page).click()
    /* Süzgeç ŞART: Next'in rota duyurucusu da `role="alert"` taşır. */
    await expect(page.getByRole('alert').filter({ hasText: 'Bu eğitime onaylı bir başvurunuz bulunamadı' })).toBeVisible()
    await expect(sahne(page)).toHaveCount(0)
    expect(await girisler(k.odaA, { user: { equals: k.onayliId } })).toHaveLength(0)

    await durumYaz('approved')
    await hesapDugmesi(page).click()
    await expect(sahne(page)).toBeVisible()
    await expect(page.getByRole('link', { name: /Toplantıyı aç/ })).toHaveAttribute('href', TOPLANTI)

    const satirlar = await girisler(k.odaA, { user: { equals: k.onayliId } })
    expect(satirlar).toHaveLength(1)
    expect(satirlar[0]).toMatchObject({
      method: 'account',
      role: 'attendee',
      registration: k.onayliKayit,
      fullName: `${TEST_ONEKI} Sinif Onayli Basvuru`,
      email: ONAYLI,
    })
  })

  test('başvuru hesaba bağlı değilse e-posta eşleşmesi yeter (büyük/küçük harf farkı yok sayılır)', async ({ page }) => {
    await girisYap(page, EPOSTA)
    await page.goto(odaAdresi(k.odaA))
    await hesapDugmesi(page).click()
    await expect(sahne(page)).toBeVisible()

    const satirlar = await girisler(k.odaA, { user: { equals: k.epostaId } })
    expect(satirlar).toHaveLength(1)
    expect(satirlar[0]).toMatchObject({ method: 'account', registration: k.epostaKayit })
  })

  test('bekleyen başvuru şifresiz giremez; şifreyle girer ve kişi yine kaydedilir', async ({ page }) => {
    await girisYap(page, BEKLEYEN)
    await page.goto(odaAdresi(k.odaA))

    await expect(page.getByText('Oturumunuz açık, ancak bu eğitime onaylı bir başvurunuz görünmüyor.', { exact: false })).toBeVisible()
    await expect(hesapDugmesi(page)).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Katılım şifresi', exact: true })).toBeVisible()

    await page.getByRole('textbox', { name: 'Katılım şifresi' }).fill(KATILIMCI_SIFRESI)
    await page.getByRole('button', { name: 'Sınıfa gir' }).click()
    await expect(sahne(page)).toBeVisible()

    const satirlar = await girisler(k.odaA, { user: { equals: k.bekleyenId } })
    expect(satirlar).toHaveLength(1)
    expect(satirlar[0]).toMatchObject({ method: 'code', role: 'attendee', email: BEKLEYEN })
    expect(satirlar[0]!.registration ?? null).toBeNull()

    /* Profilde canlı oturum bağlantısı yalnızca ONAYLI başvuruya çıkar. */
    await page.goto('/tr/profil')
    await expect(page.getByRole('link', { name: /Canlı oturuma katıl/ })).toHaveCount(0)
  })

  test('oturumsuz ziyaretçi şifreyle girer (anonim satır); "Oturum açın" girişten sonra sınıfa döndürür', async ({ page }) => {
    await page.goto(odaAdresi(k.odaA))
    await expect(hesapDugmesi(page)).toHaveCount(0)

    const girisBaglantisi = page.getByRole('link', { name: 'Oturum açın' })
    await expect(girisBaglantisi).toHaveAttribute('href', `/tr/giris?donus=${encodeURIComponent(odaAdresi(k.odaA))}`)

    /* Eğitmen şifresi: rol imzalı jetona `moderator` olarak yazılır. */
    await page.getByRole('textbox', { name: 'Katılım şifresi' }).fill(EGITMEN_SIFRESI)
    await page.getByRole('button', { name: 'Sınıfa gir' }).click()
    await expect(sahne(page)).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'Eğitmen' })).toBeVisible()

    const anonim = await girisler(k.odaA, { user: { exists: false } })
    expect(anonim).toHaveLength(1)
    expect(anonim[0]).toMatchObject({ method: 'code', role: 'moderator' })
    expect(anonim[0]!.email ?? null).toBeNull()

    await page.getByRole('button', { name: 'Odadan çık' }).click()
    await expect(page.getByRole('heading', { name: 'Katılım şifresi', exact: true })).toBeVisible()

    await girisBaglantisi.click()
    await page.waitForURL(/\/tr\/giris\?donus=/)
    await epostaAlani(page).fill(ONAYLI)
    await parolaAlani(page).fill(TEST_PAROLASI)
    await page.getByRole('button', { name: 'Giriş Yap', exact: true }).click()
    await page.waitForURL(new RegExp(`${odaAdresi(k.odaA)}$`))
    await expect(page.getByRole('heading', { name: 'Hesabınızla girin' })).toBeVisible()
  })

  test('dönüş adresi yalnızca site içi bir yol olabilir: dış adres yok sayılır', async ({ page }) => {
    await page.goto(`/tr/giris?donus=${encodeURIComponent('//kotu.example/tr/x')}`)
    await epostaAlani(page).fill(BEKLEYEN)
    await parolaAlani(page).fill(TEST_PAROLASI)
    await page.getByRole('button', { name: 'Giriş Yap', exact: true }).click()
    /* Varsayılana (kütüphane) döner; dış adrese gitmez. */
    await page.waitForURL(/\/tr\/kutuphane/)
    expect(page.url()).not.toContain('kotu.example')
  })

  test('kapalı odada hiçbir giriş yolu yok; giriş kayıtları ziyaretçiye ve katılımcıya kapalı', async ({ page, request }) => {
    await girisYap(page, ONAYLI)
    await page.goto(odaAdresi(k.odaB))
    await expect(page.getByText('Bu sanal sınıf şu anda kapalı.', { exact: false })).toBeVisible()
    await expect(hesapDugmesi(page)).toHaveCount(0)
    await expect(page.getByRole('textbox', { name: 'Katılım şifresi' })).toHaveCount(0)

    /* REST: oturumsuz liste 403. */
    expect((await request.get('/api/classroom-attendance')).status()).toBe(403)

    /* Local API, erişim kuralı ZORLANARAK: anonim ve katılımcı reddedilir… */
    const payload = await payloadIstemcisi()
    const onayli = await payload.findByID({ collection: 'users', id: k.onayliId, depth: 0, overrideAccess: true })
    await expect(payload.find({ collection: 'classroom-attendance', overrideAccess: false })).rejects.toThrow()
    await expect(
      payload.find({ collection: 'classroom-attendance', user: { ...onayli, collection: 'users' } as never, overrideAccess: false }),
    ).rejects.toThrow()
    /* …yönetici okur (olumlu kontrol), ama o bile elle satır AÇAMAZ: kayıt yalnızca girişten doğar. */
    const yonetimde = await payload.find({ collection: 'classroom-attendance', user: k.yoneticiBaglami as never, overrideAccess: false })
    expect(yonetimde.totalDocs).toBeGreaterThan(0)
    await expect(
      payload.create({
        collection: 'classroom-attendance',
        data: { room: k.odaA, method: 'code', role: 'attendee' } as never,
        user: k.yoneticiBaglami as never,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  test('onay e-postası oda bağlantılarını taşır, şifreyi taşımaz; profil açık odayı listeler', async ({ page }) => {
    const metin = (eposta: string) => {
      const ileti = k.iletiler.find((i) => String(i.to).toLowerCase() === eposta.toLowerCase())
      expect(ileti, `${eposta} için onay e-postası yakalanmadı.`).toBeTruthy()
      return String(ileti!.text)
    }

    const taban = (process.env.NEXT_PUBLIC_SERVER_URL ?? '').replace(/\/$/, '')
    expect(taban, 'NEXT_PUBLIC_SERVER_URL test ortamında tanımlı olmalı.').not.toBe('')

    const hesapli = metin(ONAYLI)
    expect(hesapli).toContain(`${taban}${odaAdresi(k.odaA)}`)
    /* Kapalı ama bitmemiş oda da listelenir: sayfa "saati gelince açılır" der. */
    expect(hesapli).toContain(`${taban}${odaAdresi(k.odaB)}`)
    expect(hesapli).toContain('oturum açarak şifresiz')

    /* Hesaba bağlı olmayan başvuru: sayfa şifre ister. */
    const hesapsiz = metin(EPOSTA)
    expect(hesapsiz).toContain(`${taban}${odaAdresi(k.odaA)}`)
    expect(hesapsiz).toContain('katılım şifresini ister')

    for (const govde of [hesapli, hesapsiz]) {
      expect(govde).not.toContain(KATILIMCI_SIFRESI)
      expect(govde).not.toContain(EGITMEN_SIFRESI)
      expect(govde).not.toContain(TOPLANTI)
    }

    await girisYap(page, ONAYLI)
    await page.goto('/tr/profil')
    await expect(page.getByRole('link', { name: `Canlı oturuma katıl: ${k.odaABasligi}` })).toHaveAttribute('href', odaAdresi(k.odaA))
    /* Kapalı oda profilde görünmez. */
    await expect(page.getByRole('link', { name: `Canlı oturuma katıl: ${k.odaBBasligi}` })).toHaveCount(0)
  })
})
