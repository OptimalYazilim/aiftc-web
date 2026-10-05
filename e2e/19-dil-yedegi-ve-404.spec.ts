import { expect, test } from '@playwright/test'

import { ADLAR, payloadIstemcisi, TEST_ONEKI } from './yardimcilar/tohum'

/**
 * SENARYO 19 — ÇEVRİLMEMİŞ KAYDIN EN/RU ADRESİ VE SİTENİN 404 SAYFASI
 * ============================================================================
 * 2026-10 denetiminde ölçülen iki kusur:
 *
 *   1. Yalnızca Türkçe girilmiş bir kayıt EN/RU listelerinde Türkçe slug'ıyla
 *      görünüyor, detay sayfası o dilde slug bulamayınca 404 veriyordu
 *      (eğitim, kütüphane, galeri, proje, haber, konu, sayfa, simülasyon).
 *      Artık Türkçe içerikle ve çeviri eksiği notuyla açılır, dizine kapalıdır
 *      (lib/slugFallback.ts).
 *   2. 404 sayfası Next'in İngilizce, menüsüz, `lang`sız varsayılanıydı.
 *      Artık dil katmanının içinde, doğru dilde basılır ([locale]/not-found.tsx).
 *
 * Olumsuz kontroller: Türkçe sürümde not ve `noindex` YOKTUR; çevrilmiş
 * kaydın başka dildeki slug'ı yedek sayfa değil, doğru adrese YÖNLENDİRMEDİR;
 * olmayan kayıt hâlâ 404'tür.
 * ============================================================================
 */

const ctx = () => ({ skipRevalidate: true })
const YEDEK_SLUG = `${TEST_ONEKI}-dil-yedegi`
const YEDEK_BASLIK = 'E2E Dil Yedeği Sayfası'
const CEVRILMIS_TR = `${TEST_ONEKI}-cevrilmis-sayfa`
const CEVRILMIS_EN = `${TEST_ONEKI}-translated-page`

const NOT = {
  en: 'have not been translated into English',
  ru: 'ещё не переведены на русский',
} as const

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
  await payload.delete({
    collection: 'pages',
    where: { slug: { in: [YEDEK_SLUG, CEVRILMIS_TR] } },
    context: ctx(),
    overrideAccess: true,
  })
}

const sayfa = (title: string, slug: string) => ({
  pageType: 'standard',
  title,
  slug,
  layout: [{ blockType: 'richText', content: metin('Yalnızca Türkçe yazılmış gövde.') }],
  _status: 'published',
})

test.beforeAll(async () => {
  await sayfalariSil()
  const payload = await payloadIstemcisi()
  /* Yalnızca Türkçe: EN/RU slug'ı YOK. */
  await payload.create({ collection: 'pages', locale: 'tr', context: ctx(), overrideAccess: true, draft: false, data: sayfa(YEDEK_BASLIK, YEDEK_SLUG) as never })
  /* Türkçe + İngilizce: iki dilde AYRI slug. */
  const cevrilmis = await payload.create({ collection: 'pages', locale: 'tr', context: ctx(), overrideAccess: true, draft: false, data: sayfa('E2E Çevrilmiş Sayfa', CEVRILMIS_TR) as never })
  await payload.update({
    collection: 'pages',
    id: cevrilmis.id,
    locale: 'en',
    context: ctx(),
    overrideAccess: true,
    data: { title: 'E2E Translated Page', slug: CEVRILMIS_EN, layout: [{ blockType: 'richText', content: metin('English body.') }] } as never,
  })
})

test.afterAll(sayfalariSil)

