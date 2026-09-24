'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useId, useState } from 'react'

import type { Locale } from '@/i18n/locales'
import { authHref } from '@/i18n/routes'

import { FormErrorSummary } from '@/components/ui/FormErrorSummary'

import { AUTH_BUTTON, AuthField, AuthNotice } from './AuthField'

/**
 * "ŞİFREMİ UNUTTUM" FORMU  (Kılavuz 5.5)
 * ============================================================================
 * `POST /api/users/forgot-password` — Payload jetonu üretir ve e-postayı
 * gönderir. E-postadaki bağlantı artık `/admin/reset/…` değil, sitenin kendi
 * sıfırlama sayfasıdır (bkz. lib/forgotPasswordEmail.ts).
 *
 * ---------------------------------------------------------------------------
 * SONUÇ HER ZAMAN AYNI — BİLİNÇLİ
 * ---------------------------------------------------------------------------
 * Adres kayıtlı olsun olmasın aynı ekran gösterilir. "Böyle bir hesap yok"
 * demek, bir saldırgana geçerli e-posta adreslerini TEK TEK DENEYEREK
 * öğrenme imkânı verir (hesap sayımı / user enumeration). Payload'ın kendisi
 * de bu yüzden her iki durumda da 200 döner.
 *
 * Bunu kullanıcıdan gizlemek yerine AÇIKÇA yazıyoruz: ekranda neden böyle
 * davranıldığını söyleyen bir not var. Sessiz bir belirsizlik, kullanıcıyı
 * "acaba yazım hatası mı yaptım" döngüsünde bırakır.
 *
 * ---------------------------------------------------------------------------
 * DİL BAŞLIĞI
 * ---------------------------------------------------------------------------
 * `X-AIFTC-Locale` gönderilir. E-posta şablonu bu başlığı okuyup mesajı
 * kullanıcının SİTEYİ KULLANDIĞI dilde yazar. Tahmine (Accept-Language veya
 * kullanıcının panel dili) bırakılmadı — beyan her zaman daha güvenilirdir.
 * ============================================================================
 */

export const ForgotPasswordForm: React.FC<{ locale: Locale }> = ({ locale }) => {
  const t = useTranslations('auth')

  /* Sabit alan kimligi — hata ozeti `#id` ile baglanir (Madde 105/107). */
  const epostaId = `${useId()}-email`

  const [eposta, setEposta] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [durum, setDurum] = useState<'bos' | 'gonderiliyor' | 'gonderildi'>('bos')
  const [sonuc, setSonuc] = useState<'ag' | 'genel' | 'limit' | null>(null)

  const gonder = async (event: React.FormEvent) => {
    event.preventDefault()

    const deger = eposta.trim()
    if (!deger) {
      setHata(t('errorRequired'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deger)) {
      setHata(t('errorEmail'))
      return
    }

    setHata(null)
    setSonuc(null)
    setDurum('gonderiliyor')

    try {
      const cevap = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          /* E-posta metninin dili — bkz. lib/forgotPasswordEmail.ts */
          'X-AIFTC-Locale': locale,
        },
        credentials: 'same-origin',
        body: JSON.stringify({ email: deger }),
      })

      if (cevap.ok) {
        setDurum('gonderildi')
        return
      }

      setSonuc(cevap.status === 429 ? 'limit' : 'genel')
      setDurum('bos')
    } catch {
      setSonuc('ag')
      setDurum('bos')
    }
  }

  if (durum === 'gonderildi') {
    return (
      <div className="space-y-5">
        <AuthNotice ton="basari" baslik={t('forgotSentTitle')} rol="alert">
          {t('forgotSent')}
        </AuthNotice>

        {/* Neden "hesap bulunamadı" denmediği açıkça söylenir. */}
        <AuthNotice ton="bilgi" baslik={t('loginEyebrow')}>
          {t('forgotPrivacyNote')}
        </AuthNotice>

        <p className="text-sm">
          <Link
            href={authHref('login', locale)}
            className="font-semibold text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700 focus-visible:decoration-brand-700"
          >
            {t('toLogin')}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={gonder} noValidate className="space-y-6">
      {/* Hata ozeti — Madde 103/105/106/107. */}
      <FormErrorSummary
        hatalar={hata ? [{ alanId: epostaId, mesaj: `${t('fieldEmail')}: ${hata}` }] : []}
        baslik={t('errorSummaryCount', { sayi: 1 })}
        belgeBasligiSablonu={String(t.raw('errorTitlePrefix'))}
      />

      {sonuc ? (
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
        id={epostaId}
        label={t('fieldEmail')}
        name="email"
        type="email"
        autoComplete="email"
        required
        requiredMark={t('fieldRequired')}
        value={eposta}
        onChange={(deger) => {
          setEposta(deger)
          setHata(null)
          setSonuc(null)
        }}
        error={hata}
      />

      <button type="submit" disabled={durum === 'gonderiliyor'} className={AUTH_BUTTON}>
        {durum === 'gonderiliyor' ? t('forgotSending') : t('forgotSubmit')}
      </button>

      <p className="border-t border-line-soft pt-5 text-sm text-ink-600">
        <Link
          href={authHref('login', locale)}
          className="font-semibold text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700 focus-visible:decoration-brand-700"
        >
          {t('toLogin')}
        </Link>
      </p>
    </form>
  )
}

export default ForgotPasswordForm
