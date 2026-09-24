'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useState } from 'react'

import { useOturum } from './SessionProvider'

/**
 * OTURUM SÜRESİ UYARISI  (Kontrol Listesi 66 · 67 · WCAG 2.2.1)
 * ============================================================================
 * SİSTEMDE BİR ZAMAN SINIRI VAR — ÖLÇÜLEBİLİR VE GİZLİ
 * ---------------------------------------------------------------------------
 * `payload.config` → `Users.auth.tokenExpiration = 60 * 60 * 8`: oturum
 * jetonu giriş anından 8 saat sonra geçersiz olur. Bu bir HAREKETSİZLİK
 * süresi değil, MUTLAK bir süredir — kullanıcı aralıksız çalışsa bile dolar.
 *
 * Uyarı olmadan yaşananlar şunlardı: kütüphanede gezinen bir katılımcı,
 * korumalı bir belgeye tıkladığında çıplak bir 403 alıyor; neden erişemediğini
 * anlamıyor ve bunu bir arıza sanıyordu. Madde 67, süre dolmadan ÖNCE
 * uyarılmayı ve BASİT BİR İŞLEMLE uzatabilmeyi şart koşuyor.
 *
 * Madde 67'nin istisnaları burada geçerli DEĞİL: süre gerçek zamanlı bir
 * etkinliğin parçası değil (açık artırma vb.), uzatmak işlemi geçersiz
 * kılmıyor ve sınır 20 saatten kısa (8 saat).
 *
 * ---------------------------------------------------------------------------
 * NASIL ÇALIŞIR
 * ---------------------------------------------------------------------------
 *   1. `/api/users/me` oturumla birlikte `exp` (JWT bitiş anı, saniye) döner.
 *   2. Bitişe `UYARI_ESIGI_MS` kala şerit belirir ve kalan süreyi sayar.
 *   3. "Oturumu uzat" düğmesi `/api/users/refresh-token` çağırır; Payload yeni
 *      bir jeton ve yeni bir `exp` verir, şerit kaybolur.
 *
 * Uzatma sayısı SINIRLANMAZ (Madde 67-c "en az 10 kez" şartının üstünde).
 *
 * ---------------------------------------------------------------------------
 * ANONİM ZİYARETÇİDE HİÇBİR ŞEY YAPMAZ
 * ---------------------------------------------------------------------------
 * Oturum yoksa bileşen hiçbir şey basmaz ve hiçbir zamanlayıcı kurmaz.
 * Sitenin büyük kısmı oturumsuz gezilir; oraya bir sayaç koymak anlamsız
 * olurdu.
 *
 * ---------------------------------------------------------------------------
 * TASARIM — UYARI, PANİK DEĞİL
 * ---------------------------------------------------------------------------
 * `SubscriptionBanner` ile aynı editoryal dil: kemik zemin, tek ince çizgi,
 * kavis ve gölge yok, kırmızı yok. Bilgi renkte değil METİNDEDİR (Madde 47):
 * kalan dakika yazıyla söylenir.
 *
 * `role="status"` — `alert` DEĞİL: kullanıcının o an yaptığı işi kesmemeli,
 * ama duyurulmalı. Kalan süre `aria-live` ile her dakika değil, yalnızca
 * şerit belirdiğinde ve uzatma sonucunda duyurulur; her saniye duyurmak
 * ekran okuyucuyu kullanılamaz hâle getirirdi.
 * ============================================================================
 */

/** Bitişe ne kadar kala uyarılır. Madde 67-c en az 20 saniye ister; 5 dakika. */
const UYARI_ESIGI_MS = 5 * 60 * 1000

/** Şerit görünürken kalan süre bu aralıkla tazelenir. */
const SAYAC_ARALIGI_MS = 30 * 1000

