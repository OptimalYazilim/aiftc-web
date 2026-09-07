import type { PayloadRequest } from 'payload'

import { DEFAULT_LOCALE, PRIMARY_DOMAIN, isLocale, type Locale } from '@/i18n/locales'
import { AUTH_ROUTES } from '@/i18n/routes'

/**
 * PAROLA SIFIRLAMA E-POSTASI — PAYLOAD'IN VARSAYILANI EZİLİR
 * ============================================================================
 * NEDEN
 * ---------------------------------------------------------------------------
 * Payload varsayılan olarak `/admin/reset/<token>` adresine bağlantı verir.
 * Ölçüldü (2026-09-07): o sayfa anonim erişilebilir (200), yani katılımcı
 * parolasını sıfırlayabiliyordu — ama işlem bitince PANELİN giriş ekranına
 * düşüyordu ve oraya giremiyor (`canAccessAdminPanel` yalnızca panel rolü
 * olanları alır). Kullanıcı parolasını değiştirmiş ama kendini kapalı bir
 * kapının önünde bulmuş oluyordu.
 *
 * Bağlantı artık sitenin kendi sayfasına gider ve akış sitede tamamlanır.
 *
 * ---------------------------------------------------------------------------
 * DİL SEÇİMİ — ÜÇ KADEMELİ
 * ---------------------------------------------------------------------------
 * E-posta, kullanıcının SİTEYİ KULLANDIĞI dilde yazılmalıdır. Sıra:
 *
 *   1. `X-AIFTC-Locale` başlığı — kendi formumuz bunu AÇIKÇA gönderir.
 *      En güvenilir sinyaldir: tahmin değil, beyandır.
 *   2. `Referer` yolundaki dil öneki — istek başka bir yerden geldiyse
 *      (örneğin panelden) yine de bir ipucu verir.
 *   3. Varsayılan dil.
 *
 * `user.preferredAdminLanguage` KULLANILMAZ: adı üstünde, o alan PANEL
 * arayüzünün dilidir ve dışarıdan kayıt olan herkeste varsayılan değeriyle
 * ('tr') durur — yani Rusça gezinen bir katılımcıya Türkçe e-posta
 * gönderirdi. Yanlış bir sinyali doğru sanmak, hiç sinyal olmamasından
 * kötüdür.
 *
 * ---------------------------------------------------------------------------
 * METİN NEDEN BURADA, `messages/*.json` İÇİNDE DEĞİL
 * ---------------------------------------------------------------------------
 * `messages/*.json` next-intl'in İSTEK BAĞLAMINA bağlıdır; bu fonksiyon ise
 * Payload'ın içinden, bir HTTP isteği bağlamı olmadan da çağrılabilir
 * (örneğin panelden tetiklenen bir sıfırlama). `getTranslations` orada
 * çalışmaz. Üç dilin metni bu yüzden burada, tek ve küçük bir sözlükte
 * durur.
 * ============================================================================
 */

type Args = { req?: PayloadRequest; token?: string; user?: unknown } | undefined

const METINLER: Record<
  Locale,
  { konu: string; selam: string; govde: string; buton: string; sure: string; yoksay: string }
> = {
  tr: {
    konu: 'Parolanızı sıfırlayın — AIFTC',
    selam: 'Merhaba',
    govde:
      'Hesabınızın parolasını yenilemek için bir istek aldık. Yeni parolanızı belirlemek için aşağıdaki düğmeyi kullanın.',
    buton: 'Yeni Parola Belirle',
    sure: 'Bu bağlantı bir saat boyunca geçerlidir.',
    yoksay:
      'Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; parolanız değişmez.',
  },
  en: {
    konu: 'Reset your password — AIFTC',
    selam: 'Hello',
    govde:
      'We received a request to reset the password for your account. Use the button below to choose a new password.',
    buton: 'Set a new password',
    sure: 'This link is valid for one hour.',
    yoksay: 'If you did not make this request you can ignore this e-mail; your password will not change.',
  },
  ru: {
    konu: 'Сброс пароля — AIFTC',
    selam: 'Здравствуйте',
    govde:
      'Мы получили запрос на сброс пароля для вашей учётной записи. Нажмите кнопку ниже, чтобы задать новый пароль.',
    buton: 'Задать новый пароль',
    sure: 'Ссылка действительна в течение одного часа.',
    yoksay: 'Если вы не отправляли этот запрос, просто проигнорируйте письмо — пароль не изменится.',
  },
}

