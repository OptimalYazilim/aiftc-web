import { expect, test } from '@playwright/test'

import { ADLAR, payloadIstemcisi, TEST_ONEKI } from './yardimcilar/tohum'

/**
 * SENARYO 10 — KÜTÜPHANE ANA BAŞLIK / ALT BAŞLIK SÜZGECİ
 * ============================================================================
 * Kurum kararı (29.09.2026): içerik kategoriyle sınıflanır; alt başlık varsa
 * o seçilir. Süzgeçte ANA başlık seçilince alt başlıklarındaki içerik de
 * listelenmeli — kurgu tam olarak bunu ölçer:
 *
 *   e2e Ana ── e2e Alt  ← açık rapor bu alt başlıkta
 *   e2e Diğer           ← albüm bu ana başlıkta
 *
 *   "e2e Ana" seçilir  → rapor GÖRÜNÜR (alt başlıktan), albüm GÖRÜNMEZ
 *
 * Albümün görünmemesi negatif kontroldür: süzgeç hiç çalışmasaydı ikisi de
 * görünürdü. Başlık adları kurumsal değildir; `e2e` önekiyle açıkça test
 * verisidir ve sonda silinir.
 * ============================================================================
 */

const ctx = () => ({ skipRevalidate: true })
const ANA = `${TEST_ONEKI} Ana`
const ALT = `${TEST_ONEKI} Alt`
const DIGER = `${TEST_ONEKI} Diğer`

const kategorileriSil = async () => {
  const payload = await payloadIstemcisi()
  /* Önce alt başlıklar: üst başlığa FK ile bağlılar (set null olsa da düzenli kalsın). */
  await payload.delete({ collection: 'library-categories', where: { parent: { exists: true }, slug: { like: TEST_ONEKI } }, context: ctx(), overrideAccess: true })
  await payload.delete({ collection: 'library-categories', where: { slug: { like: TEST_ONEKI } }, context: ctx(), overrideAccess: true })
}

const kaydaBagla = async (slug: string, kategoriId: number | string) => {
  const payload = await payloadIstemcisi()
  const kayit = (await payload.find({ collection: 'library-resources', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  expect(kayit, `Tohum kaydı bulunamadı: ${slug}`).toBeTruthy()
  await payload.update({ collection: 'library-resources', id: kayit!.id, data: { category: kategoriId } as never, context: ctx(), overrideAccess: true })
}

test.beforeAll(async () => {
  await kategorileriSil()
  const payload = await payloadIstemcisi()
  const yaz = (data: Record<string, unknown>) =>
    payload.create({ collection: 'library-categories', locale: 'tr', data: data as never, context: ctx(), overrideAccess: true })

  const ana = await yaz({ title: ANA, slug: `${TEST_ONEKI}-ana`, order: 10 })
  const alt = await yaz({ title: ALT, slug: `${TEST_ONEKI}-alt`, parent: ana.id })
  const diger = await yaz({ title: DIGER, slug: `${TEST_ONEKI}-diger`, order: 20 })

  const acik = (await payload.find({ collection: 'library-resources', where: { title: { equals: ADLAR.acikKayit } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as unknown as { slug: string }
  await kaydaBagla(acik.slug, alt.id)
  await kaydaBagla(ADLAR.albumSlug, diger.id)
})

test.afterAll(kategorileriSil)

test.describe('Kütüphane kategorileri', () => {
  test('ana başlık seçilince alt başlıktaki içerik de listelenir, diğeri süzülür', async ({ page }) => {
    await page.goto('/tr/kutuphane')

    /* Hap düğmesinin erişilebilir adı "etiket sayı" biçimindedir: "e2e Ana 1". */
    const grup = page.getByRole('group', { name: 'Kategori' })
    const anaDugme = grup.getByRole('button', { name: new RegExp(`^${ANA} \\d+$`) })
    await expect(anaDugme).toBeVisible()
    await expect(grup.getByRole('button', { name: new RegExp(`^${ANA} › ${ALT} \\d+$`) })).toBeVisible()

    await anaDugme.click()

    await expect(page.getByRole('heading', { name: ADLAR.acikKayit })).toBeVisible()
    await expect(page.getByRole('heading', { name: ADLAR.album })).toHaveCount(0)
  })

  test('alt başlığın üst başlığı yalnızca bir ANA başlık olabilir', async () => {
    const payload = await payloadIstemcisi()
    const alt = (await payload.find({ collection: 'library-categories', where: { slug: { equals: `${TEST_ONEKI}-alt` } }, limit: 1, depth: 0 })).docs[0]!
    await expect(
      payload.create({
        collection: 'library-categories',
        locale: 'tr',
        data: { title: `${TEST_ONEKI} Üçüncü Düzey`, slug: `${TEST_ONEKI}-ucuncu`, parent: alt.id } as never,
        context: ctx(),
        overrideAccess: true,
      }),
    ).rejects.toThrow(/Üst Başlık/)
  })
})
