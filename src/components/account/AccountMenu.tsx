'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import { useOturum } from './SessionProvider'

/**
 * ÜST ŞERİTTEKİ HESAP DENETİMİ
 * ============================================================================
 * SORUN
 * ---------------------------------------------------------------------------
 * Başlıktaki "Giriş" bağlantısı SABİTTİ. `TopUtilityBar` bir sunucu
 * bileşenidir ve oturumu okuyan hiçbir kod taşımıyordu: kullanıcı giriş yapıp
 * kütüphaneye yönlendirildikten sonra bile menüde "Giriş" yazmaya devam
 * ediyordu. Kullanıcı açısından bu, girişin BAŞARISIZ olduğu anlamına gelir;
 * çoğu kişi ikinci kez giriş yapmayı dener.
 *
 * Çerez (`aiftc-token`) doğru kurulmuştu — eksik olan onu okuyan arayüzdü.
 *
 * ---------------------------------------------------------------------------
 * İLK BOYAMADA "GİRİŞ" GÖSTERİLİR — BİLİNÇLİ
 * ---------------------------------------------------------------------------
 * Oturum ancak `/api/users/me` yanıtlayınca bilinir. O ana kadar üç seçenek
 * vardı:
 *
 *   1. hiçbir şey basma  → şerit boş kalır, yanıt gelince içerik ZIPLAR
 *   2. iskelet göster    → tek bir bağlantı için gereksiz karmaşa
 *   3. "Giriş" göster    → ziyaretçilerin ezici çoğunluğu için ZATEN DOĞRU
 *
 * Üçüncüsü seçildi. Oturumu olan kullanıcı çok kısa bir an "Giriş" görür ve
 * yerini adı alır; tersi (oturumsuz kullanıcıya "Çıkış Yap" göstermek) çok
 * daha yanıltıcı olurdu.
 *
 * `aria-live` KULLANILMAZ: bu bir bildirim değil, sayfanın ilk hâlinin
 * tamamlanmasıdır. Her sayfa yüklemesinde "Çıkış Yap" diye duyurmak gürültü
 * olurdu.
 *
 * ---------------------------------------------------------------------------
 * AD ARTIK BAĞLANTIDIR
 * ---------------------------------------------------------------------------
 * Önceki sürümde kullanıcının adı düz metindi, çünkü gidilecek bir profil
 * sayfası YOKTU ve olmayan bir rotaya bağlantı 404 üretirdi. `/[locale]/profil`
 * açıldığı için ad artık bağlantıya çevrildi.
 *
 * AÇILIR MENÜ (dropdown) KURULMADI — bilinçli. Menü altında şu an TEK öğe
 * olurdu ("Profilim"); tek seçenekli bir açılır menü, kullanıcıya fazladan
 * bir tıklama ve klavye kullanıcısına fazladan bir odak durağı ekler,
 * karşılığında hiçbir şey vermez. İkinci bir hesap sayfası eklendiğinde
 * menüye dönüştürülmelidir.
 *
 * Dar ekranda ad gizlidir (`sm:` eşiği); o yüzden profil bağlantısının
 * erişilebilir ismi ADIN KENDİSİ DEĞİL, `aria-label` ile verilen açık
 * ifadedir — ekran okuyucu "Deniz Yılmaz, bağlantı" yerine "Profilim,
 * bağlantı" duyar ve nereye gideceğini bilir.
 *
 * ---------------------------------------------------------------------------
 * ÇIKIŞ
 * ---------------------------------------------------------------------------
 * `POST /api/users/logout` çerezi sunucu tarafında siler (httpOnly olduğu
 * için istemci silemez). Ardından TAM SAYFA yenilemesi yapılır: sunucuda
 * render edilmiş her şey (kütüphane listesi dahil) yeni, oturumsuz hâliyle
 * yeniden kurulsun. `router.refresh()` yetmezdi — istemci tarafı gezinme
 * önbellekteki HTML'i gösterebilir.
 * ============================================================================
 */

const BAGLANTI_SINIFI =
  'inline-flex min-h-9 items-center gap-2 rounded px-2 py-1 font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white'

const GirisIkonu = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 16 16"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6.5 13.5h-3a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3" />
    <path d="M10.5 11 14 8l-3.5-3M14 8H6" />
  </svg>
)

const ProfilIkonu = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 16 16"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="8" cy="5.5" r="2.6" />
    <path d="M2.8 13.8c.9-2.5 2.9-3.9 5.2-3.9s4.3 1.4 5.2 3.9" />
  </svg>
)

const CikisIkonu = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 16 16"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.5 13.5h3a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-3" />
    <path d="M5.5 11 2 8l3.5-3M2 8h8" />
  </svg>
)

export const AccountMenu: React.FC<{ girisHref: string; profilHref: string }> = ({
  girisHref,
  profilHref,
}) => {
  const t = useTranslations('nav')
  const { durum, kullanici, yenile } = useOturum()
  const [cikiliyor, setCikiliyor] = useState(false)

  const cikisYap = async () => {
    setCikiliyor(true)
    try {
      await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
    } catch {
      /* Ağ hatası olsa bile aşağıdaki yenileme gerçek durumu getirir. */
    }
    await yenile()
    window.location.reload()
  }

  if (durum !== 'var' || !kullanici) {
    return (
      <Link href={girisHref} className={BAGLANTI_SINIFI}>
        <GirisIkonu />
        {t('signIn')}
      </Link>
    )
  }

  /*
    Ad yoksa e-posta, o da yoksa jenerik etiket. Üçü de yoksa bile boş bir
    düğme basılmaz — kullanıcı kimliğini göremediği bir "Çıkış" tuşuna
    basmaz.
  */
  const ad = (kullanici.name || kullanici.email || t('account')) as string

  return (
    <span className="inline-flex items-center gap-1">
      {/*
        `title`: dar ekranda ad kırpılır; tam hâli imleçle görülebilir.
        `max-w-[9rem] truncate` şeridin sarmasını engeller — mobilde
        başlık yüksekliğinin artması ölçülmüş bir sorundu (bkz.
        TopUtilityBar docblock'u).
      */}
      {/*
        MOBİLDE DE ULAŞILABİLİR OLMALI.
        İlk sürümde bağlantının tamamı `sm:` eşiğinin altında gizleniyordu;
        telefondan giren kullanıcının profile gidecek HİÇBİR yolu kalmıyordu.
        Artık ikon her zaman görünür, yalnızca AD dar ekranda gizlenir —
        şeridin yüksekliği korunur (mobilde başlık yüksekliği ölçülmüş bir
        kısıttır, bkz. TopUtilityBar docblock'u).
      */}
      <Link
        href={profilHref}
        title={ad}
        aria-label={t('profile')}
        className="inline-flex min-h-9 min-w-9 max-w-[11rem] items-center justify-center gap-2 rounded px-2 py-1 text-white/85 underline-offset-4 sm:justify-start transition-colors hover:bg-white/10 hover:text-white hover:underline focus-visible:bg-white/10 focus-visible:text-white focus-visible:underline"
      >
        <ProfilIkonu />
        <span className="hidden truncate sm:inline">{ad}</span>
      </Link>

      <button type="button" onClick={cikisYap} disabled={cikiliyor} className={BAGLANTI_SINIFI}>
        <CikisIkonu />
        {cikiliyor ? t('signingOut') : t('signOut')}
      </button>
    </span>
  )
}

export default AccountMenu
