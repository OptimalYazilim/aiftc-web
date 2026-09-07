'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import type { Locale } from '@/i18n/locales'
import { authHref } from '@/i18n/routes'

import { AUTH_BUTTON, AuthField, AuthNotice } from './AuthField'

/**
 * KAYIT FORMU  (Şartname 1.7 · Kılavuz 5.2)
 * ============================================================================
 * `POST /api/users` — anonim isteğe AÇIKTIR (`access.create = canRegister`),
 * ama gönderilen rol ve durum DİKKATE ALINMAZ. `Users.beforeValidate`
 * kancası oturumsuz her kaydı zorla şu hâle getirir:
 *
 *     roles: []            panel yetkisi yok
 *     role: 'trainee'      katılımcı
 *     accountStatus: 'pending'
 *
 * Yani bu form gövdesine `role: 'admin'` yazılsa bile hesap katılımcı olarak
 * açılır. Ölçüldü (2026-09-07): istek 201 döner ve veritabanındaki kayıt
 * yukarıdaki üç değeri taşır.
 *
 * ---------------------------------------------------------------------------
 * KAYIT GİRİŞ DEMEK DEĞİLDİR — KULLANICIYA SÖYLENİR
 * ---------------------------------------------------------------------------
 * Hesap `pending` doğduğu için kullanıcı hemen giriş YAPAMAZ. Bunu kayıt
 * anında söylememek, kişiyi doğru parolayla 403 alıp "sistem bozuk" sanmaya
 * bırakır. Başarı ekranı bu yüzden bir kutlama değil, bir BEKLEME
 * bildirimidir.
 *
 * Ayrıca e-posta adaptörü tanımlı olmadığı için onay bildirimi kimseye
 * ULAŞMAZ (Kılavuz 5.2). Bu, kullanıcıdan gizlenecek bir ayrıntı değildir:
 * "e-postanızı kontrol edin" demek yanlış olurdu.
 *
 * ---------------------------------------------------------------------------
 * PAROLA
 * ---------------------------------------------------------------------------
 * Asgari uzunluk SUNUCUDA zorlanır (Users.ts → MIN_PAROLA). Buradaki kontrol
 * bir kolaylıktır; API'ye doğrudan istek atan bir istemci onu görmez. İkisi
 * birlikte durur, biri ötekinin yerine geçmez.
 * ============================================================================
 */

/** Sunucu kuralıyla aynı sayı — Users.ts → MIN_PAROLA. */
const MIN_PAROLA = 10

type Alanlar = {
  name: string
  email: string
  unit: string
  password: string
  passwordConfirm: string
}
type Hatalar = Partial<Record<keyof Alanlar, string>>

/** Yanıt gövdesinde alan bazlı doğrulama hatası var mı? */
const alanHatasi = (govde: unknown, alan: string): boolean => {
  const ic = (
    govde as { errors?: { data?: { errors?: { path?: unknown }[] } }[] } | null
  )?.errors?.[0]?.data?.errors
  return Array.isArray(ic) && ic.some((hata) => hata?.path === alan)
}

const hataKodu = (govde: unknown): string | null => {
  const kod = (govde as { errors?: { data?: { code?: unknown } }[] } | null)?.errors?.[0]?.data?.code
  return typeof kod === 'string' ? kod : null
}

