import { expect, test } from '@playwright/test'

import { canRegister } from '../src/access/index.js'
import { girisYap } from './yardimcilar/oturum'
import { payloadIstemcisi, testEpostasi, TEST_ONEKI, TEST_PAROLASI } from './yardimcilar/tohum'

/**
 * SENARYO 15 — GENEL KAYIT ANAHTARI VE HESAP AÇMA YETKİSİ
 * ============================================================================
 * İKİ AYRI ŞEY ÖLÇÜLÜR.
 *
 * 1. PROJE KARARI (30.09.2026): genel kayıt sayfası açık kalmayacak. Anahtar
 *    (`Genel Site Ayarları → Hesaplar`) varsayılan kapalıdır ve yalnızca
 *    sayfayı değil kayıt UCUNU da kapatır. İki hâl de hem ekranda hem HTTP
 *    katmanında ölçülür: yalnızca "sayfa 404" iddiası, arkasında açık kalmış
 *    bir `POST /api/users` ucunu yakalamazdı.
 *
 * 2. ÖLÇÜLMÜŞ AÇIĞIN NÖBETÇİSİ (2026-09-30): oturum açmış SIRADAN bir
 *    katılımcı `POST /api/users` ile onaylı bir PERSONEL hesabı açabiliyordu
 *    (role alanı varsayılana düşüyor, kanca "kullanıcı var = yönetici"
 *    sayıyordu). Düzeltme iki katmandır ve ikisi AYRI ölçülür:
 *      - erişim kuralı: yönetici olmayan oturumlu kullanıcı hesap açamaz,
 *      - kanca: erişim aşılsa bile rol/durum `trainee` + `pending` zorlanır.
 *    Olumlu kontrol: panel yöneticisi istediği rolle onaylı hesap açar —
 *    kural herkesi engelleseydi o da düşerdi.
 *
 * CAPTCHA'ya ağ üzerinden gidilmez: kapalıyken istek CAPTCHA'dan ÖNCE
 * reddedilir; açıkken jetonsuz istek yerelde `captcha_*` koduyla düşer. İki
 * kodun FARKI, anahtarın ucu gerçekten açıp kapattığını gösterir.
 * ============================================================================
 */

const ctx = () => ({ skipRevalidate: true })
const KATILIMCI = testEpostasi('katilimci')
const YENI = (ad: string) => `${TEST_ONEKI}-kayit-${ad}@example.test`

const anahtariYaz = async (acik: boolean) => {
  const payload = await payloadIstemcisi()
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { accounts: { publicRegistrationEnabled: acik } },
    context: ctx(),
    overrideAccess: true,
  })
}

const hesapVarMi = async (eposta: string) => {
  const payload = await payloadIstemcisi()
  const r = await payload.find({ collection: 'users', where: { email: { equals: eposta } }, depth: 0, overrideAccess: true })
  return r.totalDocs > 0
}

const denemeHesaplariniSil = async () => {
  const payload = await payloadIstemcisi()
  await payload.delete({ collection: 'users', where: { email: { like: `${TEST_ONEKI}-kayit-` } }, overrideAccess: true })
}

type HataGovdesi = { errors?: { data?: { code?: string } }[] }
const kodOf = (govde: HataGovdesi | null) => govde?.errors?.[0]?.data?.code ?? null

test.beforeAll(denemeHesaplariniSil)

test.afterAll(async () => {
  await denemeHesaplariniSil()
  await anahtariYaz(false)
})

