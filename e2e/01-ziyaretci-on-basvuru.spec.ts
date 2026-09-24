import { expect, test } from '@playwright/test'

import { payloadIstemcisi, TEST_ONEKI } from './yardimcilar/tohum'

/**
 * SENARYO 1 — ZİYARETÇİ ÖN BAŞVURUSU
 * ============================================================================
 * Eğitim künyesinden başlayıp kuruma ulaşan tek zincir:
 *
 *   eğitim sayfası → "Ön Başvuru Yap" → iletişim formu → form-requests kaydı
 *
 * ---------------------------------------------------------------------------
 * NEDEN VERİTABANI DA DOĞRULANIYOR
 * ---------------------------------------------------------------------------
 * Ekrandaki "başvurunuz alındı" mesajı TEK BAŞINA KANIT DEĞİLDİR. Sunucu
 * eyleminde bal küpü (honeypot) alanı doluysa kayıt YAZILMADAN `success`
 * dönüyor — bot'a başarısız olduğunu söylememek için bilinçli bir tuzak
 * (bkz. iletisim/actions.ts). Yalnızca arayüze bakan bir test, kayıt hiç
 * oluşmasa da yeşil kalırdı.
 *
 * Bu yüzden her başarılı gönderim Local API ile veritabanında ARANIR.
 *
 * ---------------------------------------------------------------------------
 * SEÇİCİLER ROL VE ERİŞİLEBİLİR İSİM ÜZERİNDEN
 * ---------------------------------------------------------------------------
 * `data-testid` kullanılmaz. `getByRole('button', { name: … })` hem tasarım
 * değişikliklerine dayanıklıdır hem de erişilebilir isim bozulduğunda kırılır
 * — yani erişilebilirlik regresyonunu bedavaya yakalar.
 * ============================================================================
 */

const EGITIM_SLUG = `${TEST_ONEKI}-erken-uyari-calistayi`

/** Her testin kendi konusu: kayıtlar birbirine karışmasın. */
const konu = (ad: string) => `${TEST_ONEKI} ${ad} ${Date.now()}`

