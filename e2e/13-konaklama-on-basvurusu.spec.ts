import { expect, test, type Page } from '@playwright/test'

import { ADLAR, payloadIstemcisi, TEST_ONEKI } from './yardimcilar/tohum'

/**
 * SENARYO 13 — KONAKLAMA ÖN BAŞVURUSU
 * ============================================================================
 * Kurum kararı (29.09.2026): eğitim başvurusunda "konaklamak istiyorum";
 * talep → kurum onayı; online ödeme yok; eğitim tarihleri dışına taşabilir;
 * en fazla N gece; eğitim içi/dışı ayrı tarife; kapalı ve dolu geceye talep
 * yapılamaz.
 *
 * Kurgu (tohum eğitimi 10–14 Haziran 2030):
 *   tarife 100 (eğitim içi) / 150 (eğitim dışı) TRY, kapasite 1 gece,
 *   1–5 Temmuz 2030 KAPALI, 20–21 Haziran geceleri ONAYLI bir talep → DOLU
 *
 *   8–16 Haziran  → 8 gece = 4 × 100 + 4 × 150 = 1000 ₺ (formda ve kayıtta)
 *   29 Haz–2 Tem  → sunucu reddeder (kapalı dönem), kayıt YOK
 *   19–21 Haziran → sunucu reddeder (dolu gece), kayıt YOK
 *
 * Tarifeler test değeridir (kurumun rakamı değil) ve sonda silinir.
 * ============================================================================
 */

const ctx = () => ({ skipRevalidate: true })
const DOLU_EPOSTA = `${TEST_ONEKI}-dolu-oda@example.test`
/** Kapalı dönemin iç notu — hiçbir yoldan ziyaretçiye ulaşmamalı. */
const IC_NOT = `${TEST_ONEKI} ic not: bakim calismasi`

const ayarYaz = async (data: Record<string, unknown>) => {
  const payload = await payloadIstemcisi()
  await payload.updateGlobal({ slug: 'accommodation-settings', data: data as never, context: ctx(), overrideAccess: true })
}

let egitimId: number