/** İstekten dili çıkarır. Gerekçe ve sıralama yukarıdaki blokta. */
const dilBul = (req?: PayloadRequest): Locale => {
  const basliktan = req?.headers?.get?.('x-aiftc-locale')
  if (isLocale(basliktan)) return basliktan

  const referer = req?.headers?.get?.('referer')
  if (referer) {
    try {
      const ilkSegment = new URL(referer).pathname.split('/').filter(Boolean)[0]
      if (isLocale(ilkSegment)) return ilkSegment
    } catch {
      /* Bozuk referer: yok sayılır, varsayılana düşülür. */
    }
  }

  return DEFAULT_LOCALE
}

/** HTML'e gömülecek metinleri kaçırır — kullanıcı adı serbest metindir. */
const kacir = (deger: string): string =>
  deger
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const forgotPasswordSubject = (args: Args): string => METINLER[dilBul(args?.req)].konu

export const forgotPasswordHTML = (args: Args): string => {
  const locale = dilBul(args?.req)
  const t = METINLER[locale]

  /*
    Jeton SORGU DİZESİNDE taşınır. Sayfa `robots: noindex` olduğu için arama
    motorlarına sızmaz; yol parçasına konsaydı her dil için ayrı bir dinamik
    segment gerekirdi.
  */
  const yol = AUTH_ROUTES.resetPassword[locale]
  const adres = `${PRIMARY_DOMAIN}/${locale}${yol}?token=${encodeURIComponent(args?.token ?? '')}`

  const ad = (args?.user as { name?: unknown } | undefined)?.name
  const selamlama = typeof ad === 'string' && ad.trim() ? `${t.selam}, ${kacir(ad.trim())}` : t.selam

  /*
    SATIR İÇİ STİL — e-posta istemcilerinde `<style>` bloğu ve harici CSS
    güvenilir değildir (Gmail `<head>`i atar). Tablosuz, tek sütunlu ve sade
    tutuldu; kurumsal kimlik burada renk ve tipografiyle değil, metnin
    tonuyla taşınır.

    Düğmenin YANINDA düz adres de yazılır: bazı istemciler düğmeleri
    engeller ya da metin olarak gösterir, o durumda kullanıcı adresi
    kopyalayabilmelidir.
  */
  return `<!doctype html>
<html lang="${locale}">
<body style="margin:0;padding:24px;background:#f9f9f6;font-family:Helvetica,Arial,sans-serif;color:#2e3a3d;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d9d5cc;padding:32px;">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#0a4423;">AIFTC</p>
    <h1 style="margin:0 0 20px;font-size:20px;line-height:1.3;color:#062822;">${kacir(t.buton)}</h1>

    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">${selamlama},</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">${kacir(t.govde)}</p>

    <p style="margin:0 0 24px;">
      <a href="${adres}" style="display:inline-block;background:#0b6b3a;color:#ffffff;text-decoration:none;padding:14px 24px;font-size:14px;font-weight:bold;">${kacir(t.buton)}</a>
    </p>

    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#65757a;">${kacir(t.sure)}</p>
    <p style="margin:0 0 24px;font-size:13px;line-height:1.6;word-break:break-all;color:#65757a;">${adres}</p>

    <p style="margin:0;padding-top:16px;border-top:1px solid #e5e1d8;font-size:13px;line-height:1.6;color:#65757a;">${kacir(t.yoksay)}</p>
  </div>
</body>
</html>`
}
