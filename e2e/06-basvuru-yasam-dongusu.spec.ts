import { expect, test } from '@playwright/test'

import { girisYap } from './yardimcilar/oturum'
import { ADLAR, payloadIstemcisi, testEpostasi } from './yardimcilar/tohum'

/**
 * SENARYO 6 — BAŞVURU YAŞAM DÖNGÜSÜ VE YETKİ SINIRLARI
 * ============================================================================
 * Senaryo 1 başvurunun ALINDIĞINI sınar; bu dosya sonrasını: kararın panelde
 * verilmesi, kişinin profilinde görünmesi ve kararı KİMİN veremeyeceği.
 *
 *   katılımcı başvurur (oturumlu) → kayıt hesaba bağlı, pending
 *   personel onaylar (Local API, personel kimliğiyle) → reviewedBy damgalı
 *   profil: "Katıldığım Eğitimler" → Onaylandı
 *   personel tamamlandı yapar → "Sertifikalarım" listeler
 *   katılımcı kendi kaydını API'den onaylamaya çalışır → 403
 *   anonim registrations listesi → 403; katılımcı yalnızca kendisini görür
 *
 * Her olumlu iddianın yanında olumsuz bir sınır var; olumlu tek başına,
 * erişim kuralı tümden kaldırıldığında da geçerdi.
 * ============================================================================
 */

const KATILIMCI = testEpostasi('katilimci')