test.describe('Genel kayıt anahtarı', () => {
  test('kapalıyken sayfa 404 döner, bağlantı basılmaz ve uç "kapalı" der', async ({ page, request, baseURL }) => {
    await anahtariYaz(false)

    for (const adres of ['/tr/kayit', '/en/register', '/ru/registratsiya']) {
      const yanit = await request.get(adres, { maxRedirects: 0 })
      expect(yanit.status(), `${adres} kapalıyken açılıyor.`).toBe(404)
    }

    await page.goto('/tr/giris')
    /* Şeridin kendisi yerinde (öteki bağlantı duruyor); yalnızca kayıt bağlantısı yok. */
    await expect(page.getByRole('link', { name: 'Parolanızı mı unuttunuz?' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Kayıt olun/ })).toHaveCount(0)

    const eposta = YENI('kapali')
    const yanit = await request.post('/api/users', {
      headers: { Origin: String(baseURL), 'Content-Type': 'application/json' },
      data: { name: 'E2E Kapalı Kayıt', email: eposta, password: TEST_PAROLASI },
    })
    expect(yanit.status()).toBe(403)
    expect(kodOf((await yanit.json().catch(() => null)) as HataGovdesi | null)).toBe('kayit_kapali')
    expect(await hesapVarMi(eposta), 'Kapalıyken hesap yine de açıldı.').toBe(false)
  })

  test('açıkken sayfa ve bağlantı geri gelir; uç artık "kapalı" demez', async ({ page, request, baseURL }) => {
    await anahtariYaz(true)

    await page.goto('/tr/giris')
    const baglanti = page.getByRole('link', { name: /Kayıt olun/ })
    await expect(baglanti).toBeVisible()
    await baglanti.click()
    await expect(page).toHaveURL(/\/tr\/kayit$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Hesap Oluştur' })).toBeVisible()

    /*
      Jetonsuz istek: kapı AÇIK olduğu için "kapalı" koduyla değil, bir sonraki
      savunma olan CAPTCHA ile karşılanır. Hesap yine açılmaz — bu testin
      amacı kapının açıldığını göstermek, CAPTCHA'yı atlatmak değil.
    */
    const eposta = YENI('acik')
    const yanit = await request.post('/api/users', {
      headers: { Origin: String(baseURL), 'Content-Type': 'application/json' },
      data: { name: 'E2E Açık Kayıt', email: eposta, password: TEST_PAROLASI },
    })
    const kod = kodOf((await yanit.json().catch(() => null)) as HataGovdesi | null)
    expect(kod, 'Anahtar açıkken uç hâlâ "kapalı" diyor.').not.toBe('kayit_kapali')
    expect(String(kod)).toMatch(/^captcha_/)
    expect(await hesapVarMi(eposta)).toBe(false)
  })
})

test.describe('Hesap açma yetkisi — yetki yükseltme nöbetçisi', () => {
  test('oturum açmış katılımcı, kayıt AÇIK da olsa KAPALI da olsa hesap açamaz', async ({ page, baseURL }) => {
    const payload = await payloadIstemcisi()
    const katilimci = (
      await payload.find({ collection: 'users', where: { email: { equals: KATILIMCI } }, limit: 1, depth: 0, overrideAccess: true })
    ).docs[0]!
    const kimlik = { ...katilimci, collection: 'users' } as never

    await girisYap(page, KATILIMCI)

    for (const acik of [false, true]) {
      await anahtariYaz(acik)
      const durum = acik ? 'açık' : 'kapalı'

      /* 1) KURALIN KENDİSİ — CAPTCHA'dan bağımsız, doğrudan. */
      expect(await canRegister({ req: { user: kimlik, payload } } as never), `kural (kayıt ${durum})`).toBe(false)

      /* 2) GERÇEK HTTP — katılımcının kendi oturum çereziyle, saldırının yolu. */
      const eposta = YENI(`yukseltme-${acik ? 'acik' : 'kapali'}`)
      const yanit = await page.request.post('/api/users', {
        headers: { Origin: String(baseURL), 'Content-Type': 'application/json' },
        data: { name: 'E2E Yükseltme', email: eposta, password: TEST_PAROLASI, role: 'staff', accountStatus: 'approved' },
      })
      expect(yanit.ok(), `Katılımcı hesap açabildi (kayıt ${durum}).`).toBe(false)
      expect(await hesapVarMi(eposta), `Katılımcının isteği hesap üretti (kayıt ${durum}).`).toBe(false)
    }
  })

  test('erişim aşılsa bile kanca rolü zorlar; panel yöneticisi ise istediği hesabı açar', async () => {
    const payload = await payloadIstemcisi()
    const bul = async (eposta: string) =>
      (await payload.find({ collection: 'users', where: { email: { equals: eposta } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]!
    const katilimci = await bul(KATILIMCI)
    const yonetici = await bul(testEpostasi('yonetici'))

    /*
      İKİNCİ KATMAN: `overrideAccess: true` erişim kuralını ve CAPTCHA'yı aşar
      (bir iç çağrının yapabileceği şey). Hesabı açan bağlam yönetici değilse
      kanca yine de rol ve durumu zorlamalı — açığın kök nedeni tam olarak
      buradaki "kullanıcı var = yönetici" varsayımıydı.
    */
    const zorlanan = (await payload.create({
      collection: 'users',
      data: { name: 'E2E Zorlanan', email: YENI('zorlanan'), password: TEST_PAROLASI, role: 'staff', roles: ['admin'], accountStatus: 'approved' } as never,
      user: { ...katilimci, collection: 'users' } as never,
      overrideAccess: true,
    })) as unknown as { role?: string; roles?: string[]; accountStatus?: string }
    expect({ role: zorlanan.role, roles: zorlanan.roles, accountStatus: zorlanan.accountStatus }).toEqual({
      role: 'trainee',
      roles: [],
      accountStatus: 'pending',
    })

    /* OLUMLU KONTROL: panel yöneticisi için kural da kanca da yol verir. */
    expect(await canRegister({ req: { user: { ...yonetici, collection: 'users' }, payload } } as never)).toBe(true)
    const yoneticininActigi = (await payload.create({
      collection: 'users',
      data: { name: 'E2E Yönetici Açtı', email: YENI('yonetici-acti'), password: TEST_PAROLASI, role: 'instructor' } as never,
      user: { ...yonetici, collection: 'users' } as never,
      overrideAccess: false,
    })) as unknown as { role?: string; accountStatus?: string }
    expect({ role: yoneticininActigi.role, accountStatus: yoneticininActigi.accountStatus }).toEqual({
      role: 'instructor',
      accountStatus: 'approved',
    })
  })
})
