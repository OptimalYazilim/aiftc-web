import { APIError, type CollectionBeforeDeleteHook } from 'payload'

/**
 * EĞİTİM SİLİNİRKEN BAĞLI BAŞVURULARI KORU
 * ============================================================================
 * `guardVirtualClassrooms` ile AYNI KUSUR, AYNI TEDAVİ. `Registrations.training`
 * `required: true` → sütun NOT NULL; Payload yabancı anahtarı `ON DELETE set
 * null` yazar. Başvurusu olan bir eğitim silinmeye çalışıldığında Postgres
 * NULL yazamaz, işlem düşer ve editör anlamsız bir hata görür. E2E temizliğinde
 * tam bu ölçüldü (2026-09-28):
 *
 *     delete from "payload_preferences" where key in ($1)
 *     cause: current transaction is aborted, commands ignored until end of
 *            transaction block
 *
 * Görünen hata tercih tablosunda; asıl sebep bir önceki ifadede (FK).
 *
 * NEDEN "BAŞVURULARI DA SİL" DEĞİL
 * ---------------------------------------------------------------------------
 * Başvuru kaydı bir KARARIN izidir (kim onaylandı, kim tamamladı). Eğitimi
 * silmek o izi sessizce yok etmemeli — sertifika doğrulama ve raporlama bu
 * kayıtlara dayanır. Silme durdurulur, ne yapılacağı söylenir.
 * ============================================================================
 */
export const guardRegistrations: CollectionBeforeDeleteHook = async ({ req, id }) => {
  const result = await req.payload.find({
    collection: 'registrations',
    where: { training: { equals: id } },
    limit: 1,
    depth: 0,
    /* Sayım erişimden bağımsız: silme yetkisi olan editör engelin sebebini görmeli. */
    overrideAccess: true,
    req,
  })

  if (result.totalDocs === 0) return

  throw new APIError(
    `Bu eğitime bağlı ${result.totalDocs} başvuru kaydı var. ` +
      'Eğitimi silmeden önce Eğitim Başvuruları bölümünden bu kayıtları silin ' +
      'ya da eğitimi silmek yerine durumunu "İptal edildi" yapıp yayından kaldırın.',
    400,
  )
}
