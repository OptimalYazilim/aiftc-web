import React from 'react'

import type { PortalLink } from '@/lib/portalLinks'

import { ExternalLink } from '../ui/ExternalLink'

/**
 * KARDEŞ PORTAL LİSTESİ
 * ============================================================================
 * İki yerde kullanılır:
 *   'bar'    → koyu üst hizmet şeridi, yatay dizilim (masaüstü)
 *   'panel'  → mobil menü paneli, dikey dizilim, açık zemin
 *
 * Liste `lib/portalLinks.ts` içinde TEK YERDE kuruluyor; burası yalnızca
 * sunum yapar.
 *
 * TIKLANAMAZ ÖĞE
 * `href` null olduğunda bağlantı değil <span aria-disabled> basılır: odak
 * sırasına girmez, ama "Yakında" rozeti durumu METİNLE söyler (WCAG 2.2 —
 * 1.4.1 Rengin Kullanımı). Servisin açıklaması `sr-only` olarak eklenir.
 *
 * KONTRAST
 *   bar   (zemin shell-950): white/75 → 9.96:1 · white/55 → 5.94:1
 *                            rozet kenarlığı white/40 → 3.74:1 (1.4.11)
 *   panel (zemin beyaz):     ink-700 → 11.74:1 · ink-500 → 4.80:1
 * ============================================================================
 */

type Props = {
  items: PortalLink[]
  variant: 'bar' | 'panel'
  comingSoonLabel: string
}

export const PortalLinks: React.FC<Props> = ({ items, variant, comingSoonLabel }) => {
  const isBar = variant === 'bar'

  const linkClass = isBar
    ? 'inline-flex min-h-9 items-center rounded px-2 py-1 text-white/75 underline-offset-4 transition-colors hover:text-white hover:underline'
    : 'inline-flex min-h-11 items-center rounded-md px-3 py-2 font-medium text-ink-700 transition-colors hover:bg-surface-alt hover:text-brand-800'

  const disabledClass = isBar
    ? 'inline-flex min-h-9 items-center gap-2 px-2 py-1 text-white/55'
    : 'inline-flex min-h-11 items-center gap-2 px-3 py-2 text-ink-500'

  const badgeClass = isBar
    ? 'rounded-sm border border-white/40 px-1.5 py-px text-[0.6875rem] font-semibold uppercase tracking-wide'
    : 'rounded-sm bg-surface-alt px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-ink-600'

  return (
    <ul className={isBar ? 'flex flex-wrap items-center gap-x-1' : 'flex flex-col gap-1'}>
      {items.map((item) => (
        <li key={item.trackId} className={isBar ? undefined : 'w-full'}>
          {item.href ? (
            <ExternalLink href={item.href} trackId={item.trackId} className={linkClass}>
              {item.label}
            </ExternalLink>
          ) : (
            <span aria-disabled="true" className={disabledClass}>
              {item.label}
              <span className={badgeClass}>{comingSoonLabel}</span>
              {item.notice ? <span className="sr-only">. {item.notice}</span> : null}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

export default PortalLinks
