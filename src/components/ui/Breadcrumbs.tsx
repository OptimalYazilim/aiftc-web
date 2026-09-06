import Link from 'next/link'
import React from 'react'

/**
 * KIRINTI YOLU (BREADCRUMB)
 * ============================================================================
 * WCAG 2.2 — 2.4.8 Konum (AAA) ve 1.3.1 Bilgi ve İlişkiler.
 *
 *  - `<nav aria-label>`: sayfada birden çok gezinme bölgesi var (ana menü,
 *    dil seçici, kırıntı yolu). Etiketsiz bırakılırsa ekran okuyucu hepsini
 *    ayırt edilemeyen "navigation" olarak okur.
 *  - Son öğe BAĞLANTI DEĞİLDİR ve `aria-current="page"` taşır: kullanıcı zaten
 *    o sayfadadır, kendine giden bir bağlantı odak sırasında gürültüdür.
 *  - Ayraç `aria-hidden`: "büyüktür işareti" diye okunmamalıdır.
 * ============================================================================
 */

export type Crumb = {
  label: string
  /** Son öğede verilmez. */
  href?: string
}

export const Breadcrumbs: React.FC<{ items: Crumb[]; label: string }> = ({ items, label }) => (
  <nav aria-label={label}>
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-600">
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? (
              <span aria-hidden="true" className="text-ink-500">
                ›
              </span>
            ) : null}

            {item.href && !isLast ? (
              <Link href={item.href} className="underline-offset-4 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current={isLast ? 'page' : undefined} className="text-ink-700">
                {item.label}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  </nav>
)

export default Breadcrumbs
