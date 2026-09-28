import { expect, test } from '@playwright/test'

import { cikisYap, girisYap } from './yardimcilar/oturum'
import { ADLAR, testEpostasi } from './yardimcilar/tohum'

/**
 * SENARYO 4 — OTURUM SENKRONİZASYONU
 * ============================================================================
 * Bu senaryo, ölçülmüş iki gerçek kusurun nöbetçisidir:
 *
 *  1. Başlıktaki "Giriş" bağlantısı SABİTTİ. Kullanıcı giriş yapıp kütüphaneye
 *     yönlendirildikten sonra bile menüde "Giriş" yazıyordu. Kullanıcı
 *     açısından bu, girişin BAŞARISIZ olduğu anlamına gelir; çoğu kişi ikinci
 *     kez giriş yapmayı dener. Çerez doğruydu — eksik olan onu okuyan arayüzdü.
 *
 *  2. Eğitim künyesindeki birincil düğme STATİKTİ ("Bilgi Al"). Giriş yapmış
 *     bir katılımcı için yanlış eylemdir: zaten kayıtlıdır, aradığı şey
 *     eğitimin materyalidir.
 *
 * ---------------------------------------------------------------------------
 * İKİ YÖN DE ÖLÇÜLÜR
 * ---------------------------------------------------------------------------
 * Yalnızca "giriş sonrası ad göründü" iddiası yarım kalır: çıkışta eski hâle
 * DÖNMEK de senkronizasyonun parçasıdır. Çerez silinip arayüz oturumlu kalsa,
 * kullanıcı hâlâ giriş yapmış sanır ve korunan bir bağlantıya tıkladığında
 * açıklanamaz bir yönlendirme alır.
 * ============================================================================
 */

const KATILIMCI = testEpostasi('katilimci')
const EGITIM_ADRESI = `/tr/egitim-programlari/${ADLAR.egitimSlug}`

test.describe('Oturum senkronizasyonu', () => {
  test('başlık giriş sonrası hesaba, çıkış sonrası ANINDA "Giriş" hâline döner', async ({
    page,
  }) => {
    /* -- oturumsuz temel çizgi ------------------------------------------- */
    await page.goto('/tr')
    await expect(page.getByRole('link', { name: 'Giriş' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Çıkış Yap' })).toHaveCount(0)

    /* -- giriş ----------------------------------------------------------- */
    await girisYap(page, KATILIMCI)

    /*
      Başlık artık hesabı tanımalı. "Profilim" bağlantısı ve "Çıkış Yap"
      düğmesi birlikte belirir; ikisini birden aramak, bileşenin yarım bir
      ara hâlde kalmadığını da gösterir.
    */
    await expect(page.getByRole('link', { name: 'Profilim' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Çıkış Yap' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Giriş' })).toHaveCount(0)

    /* -- çıkış ----------------------------------------------------------- */
    await cikisYap(page)

    await expect(page.getByRole('link', { name: 'Profilim' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Çıkış Yap' })).toHaveCount(0)

    /*
      ÇEREZİN GERÇEKTEN SİLİNDİĞİ AYRICA ÖLÇÜLÜR.
      Arayüzün oturumsuz görünmesi yetmez: çerez ayakta kalmışsa sunucu
      tarafında kullanıcı hâlâ oturumludur ve bu, çıkış yaptığını sanan kişi
      için bir güvenlik sorunudur. `/api/users/me` boş kullanıcı dönmeli.
    */
    const ben = await page.request.get('/api/users/me')
    const govde = (await ben.json()) as { user?: unknown }
    expect(govde.user ?? null, 'Çıkıştan sonra sunucu hâlâ bir oturum görüyor.').toBeNull()
  })

  test('eğitim künyesindeki CTA, oturum durumuna göre değişir', async ({ page }) => {
    /* -- oturumsuz: ön başvuruya çağırır -------------------------------- */
    await page.goto(EGITIM_ADRESI)

    const onBasvuru = page.getByRole('link', { name: 'Ön Başvuru Yap' })
    await expect(onBasvuru).toBeVisible()
    /* Hedef: iletişim formu, eğitim ön seçili. */
    /* Hedef: site içi başvuru formu, eğitim ön seçili (Registrations akışı). */
    await expect(onBasvuru).toHaveAttribute('href', /\/tr\/basvuru\?egitim=\d+/)
    await expect(page.getByRole('link', { name: 'Eğitim Materyallerine Git' })).toHaveCount(0)

    /* -- oturumlu: materyale götürür ------------------------------------ */
    await girisYap(page, KATILIMCI)
    await page.goto(EGITIM_ADRESI)

    const materyal = page.getByRole('link', { name: 'Eğitim Materyallerine Git' })
    await expect(materyal).toBeVisible()
    /* Hedef: kütüphane, bu eğitimin süzgeciyle. */
    await expect(materyal).toHaveAttribute('href', /\/tr\/kutuphane\?egitim=/)
    await expect(page.getByRole('link', { name: 'Ön Başvuru Yap' })).toHaveCount(0)
  })

  test('CTA hedefi kütüphanede GERÇEKTEN süzülmüş bir liste açar', async ({ page }) => {
    /*
      Düğmenin adresini doğrulamak yetmez: `?egitim=` süzgeci sunucuda
      okunmuyorsa bağlantı doğru görünür ama süzülmemiş tüm katalog açılır.
      Bu test zinciri sonuna kadar izler.
    */
    await girisYap(page, KATILIMCI)
    await page.goto(EGITIM_ADRESI)
    await page.getByRole('link', { name: 'Eğitim Materyallerine Git' }).click()

    await expect(page).toHaveURL(/\/tr\/kutuphane\?egitim=/)

    /*
      Tohumlanan kütüphane kayıtları bu eğitime BAĞLI DEĞİLDİR; dolayısıyla
      süzgeç çalışıyorsa hiçbiri listelenmemeli. Süzgeç yok sayılsaydı açık
      kayıt ekranda görünürdü — testin yakaladığı fark tam olarak budur.
    */
    await expect(page.getByRole('heading', { name: ADLAR.acikKayit })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: ADLAR.kisitliKayit })).toHaveCount(0)
  })
})