const egitimIdBul = async () => {
  const payload = await payloadIstemcisi()
  const r = await payload.find({
    collection: 'training-programs',
    where: { slug: { equals: ADLAR.egitimSlug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return r.docs[0]!.id as number
}

/** Tohumlanan gerçek yönetici kaydı — karar onun kimliğiyle verilir. */
const yoneticiBul = async () => {
  const payload = await payloadIstemcisi()
  const r = await payload.find({
    collection: 'users',
    where: { email: { equals: testEpostasi('yonetici') } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  expect(r.docs[0], 'Tohumlanan yönetici hesabı bulunamadı.').toBeTruthy()
  return r.docs[0]!
}

test.describe('Başvuru yaşam döngüsü', () => {
  test('oturumlu başvuru hesaba bağlanır; onay ve tamamlama profilde görünür', async ({ page }) => {
    await girisYap(page, KATILIMCI)
    const egitimId = await egitimIdBul()

    /* Kütüphaneden (girişin bittiği yer) başvuru sayfasına bağlantıyla değil
       doğrudan gidilir; POST'u tarayıcı aynı kökenli gezinme olarak yapar. */
    await page.goto(`/tr/basvuru?egitim=${egitimId}`)

    /* Ad ve e-posta hesaptan ön dolu gelmeli. */
    await expect(page.getByLabel(/^E-posta adresi/)).toHaveValue(KATILIMCI)
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /Başvuruyu Gönder/i }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Başvurunuz alındı' })).toBeVisible()

    const payload = await payloadIstemcisi()
    const bulunan = await payload.find({
      collection: 'registrations',
      where: { email: { like: KATILIMCI } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    expect(bulunan.totalDocs).toBe(1)
    const kayit = bulunan.docs[0] as unknown as { id: number; user?: number | null; status?: string }
    expect(kayit.status).toBe('pending')
    /* OTURUMLU başvuru: `user` ilişkisi DOLU olmalı (anonimde boştu — senaryo 1). */
    expect(kayit.user, 'Oturumlu başvuru hesaba bağlanmadı.').toBeTruthy()

    /* --- Personel onaylar — GERÇEK personel kimliğiyle ------------------- */
    const yonetici = await yoneticiBul()
    const onaylanan = (await payload.update({
      collection: 'registrations',
      id: kayit.id,
      data: { status: 'approved' } as never,
      user: yonetici as never,
      overrideAccess: false,
      context: { skipRevalidate: true },
    })) as unknown as { status?: string; reviewedBy?: number | { id: number } | null; reviewedAt?: string | null }

    expect(onaylanan.status).toBe('approved')
    /* Damga: kararı kim, ne zaman verdi. */
    const reviewedById = typeof onaylanan.reviewedBy === 'object' ? onaylanan.reviewedBy?.id : onaylanan.reviewedBy
    expect(reviewedById).toBe(yonetici.id)
    expect(onaylanan.reviewedAt).toBeTruthy()

    /* --- Profil: Katıldığım Eğitimler → Onaylandı ------------------------ */
    await page.getByRole('link', { name: 'Profilim' }).click()
    await expect(page).toHaveURL(/\/tr\/profil/)

    const egitimler = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Katıldığım Eğitimler' }) })
    await expect(egitimler.getByRole('link', { name: ADLAR.egitimBasligi })).toBeVisible()
    /*
      `exact` DEĞİL: rozet ekran okuyucu için "Durum: " ön ekini `sr-only`
      taşır, dolayısıyla öğenin tam metni "Durum: Onaylandı"dır (ölçüldü).
      Bölüme kapsandığı için alt dize eşleşmesi yeterince kesindir.
    */
    await expect(egitimler.getByText('Onaylandı')).toBeVisible()

    /* Henüz tamamlanmış eğitim yok. */
    const sertifikalar = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Sertifikalarım' }) })
    await expect(sertifikalar.getByText('Tamamlanmış bir eğitiminiz henüz yok.')).toBeVisible()

    /* --- Tamamlandı → Sertifikalarım ------------------------------------ */
    const tamamlanan = (await payload.update({
      collection: 'registrations',
      id: kayit.id,
      data: { status: 'completed' } as never,
      user: yonetici as never,
      overrideAccess: false,
      context: { skipRevalidate: true },
    })) as unknown as { completedAt?: string | null }
    expect(tamamlanan.completedAt).toBeTruthy()

    await page.reload()
    await expect(sertifikalar.getByText(ADLAR.egitimBasligi)).toBeVisible()
  })

  test('katılımcı kendi başvurusunu ONAYLAYAMAZ; listeyi anonim GÖREMEZ', async ({ page, baseURL }) => {
    const payload = await payloadIstemcisi()
    const egitimId = await egitimIdBul()
    const kayit = await payload.create({
      collection: 'registrations',
      overrideAccess: true,
      context: { skipRevalidate: true },
      data: {
        status: 'pending',
        training: egitimId,
        fullName: 'E2E Yetki Testi',
        email: KATILIMCI,
      } as never,
    })

    /* Anonim: liste kapalı. */
    const anonim = await page.request.get('/api/registrations?limit=10')
    expect(anonim.status()).toBe(403)

    await girisYap(page, KATILIMCI)
    const basliklar = { Origin: String(baseURL), 'Content-Type': 'application/json' }

    /* Katılımcı yalnızca KENDİ kayıtlarını görür. */
    const liste = await page.request.get('/api/registrations?limit=50', { headers: basliklar })
    expect(liste.status()).toBe(200)
    const govde = (await liste.json()) as { docs?: { email?: string }[] }
    expect(govde.docs?.length ?? 0).toBeGreaterThan(0)
    for (const d of govde.docs ?? []) {
      expect(String(d.email ?? '').toLowerCase()).toBe(KATILIMCI.toLowerCase())
    }

    /*
      KENDİNİ ONAYLAMA: koleksiyon `update` kuralı katılımcıya kapalı.
      403 beklenir VE veritabanındaki durum DEĞİŞMEMİŞ olmalı — yalnızca
      duruma bakmak, kural 200 dönüp alanı sessizce düşürseydi de geçerdi;
      ikisi birlikte sınanır.
    */
    const deneme = await page.request.patch(`/api/registrations/${kayit.id}`, {
      headers: basliklar,
      data: { status: 'approved' },
    })
    expect(deneme.status()).toBe(403)

    const sonra = (await payload.findByID({
      collection: 'registrations',
      id: kayit.id,
      depth: 0,
      overrideAccess: true,
    })) as unknown as { status?: string }
    expect(sonra.status).toBe('pending')
  })
})
