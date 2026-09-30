import { expect, test } from '@playwright/test'

import { ADLAR, payloadIstemcisi, TEST_ONEKI } from './yardimcilar/tohum'

/**
 * SENARYO 12 — EĞİTİME ÖZEL BAŞVURU SORULARI
 * ============================================================================
 * Kurum kararı (29.09.2026): başvuru formu, genel alanlara ek olarak her
 * eğitim için editörün tanımladığı soruları sorar.
 *
 *   zorunlu kısa metin boş  → SUNUCU reddeder, hata özetinde soru adıyla çıkar
 *   dolu + seçim            → kayıt oluşur, cevaplar SORU METNİYLE yazılır
 *
 * Seçim listesinin cevabı seçeneğin kimliği değil ETİKETİ olarak saklanmalı:
 * kayıt, eğitimdeki seçenek sonradan silinse de okunabilir kalmalı.
 * ============================================================================
 */

const ctx = () => ({ skipRevalidate: true })
const SORU_METIN = `${TEST_ONEKI} Görev yeri`
const SORU_SECIM = `${TEST_ONEKI} Deneyim`

const egitimiBul = async () => {
  const payload = await payloadIstemcisi()
  return (await payload.find({ collection: 'training-programs', where: { slug: { equals: ADLAR.egitimSlug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]!
}

const sorulariYaz = async (sorular: unknown[]) => {
  const payload = await payloadIstemcisi()
  const egitim = await egitimiBul()
  await payload.update({
    collection: 'training-programs',
    id: egitim.id,
    locale: 'tr',
    data: { applicationQuestions: sorular } as never,
    context: ctx(),
    overrideAccess: true,
  })
  return egitim.id as number
}

let egitimId: number

test.beforeAll(async () => {
  egitimId = await sorulariYaz([
    { label: SORU_METIN, type: 'text', required: true },
    { label: SORU_SECIM, type: 'select', required: false, options: [{ label: '0-5 yıl' }, { label: '5 yıldan fazla' }] },
  ])
})

test.afterAll(async () => {
  await sorulariYaz([])
})

test.describe('Eğitime özel başvuru soruları', () => {
  test('zorunlu soru sunucuda denetlenir; cevaplar soru metniyle kaydedilir', async ({ page }) => {
    const eposta = `${TEST_ONEKI}-sorular@example.test`
    await page.goto(`/tr/basvuru?egitim=${egitimId}`)

    const metinAlani = page.getByRole('textbox', { name: SORU_METIN })
    await expect(metinAlani).toBeVisible()
    await expect(page.getByRole('combobox', { name: SORU_SECIM })).toBeVisible()

    await page.getByLabel(/^Ad Soyad/).fill('E2E Soru Sahibi')
    await page.getByLabel(/^E-posta adresi/).fill(eposta)
    await page.getByRole('checkbox').check()

    /* Tarayıcı doğrulaması kapatılır: kuralın SUNUCUDA olduğunu ölçmenin tek yolu. */
    await page.evaluate(() => {
      document.querySelectorAll('[required]').forEach((el) => {
        if ((el as HTMLInputElement).type !== 'checkbox') el.removeAttribute('required')
      })
      document.querySelector('form')?.setAttribute('novalidate', 'novalidate')
    })
    await page.getByRole('button', { name: /Başvuruyu Gönder/i }).click()

    const ozet = page.getByRole('alert').filter({ hasText: /hata var/i })
    await expect(ozet).toBeVisible()
    await expect(ozet.getByRole('link', { name: new RegExp(SORU_METIN) })).toBeVisible()

    const payload = await payloadIstemcisi()
    const say = async () =>
      (await payload.find({ collection: 'registrations', where: { email: { equals: eposta } }, depth: 0, overrideAccess: true })).docs
    expect(await say()).toHaveLength(0)

    /*
      HATA SONRASI DEĞERLER YERİNDE — ölçülmüş kusurun nöbetçisi. React 19
      `action` alan formu eylem bitince sıfırlar; önceki sürümde kişi burada ad,
      e-posta ve rızayı YENİDEN girmek zorunda kalıyordu. Artık sunucu gönderilen
      değerleri geri verir ve form onlara döner.
    */
    await expect(page.getByLabel(/^Ad Soyad/)).toHaveValue('E2E Soru Sahibi')
    await expect(page.getByLabel(/^E-posta adresi/)).toHaveValue(eposta)
    await expect(page.getByRole('checkbox')).toBeChecked()

    /* Yalnızca eksik soruyu doldur ve gönder. */
    await page.getByRole('textbox', { name: SORU_METIN }).fill('Antalya Orman Bölge Müdürlüğü')
    await page.getByRole('combobox', { name: SORU_SECIM }).selectOption({ label: '5 yıldan fazla' })
    await page.getByRole('button', { name: /Başvuruyu Gönder/i }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Başvurunuz alındı' })).toBeVisible()

    const kayitlar = await say()
    expect(kayitlar).toHaveLength(1)
    const cevaplar = (kayitlar[0] as unknown as { extraAnswers?: { question: string; answer: string }[] }).extraAnswers ?? []
    expect(cevaplar.map(({ question, answer }) => ({ question, answer }))).toEqual([
      { question: SORU_METIN, answer: 'Antalya Orman Bölge Müdürlüğü' },
      { question: SORU_SECIM, answer: '5 yıldan fazla' },
    ])
  })
})
