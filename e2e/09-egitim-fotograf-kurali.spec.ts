import { expect, test } from '@playwright/test'

import { ADLAR, payloadIstemcisi, testEpostasi } from './yardimcilar/tohum'

/**
 * SENARYO 9 — YAYINDAKİ EĞİTİMDE EN AZ BİR FOTOĞRAF
 * ============================================================================
 * Kurum kararı (29.09.2026): her eğitimde en az bir fotoğraf olmalı. Kural
 * `TrainingPrograms.coverImage` doğrulayıcısındadır ve yalnızca bir KULLANICI
 * adına yapılan yayımlamalarda işler (panel/API); ölçüm de bu yüzden gerçek
 * yönetici kimliğiyle ve `overrideAccess: false` ile yapılır.
 *
 *   olumsuz: kapak + galeri boşaltılarak yayımlama → REDDEDİLİR, kayıt değişmez
 *   olumlu : görseller dururken sıradan bir düzenleme → GEÇER
 *
 * Olumlu kontrol, kuralın "her düzenlemeyi" engelleyecek kadar geniş
 * yazılmadığını kanıtlar.
 * ============================================================================
 */

const yoneticiVeEgitim = async () => {
  const payload = await payloadIstemcisi()
  const yonetici = (
    await payload.find({
      collection: 'users',
      where: { email: { equals: testEpostasi('yonetici') } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
  ).docs[0]
  const egitim = (
    await payload.find({
      collection: 'training-programs',
      where: { slug: { equals: ADLAR.egitimSlug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
  ).docs[0] as unknown as { id: number; coverImage?: number | null; venue?: string | null } | undefined
  expect(yonetici, 'Tohumlanan yönetici bulunamadı.').toBeTruthy()
  expect(egitim?.coverImage, 'Tohumlanan eğitimin kapak görseli yok — ön koşul sağlanmadı.').toBeTruthy()
  return { payload, yonetici: yonetici!, egitim: egitim! }
}

test.describe('Eğitim fotoğraf kuralı', () => {
  test('görselsiz yayımlama reddedilir, kayıt değişmez', async () => {
    const { payload, yonetici, egitim } = await yoneticiVeEgitim()

    await expect(
      payload.update({
        collection: 'training-programs',
        id: egitim.id,
        data: { coverImage: null, gallery: [], _status: 'published' } as never,
        user: yonetici as never,
        overrideAccess: false,
        context: { skipRevalidate: true },
      }),
    ).rejects.toThrow(/Kapak Görseli/)

    const sonra = (await payload.findByID({ collection: 'training-programs', id: egitim.id, depth: 0 })) as unknown as {
      coverImage?: number | null
    }
    expect(sonra.coverImage).toBe(egitim.coverImage)
  })

  test('görseller dururken sıradan düzenleme geçer', async () => {
    const { payload, yonetici, egitim } = await yoneticiVeEgitim()

    const guncel = (await payload.update({
      collection: 'training-programs',
      id: egitim.id,
      data: { venue: egitim.venue } as never,
      user: yonetici as never,
      overrideAccess: false,
      context: { skipRevalidate: true },
    })) as unknown as { id: number }
    expect(guncel.id).toBe(egitim.id)
  })
})
