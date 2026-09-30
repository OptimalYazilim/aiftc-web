import { expect, test } from '@playwright/test'

import { girisYap } from './yardimcilar/oturum'
import { ADLAR, payloadIstemcisi, pngUret, testEpostasi, TEST_ONEKI } from './yardimcilar/tohum'

/**
 * SENARYO 11 — DAİRE BAZLI KÜTÜPHANE YETKİSİ
 * ============================================================================
 * Kurum kararı (29.09.2026): eğitim içeriklerine personel DAİRESİNE göre
 * erişir. Kurgu:
 *
 *   katılımcı (seviye: trainee) → daire A
 *   kısıtlı rehber (seviye: trainee, yalnızca seçili daireler)
 *   katılımcı seviyeli belge   (seviye: participants, yalnızca seçili daireler)
 *
 *   yetkili daireler = [B]    → rehber LİSTELENMEZ, künye 404, belge okunamaz
 *   yetkili daireler = [A, B] → rehber listelenir, belge okunur
 *
 * Seviye iki hâlde de uyar; farkı yaratan YALNIZCA daire listesidir. Belge
 * ayrıca ölçülür: kısıt yalnızca kayıtta olsaydı dosya kendi adresinden
 * indirilebilirdi.
 *
 * Daire adları kurumsal değildir (`e2e` önekli test verisi) ve sonda silinir;
 * katılımcının dairesi ve rehberin kısıtı eski hâline döndürülür.
 * ============================================================================
 */

const ctx = () => ({ skipRevalidate: true })
const KATILIMCI = testEpostasi('katilimci')

type Kurgu = {
  katilimciId: number
  rehberId: number
  belgeId: number
  daireA: number
  daireB: number
}
let k: Kurgu

const daireleriYaz = async (kimlikler: number[]) => {
  const payload = await payloadIstemcisi()
  for (const [collection, id] of [
    ['library-resources', k.rehberId],
    ['document-files', k.belgeId],
  ] as const) {
    await payload.update({
      collection,
      id,
      data: { restrictToDepartments: true, departments: kimlikler } as never,
      context: ctx(),
      overrideAccess: true,
    })
  }
}

test.beforeAll(async () => {
  const payload = await payloadIstemcisi()
  await payload.delete({ collection: 'departments', where: { externalCode: { like: TEST_ONEKI } }, overrideAccess: true })

  const daire = (ad: string) =>
    payload.create({
      collection: 'departments',
      locale: 'tr',
      data: { title: `${TEST_ONEKI} Daire ${ad}`, externalCode: `${TEST_ONEKI}-${ad}` } as never,
      overrideAccess: true,
    })
  const [a, b] = [await daire('A'), await daire('B')]

  const katilimci = (await payload.find({ collection: 'users', where: { email: { equals: KATILIMCI } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]!
  await payload.update({ collection: 'users', id: katilimci.id, data: { department: a.id } as never, overrideAccess: true })

  const rehber = (await payload.find({ collection: 'library-resources', where: { slug: { equals: ADLAR.kisitliSlug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]!

  await payload.delete({ collection: 'document-files', where: { title: { equals: `${TEST_ONEKI} Daire Belgesi` } }, overrideAccess: true })
  const belge = await payload.create({
    collection: 'document-files',
    locale: 'tr',
    data: { title: `${TEST_ONEKI} Daire Belgesi`, accessLevel: 'participants' } as never,
    file: { data: await pngUret(), mimetype: 'image/png', name: `${TEST_ONEKI}-daire-belgesi.png`, size: 0 },
    context: ctx(),
    overrideAccess: true,
  })

  k = { katilimciId: katilimci.id as number, rehberId: rehber.id as number, belgeId: belge.id as number, daireA: a.id as number, daireB: b.id as number }
})

test.afterAll(async () => {
  const payload = await payloadIstemcisi()
  await payload.update({ collection: 'library-resources', id: k.rehberId, data: { restrictToDepartments: false, departments: [] } as never, context: ctx(), overrideAccess: true })
  await payload.update({ collection: 'users', id: k.katilimciId, data: { department: null } as never, overrideAccess: true })
  await payload.delete({ collection: 'document-files', id: k.belgeId, context: ctx(), overrideAccess: true })
  await payload.delete({ collection: 'departments', where: { externalCode: { like: TEST_ONEKI } }, overrideAccess: true })
})

/** Katılımcı adına Local API okuması — erişim kuralı ZORLANIR. */
const katilimciOlarakBelgeSay = async () => {
  const payload = await payloadIstemcisi()
  const kullanici = await payload.findByID({ collection: 'users', id: k.katilimciId, depth: 0, overrideAccess: true })
  const r = await payload.find({
    collection: 'document-files',
    where: { id: { equals: k.belgeId } },
    user: { ...kullanici, collection: 'users' } as never,
    overrideAccess: false,
    depth: 0,
  })
  return r.totalDocs
}

/*
  KÜNYE İSTEĞİ `Origin` İLE — ÖLÇÜLMÜŞ TUZAK: Payload, aynı kökenden geldiği
  belli olmayan istekte çereze GÜVENMEZ ve isteği oturumsuz sayar. Başlıksız
  bir istek her durumda 404 alır ve negatif test anlamsızca geçerdi. Aynı
  isteğin ikinci testte 200 alması, 404'ün oturumdan değil daire kuralından
  geldiğini kanıtlar.
*/
const kunyeDurumu = async (page: import('@playwright/test').Page, baseURL: string | undefined) =>
  (
    await page.request.get(`/tr/kutuphane/${ADLAR.kisitliSlug}`, {
      maxRedirects: 0,
      headers: { Origin: baseURL ?? 'http://localhost:3100' },
    })
  ).status()

test.describe('Daire bazlı kütüphane yetkisi', () => {
  test('dairesi yetkili listede OLMAYAN katılımcı kısıtlı içeriği göremez', async ({ page, baseURL }) => {
    await daireleriYaz([k.daireB])

    await girisYap(page, KATILIMCI)
    await page.goto('/tr/kutuphane')
    await expect(page.getByRole('heading', { name: ADLAR.acikKayit })).toBeVisible()
    await expect(page.getByRole('heading', { name: ADLAR.kisitliKayit })).toHaveCount(0)

    expect(await kunyeDurumu(page, baseURL)).toBe(404)
    expect(await katilimciOlarakBelgeSay()).toBe(0)
  })

  test('dairesi listeye eklenince aynı içerik açılır', async ({ page, baseURL }) => {
    await daireleriYaz([k.daireA, k.daireB])

    await girisYap(page, KATILIMCI)
    await page.goto('/tr/kutuphane')
    await expect(page.getByRole('heading', { name: ADLAR.kisitliKayit })).toBeVisible()

    expect(await kunyeDurumu(page, baseURL)).toBe(200)
    expect(await katilimciOlarakBelgeSay()).toBe(1)
  })
})
