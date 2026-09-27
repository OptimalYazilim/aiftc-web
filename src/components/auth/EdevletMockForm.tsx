'use client'

import { useTranslations } from 'next-intl'
import React, { useId, useState } from 'react'

import { FormErrorSummary } from '@/components/ui/FormErrorSummary'
import type { Locale } from '@/i18n/locales'
import { tcknBicimiGecerli } from '@/lib/tckn'

import { AuthField, AuthNotice } from './AuthField'

/**
 * e-DEVLET KUM HAVUZU FORMU
 * ============================================================================
 * DOĞRULAMA İKİ YERDE — AMA KURAL TEK YERDE
 * ---------------------------------------------------------------------------
 * Buradaki denetim bir KOLAYLIKTIR: kullanıcı yanlış bir numarayı gönderip
 * sayfa değişmesini beklemek zorunda kalmasın. Kuralın UYGULANDIĞI yer
 * `app/api/auth/edevlet/callback` rotasıdır ve o rota bu formu HİÇ
 * varsaymaz — istemci denetimi devtools'la silinebilir, `curl` onu hiç
 * görmez.
 *
 * İki taraf AYNI fonksiyonu çağırır (`lib/tckn.ts`). Kopyalanmış iki sürüm
 * tutulsaydı biri güncellenir, öteki kalır ve istemci "geçerli" dediği bir
 * numara sunucuda reddedilirdi — kullanıcı için açıklanamaz bir duvar.
 *
 * ---------------------------------------------------------------------------
 * NEDEN SERVER ACTION KULLANILMADI
 * ---------------------------------------------------------------------------
 * Proje kuralı: kimlik formlarında Server Action kullanılmaz (Payload'ın
 * `Origin` tabanlı CSRF koruması ve `aiftc-token` çerez mantığı). Bu form da
 * sonunda bir oturum açtırıyor, yani aynı kuralın kapsamında.
 *
 * Ayrıca teknik olarak da yardımcı olmazdı: bir Server Action doğrulamayı
 * yapıp SONRA veriyi dönüş ucuna POST EDEMEZ; ya kimlik numarasını adres
 * satırına koyup yönlendirmesi (kişisel veriyi URL'e yazmak) ya da oturumu
 * kendisi açması gerekirdi (kuralın yasakladığı şey).
 *
 * Bu yüzden form, dönüş ucuna DOĞRUDAN gönderir (`action=…` + `method="post"`).
 * Bu aynı zamanda gerçek kapının yapacağı şeydir: üst düzey bir POST/GET
 * dönüşü. Akışın şekli gerçek kip açıldığında değişmez.
 *
 * ---------------------------------------------------------------------------
 * ERİŞİLEBİLİRLİK — SİTENİN GERİ KALANIYLA AYNI BİLEŞENLER
 * ---------------------------------------------------------------------------
 * Test ekranı da olsa kendi alan/uyarı bileşenleri yazılmadı; projenin
 * gerçekleri (`AuthField`, `FormErrorSummary`, `AuthNotice`) kullanıldı.
 * Böylece hata özetine odak taşıma, alan-hata bağlantısı ve zorunluluk
 * işaretinin erişilebilir isme karışmaması davranışları bedava gelir —
 * hepsi E2E takımında ayrıca sınanıyor.
 * ============================================================================
 */

type Alanlar = { tckn: string; ad: string; soyad: string; eposta: string }
type Hatalar = Partial<Record<keyof Alanlar, string>>

/**
 * BİÇİM OLARAK GEÇERLİ ÖRNEK KİMLİK NUMARASI.
 *
 * Resmî sağlama algoritmasıyla üretildi — elde uydurulmuş bir sayı
 * `tcknBicimiGecerli()` denetimini geçemez ve kum havuzu hiç başlamazdı.
 *
 * Kum havuzu HİÇBİR nüfus kaydına bağlanmaz: numara yalnızca biçim denetimine
 * girer ve özetlenir. Yine de alışılmış bir test değeri seçildi; gerçek bir
 * kişinin numarası örnek olarak KULLANILMAMALIDIR.
 */