test.beforeAll(async () => {
  const payload = await payloadIstemcisi()
  egitimId = (await payload.find({ collection: 'training-programs', where: { slug: { equals: ADLAR.egitimSlug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]!.id as number
  await ayarYaz({
    enabled: true,
    maxNights: 20,
    capacity: 1,
    currency: 'TRY',
    rateInTraining: 100,
    rateOutsideTraining: 150,
    /* Öğle saatiyle: İstanbul'da da aynı gün kalsın (lib/accommodation → gunOf). */
    closedPeriods: [{ from: '2030-07-01T12:00:00.000Z', to: '2030-07-05T12:00:00.000Z', note: IC_NOT }],
  })
  await payload.delete({ collection: 'accommodation-requests', where: { email: { equals: DOLU_EPOSTA } }, overrideAccess: true })
  await payload.create({
    collection: 'accommodation-requests',
    data: {
      status: 'approved',
      fullName: 'E2E Dolu Oda',
      email: DOLU_EPOSTA,
      checkIn: '2030-06-20T12:00:00.000Z',
      checkOut: '2030-06-22T12:00:00.000Z',
      nights: 2,
    } as never,
    overrideAccess: true,
  })
})

test.afterAll(async () => {
  const payload = await payloadIstemcisi()
  await payload.delete({
    collection: 'accommodation-requests',
    where: { or: [{ email: { equals: DOLU_EPOSTA } }, { email: { like: `${TEST_ONEKI}-onay-` } }] },
    overrideAccess: true,
  })
  await ayarYaz({ enabled: false, capacity: null, rateInTraining: null, rateOutsideTraining: null, closedPeriods: [] })
})

const formuDoldur = async (page: Page, eposta: string, giris: string, cikis: string) => {
  await page.goto(`/tr/basvuru?egitim=${egitimId}`)
  await page.getByRole('checkbox', { name: /konaklamak istiyorum/i }).check()
  await page.getByLabel(/^Giriş tarihi/).fill(giris)
  await page.getByLabel(/^Çıkış tarihi/).fill(cikis)
  await page.getByLabel(/^Ad Soyad/).fill('E2E Konaklama')
  await page.getByLabel(/^E-posta adresi/).fill(eposta)
  await page.getByRole('textbox', { name: 'Telefon' }).fill('+90 555 000 00 00')
  await page.getByRole('checkbox', { name: /açık rıza/i }).check()
}

const talepler = async (eposta: string) => {
  const payload = await payloadIstemcisi()
  return (await payload.find({ collection: 'accommodation-requests', where: { email: { equals: eposta } }, depth: 0, overrideAccess: true })).docs as unknown as Record<string, unknown>[]
}

test.describe('Konaklama ön başvurusu', () => {
  test('tahmini ücret formda görünür; talep başvuruya bağlı ve aynı rakamlarla kaydedilir', async ({ page }) => {
    const eposta = `${TEST_ONEKI}-konaklama@example.test`
    await formuDoldur(page, eposta, '2030-06-08', '2030-06-16')

    await expect(page.getByText('8 gece (4 eğitim süresince, 4 eğitim dışında)')).toBeVisible()
    await expect(page.getByText(/Tahmini ücret: .*1\.000/)).toBeVisible()

    await page.getByRole('button', { name: /Başvuruyu Gönder/i }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Başvurunuz alındı' })).toBeVisible()

    const [talep] = await talepler(eposta)
    expect(talep, 'Konaklama talebi açılmadı.').toBeTruthy()
    expect(talep!.status).toBe('pending')
    expect(talep!.nights).toBe(8)
    expect(talep!.nightsInTraining).toBe(4)
    expect(talep!.nightsOutside).toBe(4)
    expect(talep!.estimatedCost).toBe(1000)
    expect(talep!.phone).toBe('+90 555 000 00 00')
    expect(talep!.registration, 'Talep başvuruya bağlanmadı.').toBeTruthy()
  })

  test('kapalı döneme ve dolu geceye denk gelen talep SUNUCUDA reddedilir', async ({ page }) => {
    for (const [ad, giris, cikis, desen] of [
      ['kapali', '2030-06-29', '2030-07-02', /kapalı dönemine/],
      ['dolu', '2030-06-19', '2030-06-21', /gecesi dolu/],
    ] as const) {
      const eposta = `${TEST_ONEKI}-konaklama-${ad}@example.test`
      await formuDoldur(page, eposta, giris, cikis)
      await page.getByRole('button', { name: /Başvuruyu Gönder/i }).click()

      const ozet = page.getByRole('alert').filter({ hasText: /hata var/i })
      await expect(ozet).toBeVisible()
      await expect(ozet).toContainText(desen)
      expect(await talepler(eposta)).toHaveLength(0)

      const payload = await payloadIstemcisi()
      const basvurular = await payload.find({ collection: 'registrations', where: { email: { equals: eposta } }, overrideAccess: true })
      expect(basvurular.totalDocs, 'Reddedilen konaklamada başvuru yine de yazıldı.').toBe(0)
    }
  })

  test('talepler ve kapalı dönemin iç notu ziyaretçiye KAPALIDIR', async ({ page }) => {
    const payload = await payloadIstemcisi()

    /*
      Talepler kişisel veri taşır (ad, telefon, e-posta). Erişim kuralı
      ZORLANARAK, oturumsuz okunur ve yazılır: ikisi de reddedilmeli. Genel
      API'den talep açılamaması, tek giriş kapısının başvuru formu olduğunu
      (sunucu denetimlerinin atlanamadığını) güvenceye alır.
    */
    await expect(payload.find({ collection: 'accommodation-requests', overrideAccess: false, depth: 0 })).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'accommodation-requests',
        data: { fullName: 'x', checkIn: '2030-01-01', checkOut: '2030-01-02' } as never,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    /*
      İÇ NOT İKİ YOLDAN DA SIZMAMALI:
        1. API: global herkese açık okunur (form kuralları için) ama `note`
           alanı alan düzeyinde oturuma bağlıdır.
        2. SAYFA: başvuru sayfası ayarları erişim kuralını AŞARAK okur; notu
           istemciye göndermeden ayıklamak sayfanın işidir. Bu yüzden üretilen
           HTML'in kendisi taranır — yalnızca API'yi ölçmek bu yolu kaçırırdı.
      Kapalı dönemin TARİHİ ise görünmelidir: not gizli, kural açık.
    */
    const anonim = (await payload.findGlobal({ slug: 'accommodation-settings', depth: 0, overrideAccess: false })) as unknown as {
      closedPeriods?: { from?: string; note?: string }[]
    }
    expect(anonim.closedPeriods?.[0]?.from).toBeTruthy()
    expect(anonim.closedPeriods?.[0]?.note).toBeUndefined()

    await page.goto(`/tr/basvuru?egitim=${egitimId}`)
    await page.getByRole('checkbox', { name: /konaklamak istiyorum/i }).check()
    await expect(page.getByText('01.07.2030 – 05.07.2030 (kapalı)')).toBeVisible()
    expect(await page.content()).not.toContain(IC_NOT)
  })

  test('personel onayında da kapasite denetlenir: dolu geceye ikinci talep ONAYLANAMAZ', async () => {
    /*
      Form dolu geceye talebi reddeder, ama doluluk yalnızca ONAYLI taleplerden
      hesaplanır: aynı geceye iki BEKLEYEN talep gelebilir. Denetim yalnızca
      formda olsaydı personel ikisini de onaylayıp kapasiteyi (burada 1)
      aşabilirdi. Kurgu: 20–21 Haziran geceleri zaten onaylı bir talepte.

        21–22 geceleri isteyen bekleyen talep → onay REDDEDİLİR, gece söylenir
        22–23 geceleri isteyen bekleyen talep → onaylanır (çakışma yok)

      İkincisi negatif kontroldür: kural her onayı engelleseydi o da düşerdi.
    */
    const payload = await payloadIstemcisi()
    const ac = (ad: string, giris: string, cikis: string) =>
      payload.create({
        collection: 'accommodation-requests',
        data: {
          status: 'pending',
          fullName: `E2E ${ad}`,
          email: `${TEST_ONEKI}-onay-${ad}@example.test`,
          checkIn: `${giris}T12:00:00.000Z`,
          checkOut: `${cikis}T12:00:00.000Z`,
          nights: 2,
        } as never,
        overrideAccess: true,
      })
    const onayla = (id: number | string) =>
      payload
        .update({ collection: 'accommodation-requests', id, data: { status: 'approved' } as never, overrideAccess: true })
        .then(
          () => null,
          (hata: { data?: { errors?: { message?: string }[] } }) => hata,
        )

    const cakisan = await ac('cakisan', '2030-06-21', '2030-06-23')
    const serbest = await ac('serbest', '2030-06-22', '2030-06-24')

    const hata = await onayla(cakisan.id)
    expect(hata, 'Dolu geceye denk gelen talep onaylandı.').toBeTruthy()
    expect(String(hata?.data?.errors?.[0]?.message)).toContain('21.06.2030')
    const sonra = (await payload.findByID({ collection: 'accommodation-requests', id: cakisan.id, depth: 0 })) as unknown as {
      status?: string
    }
    expect(sonra.status).toBe('pending')

    expect(await onayla(serbest.id), 'Çakışmayan talep de reddedildi.').toBeNull()
  })
})
