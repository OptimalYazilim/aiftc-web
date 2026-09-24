'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useId, useState } from 'react'

import type { Locale } from '@/i18n/locales'
import { authHref } from '@/i18n/routes'

import { MIN_PAROLA } from '@/lib/passwordPolicy'

import { FieldGroup } from '@/components/ui/FieldGroup'
import { FormErrorSummary } from '@/components/ui/FormErrorSummary'
import { LiveRegion } from '@/components/ui/LiveRegion'

import { AUTH_BUTTON, AuthField, AuthNotice } from './AuthField'
import { useTurnstile } from './useTurnstile'

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

export const RegisterForm: React.FC<{ locale: Locale; captchaSiteKey: string | null }> = ({
  locale,
  captchaSiteKey,
}) => {
  const t = useTranslations('auth')

  /** Hata özetinde kullanılacak GÖRÜNÜR etiketler — alan adıyla birebir aynı. */
  const etiketler: Record<keyof Alanlar, string> = {
    name: t('fieldName'),
    email: t('fieldEmail'),
    unit: t('fieldUnit'),
    password: t('fieldPassword'),
    passwordConfirm: t('fieldPasswordConfirm'),
  }

  const [alanlar, setAlanlar] = useState<Alanlar>({
    name: '',
    email: '',
    unit: '',
    password: '',
    passwordConfirm: '',
  })
  const [hatalar, setHatalar] = useState<Hatalar>({})
  const [durum, setDurum] = useState<'bos' | 'gonderiliyor' | 'basarili'>('bos')
  const [sonuc, setSonuc] = useState<'ag' | 'genel' | 'limit' | 'captcha' | null>(null)

  const turnstile = useTurnstile(captchaSiteKey, locale)

  /*
    SABİT ALAN KİMLİKLERİ (Kontrol Listesi 105/107).
    Hata özeti alanlara `#id` ile bağlanır; kimlikler `useId()` tabanından
    türetilir ki aynı sayfada iki form bulunsa bile çakışmasın.
  */
  const taban = useId()
  const alanId = (ad: keyof Alanlar) => `${taban}-${ad}`

  /*
    Hata özeti, alanların GÖRÜNÜR etiketleriyle konuşur (Madde 89: erişilebilir
    isim görünür etiketle başlar). "Bu alan gereklidir" tek başına hangi alan
    olduğunu söylemezdi.
  */
  const hataListesi = (Object.keys(hatalar) as (keyof Alanlar)[])
    .filter((ad) => Boolean(hatalar[ad]))
    .map((ad) => ({
      alanId: alanId(ad),
      mesaj: `${etiketler[ad]}: ${hatalar[ad]}`,
    }))

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

    /*
      CAPTCHA JETONU — gönderimden hemen önce alınır.
      Widget kapalıysa (site anahtarı yok) `null` döner ve sunucu da zaten
      doğrulama yapmaz; iki taraf aynı ortam değişkenine bakar.

      Jeton alınamıyorsa BURADA durulur ve istek hiç atılmaz: sunucu onu
      400 ile reddederdi ve kullanıcı "genel hata" görürdü. Sebebi bilinen
      bir başarısızlığı, bilinmeyen bir başarısızlık gibi göstermeyiz.
    */
    let captchaToken: string | null = null
    if (captchaSiteKey) {
      captchaToken = await turnstile.tokenAl()
      if (!captchaToken) {
        setSonuc('captcha')
        setDurum('bos')
        turnstile.sifirla()
        return
      }
    }

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
          ...(captchaToken ? { captchaToken } : {}),
        }),
      })

      /*
        JETON HARCANDI — sonuç ne olursa olsun widget sıfırlanır.
        Turnstile jetonu tek kullanımlıktır; sıfırlamadan yapılan ikinci
        gönderim `timeout-or-duplicate` ile reddedilir ve kullanıcı, düzelttiği
        alanla hiç ilgisi olmayan bir güvenlik hatası görürdü.
      */
      turnstile.sifirla()

      if (cevap.ok) {
        setDurum('basarili')
        return
      }

      const govde = await cevap.json().catch(() => null)

      if (cevap.status === 429) {
        /* Hız sınırı — middleware'den gelir (bkz. lib/rateLimit.ts). */
        setSonuc('limit')
      } else if (alanHatasi(govde, 'email')) {
        setHatalar({ email: t('errorEmailTaken') })
      } else if (hataKodu(govde) === 'password_too_short') {
        setHatalar({ password: t('errorPasswordShort', { min: MIN_PAROLA }) })
      } else if (String(hataKodu(govde) ?? '').startsWith('captcha_')) {
        /* Üç CAPTCHA kodu (eksik / geçersiz / sağlayıcıya ulaşılamadı) tek
           mesajla karşılanır: kullanıcının yapacağı şey üçünde de aynıdır ve
           hangisinin geldiğini söylemek, saldırgana geri bildirim olurdu. */
        setSonuc('captcha')
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
        {/* Gorsel bildirim degismedi; sesli karsiligi (Madde 109). */}
        <LiveRegion mesaj={`${t('registerSuccessTitle')}. ${t('registerSuccess')}`} />
        <AuthNotice ton="basari" baslik={t('registerSuccessTitle')} rol="status">
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
      {/* Form cizildigi anda BOS olarak DOM'a girer; sonuc geldiginde metni
          degisir ve okuyucu degisikligi yakalar (bkz. LiveRegion). */}
      <LiveRegion
        mesaj={
          sonuc === 'ag'
            ? t('errorNetwork')
            : sonuc === 'limit'
              ? t('errorRateLimited')
              : sonuc === 'captcha'
                ? t('errorCaptcha')
                : sonuc
                  ? t('errorGeneric')
                  : ''
        }
      />

      {sonuc ? (
        <AuthNotice ton="hata" baslik={t('errorSummary')} rol="alert">
          {sonuc === 'ag'
            ? t('errorNetwork')
            : sonuc === 'limit'
              ? t('errorRateLimited')
              : sonuc === 'captcha'
                ? t('errorCaptcha')
                : t('errorGeneric')}
        </AuthNotice>
      ) : null}

      {/*
        HATA ÖZETİ — formun başında, alanlardan ÖNCE (Madde 103/105/106/107).
        Alan bazlı mesajlar yerinde kalır; bu liste onların yerine geçmez,
        kaç hata olduğunu ve nerede olduklarını tek bakışta verir.
      */}
      <FormErrorSummary
        hatalar={hataListesi}
        baslik={t('errorSummaryCount', { sayi: hataListesi.length })}
        belgeBasligiSablonu={String(t.raw('errorTitlePrefix'))}
      />

      {/* Zorunluluk notu form başına bir kez — gerekçe LoginForm içinde. */}
      <p className="text-xs text-ink-500">{t('requiredHint')}</p>

      {/*
        BENZER ALANLAR GRUPLANDI (Madde 112/113). İki küme vardır ve ayrımları
        anlamlıdır: kimlik bilgileri kurumla paylaşılacak verilerdir, parola
        yalnızca hesabın kendisine aittir. Görsel düzen değişmez — `fieldset`
        kenarlıksız ve dolgusuzdur.
      */}
      <FieldGroup baslik={t('groupIdentity')} className="space-y-6">
        <AuthField
          id={alanId('name')}
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
          id={alanId('unit')}
          label={t('fieldUnit')}
          name="unit"
          autoComplete="organization"
          hint={t('fieldUnitHint')}
          requiredMark=""
          value={alanlar.unit}
          onChange={alanDegistir('unit')}
          error={hatalar.unit}
        />
      </FieldGroup>

      <FieldGroup baslik={t('groupPassword')} className="space-y-6">
        <AuthField
          id={alanId('password')}
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
          id={alanId('passwordConfirm')}
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
      </FieldGroup>

      {/*
        Kayıt SONUCU önceden söylenir: hesap onay bekleyecektir. Bunu gönderim
        sonrasına saklamak, kullanıcıyı hemen giriş yapmayı deneyip 403
        almaya bırakırdı.
      */}
      <AuthNotice ton="bilgi" baslik={t('statusPendingTitle')}>
        {t('statusPending')}
      </AuthNotice>

      {/*
        CAPTCHA — normalde HİÇBİR ŞEY GÖRÜNMEZ.
        `appearance: 'interaction-only'` ile kutu yalnızca Cloudflare gerçekten
        bir etkileşim isterse belirir; o zaman da düğmenin hemen üstünde,
        beklendiği yerde durur. Site anahtarı tanımlı değilse bu blok hiç
        basılmaz — boş bir kapsayıcı da bırakılmaz.
      */}
      {captchaSiteKey ? (
        <div className="space-y-3">
          <div ref={turnstile.kapsayiciRef} />

          {turnstile.yuklenemedi ? (
            <AuthNotice ton="uyari" baslik={t('captchaUnavailableTitle')} rol="alert">
              {t('captchaUnavailable')}
            </AuthNotice>
          ) : null}

          {/*
            Şartname 12.3 / KVKK: üçüncü tarafa istek gittiği kullanıcıdan
            gizlenmez. Turnstile çerez koymaz ve profilleme yapmaz, ama yine
            de dış bir servistir ve bunu söylemek kullanıcının hakkıdır.
          */}
          <p className="text-xs text-ink-500">{t('captchaNotice')}</p>
        </div>
      ) : null}

      <button type="submit" disabled={durum === 'gonderiliyor'} className={AUTH_BUTTON}>
        {durum === 'gonderiliyor' ? t('registerSending') : t('registerSubmit')}
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

export default RegisterForm
