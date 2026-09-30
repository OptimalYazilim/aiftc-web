import { edevletKullanilabilir } from './edevlet'
import { payloadClient } from './queries'

/**
 * e-DEVLET SİTEDE AÇIK MI — İKİ BAĞIMSIZ KOŞUL
 * ============================================================================
 *   1. TEKNİK: akış çalışabilir mi? (`edevletKullanilabilir()` — kum havuzu
 *      yerel adreste açık ya da gerçek kapı yapılandırılmış)
 *   2. KURUMSAL: editör vatandaş girişini açtı mı?
 *      (`external-services.edevlet.citizenLoginEnabled`)
 *
 * İkisi de sağlanmadan giriş düğmesi basılmaz ve uçlar 404 döner. Birinci
 * koşul `lib/edevlet.ts`te kalır çünkü istemcide de okunur ve veritabanına
 * bakmaz; ikincisi global okuduğu için yalnızca sunucuda çalışır.
 *
 * HATA KAPALI TARAFA DÜŞER: global okunamazsa (veritabanı hatası, alan henüz
 * yok) giriş KAPALI sayılır. Kurumun "kapalı" dediği bir girişin geçici bir
 * hata yüzünden açılması, açık bir girişin geçici olarak görünmemesinden
 * daha kötüdür.
 * ============================================================================
 */
export const edevletSitedeAcik = async (): Promise<boolean> => {
  if (!edevletKullanilabilir()) return false
  try {
    const payload = await payloadClient()
    const svc = await payload.findGlobal({ slug: 'external-services', depth: 0 })
    return svc.edevlet?.citizenLoginEnabled === true
  } catch {
    return false
  }
}
