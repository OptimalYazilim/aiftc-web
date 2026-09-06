import { NextResponse } from 'next/server'

import { payloadClient } from '@/lib/queries'

/**
 * İNDİRME / İZLENME SAYACI — ARTIRMA UÇ NOKTASI
 * ============================================================================
 * Ziyaretçi bir kütüphane kaydının "Dokümanı İndir" veya "Kaydı İzle"
 * düğmesine bastığında istemci buraya `navigator.sendBeacon` ile haber
 * gönderir ve `library-resources.downloads` alanı bir artırılır.
 *
 * ---------------------------------------------------------------------------
 * NEDEN AYRI BİR UÇ NOKTA — Payload'ın REST API'si kullanılamaz
 * ---------------------------------------------------------------------------
 * Payload'ın `PATCH /api/library-resources/:id` ucu, koleksiyonun `update`
 * erişimine tabidir ve o erişim yalnızca yetkili editörlere açıktır
 * (`canAuthorContent`). Ziyaretçiye o ucu açmak, tüm alanları yazma yetkisi
 * vermek olurdu. Buradaki uç noktanın yazabildiği TEK alan `downloads`'tur.
 *
 * ---------------------------------------------------------------------------
 * KİŞİSEL VERİ İŞLENMEZ (KVKK / Şartname 12.2)
 * ---------------------------------------------------------------------------
 * IP, çerez, oturum kimliği, referans adresi — hiçbiri okunmaz ve
 * kaydedilmez. Yalnızca ilgili satırdaki bir tam sayı artar. Bu nedenle
 * ziyaretçiden ayrıca rıza istenmez: ortada kişiyle ilişkilendirilebilir bir
 * veri yoktur.
 *
 * ---------------------------------------------------------------------------
 * BİLİNEN SINIRLAR — GÖRMEZDEN GELİNMESİN
 * ---------------------------------------------------------------------------
 *   - TEKİLLEŞTİRME YOK. Aynı kişinin beş indirmesi sayacı beşe çıkarır.
 *     Tekilleştirme, ziyaretçiyi tanımlayan bir çerez gerektirirdi; bu ayrı
 *     bir rıza konusudur ve sayaç bunu hak edecek kadar kritik değildir.
 *   - HIZ SINIRI UYGULAMA KATMANINDA YOK. Bir betik bu ucu döngüde çağırıp
 *     sayacı şişirebilir. Sınırlama ters vekil / WAF katmanında yapılmalıdır
 *     (bkz. payload.config.ts içindeki hız sınırlama notu). Bu yüzden sayı
 *     KABA BİR POPÜLERLİK GÖSTERGESİDİR, denetlenebilir bir istatistik
 *     değildir; arayüzde de öyle sunulur.
 *
 * Aşağıdaki üç önlem yine de alınır:
 *   1. `id` tam sayıya indirgenir — keyfi bir değer sorguya girmez.
 *   2. Kayıt YALNIZCA yayımlanmışsa artırılır; taslak kayıtların sayacı
 *      dışarıdan şişirilemez.
 *   3. `skipRevalidate`: sayaç artışı ISR yenilemesini TETİKLEMEZ. Aksi
 *      halde her indirme tüm kütüphane sayfasını yeniden ürettirirdi.
 *
 * Hata durumunda bile 204 dönülür: sayaç bir yan işlevdir, ziyaretçinin
 * indirmesini hiçbir koşulda etkilememelidir.
 * ============================================================================
 */

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params

  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) {
    return new NextResponse(null, { status: 204 })
  }

  try {
    const payload = await payloadClient()

    const doc = await payload.findByID({
      collection: 'library-resources',
      id,
      depth: 0,
      // Yayımlanmamış kayıtlar `publishedOrAuthenticated` ile zaten
      // görünmez; burada ayrıca `_status` kontrolü yapılır.
      overrideAccess: true,
    })

    if (doc?._status !== 'published') {
      return new NextResponse(null, { status: 204 })
    }

    await payload.update({
      collection: 'library-resources',
      id,
      overrideAccess: true,
      context: { skipRevalidate: true, skipTranslationStatus: true },
      data: { downloads: (Number(doc.downloads) || 0) + 1 },
    })
  } catch {
    /*
      Yutulan hata BİLİNÇLİDİR. Ziyaretçi dosyayı zaten indirdi; sayacın
      artmaması onun için bir sonuç doğurmaz. Burada 500 dönmek, tarayıcı
      konsoluna hiçbir işe yaramayan bir hata basmaktan başka bir şey yapmaz.
    */
  }

  return new NextResponse(null, { status: 204 })
}