export const RegisterForm: React.FC<{ locale: Locale }> = ({ locale }) => {
  const t = useTranslations('auth')

  const [alanlar, setAlanlar] = useState<Alanlar>({
    name: '',
    email: '',
    unit: '',
    password: '',
    passwordConfirm: '',
  })
  const [hatalar, setHatalar] = useState<Hatalar>({})
  const [durum, setDurum] = useState<'bos' | 'gonderiliyor' | 'basarili'>('bos')
  const [sonuc, setSonuc] = useState<'ag' | 'genel' | null>(null)

  const alanDegistir = (ad: keyof Alanlar) => (deger: string) => {
    setAlanlar((onceki) => ({ ...onceki, [ad]: deger }))
    setHatalar((onceki) => ({ ...onceki, [ad]: undefined }))
    setSonuc(null)
  }

  const dogrula = (): Hatalar => {
    const yeni: Hatalar = {}
    if (!alanlar.name.trim()) yeni.name = t('errorRequired')
    if (!alanlar.email.trim()) yeni.email = t('errorRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alanlar.email.trim())) yeni.email = t('errorEmail')
    if (!alanlar.password) yeni.password = t('errorRequired')
    else if (alanlar.password.length < MIN_PAROLA) {
      yeni.password = t('errorPasswordShort', { min: MIN_PAROLA })
    }
    if (alanlar.passwordConfirm !== alanlar.password) {
      yeni.passwordConfirm = t('errorPasswordMismatch')
    }
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
      const cevap = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        /*
          `role` / `roles` / `accountStatus` GÖNDERİLMEZ. Sunucu bunları
          zaten yok sayar; göndermek, istemcinin bu değerleri belirlediği
          izlenimi yaratır ve bir sonraki okuyucuyu yanıltır.
        */
        body: JSON.stringify({
          name: alanlar.name.trim(),
          email: alanlar.email.trim(),
          password: alanlar.password,
          ...(alanlar.unit.trim() ? { unit: alanlar.unit.trim() } : {}),
        }),
      })

      if (cevap.ok) {
        setDurum('basarili')
        return
      }

      const govde = await cevap.json().catch(() => null)

      if (alanHatasi(govde, 'email')) {
        setHatalar({ email: t('errorEmailTaken') })
      } else if (hataKodu(govde) === 'password_too_short') {
        setHatalar({ password: t('errorPasswordShort', { min: MIN_PAROLA }) })
      } else {
        setSonuc('genel')
      }
      setDurum('bos')
    } catch {
      setSonuc('ag')
      setDurum('bos')
    }
  }

  if (durum === 'basarili') {
    return (
      <div className="space-y-5">
        <AuthNotice ton="basari" baslik={t('registerSuccessTitle')} rol="alert">
          {t('registerSuccess')}
        </AuthNotice>

        {/*
          E-posta gönderimi kapalı olduğu için "gelen kutunuzu kontrol edin"
          demek YANLIŞ olurdu. Durum açıkça yazılır (Kılavuz 5.2).
        */}
        <AuthNotice ton="bilgi" baslik={t('loginEyebrow')}>
          {t('noEmailNotice')}
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
      {sonuc ? (
        <AuthNotice ton="hata" baslik={t('errorSummary')} rol="alert">
          {sonuc === 'ag' ? t('errorNetwork') : t('errorGeneric')}
        </AuthNotice>
      ) : null}

      {/* Zorunluluk notu form başına bir kez — gerekçe LoginForm içinde. */}
      <p className="text-xs text-ink-500">{t('requiredHint')}</p>

      <AuthField
        label={t('fieldName')}
        name="name"
        autoComplete="name"
        required
        requiredMark={t('fieldRequired')}
        value={alanlar.name}
        onChange={alanDegistir('name')}
        error={hatalar.name}
      />

      <AuthField
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
        label={t('fieldUnit')}
        name="unit"
        autoComplete="organization"
        hint={t('fieldUnitHint')}
        requiredMark=""
        value={alanlar.unit}
        onChange={alanDegistir('unit')}
        error={hatalar.unit}
      />

      <AuthField
        label={t('fieldPassword')}
        name="password"
        type="password"
        autoComplete="new-password"
        required
        requiredMark={t('fieldRequired')}
        hint={t('passwordHint', { min: MIN_PAROLA })}
        value={alanlar.password}
        onChange={alanDegistir('password')}
        error={hatalar.password}
      />

      <AuthField
        label={t('fieldPasswordConfirm')}
        name="passwordConfirm"
        type="password"
        autoComplete="new-password"
        required
        requiredMark={t('fieldRequired')}
        value={alanlar.passwordConfirm}
        onChange={alanDegistir('passwordConfirm')}
        error={hatalar.passwordConfirm}
      />

      {/*
        Kayıt SONUCU önceden söylenir: hesap onay bekleyecektir. Bunu gönderim
        sonrasına saklamak, kullanıcıyı hemen giriş yapmayı deneyip 403
        almaya bırakırdı.
      */}
      <AuthNotice ton="bilgi" baslik={t('statusPendingTitle')}>
        {t('statusPending')}
      </AuthNotice>

      <button type="submit" disabled={durum === 'gonderiliyor'} className={AUTH_BUTTON}>
        {durum === 'gonderiliyor' ? t('registerSending') : t('registerSubmit')}
      </button>

      <p className="border-t border-line-soft pt-5 text-sm text-ink-600">
        <Link
          href={authHref('login', locale)}
          className="font-semibold text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700"
        >
          {t('toLogin')}
        </Link>
      </p>
    </form>
  )
}

export default RegisterForm