test.describe('Çevrilmemiş kaydın EN/RU adresi', () => {
  test('yalnızca Türkçe sayfa EN ve RU adresinde Türkçe içerik ve notla açılır, dizine kapalıdır', async ({ page }) => {
    for (const dil of ['en', 'ru'] as const) {
      const yanit = await page.goto(`/${dil}/${YEDEK_SLUG}`)
      expect(yanit?.status(), `/${dil}/${YEDEK_SLUG} açılmadı`).toBe(200)
      await expect(page.getByRole('heading', { level: 1, name: YEDEK_BASLIK })).toBeVisible()
      await expect(page.getByRole('note').filter({ hasText: NOT[dil] })).toBeVisible()
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    }

    /* Negatif kontrol: kaynak dilde not ve noindex YOK. */
    const yanit = await page.goto(`/tr/${YEDEK_SLUG}`)
    expect(yanit?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1, name: YEDEK_BASLIK })).toBeVisible()
    await expect(page.getByRole('note')).toHaveCount(0)
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0)
  })

  test('başka koleksiyonda da aynı: tohum eğitimi (yalnızca Türkçe) EN detay adresinde açılır', async ({ page }) => {
    const payload = await payloadIstemcisi()
    const egitim = (await payload.find({ collection: 'training-programs', where: { slug: { equals: ADLAR.egitimSlug } }, locale: 'all', depth: 0, limit: 1, overrideAccess: true })).docs[0] as unknown as {
      slug?: Record<string, string | null>
    }
    /* Ön koşul: tohum eğitiminin İngilizce slug'ı gerçekten YOK — yoksa test bir şey ölçmez. */
    expect(egitim.slug?.en ?? null).toBeNull()

    const yanit = await page.goto(`/en/training-programmes/${ADLAR.egitimSlug}`)
    expect(yanit?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1, name: ADLAR.egitimBasligi })).toBeVisible()
    await expect(page.getByRole('note').filter({ hasText: NOT.en })).toBeVisible()
  })

  test('çevrilmiş kaydın Türkçe slug\'ı EN adresinde yedek sayfa değil, İngilizce adrese yönlendirmedir', async ({ page }) => {
    await page.goto(`/en/${CEVRILMIS_TR}`)
    await expect(page).toHaveURL(new RegExp(`/en/${CEVRILMIS_EN}$`))
    await expect(page.getByRole('heading', { level: 1, name: 'E2E Translated Page' })).toBeVisible()
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0)
  })
})

test.describe('Sitenin 404 sayfası', () => {
  const durumlar = [
    { yol: `/tr/${TEST_ONEKI}-olmayan-sayfa`, lang: 'tr-TR', baslik: 'Sayfa bulunamadı', menu: 'Ana menü' },
    { yol: `/en/${TEST_ONEKI}/no/such/path`, lang: 'en', baslik: 'Page not found', menu: 'Main menu' },
    { yol: `/ru/programmy-obucheniya/${TEST_ONEKI}-net-takogo`, lang: 'ru-RU', baslik: 'Страница не найдена', menu: 'Главное меню' },
  ]

  test('dil öneki geçersiz yollar da 404 döner, 500 değil', async ({ request }) => {
    /*
      ÖLÇÜLMÜŞ GERİLEME (2026-10): 404 sayfasının meta verisi dili
      `getLocale()` ile okuyordu; o da statik rotada `headers()` okuyup ÜRETİMDE
      500 verdi. `/documents/...` (E2E 03'ün korumasız eski belge adresi) bu
      yoldan geçer: "dil" parçası geçersizdir ama Next 404 sayfasının meta
      verisini yine çözümler.
    */
    /* Noktasız yol ara katmanda önce `/tr/...`'ye yönlenir; yönlendirme izlenir, SON durum ölçülür. */
    for (const yol of [`/documents/${TEST_ONEKI}-yok.png`, `/${TEST_ONEKI}-gecersiz-dil/alt-sayfa`]) {
      const yanit = await request.get(yol)
      expect(yanit.status(), `${yol} 404 vermedi`).toBe(404)
    }
  })

  for (const d of durumlar) {
    test(`${d.yol} → 404, site menüsüyle ve doğru dilde`, async ({ page, request }) => {
      /*
        HAM YANIT: durum 404 ve `noindex` — arama motorunun karar verdiği ikisi.
        İçerik ham HTML'de ARANMAZ: Next 15, sayfa `notFound()` çağırınca ilk
        HTML'i her zaman `<html id="__next_error__">` kabuğuyla gönderir ve 404
        sayfasını tarayıcıda ana yanıtın verisiyle çizer (React'in sunucu
        render'ı hata sınırlarını çalıştırmaz; next/dist/server/app-render/
        app-render.js → ErrorApp). Üretim derlemesinde ölçüldü (2026-10).
      */
      const ham = await request.get(d.yol)
      expect(ham.status()).toBe(404)
      expect(await ham.text()).toMatch(/<meta name="robots" content="noindex"/)

      const yanit = await page.goto(d.yol)
      expect(yanit?.status()).toBe(404)
      await expect(page.locator('html')).toHaveAttribute('lang', d.lang)
      await expect(page.getByRole('heading', { level: 1, name: d.baslik })).toBeVisible()
      await expect(page.getByRole('navigation', { name: d.menu }).first()).toBeAttached()
      await expect(page).toHaveTitle(new RegExp(`^${d.baslik}`))
    })
  }
})
