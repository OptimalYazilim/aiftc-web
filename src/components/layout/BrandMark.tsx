import React from 'react'

/**
 * KURUMSAL AMBLEM — ÖN YÜZ
 * ============================================================================
 * Üst menüde kurum adının solunda görünür.
 *
 * NE ZAMAN KULLANILIR
 * Yalnızca Genel Ayarlar > Logolar > Ana Logo alanına bir görsel YÜKLENMEMİŞSE.
 * Yüklenmişse `SiteHeader` o görseli basar; bu bileşen hiç render edilmez.
 * Böylece kurum resmî logosunu panelden yüklediğinde kodda değişiklik
 * gerekmez.
 *
 * ÖNEMLİ — BU RESMÎ AMBLEM DEĞİLDİR
 * Kurumun resmî OGM / AIFTC amblemi değildir. Resmî görsel geldiğinde
 * panelden yüklenmeli, bu bileşene dokunulmamalıdır (Şartname 10.2).
 *
 * ---------------------------------------------------------------------------
 * NEDEN İLLÜSTRASYON DEĞİL, MÜHÜR
 * ---------------------------------------------------------------------------
 * Önceki sürüm dolu bir ibreli ağaç siluetiydi. Klipart bir çam, uluslararası
 * kurum portallarının görsel dilinde yer almaz; bir şablondan alınmış izlenimi
 * verir. WHO, ILO ve FAO amblemlerinin ortak yapısı ŞUDUR: dairesel bir
 * çerçeve + soyut, geometrik bir iç işaret.
 *
 * Buradaki iç işaret de soyuttur: yatay ufuk çizgileri (arazi/peyzaj) ve
 * bunları kesen dikey eksen. Belirli bir ağacı, ülkeyi veya kurumu temsil
 * etmez — resmî amblem gelene kadar YER TUTAR.
 *
 * `aria-hidden`: yanındaki kurum adı zaten metin olarak okunuyor; amblemin
 * ikinci kez duyurulması ekran okuyucuda gürültü olurdu (WCAG 2.2 — 1.1.1).
 * ============================================================================
 */
export const BrandMark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 40 40"
    aria-hidden="true"
    focusable="false"
    className={`h-11 w-11 shrink-0 text-shell-900 ${className}`}
  >
    {/* Dış mühür halkası */}
    <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    {/* İç halka — mühür derinliği */}
    <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.45" />

    {/* Soyut peyzaj: üç ufuk yayı, aşağı doğru sıklaşır */}
    <path
      d="M9.5 24.5c3.4-3.4 7-5.1 10.5-5.1s7.1 1.7 10.5 5.1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M11.5 28.8c2.8-2.4 5.6-3.6 8.5-3.6s5.7 1.2 8.5 3.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      opacity="0.6"
    />

    {/* Dikey eksen — kurumsal süreklilik */}
    <path
      d="M20 9.5v9.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
)

export default BrandMark