export const SessionTimeoutNotice: React.FC = () => {
  const t = useTranslations('session')

  /*
    BİTİŞ ANI BAĞLAMDAN GELİR (bkz. SessionProvider).
    Önceki sürüm kendi `/api/users/me` çağrısını yapıyordu; aynı isteği
    abonelik şeridi ve başlıktaki hesap menüsü de atıyordu.
  */
  const { biter: baglamBitis, yenile } = useOturum()

  /** Uzatma sonrası yerel olarak güncellenen bitiş anı. */
  const [yerelBitis, setYerelBitis] = useState<number | null>(null)
  const bitis = yerelBitis ?? baglamBitis

  const [simdi, setSimdi] = useState<number | null>(null)
  const [uzatiliyor, setUzatiliyor] = useState(false)
  const [uzatmaBasarisiz, setUzatmaBasarisiz] = useState(false)

  /*
    ZAMANLAYICI YALNIZCA GEREKTİĞİNDE KURULUR.
    Bitişe 5 dakikadan fazla varsa tek bir uzun `setTimeout` kurulur ve
    saniye saniye sayan bir aralık ÇALIŞMAZ — sekme arka plandayken boşuna
    uyandırılmaz. Eşik geçildiğinde sayaç devreye girer.
  */
  useEffect(() => {
    if (bitis === null) return

    let aralik: number | undefined
    let zamanlayici: number | undefined

    const baslat = () => {
      setSimdi(Date.now())
      aralik = window.setInterval(() => setSimdi(Date.now()), SAYAC_ARALIGI_MS)
    }

    const kalan = bitis - Date.now()
    if (kalan <= UYARI_ESIGI_MS) {
      baslat()
    } else {
      zamanlayici = window.setTimeout(baslat, kalan - UYARI_ESIGI_MS)
    }

    /*
      Sekme arka plandayken tarayıcı zamanlayıcıları kısar; geri dönüldüğünde
      gerçek saate bakılır. Olmasaydı kullanıcı sekmeye döndüğünde şeridi
      dakikalarca gecikmeli görebilirdi.
    */
    const gorunurluk = () => {
      if (document.visibilityState === 'visible') setSimdi(Date.now())
    }
    document.addEventListener('visibilitychange', gorunurluk)

    return () => {
      if (aralik) window.clearInterval(aralik)
      if (zamanlayici) window.clearTimeout(zamanlayici)
      document.removeEventListener('visibilitychange', gorunurluk)
    }
  }, [bitis])

  const uzat = useCallback(async () => {
    setUzatiliyor(true)
    setUzatmaBasarisiz(false)
    try {
      const yanit = await fetch('/api/users/refresh-token', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!yanit.ok) throw new Error('uzatilamadi')
      const govde = (await yanit.json()) as { exp?: number }
      if (typeof govde?.exp !== 'number') throw new Error('exp yok')
      setYerelBitis(govde.exp * 1000)
      setSimdi(null)
      /* Bağlamdaki kullanıcı bilgisi de tazelensin. */
      void yenile()
    } catch {
      setUzatmaBasarisiz(true)
    } finally {
      setUzatiliyor(false)
    }
  }, [yenile])

  if (bitis === null || simdi === null) return null

  const kalanMs = bitis - simdi
  if (kalanMs > UYARI_ESIGI_MS) return null

  const suresiDoldu = kalanMs <= 0
  /* Yukarı yuvarlanır: 30 saniye kala "0 dakika" demek yanlış olurdu. */
  const kalanDakika = Math.max(1, Math.ceil(kalanMs / 60000))

  return (
    <div role="status" className="border-b border-line-strong bg-surface-alt" data-oturum="uyari">
      <div className="container-page flex flex-col gap-2 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <p className="text-sm font-bold text-shell-900">
            {suresiDoldu ? t('expiredTitle') : t('warningTitle')}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-700">
            {suresiDoldu
              ? t('expiredBody')
              : uzatmaBasarisiz
                ? t('extendFailed')
                : t('warningBody', { dakika: kalanDakika })}
          </p>
        </div>

        {suresiDoldu ? null : (
          <button
            type="button"
            onClick={uzat}
            disabled={uzatiliyor}
            className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-shell-900 underline underline-offset-4 hover:text-brand-800 focus-visible:text-brand-800 disabled:cursor-not-allowed disabled:text-ink-500"
          >
            {uzatiliyor ? t('extending') : t('extend')}
          </button>
        )}
      </div>
    </div>
  )
}

export default SessionTimeoutNotice
