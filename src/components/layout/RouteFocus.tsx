'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * ROTA DEĞİŞİMİNDE ODAK YÖNETİMİ  (Kontrol Listesi 78 · 79 · 80 · 81)
 * ============================================================================
 * SORUN — ÖLÇÜLDÜ (2026-09-24)
 * ---------------------------------------------------------------------------
 * App Router istemci tarafı gezinmede sayfayı YENİLEMEZ. Ölçüm:
 *
 *     /tr → /tr/kutuphane bağlantısına tıklandı
 *     document.title   → "Dijital Ormancılık Kütüphanesi…"   (doğru güncellendi)
 *     document.activeElement → BODY                          (odak kayboldu)
 *
 * Başlık doğru; sorun odakta. Tıklanan bağlantı DOM'dan kalktığı için odak
 * `<body>`ye düşüyor ve klavye kullanıcısı Tab'a bastığında yeni sayfanın
 * içeriğine değil BELGENİN EN BAŞINA dönüyor — her gezinmede başlık, menü ve
 * dil seçiciyi yeniden geçmek zorunda kalıyor. Ekran okuyucu ise hiçbir şey
 * duyurmuyor: kullanıcı sayfanın değiştiğini bile anlamıyor.
 *
 * ---------------------------------------------------------------------------
 * ÇÖZÜM — ODAK ANA İÇERİĞE
 * ---------------------------------------------------------------------------
 * Yerleşimde zaten `<main id="main-content" tabIndex={-1}>` var (atlama
 * bağlantısının hedefi). Rota değişince odak oraya taşınır: okuma da Tab da
 * içerikten başlar, başlık ve menü atlanmış olur.
 *
 * `<h1>`e DEĞİL `<main>`e taşınıyor. `<h1>` odaklanabilir değildir ve onu
 * `tabIndex={-1}` yapmak, sayfadaki her başlığı ayrı bir odak hedefine
 * çevirme baskısı yaratır. `<main>` bir landmark'tır; okuyucu oraya
 * girildiğinde "ana içerik" der ve hemen ardından `<h1>`i okur.
 *
 * ---------------------------------------------------------------------------
 * İLK YÜKLEMEDE ÇALIŞMAZ — BİLİNÇLİ
 * ---------------------------------------------------------------------------
 * Sayfa ilk açıldığında odağı taşımak YANLIŞTIR: kullanıcı henüz hiçbir şey
 * yapmamıştır ve atlama bağlantısı ("İçeriğe geç") erişilemez hâle gelir —
 * o bağlantının tüm amacı, odak belgenin başındayken ilk sırada olmaktır.
 * `ilkRef` bu yüzden ilk çalışmayı yutar.
 *
 * ---------------------------------------------------------------------------
 * `preventScroll: true` — NEDEN
 * ---------------------------------------------------------------------------
 * Next.js gezinmede kaydırma konumunu kendisi ayarlar. `focus()` ayrıca
 * kaydırmaya çalışırsa iki mekanizma çakışır ve sayfa bir zıplar. Odak
 * taşınır, kaydırmaya karışılmaz.
 *
 * ---------------------------------------------------------------------------
 * BAŞLIK AYRICA DUYURULUR
 * ---------------------------------------------------------------------------
 * `document.title` değişikliği ekran okuyucularda TUTARLI biçimde
 * duyurulmaz — tarayıcı ve okuyucu birleşimine göre değişir. Kalıcı bir
 * `aria-live` bölgesine yeni başlığı yazmak bu boşluğu kapatır ve kullanıcı
 * nereye geldiğini duyar (Madde 79).
 *
 * Bölge `role="status"` DEĞİL sade `aria-live`: sayfa başlığı bir durum
 * bildirimi değil, bir konum bildirimidir.
 * ============================================================================
 */
export const RouteFocus: React.FC = () => {
  const pathname = usePathname()
  const ilkRef = useRef(true)
  const [duyuru, setDuyuru] = useState('')

  useEffect(() => {
    if (ilkRef.current) {
      ilkRef.current = false
      return
    }

    const ana = document.getElementById('main-content')
    ana?.focus({ preventScroll: true })

    /*
      Başlık, yeni sayfanın `generateMetadata` çıktısı DOM'a yazıldıktan
      sonra okunmalı. Aynı tick'te okunursa ÖNCEKİ sayfanın başlığı
      duyurulurdu — ölçümde `document.title` gezinme tamamlandığında
      güncelleniyor, ama bu efekt ondan önce de koşabilir.

      Site adı ekten çıkarılır: "Kütüphane | AIFTC" yerine "Kütüphane" —
      her gezinmede kurum adını tekrar duymak gürültüdür.
    */
    const zamanlayici = window.setTimeout(() => {
      const tam = document.title
      setDuyuru(tam.split('|')[0]?.trim() || tam)
    }, 120)

    return () => window.clearTimeout(zamanlayici)
  }, [pathname])

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {duyuru}
    </div>
  )
}

export default RouteFocus
