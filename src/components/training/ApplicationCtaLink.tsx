'use client'

import Link from 'next/link'
import React from 'react'

import { useOturum } from '@/components/account/SessionProvider'

/**
 * BAŞVURU AKSİYONU — OTURUMA GÖRE DEĞİŞEN BAĞLANTI
 * ============================================================================
 * Eğitim künyesindeki birincil düğme, ziyaretçiye göre iki farklı şey ifade
 * eder:
 *
 *   oturum YOK  → "Bilgi Al"                  iletişim sayfasına gider
 *   oturum VAR  → "Eğitim Materyallerine Git" kütüphaneye gider
 *
 * Gerekçe: giriş yapmış bir katılımcı için "Bilgi Al" yanlış eylemdir —
 * zaten kayıtlıdır, aradığı şey eğitimin materyalidir. Aynı düğmenin iki
 * kitleye aynı şeyi söylemesi, ikisinden birini her zaman yanlış yere
 * götürür.
 *
 * ---------------------------------------------------------------------------
 * NEDEN AYRI BİR İSTEMCİ BİLEŞENİ
 * ---------------------------------------------------------------------------
 * `ApplicationCta` bir SUNUCU bileşenidir: başvuru hedefini, eğitim durumunu
 * ve harici servis ayarlarını çözer. Oturum ise yalnızca istemcide
 * bilinebilir — çerez `httpOnly`dir (bkz. SessionProvider). Sunucu bileşenini
 * tümden istemciye çevirmek, o veri çözümlemesini de tarayıcıya taşırdı.
 *
 * Bu yüzden ayrım en dar yerde yapılır: sunucu İKİ OLASILIĞI DA hazırlar,
 * bu bileşen yalnızca hangisinin basılacağına karar verir.
 *
 * ---------------------------------------------------------------------------
 * OKUNURKEN "BİLGİ AL" GÖSTERİLİR — BİLİNÇLİ
 * ---------------------------------------------------------------------------
 * Oturum `/api/users/me` yanıtlayana kadar bilinmez. O ana kadar oturumsuz
 * hâl basılır: ziyaretçilerin ezici çoğunluğu için zaten doğrudur ve yanlış
 * yöne düşen kullanıcı daha AZ yetkili seçeneği görür. Tersi — henüz
 * doğrulanmamış bir ziyaretçiye "Materyallere Git" demek — onu erişemeyeceği
 * bir yere yollardı.
 *
 * Görsel sınıflar İKİ HÂLDE DE AYNIDIR; değişen yalnızca metin ve hedeftir.
 * ============================================================================
 */
export const ApplicationCtaLink: React.FC<{
  /** Oturumsuz hâl: iletişim sayfası (varsa eğitim ön seçimiyle). */
  bilgiHref: string
  bilgiEtiketi: string
  /** Oturumlu hâl: kütüphane. */
  materyalHref: string
  materyalEtiketi: string
  className: string
}> = ({ bilgiHref, bilgiEtiketi, materyalHref, materyalEtiketi, className }) => {
  const { durum } = useOturum()
  const oturumVar = durum === 'var'

  return (
    <Link href={oturumVar ? materyalHref : bilgiHref} className={className}>
      {oturumVar ? materyalEtiketi : bilgiEtiketi}
    </Link>
  )
}

export default ApplicationCtaLink
