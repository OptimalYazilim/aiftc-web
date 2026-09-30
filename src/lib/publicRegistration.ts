import type { Payload } from 'payload'

/**
 * GENEL KAYIT AÇIK MI — TEK KARAR NOKTASI
 * ============================================================================
 * Proje kararı (30.09.2026): genel kayıt sayfası açık kalmayacak. Gerekçe,
 * 29.09.2026 kurum toplantısının sonuçlarıdır: merkez vatandaşa eğitim
 * vermiyor, OGM personeli OGM hesabıyla girecek; yurt dışı katılımcılar ise
 * başvuru formunu hesap açmadan dolduruyor. Dışarıdan hesap açılmasına gerek
 * kalmadı.
 *
 * Akış SİLİNMEDİ: `Genel Site Ayarları → Hesaplar → Genel kayıt` anahtarıyla
 * geri açılabilir (varsayılan KAPALI). Bu fonksiyon o anahtarı okur ve üç yer
 * aynı cevabı kullanır — biri kapanıp diğeri açık kalamasın:
 *
 *   1. `Users.access.create` (access/index.ts → canRegister): BAĞLAYICI kural.
 *   2. `Users.beforeOperation`: kapalıyken anonim istek CAPTCHA'ya bile
 *      gitmeden, anlaşılır bir kodla reddedilir.
 *   3. Kayıt sayfası ve giriş formundaki bağlantı: sayfa 404 döner, bağlantı
 *      basılmaz.
 *
 * Yalnızca sayfayı gizlemek YETMEZDİ: kayıt, sayfadan değil `POST /api/users`
 * ucundan yapılır; gizli bir sayfanın arkasında açık kalan uç hâlâ çalışan
 * bir kayıttır (aynı ders: lib/edevletSite.ts).
 *
 * HATA KAPALI TARAFA DÜŞER: ayar okunamazsa kayıt KAPALI sayılır.
 * ============================================================================
 */
export const KAYIT_KAPALI_KODU = 'kayit_kapali'

export const genelKayitAcik = async (payload: Payload): Promise<boolean> => {
  try {
    const ayar = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    return ayar.accounts?.publicRegistrationEnabled === true
  } catch {
    return false
  }
}