test.describe('Ziyaretçi ön başvurusu', () => {
  test('eğitim künyesindeki düğme, ön seçimli iletişim formuna götürür', async ({ page }) => {
    await page.goto(`/tr/egitim-programlari/${EGITIM_SLUG}`)

    /*
      Oturum AÇILMAMIŞ ziyaretçi "Ön Başvuru Yap" görür. Giriş yapmış
      kullanıcıda aynı düğme "Eğitim Materyallerine Git" olur; bu ayrımın
      kendisi 4. senaryoda sınanır.
    */
    const dugme = page.getByRole('link', { name: 'Ön Başvuru Yap' })
    await expect(dugme).toBeVisible()

    await dugme.click()

    /* Sorgu dizesi taşınmalı: form türü ve eğitim ön seçili gelsin. */
    await expect(page).toHaveURL(/\/tr\/iletisim\?tur=basvuru&egitim=\d+/)

    const turSecimi = page.getByLabel(/Talep Türü|Başvuru Türü/i)
    await expect(turSecimi).toHaveValue('training-application')

    /* Bağlı eğitim alanı görünür ve doğru eğitim seçili olmalı. */
    const egitimSecimi = page.getByLabel(/Bağlı Eğitim|İlgili Eğitim/i)
    await expect(egitimSecimi).toBeVisible()
  })

  test('KVKK onayı olmadan gönderim SUNUCUDA reddedilir', async ({ page }) => {
    await page.goto(`/tr/iletisim`)

    const buKonu = konu('riza-yok')
    await page.getByLabel(/Ad Soyad/i).fill('E2E Rıza Testi')
    await page.getByLabel(/E-posta/i).fill(`${TEST_ONEKI}-riza@example.test`)
    await page.getByLabel(/^Konu/i).fill(buKonu)
    await page.getByLabel(/Mesaj/i).fill('Rıza kutusu işaretlenmeden gönderiliyor.')

    /*
      TARAYICI DOĞRULAMASI DEVRE DIŞI BIRAKILIR.
      `required` niteliği devtools ile silinebilir; kuralın SUNUCUDA da
      uygulandığını sınamanın tek yolu, istemci engelini kaldırıp göndermektir.
      Bu test tam olarak o saldırgan davranışını taklit eder.
    */
    await page.evaluate(() => {
      document.querySelectorAll('[required]').forEach((el) => el.removeAttribute('required'))
      document.querySelector('form')?.setAttribute('novalidate', 'novalidate')
    })

    /*
      SUNUCUYA GİDİLDİĞİ AĞ KATMANINDA KANITLANIR.
      Sadece bir uyarı kutusu aramak yeterli DEĞİLDİR: aynı kutuyu istemci
      tarafı bir kontrol de basabilirdi ve test, kural sunucudan kaldırılmış
      olsa bile yeşil kalırdı. Burada gönderimin gerçekten sunucuya ulaşıp
      yanıt döndüğü ölçülür.

      (Kodda da doğrulandı: `ContactForm` hata durumunu YALNIZCA
      `useActionState` üzerinden, yani sunucu eyleminin dönüş değerinden
      alır — istemcide ikinci bir doğrulama yolu yoktur.)
    */
    const [yanit] = await Promise.all([
      page.waitForResponse(
        (r) => r.request().method() === 'POST' && r.url().includes('/tr/iletisim'),
      ),
      page.getByRole('button', { name: /Gönder/i }).click(),
    ])
    expect(yanit.ok()).toBe(true)

    /*
      HATA ÖZETİ AÇIKÇA SEÇİLİR — `getByRole('alert')` TEK BAŞINA YETMEZ.
      Sayfada aynı anda ÜÇ `role="alert"` bulunur (ölçüldü): form başlığı
      uyarısı, `FormErrorSummary` kutusu ve Next.js'in her sayfada tuttuğu
      BOŞ rota anonsçusu (`#__next-route-announcer__`). Yalnızca role'e
      bakan bir iddia o boş kutuya düşebilir ve form hiç hata göstermese bile
      yeşil kalırdı — bu testin ilk sürümünde tam olarak bu risk vardı.
    */
    const ozet = page.getByRole('alert').filter({ hasText: /hata var/i })
    await expect(ozet).toBeVisible()

    /*
      HANGİ kuralın çiğnendiği hem özette hem alanın yanında görünmeli.
      Jenerik bir "form hatalı" mesajı, rıza kuralının gerçekten işlediğini
      kanıtlamaz: zorunlu başka bir alan da aynı kutuyu doldururdu.
    */
    await expect(ozet.getByRole('link', { name: /Açık rıza onayı/i })).toBeVisible()

    /*
      ALAN DÜZEYİNDEKİ MESAJ KENDİ GRUBUNDA ARANIR.
      Aynı metin özet bağlantısında da geçtiği için sayfa genelinde arama iki
      eşleşme döndürür. Mesajı `<fieldset>/<legend>` grubuna bağlamak hem
      belirsizliği kaldırır hem de mesajın ÖZETTE değil ALANIN YANINDA
      durduğunu kanıtlar — WCAG 3.3.1'in asıl istediği budur.
    */
    const rizaGrubu = page.getByRole('group', { name: /Açık rıza/i })
    await expect(rizaGrubu.getByText(/açık rıza onayı gereklidir/i)).toBeVisible()

    /* Alan programatik olarak da hatalı işaretlenmeli (WCAG 3.3.1). */
    await expect(rizaGrubu.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true')

    /* Form ekranda kalmalı — girilen veri kaybolmamalı. */
    await expect(page.getByLabel(/Mesaj/i)).toBeVisible()

    /* Ve en önemlisi: kayıt OLUŞMAMALI. */
    const payload = await payloadIstemcisi()
    const kayit = await payload.find({
      collection: 'form-requests',
      where: { subject: { equals: buKonu } },
      limit: 1,
      overrideAccess: true,
    })
    expect(kayit.totalDocs).toBe(0)
  })

  test('eksiksiz başvuru gönderilir ve KAYIT OLUŞUR', async ({ page }) => {
    await page.goto(`/tr/egitim-programlari/${EGITIM_SLUG}`)
    await page.getByRole('link', { name: 'Ön Başvuru Yap' }).click()
    await expect(page).toHaveURL(/\/tr\/iletisim\?/)

    const buKonu = konu('tam-basvuru')
    const eposta = `${TEST_ONEKI}-basvuru@example.test`

    await page.getByLabel(/Ad Soyad/i).fill('E2E Başvuru Sahibi')
    await page.getByLabel(/E-posta/i).fill(eposta)
    await page.getByLabel(/^Konu/i).fill(buKonu)
    await page.getByLabel(/Mesaj/i).fill('Çalıştaya ön başvuru yapmak istiyorum.')
    await page.getByRole('checkbox').check()

    await page.getByRole('button', { name: /Gönder/i }).click()

    /* Başarı bildirimi `role="status"` taşır (WCAG 4.1.3). */
    await expect(page.getByRole('status')).toBeVisible()

    /*
      ASIL DOĞRULAMA: kayıt gerçekten yazıldı mı, doğru alanlarla mı?
      `relatedTraining` özellikle kontrol edilir — sorgu dizesinden gelen
      eğitim ilişkisi kopsa panelde "hangi eğitim" bilgisi boş kalırdı ve
      arayüz yine de "başarılı" derdi.
    */
    const payload = await payloadIstemcisi()
    const sonuc = await payload.find({
      collection: 'form-requests',
      where: { subject: { equals: buKonu } },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })

    expect(sonuc.totalDocs).toBe(1)
    const kayit = sonuc.docs[0] as unknown as Record<string, unknown>
    expect(kayit.email).toBe(eposta)
    expect(kayit.submissionType).toBe('training-application')
    expect(kayit.status).toBe('pending')
    /* KVKK: onay anı damgalanmış olmalı. */
    expect(kayit.consentAcceptedAt).toBeTruthy()

    const egitim = kayit.relatedTraining as { slug?: string } | null
    expect(egitim?.slug).toBe(EGITIM_SLUG)
  })

  test('bal küpü dolduğunda arayüz başarılı der ama KAYIT YAZILMAZ', async ({ page }) => {
    await page.goto(`/tr/iletisim`)

    const buKonu = konu('bal-kupu')
    await page.getByLabel(/Ad Soyad/i).fill('E2E Bot')
    await page.getByLabel(/E-posta/i).fill(`${TEST_ONEKI}-bot@example.test`)
    await page.getByLabel(/^Konu/i).fill(buKonu)
    await page.getByLabel(/Mesaj/i).fill('Bot gönderimi.')
    await page.getByRole('checkbox').check()

    /*
      Bal küpü alanı ekran dışındadır ve `tabIndex={-1}` taşır; gerçek
      kullanıcı ona ulaşamaz. Bir bot ise formdaki HER alanı doldurur —
      testte onu taklit ediyoruz.
    */
    await page.locator('input[name="website"]').fill('https://spam.example')

    await page.getByRole('button', { name: /Gönder/i }).click()
    await expect(page.getByRole('status')).toBeVisible()

    /* Tuzağın çalıştığının kanıtı: ekran "başarılı" der, veritabanı boştur. */
    const payload = await payloadIstemcisi()
    const kayit = await payload.find({
      collection: 'form-requests',
      where: { subject: { equals: buKonu } },
      limit: 1,
      overrideAccess: true,
    })
    expect(kayit.totalDocs).toBe(0)
  })
})
