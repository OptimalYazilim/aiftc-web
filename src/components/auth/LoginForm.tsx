'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useId, useState } from 'react'

import type { Locale } from '@/i18n/locales'
import { authHref, href as routeHref } from '@/i18n/routes'

import { FieldGroup } from '@/components/ui/FieldGroup'
import { LiveRegion } from '@/components/ui/LiveRegion'
import { FormErrorSummary } from '@/components/ui/FormErrorSummary'

import { AUTH_BUTTON, AuthField, AuthNotice } from './AuthField'

/**
 * GİRİŞ FORMU  (Şartname 1.7 · Kılavuz 5.2)
 * ============================================================================
 * NEDEN SERVER ACTION DEĞİL, DOĞRUDAN `fetch`
 * ---------------------------------------------------------------------------
 * Oturum, Payload'ın `Set-Cookie` başlığıyla kurulur (`aiftc-token`). Bir
 * Server Action, isteği SUNUCUDAN sunucuya atardı: çerez tarayıcıya değil
 * Node süreçine gelir ve orada kaybolur. Ayrıca Payload'ın CSRF koruması
 * (`csrf: allowedOrigins`) çerez kimliğini yalnızca izinli bir `Origin`
 * başlığıyla kabul eder — bu başlığı sunucu tarafı `fetch` göndermez,
 * TARAYICI gönderir.
 *
 * Bu ikisi ölçülmüştü (bkz. docs/access-control-guide.md 10.4):
 *     gerçek çerez, Origin yok   -> 403
 *     gerçek çerez + Origin      -> 206
 *
 * Bu yüzden istek tarayıcıdan çıkar. `credentials: 'same-origin'` (fetch'in
 * varsayılanı) çerezin doğal yoldan saklanmasını sağlar.
 *
 * ---------------------------------------------------------------------------
 * HESAP DURUMU — ASIL MESELE
 * ---------------------------------------------------------------------------
 * Doğru parola YETMEZ. `Users.beforeLogin` kancası, hesabı `approved`
 * olmayan kullanıcıyı 403 ile geri çevirir. Bu, hatanın istisnası değil
 * BEKLENEN akışıdır: dışarıdan kayıt olan herkes `pending` doğar.
 *
 * Sunucu yanıtı makine okunabilir bir kod taşır:
 *     errors[0].data.code = 'account_pending' | 'account_suspended'
 * Kod, kullanıcının kendi dilindeki açıklamaya çevrilir. Metin AYRIŞTIRILMAZ:
 * cümle düzeltildiğinde eşleşme sessizce bozulurdu ve Rusça arayüzde Türkçe
 * bir cümle görünürdü.
 *
 * Ekranda jenerik kırmızı bir "yetki reddedildi" YOKTUR: "onay bekliyor"
 * kullanıcının yapacağı bir şey olmayan bir bekleme durumudur, "askıya
 * alındı" ise iletişime geçmesi gereken bir durum. İkisi ayrı ton, ayrı
 * başlık, ayrı yönlendirme alır.
 * ============================================================================
 */

type Alanlar = { email: string; password: string }
type Hatalar = Partial<Record<keyof Alanlar, string>>

/** Sunucudan dönen hatanın makine kodu — varsa. */
const hataKodu = (govde: unknown): string | null => {
  const hatalar = (govde as { errors?: { data?: { code?: unknown } }[] } | null)?.errors
  const kod = hatalar?.[0]?.data?.code
  return typeof kod === 'string' ? kod : null
}

