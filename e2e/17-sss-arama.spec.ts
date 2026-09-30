import { expect, test } from '@playwright/test'

import { payloadIstemcisi, TEST_ONEKI } from './yardimcilar/tohum'

/**
 * SENARYO 17 — SIK SORULAN SORULAR SİTE ARAMASINDA
 * ============================================================================
 * ÖLÇÜLMÜŞ HATA (2026-09-30, panel denetiminde bulundu): arama eklentisi
 * dizin başlığını kaynak kaydın `title` alanından kopyalar; SSS'lerde başlık
 * `question` alanındadır. Dizindeki SSS kayıtları başlıksız kalıyordu ve arama
 * sayfası başlıkta aradığı, başlıksız satırları da elediği için SSS'ler site
 * aramasında HİÇ çıkmıyordu. Düzeltme: payload.config.ts → `beforeSync`.
 *
 * Ölçülen:
 *   - yayınlanan bir SSS, aranan dilde SORUSUYLA çıkar (Türkçe ve İngilizce
 *     ayrı ayrı: başlık dil dil yazılır),
 *   - satır bağlantısızdır — SSS'nin kendi sayfası yoktur (arama/page.tsx),
 *   - eşleşmeyen bir terim onu döndürmez (negatif kontrol: sayfa her şeyi
 *     basıyor olsaydı bu test düşerdi).
 *
 * Terim TEK SÖZCÜKTÜR: arama `like` ile yapılır, çok sözcüklü bir terim başka
 * kayıtlarla da eşleşebilirdi.
 * ============================================================================
 */

const ctx = () => ({ skipRevalidate: true })
const ETIKET = `${TEST_ONEKI}sssarama`
const SORU_TR = `${ETIKET} Eğitim sonunda sertifika veriliyor mu?`
const SORU_EN = `${ETIKET} Is a certificate issued at the end of the training?`

/** Payload'ın Lexical şemasına uyan en küçük gövde (src/scripts/seed.ts ile aynı). */
const paragraf = (text: string) =>
  ({
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          textFormat: 0,
          textStyle: '',
          children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 }],
        },
      ],
    },
  }) as never

/* Tohumun `temizle`si SSS silmez; yarıda kalan bir koşunun kaydı burada gider. */
const sssleriSil = async () => {
  const payload = await payloadIstemcisi()
  await payload.delete({ collection: 'faqs', where: { question: { like: ETIKET } }, context: ctx(), overrideAccess: true })
}

test.beforeAll(async () => {
  await sssleriSil()
  const payload = await payloadIstemcisi()
  const sss = await payload.create({
    collection: 'faqs',
    locale: 'tr',
    data: { question: SORU_TR, answer: paragraf('Evet.'), group: 'certificates', _status: 'published' } as never,
    context: ctx(),
    overrideAccess: true,
  })
  await payload.update({
    collection: 'faqs',
    id: sss.id,
    locale: 'en',
    data: { question: SORU_EN, answer: paragraf('Yes.'), _status: 'published' } as never,
    context: ctx(),
    overrideAccess: true,
  })
})

test.afterAll(sssleriSil)

test.describe('SSS site aramasında', () => {
  test('yayınlanan SSS, aranan dilde sorusuyla ve bağlantısız çıkar', async ({ page }) => {
    for (const [adres, soru] of [
      [`/tr/arama?q=${ETIKET}`, SORU_TR],
      [`/en/search?q=${ETIKET}`, SORU_EN],
    ] as const) {
      await page.goto(adres)
      const ana = page.locator('main')
      await expect(ana.getByText(soru, { exact: true }), `${adres}: SSS aramada çıkmadı.`).toBeVisible()
      await expect(ana.getByRole('link', { name: soru })).toHaveCount(0)
    }
  })

  test('eşleşmeyen terim SSS döndürmez', async ({ page }) => {
    await page.goto(`/tr/arama?q=${ETIKET}yok`)
    await expect(page.locator('main').getByText(SORU_TR)).toHaveCount(0)
  })
})
