import { expect, test } from '@playwright/test'

import { payloadIstemcisi, pngUret, TEST_ONEKI } from './yardimcilar/tohum'

/**
 * SENARYO 16 — FAVİCON PANELDEN
 * ============================================================================
 * ÖLÇÜLMÜŞ SORUN (2026-09-30): sitede hiç ikon tanımı yoktu; tarayıcı her
 * sayfada `/favicon.ico` isteyip 404 alıyordu, panel de olmayan bir
 * `/favicon.png` gösteriyordu. Genel Site Ayarları'ndaki "Favicon" alanı vardı
 * ama hiçbir yer onu okumuyordu.
 *
 * Ölçülen iki hâl:
 *   1. Alan BOŞ  → sayfa nötr geçici işareti (`/favicon.svg`) basar ve hem o
 *      dosya hem de istemcilerin kendiliğinden istediği `/favicon.ico` sunulur.
 *   2. Panelden bir görsel seçildi → sayfa ARTIK O GÖRSELİ basar ve adres
 *      gerçekten o dosyayı döndürür.
 * İkincisi birincinin negatif kontrolüdür: bağlantı sabit yazılmış olsaydı
 * görsel seçilince değişmezdi.
 *
 * Dinamik bir sayfa (giriş) kullanılır: önbelleğe alınmış bir sayfa ayar
 * değişikliğini göstermeyebilirdi ve hata ikonda değil önbellekte olurdu.
 * ============================================================================
 */

const ctx = () => ({ skipRevalidate: true })

const faviconYaz = async (medyaId: number | null) => {
  const payload = await payloadIstemcisi()
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { logos: { favicon: medyaId } } as never,
    context: ctx(),
    overrideAccess: true,
  })
}

let medyaId: number | null = null

test.afterAll(async () => {
  await faviconYaz(null)
  if (medyaId !== null) {
    const payload = await payloadIstemcisi()
    await payload.delete({ collection: 'media', id: medyaId, context: ctx(), overrideAccess: true })
  }
})

test.describe('Favicon', () => {
  test('alan boşken nötr işaret basılır; /favicon.svg ve /favicon.ico sunulur', async ({ page, request }) => {
    await faviconYaz(null)

    await page.goto('/tr/giris')
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg')

    for (const [adres, tur] of [
      ['/favicon.svg', 'image/svg+xml'],
      ['/favicon.ico', 'image/x-icon'],
    ] as const) {
      const yanit = await request.get(adres)
      expect(yanit.status(), `${adres} sunulmuyor.`).toBe(200)
      expect(yanit.headers()['content-type']).toContain(tur)
    }
  })

  test('panelden seçilen görsel basılır ve o adres görseli döndürür', async ({ page, request }) => {
    const payload = await payloadIstemcisi()
    const medya = await payload.create({
      collection: 'media',
      locale: 'tr',
      data: { alt: `${TEST_ONEKI} favicon` } as never,
      file: { data: await pngUret(48, 48), mimetype: 'image/png', name: `${TEST_ONEKI}-favicon.png`, size: 0 },
      context: ctx(),
      overrideAccess: true,
    })
    medyaId = medya.id as number
    await faviconYaz(medyaId)

    await page.goto('/tr/giris')
    const baglanti = page.locator('link[rel="icon"]')
    await expect(baglanti).toHaveCount(1)
    const adres = await baglanti.getAttribute('href')
    expect(adres, 'Panelde seçilen görsel basılmadı.').toContain('/api/media/file/')

    /*
      Tür, yüklenen dosyanınki DEĞİL, medya kütüphanesinin sakladığınkidir:
      ÖLÇÜLDÜ — yüklenen PNG, koleksiyonun biçim ayarı yüzünden WebP olarak
      saklanıyor. Bağlantının bildirdiği tür ile sunulan tür aynı olmalı.
    */
    const bildirilen = await baglanti.getAttribute('type')
    expect(bildirilen).toMatch(/^image\//)
    const yanit = await request.get(String(adres))
    expect(yanit.status()).toBe(200)
    expect(yanit.headers()['content-type']).toContain(String(bildirilen))
  })
})
