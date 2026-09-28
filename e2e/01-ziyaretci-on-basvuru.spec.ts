import { expect, test } from '@playwright/test'

import { ADLAR, payloadIstemcisi, TEST_ONEKI } from './yardimcilar/tohum'

/**
 * SENARYO 1 — ZİYARETÇİ EĞİTİM BAŞVURUSU
 * ============================================================================
 * Eğitim künyesinden başlayıp KARAR BEKLEYEN bir kayda ulaşan zincir:
 *
 *   eğitim sayfası → "Ön Başvuru Yap" → /basvuru (eğitim ön seçili)
 *   → registrations kaydı (status: pending)
 *
 * Bu senaryo bir dönem iletişim formuna gidiyordu ve kayıt `form-requests`
 * içine düşüyordu. Başvuru süreci panelde yürütülen bir yaşam döngüsüne
 * dönüştüğü için (Registrations) hedef değişti; test o mimariyi sınar.
 *
 * ---------------------------------------------------------------------------
 * NEDEN VERİTABANI DA DOĞRULANIYOR
 * ---------------------------------------------------------------------------
 * Ekrandaki "başvurunuz alındı" TEK BAŞINA KANIT DEĞİLDİR: bal küpü doluysa
 * sunucu kayıt YAZMADAN başarı döner (bot'a ipucu vermemek için). Yalnızca
 * arayüze bakan test, kayıt hiç oluşmasa da yeşil kalırdı.
 *
 * Seçiciler rol/erişilebilir isim üzerinden; `data-testid` yok.
 * ============================================================================
 */

const EGITIM_ADRESI = `/tr/egitim-programlari/${ADLAR.egitimSlug}`

/** Başarı bildirimi: sayfada başka `role="status"` (canlı bölge) de var; metinle süz. */
const basariBildirimi = (page: import('@playwright/test').Page) =>
  page.getByRole('status').filter({ hasText: 'Başvurunuz alındı' })

const kayitSay = async (eposta: string) => {
  const payload = await payloadIstemcisi()
  const r = await payload.find({
    collection: 'registrations',
    where: { email: { like: eposta } },
    limit: 5,
    depth: 1,
    overrideAccess: true,
  })
  return r
}