export const LoginForm: React.FC<{ locale: Locale }> = ({ locale }) => {
  const t = useTranslations('auth')

  /** Hata ozetinde kullanilacak GORUNUR etiketler (Madde 89). */
  const etiketler: Record<keyof Alanlar, string> = {
    email: t('fieldEmail'),
    password: t('fieldPassword'),
  }

  /* Sabit alan kimlikleri — hata ozeti `#id` ile baglanir (Madde 105/107). */
  const taban = useId()
  const alanId = (ad: keyof Alanlar) => `${taban}-${ad}`

  const hataListesiUret = (h: Hatalar) =>
    (Object.keys(h) as (keyof Alanlar)[])
      .filter((ad) => Boolean(h[ad]))
      .map((ad) => ({ alanId: alanId(ad), mesaj: `${etiketler[ad]}: ${h[ad]}` }))

  const [alanlar, setAlanlar] = useState<Alanlar>({ email: '', password: '' })
  const [hatalar, setHatalar] = useState<Hatalar>({})
  const [durum, setDurum] = useState<'bos' | 'gonderiliyor' | 'basarili'>('bos')
  /** Alan bazlı olmayan sonuç: kimlik hatası, hesap durumu, ağ hatası. */
  const [sonuc, setSonuc] = useState<
    | null
    | { tur: 'gecersiz' | 'limit' | 'ag' | 'genel' }
    | { tur: 'durum'; kod: 'account_pending' | 'account_suspended' }
  >(null)

  const hataListesi = hataListesiUret(hatalar)

  const alanDegistir = (ad: keyof Alanlar) => (deger: string) => {
    setAlanlar((onceki) => ({ ...onceki, [ad]: deger }))
    setHatalar((onceki) => ({ ...onceki, [ad]: undefined }))
    setSonuc(null)
  }

  /** İstemci tarafı ön kontrol — sunucu kuralının YERİNE GEÇMEZ, kolaylıktır. */
  const dogrula = (): Hatalar => {
    const yeni: Hatalar = {}
    if (!alanlar.email.trim()) yeni.email = t('errorRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alanlar.email.trim())) yeni.email = t('errorEmail')
    if (!alanlar.password) yeni.password = t('errorRequired')
    return yeni
  }

  const gonder = async (event: React.FormEvent) => {
    event.preventDefault()

    const bulunan = dogrula()
    setHatalar(bulunan)
    if (Object.keys(bulunan).length > 0) return

    setDurum('gonderiliyor')
    setSonuc(null)

    try {
      const cevap = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        /*
          Çerez tarayıcıda saklanır. `same-origin` fetch'in varsayılanıdır;
          niyeti okunur kılmak için açıkça yazılmıştır.
        */
        credentials: 'same-origin',
        body: JSON.stringify({
          email: alanlar.email.trim(),
          password: alanlar.password,
        }),
      })

      if (cevap.ok) {
        setDurum('basarili')
        /*
          BAĞLAM DEĞİŞİKLİĞİ ÖNCE DUYURULUR  (Kontrol Listesi 96)
          ------------------------------------------------------------------
          Önceki sürümde `setDurum('basarili')` ile `window.location.assign`
          aynı tick içindeydi: React'in başarı bildirimini BOYAMASINA fırsat
          kalmadan gezinme başlıyordu. Kullanıcı için sonuç, hiçbir açıklama
          olmadan başka bir sayfada uyanmaktı; ekran okuyucu ise duyuracak bir
          şey bulamıyordu.

          Kısa bir gecikme, bildirimin hem BOYANMASINA hem de canlı bölgeden
          OKUNMASINA yetiyor. Süre bilinçli olarak kısa: bu bir onay ekranı
          değil, geçişin fark edilmesini sağlayan bir soluk.

          Gezinme `router.push` ile değil tam sayfa geçişiyle yapılır — sunucu
          bileşenleri yeni oturumu ancak yeni bir istekte görür, istemci
          tarafı gezinme önbellekteki anonim HTML'i gösterirdi.
        */
        window.setTimeout(() => {
          window.location.assign(routeHref('library', locale))
        }, 1200)
        return
      }

      const govde = await cevap.json().catch(() => null)
      const kod = hataKodu(govde)

      if (kod === 'account_pending' || kod === 'account_suspended') {
        setSonuc({ tur: 'durum', kod })
      } else if (cevap.status === 429) {
        /*
          IP BAZLI HIZ SINIRI — middleware'den gelir (lib/rateLimit.ts).
          Payload'ın HESAP bazlı kilidiyle KARIŞTIRILMAMALI: o, beş yanlış
          parolanın ardından 401 ve kendi mesajıyla döner. İkisi farklı
          şeylerdir ve kullanıcıya farklı söylenir — biri "bu bilgisayardan
          çok denendi", öteki "bu hesap kilitlendi".
        */
        setSonuc({ tur: 'limit' })
      } else if (cevap.status === 401) {
        /*
          Payload hesap kilidini de 401 ile döndürür; mesajında "locked"
          geçer. Ayrımı mesajdan yapmak kırılgan olurdu (üç dilde çevrilir),
          bu yüzden ikisi de "e-posta veya parola hatalı" olarak sunulur.
          Bu ayrıca BİLİNÇLİ bir gizlemedir: hangi hesabın kilitli olduğunu
          söylemek, geçerli e-posta adreslerini sızdırır.
        */
        setSonuc({ tur: 'gecersiz' })
      } else {
        setSonuc({ tur: 'genel' })
      }
      setDurum('bos')
    } catch {
      /* Ağ hatası: sunucuya hiç ulaşılamadı. */
      setSonuc({ tur: 'ag' })
      setDurum('bos')
    }
  }

  if (durum === 'basarili') {
    return (
      <>
        {/* Gorsel bildirim degismedi; bu onun SESLI karsiligidir (Madde 96). */}
        <LiveRegion mesaj={`${t('loginSuccessTitle')}. ${t('loginSuccess')}`} />
        <AuthNotice ton="basari" baslik={t('loginSuccessTitle')} rol="status">
          {t('loginSuccess')}
        </AuthNotice>
      </>
    )
  }

  return (
    <form onSubmit={gonder} noValidate className="space-y-6">
      {/*
        KALICI CANLI BOLGE (Madde 103/109). Form ilk cizildiginde BOS olarak
        DOM'a girer; sonuc geldiginde yalnizca METNI degisir ve ekran okuyucu
        degisikligi yakalar. Bildirim kutusuyla birlikte DOM'a giren bir
        bolge bu garantiyi vermez — gerekce LiveRegion icinde.
      */}
      <LiveRegion
        mesaj={
          sonuc?.tur === 'durum'
            ? sonuc.kod === 'account_suspended'
              ? t('statusSuspended')
              : t('statusPending')
            : sonuc?.tur === 'gecersiz'
              ? t('errorInvalidCredentials')
              : sonuc?.tur === 'limit'
                ? t('errorRateLimited')
                : sonuc?.tur === 'ag'
                  ? t('errorNetwork')
                  : sonuc
                    ? t('errorGeneric')
                    : ''
        }
      />

      {/* Hata ozeti — Madde 103/105/106/107. */}
      <FormErrorSummary
        hatalar={hataListesi}
        baslik={t('errorSummaryCount', { sayi: hataListesi.length })}
        belgeBasligiSablonu={String(t.raw('errorTitlePrefix'))}
      />

      {/* --- Sonuç bildirimi ------------------------------------------- */}
      {sonuc?.tur === 'durum' ? (
        <AuthNotice
          ton={sonuc.kod === 'account_suspended' ? 'hata' : 'uyari'}
          rol="alert"
          baslik={
            sonuc.kod === 'account_suspended' ? t('statusSuspendedTitle') : t('statusPendingTitle')
          }
        >
          <p>{sonuc.kod === 'account_suspended' ? t('statusSuspended') : t('statusPending')}</p>
          <p className="mt-2">
            <Link
              href={routeHref('contact', locale)}
              className="font-semibold text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700 focus-visible:decoration-brand-700"
            >
              {t('contactLink')} →
            </Link>
          </p>
        </AuthNotice>
      ) : sonuc ? (
        <AuthNotice ton="hata" baslik={t('errorSummary')} rol="alert">
          {sonuc.tur === 'gecersiz'
            ? t('errorInvalidCredentials')
            : sonuc.tur === 'limit'
              ? t('errorRateLimited')
              : sonuc.tur === 'ag'
                ? t('errorNetwork')
                : t('errorGeneric')}
        </AuthNotice>
      ) : null}

      {/*
        Zorunluluk notu FORM BAŞINA bir kez yazılır. Her alanın yanında
        tekrarlansaydı ekran okuyucu aynı cümleyi her etikette okurdu; alan
        işareti kısa ("zorunlu"), açıklama burada durur.
      */}
      <p className="text-xs text-ink-500">{t('requiredHint')}</p>

      {/* Madde 112/113: iki alan tek bir anlamlı küme oluşturur. */}
      <FieldGroup baslik={t('groupCredentials')} gizliBaslik className="space-y-6">
        <AuthField
          id={alanId('email')}
          label={t('fieldEmail')}
          name="email"
          type="email"
          autoComplete="email"
          required
          requiredMark={t('fieldRequired')}
          value={alanlar.email}
          onChange={alanDegistir('email')}
          error={hatalar.email}
        />

        <AuthField
          id={alanId('password')}
          label={t('fieldPassword')}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          requiredMark={t('fieldRequired')}
          value={alanlar.password}
          onChange={alanDegistir('password')}
          error={hatalar.password}
        />
      </FieldGroup>

      <button type="submit" disabled={durum === 'gonderiliyor'} className={AUTH_BUTTON}>
        {durum === 'gonderiliyor' ? t('loginSending') : t('loginSubmit')}
      </button>

      {/*
        İKİ İKİNCİL YOL, TEK ŞERİTTE.
        "Parolamı unuttum" giriş denemesinden SONRA aranır; bu yüzden
        düğmenin altındadır, üstünde değil. Kayıt bağlantısı da aynı yerde
        durur — ikisi de "buradan çıkamıyorum" anındaki çıkış kapılarıdır.
      */}
      <div className="space-y-2 border-t border-line-soft pt-5 text-sm text-ink-600">
        <p>
          <Link
            href={authHref('forgotPassword', locale)}
            className="font-semibold text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700 focus-visible:decoration-brand-700"
          >
            {t('toForgot')}
          </Link>
        </p>
        <p>
          <Link
            href={authHref('register', locale)}
            className="font-semibold text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700 focus-visible:decoration-brand-700"
          >
            {t('toRegister')}
          </Link>
        </p>
      </div>
    </form>
  )
}

export default LoginForm
