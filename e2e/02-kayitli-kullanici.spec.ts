import { expect, test } from '@playwright/test'

import { girisYap } from './yardimcilar/oturum'
import { ADLAR, testEpostasi } from './yardimcilar/tohum'

/**
 * SENARYO 2 — KAYITLI KULLANICI AKIŞI
 * ============================================================================
 * Onaylı bir hesabın uçtan uca yolu:
 *
 *   giriş → kütüphane (kısıtlı içerik açılır) → profil (kendi başvuruları)
 *
 * ---------------------------------------------------------------------------
 * ÖNCE ANONİM ÖLÇÜM — KONTROL GRUBU
 * ---------------------------------------------------------------------------
 * "Giriş yapan kullanıcı kısıtlı belgeyi görüyor" iddiası, anonim kullanıcının
 * o belgeyi GÖRMEDİĞİ ölçülmeden anlamsızdır. Erişim kuralı tümden kaldırılsa
 * (her şey herkese açık olsa) yalnızca oturumlu tarafa bakan bir test yeşil
 * kalmaya devam ederdi.
 *
 * Bu yüzden ilk test bilinçli olarak OTURUMSUZDUR ve temel çizgiyi kurar.
 *
 * ---------------------------------------------------------------------------
 * ÜÇÜNCÜ SEVİYE: PERSONELE ÖZEL KAYIT
 * ---------------------------------------------------------------------------
 * Tohum üç seviye üretir (public / trainee / staff). Katılımcı hesabı ONAYLI
 * ve aboneliği GEÇERLİ olmasına rağmen `staff` kaydını GÖRMEMELİDİR. Bu iddia
 * olmadan, kural "oturum varsa her şeyi göster" biçiminde bozulduğunda test
 * fark etmezdi.
 * ============================================================================
 */

const KATILIMCI = testEpostasi('katilimci')

test.describe('Kayıtlı kullanıcı akışı', () => {
  test('anonim ziyaretçi kütüphanede YALNIZCA herkese açık kaydı görür', async ({ page }) => {
    await page.goto('/tr/kutuphane')

    /* Kartlar `<h3>` başlığı taşır (LibraryResourceCard). */
    await expect(page.getByRole('heading', { name: ADLAR.acikKayit })).toBeVisible()
    await expect(page.getByRole('heading', { name: ADLAR.kisitliKayit })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: ADLAR.personelKaydi })).toHaveCount(0)
  })

  test('giriş sonrası kütüphaneye yönlendirilir ve kısıtlı kayıt listelenir', async ({ page }) => {
    /* Yardımcı, giriş isteğini ağ katmanında doğrular ve yönlendirmeyi bekler. */
    await girisYap(page, KATILIMCI)

    /* Yönlendirme hedefi: kütüphane. */
    await expect(page).toHaveURL(/\/tr\/kutuphane/)

    /* Abonelik kapısı açık → katılımcı seviyesindeki kayıt artık görünür. */
    await expect(page.getByRole('heading', { name: ADLAR.kisitliKayit })).toBeVisible()
    /* Herkese açık kayıt kaybolmamalı. */
    await expect(page.getByRole('heading', { name: ADLAR.acikKayit })).toBeVisible()

    /*
      ASIL KAPI: hesap onaylı ve abonesi olsa DA personele özel kayıt
      görünmemeli. Seviye kapısının rolden türediğinin kanıtı budur.
    */
    await expect(page.getByRole('heading', { name: ADLAR.personelKaydi })).toHaveCount(0)
  })

  test('başlıktaki profil bağlantısı, YALNIZCA kendi başvurularını gösteren sayfaya götürür', async ({
    page,
  }) => {
    await girisYap(page, KATILIMCI)

    /*
      Bağlantının erişilebilir ismi ADIN KENDİSİ DEĞİL, "Profilim"dir: dar
      ekranda ad gizlendiği için `aria-label` ile açık ifade verilir
      (AccountMenu docblock). Bu test o kararı da sabitler.
    */
    await page.getByRole('link', { name: 'Profilim' }).click()
    await expect(page).toHaveURL(/\/tr\/profil/)

    /*
      Hesap bilgileri gerçekten bu kullanıcıya ait olmalı.

      `exact: true` ŞART — ölçüldü: e-posta sayfada İKİ yerde geçiyor, hesap
      künyesindeki `<dd>` içinde ve "Başvurularım" bölümünün giriş cümlesinde
      ("… adresiyle gönderdiğiniz kayıtlar listelenir."). Gevşek eşleşme katı
      kip ihlaliyle kırılıyordu; tam eşleşme yalnızca künye satırını seçer.
    */
    await expect(page.getByRole('heading', { name: 'Hesap Bilgileri' })).toBeVisible()
    await expect(page.getByText(KATILIMCI, { exact: true })).toBeVisible()

    /* Kendi başvurusu listelenir. */
    await expect(page.getByRole('heading', { name: 'Başvurularım' })).toBeVisible()
    await expect(page.getByText(ADLAR.kendiTalep, { exact: true })).toBeVisible()

    /*
      KVKK SIZINTISI TESTİ.
      Bu satır, ölçülmüş gerçek bir açığın nöbetçisidir: `FormRequests.read`
      bir dönem `isAuthenticated` idi ve onaylı HER ziyaretçi herkesin
      başvurusunu (ad, e-posta, mesaj) görebiliyordu. Yabancı kaydın konusu
      sayfada GEÇMEMELİDİR.
    */
    await expect(page.getByText(ADLAR.yabanciTalep, { exact: true })).toHaveCount(0)

    /*
      Boş durum mesajı basılmamalı.

      Bu satır ayrı bir yanlış-pozitifi kapatır: yukarıdaki "yabancı kayıt yok"
      iddiası, liste TÜMDEN boş olduğunda da geçerdi. İkisi birlikte "liste
      dolu AMA yalnızca kendi kaydıyla" demenin tek yoludur.

      (İlk sürüm bölümü `getByRole('region')` ile arıyordu; `<section>`
      erişilebilir bir isim taşımadığı için `region` rolü ALMAZ, dolayısıyla
      eşleşme boş dönüyor ve iddia sessizce hiç koşmuyordu.)
    */
    await expect(
      page.getByText('Bu adresle gönderilmiş bir başvuru bulunamadı.'),
    ).toHaveCount(0)
  })
})
