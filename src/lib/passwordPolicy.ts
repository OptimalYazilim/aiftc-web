/**
 * PAROLA POLİTİKASI — TEK KAYNAK  (Şartname 12.1)
 * ============================================================================
 * Kural üç yerden okunur ve üçü de AYNI sayıyı kullanmak zorundadır:
 *
 *   1. `collections/Users.ts`  → `hooks.beforeValidate`
 *      Hesap OLUŞTURMA ve normal güncelleme yolunu kapatır.
 *   2. `middleware.ts`         → `POST /api/users/reset-password`
 *      SIFIRLAMA yolunu kapatır. Ayrı bir yer olması ZORUNLUDUR — gerekçe
 *      aşağıda.
 *   3. `components/auth/*`     → form içi ön kontrol (yalnızca kolaylık)
 *
 * ---------------------------------------------------------------------------
 * NEDEN İKİ SUNUCU NOKTASI — ÖLÇÜLMÜŞ
 * ---------------------------------------------------------------------------
 * Kural önce yalnızca `beforeValidate` içindeydi. Ölçüldü (2026-09-07):
 *
 *     POST /api/users/reset-password { token, password: '123' }  ->  200
 *
 * Yani politika sıfırlama yolundan TAMAMEN ATLANABİLİYORDU. Sebebi Payload'ın
 * kaynak kodunda görünür (`auth/operations/resetPassword.js`): işlem parolayı
 * ÖNCE hash'ler, sonra kancayı çağırır —
 *
 *     user.salt = salt
 *     user.hash = hash
 *     …
 *     hook({ data: user, operation: 'update', … })
 *
 * Kancaya giden `data` içinde `password` YOKTUR; `salt` ve `hash` vardır.
 * Düz metni göremeyen bir kural onu doğrulayamaz.
 *
 * Bu yüzden sıfırlama yolu, isteğin Payload'a HİÇ ULAŞMADAN önce
 * middleware'de denetlenir. İki nokta, tek kural, tek sayı.
 *
 * ---------------------------------------------------------------------------
 * Bu dosya BAĞIMLILIKSIZDIR
 * ---------------------------------------------------------------------------
 * Hem Edge çalışma zamanındaki middleware'den hem istemci bileşenlerinden
 * hem de Payload yapılandırmasından içe aktarılır. Bu yüzden yalnızca düz
 * TypeScript içerir: kitaplık yok, `process.env` okuması yok.
 */

/** Asgari parola uzunluğu. Değiştirilirse üç nokta da otomatik izler. */
export const MIN_PAROLA = 10

/** Hata gövdesinde ve istemcide kullanılan makine kodu. */
export const PAROLA_KISA_KODU = 'password_too_short'

/**
 * Parola kuralı sağlıyor mu?
 *
 * BOŞ DEĞER `true` DÖNER — bilinçli. "Parola verilmedi" ile "parola çok
 * kısa" farklı durumlardır: birincisi bu kuralın konusu değildir (parolasız
 * bir güncelleme, örneğin yöneticinin hesabı onaylaması, bu kuraldan
 * etkilenmemelidir). Zorunluluk denetimi çağıran tarafa aittir.
 */
export const parolaGecerliMi = (parola: unknown): boolean => {
  if (typeof parola !== 'string' || parola.length === 0) return true
  return parola.length >= MIN_PAROLA
}

/** Payload'ın hata biçimiyle uyumlu gövde — istemci tek bir dal okur. */
export const parolaHataGovdesi = () => ({
  errors: [
    {
      message: `Parola en az ${MIN_PAROLA} karakter olmalıdır.`,
      data: { code: PAROLA_KISA_KODU, minLength: MIN_PAROLA },
    },
  ],
})
