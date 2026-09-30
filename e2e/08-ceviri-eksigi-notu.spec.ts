import { expect, test } from '@playwright/test'

import { payloadIstemcisi, TEST_ONEKI } from './yardimcilar/tohum'

/**
 * SENARYO 8 — ÇEVİRİSİ EKSİK İÇERİK OKUYUCUYA SÖYLENİR
 * ============================================================================
 * Kurum kararı (29.09.2026): EN/RU sürümler Türkçenin birebir karşılığı
 * olmalı. `fallback: true` yüzünden çevrilmemiş bir alan o dilde Türkçe aslıyla
 * görünür; bu senaryo, o durumun okuyucudan GİZLENMEDİĞİNİ ölçer.
 *
 * Kurgu gerçek bir editör hatasıdır: sayfanın İngilizce BAŞLIĞI girilmiş ama
 * GÖVDESİ (blok dizisi) boş bırakılmış. Eski hesap yalnızca başlığa baktığı
 * için bu sayfayı "çevrildi" sayıyordu.
 *
 * Negatif kontrol: aynı sayfanın Türkçe sürümünde not YOKTUR — not hiçbir
 * zaman kaynak dilde basılmaz.
 * ============================================================================
 */

const SLUG = `${TEST_ONEKI}-ceviri-notu`
const ctx = () => ({ skipRevalidate: true })

const metin = (t: string) => ({
  root: {
    type: 'root', format: '', indent: 0, version: 1, direction: 'ltr',
    children: [{
      type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0,
      children: [{ type: 'text', text: t, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
    }],
  },
})

const sayfalariSil = async () => {
  const payload = await payloadIstemcisi()
  await payload.delete({ collection: 'pages', where: { slug: { equals: SLUG } }, context: ctx(), overrideAccess: true })
}

test.beforeAll(async () => {
  await sayfalariSil()
  const payload = await payloadIstemcisi()
  const sayfa = await payload.create({
    collection: 'pages',
    locale: 'tr',
    context: ctx(),
    overrideAccess: true,
    draft: false,
    data: {
      pageType: 'standard',
      title: 'E2E Çeviri Notu Sayfası',
      slug: SLUG,
      layout: [{ blockType: 'richText', content: metin('Yalnızca Türkçe yazılmış gövde.') }],
      _status: 'published',
    } as never,
  })
  /* İngilizce: başlık VAR, gövde YOK — tipik yarım çeviri. */
  await payload.update({
    collection: 'pages',
    id: sayfa.id,
    locale: 'en',
    context: ctx(),
    overrideAccess: true,
    data: { title: 'E2E Translation Notice Page', layout: [] } as never,
  })
})

test.afterAll(sayfalariSil)

test.describe('Çeviri eksiği notu', () => {
  test('yarım çevrilmiş sayfa işaretlenir ve İngilizce sayfada not görünür', async ({ page }) => {
    const payload = await payloadIstemcisi()
    const kayit = (await payload.find({ collection: 'pages', where: { slug: { equals: SLUG } }, depth: 0 }))
      .docs[0] as unknown as { translationStatus?: { missing?: string[] } }
    /* Hesap: gövde yalnız Türkçede dolu → en ve ru eksik. */
    expect(kayit.translationStatus?.missing).toEqual(['en', 'ru'])

    await page.goto(`/en/${SLUG}`)
    await expect(page.getByRole('note').filter({ hasText: 'not been translated into English' })).toBeVisible()
  })

  test('Türkçe sürümde not basılmaz', async ({ page }) => {
    await page.goto(`/tr/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1, name: 'E2E Çeviri Notu Sayfası' })).toBeVisible()
    await expect(page.getByText('henüz çevrilmedi')).toHaveCount(0)
  })
})
