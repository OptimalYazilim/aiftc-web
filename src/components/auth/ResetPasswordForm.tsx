'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'

import type { Locale } from '@/i18n/locales'
import { authHref } from '@/i18n/routes'

import { MIN_PAROLA } from '@/lib/passwordPolicy'

import { AUTH_BUTTON, AuthField, AuthNotice } from './AuthField'

/**
 * "YENİ PAROLA BELİRLE" FORMU  (Kılavuz 5.5)
 * ============================================================================
 * `POST /api/users/reset-password` — `{ token, password }` alır.
 *
 * ---------------------------------------------------------------------------
 * JETON ADRES ÇUBUĞUNDAN OKUNUR — SUNUCUYA HİÇ UĞRAMAZ
 * ---------------------------------------------------------------------------
 * Sayfa sunucu bileşeni olarak `searchParams`ı okuyup prop geçseydi, jeton
 * RSC yükünün içine gömülür ve sunucu günlüklerine düşme olasılığı artardı.
 * Burada jeton yalnızca tarayıcıda okunur ve doğrudan API'ye gider.
 *
 * `useSearchParams` KULLANILMADI — ÖLÇÜLMÜŞ GEREKÇE.
 * O kanca, kullanan alt ağacın bir `<Suspense>` sınırına alınmasını zorunlu
 * kılar. Öyle kurulduğunda sayfa dev ortamında sınırda ASILI KALDI: DOM'da
 * yalnızca çözülmemiş bir sınır işareti duruyordu —
 *
 *     <!--$~--><template id="B:0"></template><!--/$-->
 *
 * ve form hiç görünmüyordu. `window.location.search` bu sayfa için aynı
 * bilgiyi sınır gerektirmeden verir: jeton zaten yalnızca tarayıcıda
 * anlamlıdır. Sonuç: sınır yok, bekleme yok, daha az hareketli parça.
 *
 * Sayfanın `robots: noindex` olması da aynı gerekçenin parçasıdır: sorgu
 * dizesindeki jeton arama motoruna sızmamalıdır.
 *
 * ---------------------------------------------------------------------------
 * ÜÇ AYRI BAŞARISIZLIK, ÜÇ AYRI EKRAN
 * ---------------------------------------------------------------------------
 *   jeton YOK        → kullanıcı bu sayfaya doğrudan gelmiş. Form hiç
 *                      gösterilmez; ne yapması gerektiği söylenir.
 *   jeton GEÇERSİZ   → süre dolmuş ya da kullanılmış. Yeni bağlantı isteme
 *                      yolu verilir.
 *   parola kuralı    → alanın altında, alana bağlı hata.
 *
 * Üçünü tek bir kırmızı kutuda toplamak, kullanıcının hangisini yaşadığını
 * ve ne yapacağını belirsiz bırakırdı.
 *
 * ---------------------------------------------------------------------------
 * BAŞARIDAN SONRA OTOMATİK GİRİŞ YAPILMAZ
 * ---------------------------------------------------------------------------
 * Payload bu uçta bir oturum çerezi döndürebilir; yine de kullanıcı giriş
 * sayfasına yönlendirilir. Sebep: hesap `pending` ya da `suspended` olabilir
 * ve o durumda "giriş yapıldı" demek yanlış olur. Giriş sayfası bu durumları
 * zaten doğru mesajla karşılıyor — tek bir kapı, tek bir kural.
 * ============================================================================
 */

