'use client'

import React from 'react'
import { useLocale, useTranslations } from 'next-intl'

import { toTrackKey, trackOutbound } from '@/lib/analytics'

/**
 * HARİCİ BAĞLANTI
 * ============================================================================
 * WCAG 2.2 — 2.4.4 / 3.2.5: yeni sekmede açılan bağlantı kullanıcıya ÖNCEDEN
 * bildirilmelidir. Bu bileşen görünür bir ikon ve ekran okuyucular için
 * "(yeni pencerede açılır)" metni ekler; ikisi birden olmadan AA sağlanmaz.
 *
 * Güvenlik: `target="_blank"` her zaman `rel="noopener noreferrer"` ile gelir
 * (Şartname 12.1 — temel OWASP kontrolleri).
 *
 * Şartname 17: tıklama, kişisel veri içermeyen bir anahtarla sayılır.
 * ============================================================================
 */

type Props = {
  href: string
  children: React.ReactNode
  /** Yeni sekmede açılsın mı? EK-2 servislerinde CMS'ten gelir. */
  newTab?: boolean
  /** Analitik anahtarı. Verilmezse host'tan türetilir. */
  trackId?: string
  /** Eğitim kodu gibi kişisel veri İÇERMEYEN bağlam. */
  trackContext?: string
  className?: string
  /** İkonu gizle (örn. logo bağlantısı). Ekran okuyucu uyarısı yine kalır. */
  hideIcon?: boolean
  /**
   * Tıklamada, dış bağlantı sayacına EK OLARAK çalışacak iş.
   * `onClick` prop'u olarak açılmadı: bu bileşenin tıklama davranışı
   * (giden bağlantı ölçümü) kendisine aittir ve dışarıdan ezilmemelidir.
   * Bu kanca onun YERİNE değil, YANINDA çalışır.
   */
  onActivate?: () => void
}

export const ExternalLink: React.FC<Props> = ({
  href,
  children,
  newTab = true,
  trackId,
  trackContext,
  className,
  hideIcon = false,
  onActivate,
}) => {
  const locale = useLocale()
  const t = useTranslations('common')

  const onClick = () => {
    trackOutbound({
      target: trackId ?? toTrackKey(href),
      locale,
      context: trackContext,
    })
    onActivate?.()
  }

  return (
    <a
      href={href}
      className={className}
      onClick={onClick}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
      {!hideIcon && newTab ? (
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 16 16"
          width="0.85em"
          height="0.85em"
          className="ml-1 inline-block shrink-0 align-[-0.05em]"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.5 2.5H2.5v11h11v-4M9.5 2.5h4v4M13.5 2.5 7 9"
          />
        </svg>
      ) : null}
      {newTab ? <span className="sr-only"> {t('opensInNewTab')}</span> : null}
    </a>
  )
}

export default ExternalLink
