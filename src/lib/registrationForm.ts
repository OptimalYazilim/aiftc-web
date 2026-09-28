/**
 * EĞİTİM BAŞVURU FORMUNUN CMS KİMLİĞİ
 * ============================================================================
 * `lib/contactForm.ts` ile aynı gerekçe: 'use server' modülleri sabit dışa
 * aktaramaz, sabit ayrı dosyada durur.
 *
 * AÇIK RIZA METNİ NEREDEN GELİR
 * ---------------------------------------------------------------------------
 * Başvuru formu, `forms` koleksiyonunda BU başlıkla kayıtlı bir formun
 * `consentText` alanını okur. Böyle bir kayıt YOKSA iletişim formunun metnine
 * düşer (`CONTACT_FORM_TITLE`). Bu bir geçiş kolaylığıdır, nihai durum değil:
 * başvuruda toplanan veri (telefon, görev) iletişim formundakinden fazladır ve
 * aydınlatma metni o veriyi de kapsamalıdır. Metni kurum yazar — bu kod
 * hukuki metin ÜRETMEZ; yalnızca nereden okuyacağını bilir.
 * ============================================================================
 */
export const REGISTRATION_FORM_TITLE = 'Eğitim Başvuru Formu'