test.describe('Ziyaretçi eğitim başvurusu', () => {
  test('eğitim künyesindeki düğme, eğitimi ön seçili başvuru formuna götürür', async ({ page }) => {
    await page.goto(EGITIM_ADRESI)

    /* Oturumsuz ziyaretçi "Ön Başvuru Yap" görür (oturumlu hâl senaryo 4'te). */
    const dugme = page.getByRole('link', { name: 'Ön Başvuru Yap' })
    await expect(dugme).toBeVisible()
    await dugme.click()

    await expect(page).toHaveURL(/\/tr\/basvuru\?egitim=\d+/)

    /* Seçim kutusu tohumlanan eğitimi göstermeli — id'yi sorgudan alıp kıyasla. */
    const egitimId = new URL(page.url()).searchParams.get('egitim')
    const secim = page.getByLabel(/^Başvurulan eğitim/)
    await expect(secim).toHaveValue(String(egitimId))
    await expect(secim.locator('option:checked')).toHaveText(ADLAR.egitimBasligi)
  })

  test('KVKK onayı olmadan gönderim SUNUCUDA reddedilir', async ({ page }) => {
    await page.goto(EGITIM_ADRESI)
    await page.getByRole('link', { name: 'Ön Başvuru Yap' }).click()

    const eposta = `${TEST_ONEKI}-riza@example.test`
    await page.getByLabel(/^Ad Soyad/).fill('E2E Rıza Testi')
    await page.getByLabel(/^E-posta adresi/).fill(eposta)

    /* Tarayıcı doğrulaması devre dışı: kuralın SUNUCUDA olduğunu sınamanın tek yolu. */
    await page.evaluate(() => {
      document.querySelectorAll('[required]').forEach((el) => el.removeAttribute('required'))
      document.querySelector('form')?.setAttribute('novalidate', 'novalidate')
    })

    const [yanit] = await Promise.all([
      page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/tr/basvuru')),
      page.getByRole('button', { name: /Başvuruyu Gönder/i }).click(),
    ])
    expect(yanit.ok()).toBe(true)

    const ozet = page.getByRole('alert').filter({ hasText: /hata var/i })
    await expect(ozet).toBeVisible()
    await expect(ozet.getByRole('link', { name: /Açık rıza onayı/i })).toBeVisible()

    const rizaGrubu = page.getByRole('group', { name: /Açık rıza/i })
    await expect(rizaGrubu.getByText(/açık rıza onayı gereklidir/i)).toBeVisible()
    await expect(rizaGrubu.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true')

    expect((await kayitSay(eposta)).totalDocs).toBe(0)
  })

  test('eksiksiz başvuru gönderilir ve KARAR BEKLEYEN KAYIT OLUŞUR', async ({ page }) => {
    await page.goto(EGITIM_ADRESI)
    await page.getByRole('link', { name: 'Ön Başvuru Yap' }).click()
    await expect(page).toHaveURL(/\/tr\/basvuru\?/)

    const eposta = `${TEST_ONEKI}-basvuru@example.test`
    await page.getByLabel(/^Ad Soyad/).fill('E2E Başvuru Sahibi')
    await page.getByLabel(/^E-posta adresi/).fill(eposta)
    /* Rolle: `getByLabel(/^Kurum/)` alt bilgideki "Kurum" bölgesine de çarpıyor (ölçüldü). */
    await page.getByRole('textbox', { name: 'Kurum' }).fill('E2E Test Kurumu')
    await page.getByRole('checkbox').check()

    await page.getByRole('button', { name: /Başvuruyu Gönder/i }).click()
    await expect(basariBildirimi(page)).toBeVisible()

    /*
      ASIL DOĞRULAMA: kayıt registrations içinde, `pending` durumunda ve
      DOĞRU eğitime bağlı mı? İlişki kopsa panelde "hangi eğitim" boş kalır
      ve arayüz yine de "alındı" derdi. Anonim başvuru `user` TAŞIMAZ.
    */
    const sonuc = await kayitSay(eposta)
    expect(sonuc.totalDocs).toBe(1)
    const kayit = sonuc.docs[0] as unknown as Record<string, unknown>
    expect(kayit.status).toBe('pending')
    expect(kayit.fullName).toBe('E2E Başvuru Sahibi')
    expect(kayit.consentAcceptedAt).toBeTruthy()
    expect(kayit.user ?? null).toBeNull()
    expect((kayit.training as { slug?: string } | null)?.slug).toBe(ADLAR.egitimSlug)
    /* Karar verilmeden damga olmamalı. */
    expect(kayit.reviewedAt ?? null).toBeNull()
  })

  test('aynı e-posta ile aynı eğitime ikinci başvuru REDDEDİLİR', async ({ page }) => {
    /*
      Mükerrer denetimi sunucudadır. Panelde iki kayıtla uğraşmak yerine
      kişiye "zaten başvurdunuz" denir. İlk kayıt Local API ile hazırlanır
      ki test, önceki testin sırasına bağlı olmasın.
    */
    const eposta = `${TEST_ONEKI}-mukerrer@example.test`
    const payload = await payloadIstemcisi()
    const egitim = await payload.find({
      collection: 'training-programs',
      where: { slug: { equals: ADLAR.egitimSlug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    await payload.create({
      collection: 'registrations',
      overrideAccess: true,
      context: { skipRevalidate: true },
      data: {
        status: 'pending',
        training: egitim.docs[0]!.id,
        fullName: 'E2E İlk Başvuru',
        email: eposta,
      } as never,
    })

    await page.goto(EGITIM_ADRESI)
    await page.getByRole('link', { name: 'Ön Başvuru Yap' }).click()
    await page.getByLabel(/^Ad Soyad/).fill('E2E İkinci Deneme')
    await page.getByLabel(/^E-posta adresi/).fill(eposta)
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /Başvuruyu Gönder/i }).click()

    await expect(page.getByRole('alert').filter({ hasText: /zaten başvurulmuş/i })).toBeVisible()
    expect((await kayitSay(eposta)).totalDocs).toBe(1)
  })

  test('bal küpü dolduğunda arayüz başarılı der ama KAYIT YAZILMAZ', async ({ page }) => {
    await page.goto(EGITIM_ADRESI)
    await page.getByRole('link', { name: 'Ön Başvuru Yap' }).click()

    const eposta = `${TEST_ONEKI}-bot@example.test`
    await page.getByLabel(/^Ad Soyad/).fill('E2E Bot')
    await page.getByLabel(/^E-posta adresi/).fill(eposta)
    await page.getByRole('checkbox').check()
    /* Bal küpü ekran dışı; gerçek kullanıcı ulaşamaz, bot her alanı doldurur. */
    await page.locator('input[name="website"]').fill('https://spam.example')

    await page.getByRole('button', { name: /Başvuruyu Gönder/i }).click()
    await expect(basariBildirimi(page)).toBeVisible()

    expect((await kayitSay(eposta)).totalDocs).toBe(0)
  })
})