const ORNEK_TCKN = '10000000078'

const EPOSTA_DESENI = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const EdevletMockForm: React.FC<{
  locale: Locale
  state: string
  /** Dönüş ucunun reddettiği alanın kodu (`?hata=tckn` gibi). */
  sunucuHatasi?: string | null
}> = ({ locale, state, sunucuHatasi = null }) => {
  const t = useTranslations('edevletMock')
  const ta = useTranslations('auth')

  const taban = useId()
  const alanId = (ad: keyof Alanlar) => `${taban}-${ad}`

  const [alanlar, setAlanlar] = useState<Alanlar>({
    tckn: ORNEK_TCKN,
    ad: '',
    soyad: '',
    eposta: '',
  })
  const [hatalar, setHatalar] = useState<Hatalar>({})

  const etiketler: Record<keyof Alanlar, string> = {
    tckn: t('fieldTckn'),
    ad: t('fieldFirstName'),
    soyad: t('fieldLastName'),
    eposta: ta('fieldEmail'),
  }

  const degistir = (ad: keyof Alanlar) => (deger: string) => {
    setAlanlar((onceki) => ({ ...onceki, [ad]: deger }))
    setHatalar((onceki) => ({ ...onceki, [ad]: undefined }))
  }

  const denetle = (): Hatalar => {
    const yeni: Hatalar = {}

    if (!alanlar.tckn.trim()) yeni.tckn = ta('errorRequired')
    else if (!tcknBicimiGecerli(alanlar.tckn.trim())) yeni.tckn = t('errorTckn')

    if (!alanlar.ad.trim()) yeni.ad = ta('errorRequired')
    if (!alanlar.soyad.trim()) yeni.soyad = ta('errorRequired')

    /*
      E-POSTA OPSİYONELDİR — boşsa hata yok. Ama GİRİLDİYSE biçimi tutmalı:
      yarım bir adresle açılan hesap, sahibine hiçbir zaman ulaşılamayan bir
      hesap olur.
    */
    if (alanlar.eposta.trim() && !EPOSTA_DESENI.test(alanlar.eposta.trim())) {
      yeni.eposta = ta('errorEmail')
    }

    return yeni
  }

  const gonderimeBak = (olay: React.FormEvent<HTMLFormElement>) => {
    const yeni = denetle()
    setHatalar(yeni)

    /*
      Hata varsa gönderim DURDURULUR ve sayfa değişmez. `FormErrorSummary`
      odağı kendi üzerine alır, böylece klavye ve ekran okuyucu kullanıcısı
      hatayı anında bulur.
    */
    if (Object.keys(yeni).length > 0) olay.preventDefault()
  }

  const hataListesi = (Object.keys(hatalar) as (keyof Alanlar)[])
    .filter((ad) => Boolean(hatalar[ad]))
    .map((ad) => ({ alanId: alanId(ad), mesaj: `${etiketler[ad]}: ${hatalar[ad]}` }))

  /** Sunucudan dönen kodu okunur bir cümleye çevirir. */
  const sunucuMesaji = (kod: string): string => {
    if (kod === 'tckn') return t('errorTckn')
    if (kod === 'isim') return t('errorName')
    if (kod === 'eposta') return ta('errorEmail')
    /* Bağlama özel metin: burada adres DEĞİŞTİRİLEBİLİR, giriş sayfasındaki
       'parolanızla girin' önerisi bu ekranda yanlış yönlendirir. */
    if (kod === 'eposta_kullanimda') return t('errorEmailTaken')
    return ta('edevletErrorGeneric')
  }

  return (
    <form
      action="/api/auth/edevlet/callback"
      method="post"
      noValidate
      onSubmit={gonderimeBak}
      className="space-y-5"
    >
      {/*
        SUNUCUDAN DÖNEN HATA.
        İstemci denetiminden ayrı durur ve ayrı bir metin taşır: "sunucu
        reddetti" ile "formu doldurmadın" aynı şey değildir ve kum havuzunu
        geliştirirken bu ayrım tam olarak aranan bilgidir.
      */}
      {sunucuHatasi ? (
        <AuthNotice ton="hata" baslik={t('serverRejected')} rol="alert">
          <p>{sunucuMesaji(sunucuHatasi)}</p>
        </AuthNotice>
      ) : null}

      <FormErrorSummary
        hatalar={hataListesi}
        baslik={ta('errorSummaryCount', { sayi: hataListesi.length })}
        belgeBasligiSablonu={String(ta.raw('errorTitlePrefix'))}
      />

      {/*
        `state` FORMDA GİZLİ ALAN OLARAK TAŞINIR.
        Değeri doğrulayan taraf sunucudur: dönüş ucu bunu httpOnly çerezdeki
        eşiyle karşılaştırır. İki değerden biri istemcinin JavaScript'ine hiç
        görünmediği için, yalnızca bu tarayıcıda başlamış bir akış
        tamamlanabilir (gerekçe: lib/edevlet.ts).

        Boş gelmesi bir hata DEĞİLDİR: sayfa doğrudan açılmış olabilir. O
        durumda sunucu isteği reddeder ve kullanıcı giriş sayfasına döner —
        karar burada verilmez.
      */}
      <input type="hidden" name="state" value={state} />
      <input type="hidden" name="locale" value={locale} />

      <AuthField
        id={alanId('tckn')}
        label={etiketler.tckn}
        name="tckn"
        value={alanlar.tckn}
        onChange={degistir('tckn')}
        required
        requiredMark={ta('fieldRequired')}
        hint={t('hintTckn')}
        error={hatalar.tckn ?? null}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <AuthField
          id={alanId('ad')}
          label={etiketler.ad}
          name="ad"
          value={alanlar.ad}
          onChange={degistir('ad')}
          required
          requiredMark={ta('fieldRequired')}
          error={hatalar.ad ?? null}
        />
        <AuthField
          id={alanId('soyad')}
          label={etiketler.soyad}
          name="soyad"
          value={alanlar.soyad}
          onChange={degistir('soyad')}
          required
          requiredMark={ta('fieldRequired')}
          error={hatalar.soyad ?? null}
        />
      </div>

      {/*
        E-POSTA: `required` VERİLMEZ.
        Gerçek e-Devlet Kapısı e-posta döndürmez, dolayısıyla alanın zorunlu
        olmaması gerçek akışa daha yakındır. Boş bırakıldığında sunucu, kimlik
        özetinden türetilmiş ve HİÇBİR ZAMAN teslim edilemeyecek bir adres
        üretir (`@edevlet.invalid`) — gerekçesi dönüş ucunda yazılı.
      */}
      <AuthField
        id={alanId('eposta')}
        label={etiketler.eposta}
        name="eposta"
        type="email"
        value={alanlar.eposta}
        onChange={degistir('eposta')}
        requiredMark=""
        hint={t('hintEmail')}
        error={hatalar.eposta ?? null}
      />

      {/*
        DÜĞME BİLİNÇLİ OLARAK `AUTH_BUTTON` DEĞİL.
        `AUTH_BUTTON` kurumun marka rengini (`brand-700`) taşır; bu ekranın
        kurumsal bir giriş ekranı gibi görünmemesi gerekiyor. Nötr, koyu gri
        bir düğme kullanılıyor — aynı yükseklik ve odak davranışıyla.
      */}
      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-shell-900 px-6 text-sm font-bold text-white transition-colors duration-300 hover:bg-shell-800 focus-visible:bg-shell-800"
      >
        {t('submit')}
      </button>
    </form>
  )
}

export default EdevletMockForm