export const ResetPasswordForm: React.FC<{ locale: Locale }> = ({ locale }) => {
  const t = useTranslations('auth')

  /*
    `undefined` = HENÜZ OKUNMADI, `null` = adreste yok.
    Üçüncü bir durum gerekir: ilk sunucu render'ında `window` yoktur ve
    ikisini ayırmazsak sayfa bir an "bağlantı geçersiz" diye yanıp sönerdi —
    jetonu olan kullanıcıya bile.
  */
  const [token, setToken] = useState<string | null | undefined>(undefined)

  const [parola, setParola] = useState('')
  const [tekrar, setTekrar] = useState('')
  const [hatalar, setHatalar] = useState<{ parola?: string; tekrar?: string }>({})
  const [durum, setDurum] = useState<'bos' | 'gonderiliyor' | 'tamam'>('bos')
  const [sonuc, setSonuc] = useState<'jetonGecersiz' | 'ag' | 'genel' | 'limit' | null>(null)

  useEffect(() => {
    const deger = new URLSearchParams(window.location.search).get('token')?.trim()
    setToken(deger || null)
  }, [])

  /*
    Okuma tamamlanana kadar hiçbir şey basılmaz. Bu tek bir kare sürer;
    bir iskelet göstermek, anında kaybolan sahte bir alan titremesi
    üretirdi.
  */
  if (token === undefined) return null

  /* Jeton hiç yoksa form gösterilmez: doldurulacak bir şey yok. */
  if (!token) {
    return (
      <div className="space-y-5">
        <AuthNotice ton="uyari" baslik={t('resetMissingTokenTitle')}>
          {t('resetMissingToken')}
        </AuthNotice>
        <p className="text-sm">
          <Link
            href={authHref('forgotPassword', locale)}
            className="font-semibold text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700"
          >
            {t('resetRequestNew')} →
          </Link>
        </p>
      </div>
    )
  }

  const gonder = async (event: React.FormEvent) => {
    event.preventDefault()

    const yeni: { parola?: string; tekrar?: string } = {}
    if (!parola) yeni.parola = t('errorRequired')
    else if (parola.length < MIN_PAROLA) yeni.parola = t('errorPasswordShort', { min: MIN_PAROLA })
    if (tekrar !== parola) yeni.tekrar = t('errorPasswordMismatch')

    setHatalar(yeni)
    if (Object.keys(yeni).length > 0) return

    setSonuc(null)
    setDurum('gonderiliyor')

    try {
      const cevap = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ token, password: parola }),
      })

      if (cevap.ok) {
        setDurum('tamam')
        return
      }

      if (cevap.status === 429) {
        setSonuc('limit')
      } else {
        /*
          Payload süresi dolmuş / kullanılmış jetona 4xx döner. Ayrı bir kod
          taşımadığı için durum koda göre değil, BAĞLAMA göre yorumlanır:
          buraya gelmek için jeton zaten vardı, dolayısıyla en olası sebep
          jetonun artık geçerli olmamasıdır. Kullanıcıya yeni bağlantı isteme
          yolu verilir — bu, hangi hata olursa olsun doğru sonraki adımdır.
        */
        setSonuc('jetonGecersiz')
      }
      setDurum('bos')
    } catch {
      setSonuc('ag')
      setDurum('bos')
    }
  }

  if (durum === 'tamam') {
    return (
      <div className="space-y-5">
        <AuthNotice ton="basari" baslik={t('resetDoneTitle')} rol="alert">
          {t('resetDone')}
        </AuthNotice>
        <p className="text-sm">
          <Link
            href={authHref('login', locale)}
            className="font-semibold text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700"
          >
            {t('toLogin')}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={gonder} noValidate className="space-y-6">
      {sonuc === 'jetonGecersiz' ? (
        <AuthNotice ton="uyari" baslik={t('resetInvalidTokenTitle')} rol="alert">
          <p>{t('resetInvalidToken')}</p>
          <p className="mt-2">
            <Link
              href={authHref('forgotPassword', locale)}
              className="font-semibold text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700"
            >
              {t('resetRequestNew')} →
            </Link>
          </p>
        </AuthNotice>
      ) : sonuc ? (
        <AuthNotice ton="hata" baslik={t('errorSummary')} rol="alert">
          {sonuc === 'ag'
            ? t('errorNetwork')
            : sonuc === 'limit'
              ? t('errorRateLimited')
              : t('errorGeneric')}
        </AuthNotice>
      ) : null}

      <p className="text-xs text-ink-500">{t('requiredHint')}</p>

      <AuthField
        label={t('fieldPassword')}
        name="password"
        type="password"
        autoComplete="new-password"
        required
        requiredMark={t('fieldRequired')}
        hint={t('passwordHint', { min: MIN_PAROLA })}
        value={parola}
        onChange={(deger) => {
          setParola(deger)
          setHatalar((o) => ({ ...o, parola: undefined }))
          setSonuc(null)
        }}
        error={hatalar.parola}
      />

      <AuthField
        label={t('fieldPasswordConfirm')}
        name="passwordConfirm"
        type="password"
        autoComplete="new-password"
        required
        requiredMark={t('fieldRequired')}
        value={tekrar}
        onChange={(deger) => {
          setTekrar(deger)
          setHatalar((o) => ({ ...o, tekrar: undefined }))
          setSonuc(null)
        }}
        error={hatalar.tekrar}
      />

      <button type="submit" disabled={durum === 'gonderiliyor'} className={AUTH_BUTTON}>
        {durum === 'gonderiliyor' ? t('resetSending') : t('resetSubmit')}
      </button>
    </form>
  )
}

export default ResetPasswordForm
