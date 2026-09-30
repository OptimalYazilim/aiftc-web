import { expect, test } from '@playwright/test'

import { payloadIstemcisi } from './yardimcilar/tohum'

/**
 * SENARYO 7 — VATANDAŞ e-DEVLET GİRİŞİ ANAHTARI
 * ============================================================================
 * Kurum kararı (29.09.2026): vatandaş e-Devlet girişi gizlenir, silinmez;
 * editör `Dış Servisler → e-Devlet Girişi` anahtarıyla geri açabilir.
 *
 * Anahtar yalnızca DÜĞMEYİ değil UÇLARI da kapatmalı. Bu yüzden iki hâlin ikisi
 * de hem ekranda hem HTTP katmanında ölçülür: yalnızca "düğme görünmüyor"
 * iddiası, arkasında açık kalmış bir `/api/auth/edevlet/login` ucunu
 * yakalamazdı.
 *
 * Test veritabanında kum havuzu açıktır (`.env.test`, adres localhost), yani
 * teknik koşul sağlanır; sonucu belirleyen YALNIZCA anahtardır. Global'in eski
 * değeri sonda geri yazılır — diğer senaryolar bu ayara dokunmaz ama paylaşılan
 * veritabanında iz bırakmamak kuraldır.
 * ============================================================================
 */

const ctx = () => ({ skipRevalidate: true })

const anahtariYaz = async (acik: boolean) => {
  const payload = await payloadIstemcisi()
  await payload.updateGlobal({
    slug: 'external-services',
    data: { edevlet: { citizenLoginEnabled: acik } },
    context: ctx(),
    overrideAccess: true,
  })
}

let eskiDeger: boolean | null = null

test.beforeAll(async () => {
  const payload = await payloadIstemcisi()
  const svc = await payload.findGlobal({ slug: 'external-services', depth: 0 })
  eskiDeger = svc.edevlet?.citizenLoginEnabled ?? null
})

test.afterAll(async () => {
  await anahtariYaz(eskiDeger === true)
})

test.describe('Vatandaş e-Devlet girişi anahtarı', () => {
  test('kapalıyken düğme HİÇ basılmaz ve uçlar 404 döner', async ({ page, request }) => {
    await anahtariYaz(false)

    await page.goto('/tr/giris')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    /* Ne bağlantı ne pasif yer tutucu: "Yakında" rozetli eski düğme de yok. */
    await expect(page.getByText('e-Devlet ile Giriş Yap')).toHaveCount(0)

    const giris = await request.get('/api/auth/edevlet/login?locale=tr', { maxRedirects: 0 })
    expect(giris.status()).toBe(404)
    const donus = await request.get('/api/auth/edevlet/callback', { maxRedirects: 0 })
    expect(donus.status()).toBe(404)
    const kumHavuzu = await request.get('/tr/edevlet-mock', { maxRedirects: 0 })
    expect(kumHavuzu.status()).toBe(404)
  })

  test('açıkken düğme görünür ve giriş ucu akışı başlatır', async ({ page, request }) => {
    await anahtariYaz(true)

    await page.goto('/tr/giris')
    await expect(page.getByRole('link', { name: 'e-Devlet ile Giriş Yap' })).toBeVisible()

    /* Negatif kontrolün karşılığı: aynı uç artık 404 DEĞİL, akışı yönlendirir. */
    const giris = await request.get('/api/auth/edevlet/login?locale=tr', { maxRedirects: 0 })
    expect(giris.status()).toBeGreaterThanOrEqual(300)
    expect(giris.status()).toBeLessThan(400)
  })
})
