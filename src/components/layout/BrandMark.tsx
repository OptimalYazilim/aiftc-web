import React from 'react'

/**
 * KURUMSAL İŞARET — YER TUTUCU AMBLEM
 * ============================================================================
 * Panelden kurumun resmî logosu (Genel Ayarlar > Logolar) yüklenmediğinde
 * footer'da gösterilir. RESMÎ AMBLEM DEĞİLDİR.
 *
 * Biçim: çift halkalı mühür içinde üç katlı stilize çam ve ufuk çizgisi —
 * ormancılık eğitimine doğrudan gönderme yapar.
 *
 * ÖNCEKİ ÇİZİM DEĞİŞTİRİLDİ: daire içindeki dikey eksen ve iki yay, üç kollu
 * yıldızlı bilinen bir otomobil markası logosunu çağrıştırıyordu. Kurumsal
 * bir sitede başka bir markayla karıştırılabilecek bir işaret kullanılmamalı.
 * ============================================================================
 */
export const BrandMark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 40 40"
    aria-hidden="true"
    focusable="false"
    className={`h-11 w-11 shrink-0 text-shell-900 ${className}`}
  >
    {/* Mühür halkaları */}
    <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="20" cy="20" r="15.2" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.4" />

    {/* Üç katlı stilize çam */}
    <path
      d="M20 8.6l4.2 5.6h-2.3l4.1 5.4h-2.4l4.4 5.8H14l4.4-5.8H16l4.1-5.4h-2.3Z"
      fill="currentColor"
    />
    {/* Gövde */}
    <path d="M20 25.4v3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    {/* Ufuk çizgisi */}
    <path
      d="M10.5 29.6c3-.9 6.2-1.3 9.5-1.3s6.5.4 9.5 1.3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
)

export default BrandMark
