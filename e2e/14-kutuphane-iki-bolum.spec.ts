import { expect, test } from '@playwright/test'

import { girisYap } from './yardimcilar/oturum'
import { ADLAR, testEpostasi } from './yardimcilar/tohum'

/**
 * SENARYO 14 — KÜTÜPHANENİN İKİ BÖLÜMÜ
 * ============================================================================
 * Kurum kararı (29.09.2026): dijital kütüphane ikiye ayrılır — herkese açık
 * içerik ve personelin yetkiyle eriştiği eğitim içerikleri.
 *
 * Ayrımı yapan ERİŞİM KURALIDIR ve başka senaryolarda ölçülür (02, 03, 11).
 * Burada ölçülen yalnızca arayüzdür: yetkili içeriği görebilen kişi iki bölümü
 * ayrı ayrı listeleyebiliyor mu, göremeyen kişiye ise süzgeç hiç gösterilmiyor
 * mu. İkincisi önemlidir: anonim ziyaretçiye "Yalnızca yetkililere açık 0"
 * diye bir düğme göstermek, var olduğunu bilmemesi gereken bir bölümü ilan
 * etmek olurdu.
 *
 * Tohum: bir herkese açık rapor ve albüm, bir katılımcıya özel rehber.
 * ============================================================================
 */

const KATILIMCI = testEpostasi('katilimci')

test.describe('Kütüphanenin iki bölümü', () => {
  test('anonim ziyaretçiye erişim süzgeci hiç gösterilmez', async ({ page }) => {
    await page.goto('/tr/kutuphane')

    await expect(page.getByRole('heading', { name: ADLAR.acikKayit })).toBeVisible()
    await expect(page.getByRole('group', { name: 'Erişim', exact: true })).toHaveCount(0)
    await expect(page.getByText('Yalnızca yetkililere açık')).toHaveCount(0)
  })

  test('yetkili kullanıcı iki bölümü ayrı ayrı listeler', async ({ page }) => {
    await girisYap(page, KATILIMCI)
    await page.goto('/tr/kutuphane')

    /* Hap düğmesinin erişilebilir adı "etiket sayı" biçimindedir. */
    const grup = page.getByRole('group', { name: 'Erişim', exact: true })
    await expect(grup).toBeVisible()

    await grup.getByRole('button', { name: /^Yalnızca yetkililere açık \d+$/ }).click()
    await expect(page.getByRole('heading', { name: ADLAR.kisitliKayit })).toBeVisible()
    await expect(page.getByRole('heading', { name: ADLAR.acikKayit })).toHaveCount(0)

    await grup.getByRole('button', { name: /^Herkese açık \d+$/ }).click()
    await expect(page.getByRole('heading', { name: ADLAR.acikKayit })).toBeVisible()
    await expect(page.getByRole('heading', { name: ADLAR.kisitliKayit })).toHaveCount(0)

    /* "Tümü" iki bölümü birlikte geri getirir. */
    await grup.getByRole('button', { name: /^Tümü \d+$/ }).click()
    await expect(page.getByRole('heading', { name: ADLAR.acikKayit })).toBeVisible()
    await expect(page.getByRole('heading', { name: ADLAR.kisitliKayit })).toBeVisible()
  })
})
