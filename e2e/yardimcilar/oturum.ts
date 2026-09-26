import { expect, type Page } from '@playwright/test'

import { TEST_PAROLASI } from './tohum'

/**
 * OTURUM YARDIMCILARI
 * ============================================================================
 * NEDEN GİRİŞ ARAYÜZDEN YAPILIYOR — API'DEN DEĞİL
 * ---------------------------------------------------------------------------
 * Çerezi doğrudan `POST /api/users/login` ile alıp tarayıcıya yerleştirmek
 * daha hızlı olurdu. Ama o yol, testin sınamak istediği şeyin tam ortasından
 * geçip gidiyor: formun kendisi, istemci doğrulaması, `beforeLogin` kapısı ve
 * girişten sonra kütüphaneye yönlendirme. Gerçek kullanıcının yaptığı işi
 * yapmayan bir yardımcı, kırıldığında hiçbir şey söylemez.
 *
 * Bir kez ölçüldü ve burada korunuyor: giriş isteği AĞ KATMANINDA doğrulanır.
 * Yalnızca "yönlendirme oldu mu" diye bakmak, hesap askıya alınmış olsa bile
 * (form o durumda da sayfayı değiştirebilir) yanlış yere yeşil verebilirdi.
 * ============================================================================
 */
/**
 * KİMLİK ALANLARI — SEÇİCİLER TEK YERDE
 * ---------------------------------------------------------------------------
 * ÖLÇÜLMÜŞ TUZAK: erişilebilir isim `E-posta adresi(zorunlu)`dır, çünkü
 * `AuthField` zorunluluk işaretini etiketin İÇİNE koyar. `exact: true` ile
 * arayan ilk sürüm hiçbir alanı bulamadı ve giriş kullanan yedi test birden
 * zaman aşımına düştü — sebebi tek bir seçiciydi.
 *
 * Başa çapalanmış düzenli ifade kullanılır: işaretin metni değişse bile
 * (örn. "(gerekli)") seçici ayakta kalır, ama alanın GÖRÜNÜR etiketi
 * değişirse — yani gerçek bir gerileme olursa — kırılır.
 */
export const epostaAlani = (page: Page) => page.getByLabel(/^E-posta adresi/)
export const parolaAlani = (page: Page) => page.getByLabel(/^Parola\(/)

export const girisYap = async (
  page: Page,
  eposta: string,
  parola: string = TEST_PAROLASI,
): Promise<void> => {
  await page.goto('/tr/giris')

  await epostaAlani(page).fill(eposta)
  await parolaAlani(page).fill(parola)

  /*
    `exact: true` ŞART: sayfada "e-Devlet ile Giriş Yap" düğmesi de var
    (şimdilik devre dışı bir yer tutucu). Gevşek bir eşleşme iki düğmeye
    çarpar ve test katı kip ihlaliyle kırılırdı.
  */
  const [yanit] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/users/login') && r.request().method() === 'POST',
    ),
    page.getByRole('button', { name: 'Giriş Yap', exact: true }).click(),
  ])

  expect(
    yanit.status(),
    'Giriş isteği 200 dönmedi — hesap onaylı ve parolası doğru tohumlanmış olmalı.',
  ).toBe(200)

  /* Giriş başarılıysa uygulama kütüphaneye götürür (LoginForm docblock). */
  await page.waitForURL(/\/tr\/kutuphane/)
}

/**
 * Oturumu kapatır ve başlığın oturumsuz hâle dönmesini bekler.
 *
 * `AccountMenu` çıkıştan sonra TAM SAYFA yenilemesi yapar (sunucuda üretilmiş
 * içerik de oturumsuz hâliyle yeniden kurulsun diye), bu yüzden düğmenin
 * kaybolmasını beklemek yeterli değildir — yenilemenin tamamlanması beklenir.
 */
export const cikisYap = async (page: Page): Promise<void> => {
  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/users/logout') && r.request().method() === 'POST',
    ),
    page.getByRole('button', { name: 'Çıkış Yap' }).click(),
  ])

  await expect(page.getByRole('link', { name: 'Giriş' })).toBeVisible()
}
