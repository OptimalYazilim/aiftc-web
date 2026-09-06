import Link from 'next/link'
import React from 'react'

/**
 * OK İŞARETLİ BAĞLANTI
 * ============================================================================
 * "Tümünü gör →" gibi bölüm sonu bağlantıları için ortak bileşen. İmleç
 * bağlantının herhangi bir yerindeyken (`group`) ok sağa kayar.
 *
 * ERİŞİLEBİLİRLİK
 *   - Ok `aria-hidden`: yön bilgisi metinde zaten var, ekran okuyucuya
 *     "sağ ok" diye okutmanın faydası yok.
 *   - Alt çizgi KORUNUR. Bağlantıyı yalnızca renkle ayırmak WCAG 2.2 —
 *     1.4.1'i karşılamaz; ok da tek başına yeterli bir işaret değildir.
 *   - `min-h-11`: dokunma hedefi 44px (2.5.8).
 *   - Kayma `transition-transform` ile yapılır; globals.css'teki
 *     `prefers-reduced-motion` kuralı süreyi 0.01ms'ye indirir.
 * ============================================================================
 */

type Props = {
  href: string
  children: React.ReactNode
  className?: string
}

export const ArrowLink: React.FC<Props> = ({ href, children, className = '' }) => (
  <Link
    href={href}
    className={`group inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap py-2 font-medium text-brand-800 underline underline-offset-4 hover:text-brand-700 ${className}`}
  >
    {children}
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      className="transition-transform duration-200 group-hover:translate-x-1"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.5 8h11M9.5 4l4 4-4 4"
      />
    </svg>
  </Link>
)

export default ArrowLink
