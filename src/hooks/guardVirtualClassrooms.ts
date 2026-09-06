import { APIError, type CollectionBeforeDeleteHook } from 'payload'

/**
 * EĞİTİM SİLİNİRKEN BAĞLI SANAL SINIFLARI KORU
 * ============================================================================
 * NEDEN VAR — ÖLÇÜLEREK BULUNAN BİR KUSUR
 * ---------------------------------------------------------------------------
 * `VirtualClassrooms.training` alanı `required: true` olduğu için sütun
 * NOT NULL üretilir; ancak Payload yabancı anahtarı `ON DELETE set null` ile
 * yazar. İkisi çelişir: odası olan bir eğitim silinmeye çalışıldığında
 * Postgres NULL yazamaz ve işlem düşer.
 *
 * Deneyle doğrulandı (geçici bir eğitim + oda kurulup silinmeye çalışıldı):
 *
 *     SONUÇ: HATA -> Failed query: delete from "training_programs"
 *                    where "training_programs"."id" = $1  params: 8
 *
 * Editörün panelde göreceği şey buydu: ne olduğunu söylemeyen bir SQL hatası.
 *
 * NEDEN "ODALARI DA SİL" DEĞİL
 * ---------------------------------------------------------------------------
 * Sessiz zincirleme silme seçilmedi. Oda kaydı toplantı adresi ve parolaları
 * taşır; bir eğitimi silmek, o oturumların kaydını da sessizce yok etmeyi
 * gerektirmez. Kurumsal bir panelde veri, kullanıcı istemeden kaybolmamalıdır.
 *
 * Bunun yerine silme DURDURULUR ve ne yapılması gerektiği söylenir. Editör
 * odaları bilerek siler veya başka bir eğitime taşır, sonra eğitimi siler.
 * ============================================================================
 */
export const guardVirtualClassrooms: CollectionBeforeDeleteHook = async ({ req, id }) => {
  const result = await req.payload.find({
    collection: 'virtual-classrooms',
    where: { training: { equals: id } },
    limit: 5,
    depth: 0,
    // Sayım erişim kurallarından bağımsız olmalı: silme yetkisi olan bir
    // editör, odayı okuyamasa bile engelin sebebini öğrenebilmelidir.
    overrideAccess: true,
    req,
  })

  if (result.totalDocs === 0) return

  const names = (result.docs as unknown as { title?: string | null }[])
    .map((doc) => doc.title)
    .filter(Boolean)
    .join(', ')

  throw new APIError(
    `Bu eğitime bağlı ${result.totalDocs} sanal sınıf var${names ? ` (${names})` : ''}. ` +
      'Eğitimi silmeden önce Sanal Sınıflar bölümünden bu odaları silin veya başka bir eğitime taşıyın.',
    400,
  )
}
