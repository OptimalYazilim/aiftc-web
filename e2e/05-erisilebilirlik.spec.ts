import { expect, test } from '@playwright/test'

import { epostaAlani } from './yardimcilar/oturum'
import { ADLAR } from './yardimcilar/tohum'

/**
 * SENARYO 5 — ERİŞİLEBİLİRLİK DEĞİŞMEZLERİ
 * ============================================================================
 * Buradaki iddiaların hepsi, bu projede GERÇEKTEN kırılmış davranışlardır.
 * Erişilebilirlik regresyonu sessizdir: ekran aynı görünür, hiçbir hata
 * düşmez, yalnızca klavye ve ekran okuyucu kullanıcısı kullanamaz hâle gelir.
 * Bu yüzden değişmezler otomatik sınanır.
 *
 *  · Odak hata özetine taşınır           (Kontrol listesi 103, 105, 107)
 *  · Modal Escape ile kapanır            (56, 57, 62, 63)
 *  · Kapanışta odak TETİKLEYİCİYE döner  (63)
 *  · Modal içinde klavye tuzağı yoktur   (57)
 *  · Atlama bağlantısı ilk duraktır      (78, 79)
 *
 * ---------------------------------------------------------------------------
 * NEDEN "ODAK KAYBOLMADI" DEĞİL, "ODAK ŞURADA"
 * ---------------------------------------------------------------------------
 * `toBeFocused()` tek tek elemana bakar. "Bir yere odaklandı" biçiminde gevşek
 * bir iddia, odağın `<body>`ye düşmesini de kabul ederdi — modal kapanışında
 * yaşanan kusur tam olarak buydu ve gevşek bir test onu göremezdi.
 * ============================================================================
 */

test.describe('Erişilebilirlik değişmezleri', () => {
  test('form hatasında odak, hata özetine taşınır', async ({ page }) => {
    await page.goto('/tr/giris')

    /* Boş formu göndermek iki zorunlu alan hatası üretir. */
    await page.getByRole('button', { name: 'Giriş Yap', exact: true }).click()

    /*
      Hata özeti `role="alert"` + `tabIndex={-1}` taşır: Tab sırasına GİRMEZ,
      yalnızca programla odaklanır (FormErrorSummary docblock). Katı kip
      ihlalinden kaçınmak için metne göre süzülür — sayfada Next.js'in boş rota
      anonsçusu da `role="alert"` taşır (senaryo 1'de ölçüldü).
    */
    const ozet = page.getByRole('alert').filter({ hasText: /hata var/i })
    await expect(ozet).toBeVisible()
    await expect(ozet).toBeFocused()

    /* Özet, hatalı alanlara DOĞRUDAN atlama bağlantısı vermeli. */
    await expect(ozet.getByRole('link').first()).toBeVisible()

    /*
      Bağlantı gerçekten alanı odaklamalı — yalnızca çıpaya kaydırmak
      klavye kullanıcısını hedefe götürmez.
    */
    await ozet.getByRole('link').first().click()
    await expect(epostaAlani(page)).toBeFocused()
  })

  test('modal Escape ile kapanır ve odak TETİKLEYİCİYE döner', async ({ page }) => {
    await page.goto(`/tr/kutuphane/${ADLAR.albumSlug}`)

    const tetik = page.getByRole('button', { name: /Galeriyi İncele/i })
    await expect(tetik).toBeVisible()
    await tetik.click()

    /*
      `<dialog>` `aria-label` ile isimlendirilir; rol + isimle aranması
      erişilebilir ismin korunduğunu da sınar.
    */
    const pencere = page.getByRole('dialog', { name: ADLAR.album })
    await expect(pencere).toBeVisible()

    /*
      ODAK PENCEREDE OLMALI.
      `<dialog>` varsayılan olarak ODAKLANAMAZ; `tabIndex={-1}` olmadan
      `dialog.focus()` sessizce hiçbir şey yapmaz (ölçüldü). O eksik olsa
      odak tetikleyicide kalır ve Escape'i `<dialog>` değil sayfa görür.
    */
    await expect(pencere).toBeFocused()

    await page.keyboard.press('Escape')

    await expect(pencere).toHaveCount(0)

    /*
      ASIL DEĞİŞMEZ.
      Kapanışta odak `<body>`ye düşüyordu: React'in StrictMode'daki ikinci
      efekt koşusu, efekt içinde tutulan `activeElement` değerini eziyordu.
      `useRef` ile düzeltildi. Aşağıdaki satır o düzeltmenin nöbetçisidir —
      klavye kullanıcısı kaldığı yere geri dönmeli.
    */
    await expect(tetik).toBeFocused()
  })

  test('modal açıkken Tab pencerenin İÇİNDE kalır (klavye tuzağı yok, kaçış da yok)', async ({
    page,
  }) => {
    await page.goto(`/tr/kutuphane/${ADLAR.albumSlug}`)
    await page.getByRole('button', { name: /Galeriyi İncele/i }).click()

    const pencere = page.getByRole('dialog', { name: ADLAR.album })
    await expect(pencere).toBeVisible()

    /*
      `showModal()` tarayıcıdan odak kuşatmasını ÜCRETSİZ getirir. Bu test onu
      sabitler: pencere `show()` ile açılacak biçimde değiştirilirse Tab arka
      plandaki bağlantılara kaçar ve klavye kullanıcısı göremediği öğelere
      odaklanır — ekranda hiçbir belirti olmadan.

      Beş Tab, penceredeki tüm düğmeleri dolaşmaya yeter; her adımda odak
      pencerenin içinde kalmalı.
    */
    for (let adim = 0; adim < 5; adim += 1) {
      await page.keyboard.press('Tab')
      const iceride = await pencere.evaluate(
        (kabuk) => kabuk.contains(document.activeElement) || kabuk === document.activeElement,
      )
      expect(iceride, `Tab ${adim + 1}. adımda odak pencerenin dışına çıktı.`).toBe(true)
    }

    /* Ve kapatma düğmesi klavyeyle çalışmalı. */
    await page.keyboard.press('Escape')
    await expect(pencere).toHaveCount(0)
  })

  test('ilk Tab durağı atlama bağlantısıdır ve odağı ana içeriğe taşır', async ({ page }) => {
    await page.goto('/tr')

    /*
      Klavye kullanıcısının ilk hamlesi. Atlama bağlantısı gizli değil
      GÖRÜNMEZ durumdadır: odaklanınca ortaya çıkar (`.skip-link`). Tab
      sırasında ilk sırada olmazsa kullanıcı onu bulamaz ve her sayfada tüm
      gezinme menüsünü baştan geçmek zorunda kalır.
    */
    await page.keyboard.press('Tab')

    const atlama = page.getByRole('link', { name: 'İçeriğe geç' })
    await expect(atlama).toBeFocused()
    await expect(atlama).toBeVisible()

    await page.keyboard.press('Enter')

    /*
      `<main id="main-content" tabIndex={-1}>` — `tabIndex` olmadan çıpaya
      atlamak sayfayı kaydırır ama ODAĞI TAŞIMAZ; sonraki Tab kullanıcıyı
      yine başlığa geri götürürdü.
    */
    await expect(page.locator('#main-content')).toBeFocused()
  })
})
