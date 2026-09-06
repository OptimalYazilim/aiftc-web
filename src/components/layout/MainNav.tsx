'use client'

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { usePathname } from '@/i18n/routing'
import type { ResolvedNavLink } from '@/lib/resolveLink'

import { ExternalLink } from '../ui/ExternalLink'

/**
 * ANA MENÜ
 * ============================================================================
 * Erişilebilirlik yaklaşımı — DISCLOSURE deseni (WAI-ARIA APG):
 *   Alt menüsü olan başlık bir <button aria-expanded aria-controls> olur,
 *   açtığı panel sıradan bir <ul>'dir.
 *
 * Bilinçli olarak `role="menu"` / `aria-haspopup="menu"` KULLANILMAZ.
 * O desen masaüstü uygulama menüleri içindir; site gezinmesinde ekran
 * okuyucuyu "uygulama moduna" sokar ve ok tuşlarıyla gezinme zorunluluğu
 * doğurur. Site menüsü için doğru desen disclosure'dır.
 *
 * Klavye: Tab ile doğal sıra, Escape paneli kapatır ve odağı tetikleyen
 * butona geri verir (WCAG 2.2 — 2.1.2 Klavye Tuzağı Yok).
 * Panel dışına tıklama kapatır. Hover ile AÇILMAZ — 2.5.8 hedef boyutu ve
 * dokunmatik cihaz eşitliği için tıklama esas alınır.
 * ============================================================================
 */

type Props = {
  items: ResolvedNavLink[]
  /** Mobil panelde mi render ediliyor? Görünüm ve etiketleme değişir. */
  variant?: 'desktop' | 'mobile'
  onNavigate?: () => void
}

/**
 * Aktif öğe tespiti KANONİK yol üzerinden yapılır (bkz. ResolvedNavLink).
 * `usePathname` next-intl'den gelir: dil öneki olmadan, TR segmentleriyle
 * döner ve sunucu/istemci arasında aynıdır.
 */
const isActive = (pathname: string, canonical?: string): boolean => {
  if (!canonical) return false
  if (canonical === '/') return pathname === '/'
  return pathname === canonical || pathname.startsWith(`${canonical}/`)
}

export const MainNav: React.FC<Props> = ({ items, variant = 'desktop', onNavigate }) => {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLUListElement>(null)
  const baseId = useId()

  const close = useCallback(() => setOpenIndex(null), [])

  // Sayfa değişince açık paneli kapat.
  useEffect(() => {
    close()
  }, [pathname, close])

  // Escape + dışarı tıklama.
  useEffect(() => {
    if (openIndex === null) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const trigger = containerRef.current?.querySelector<HTMLButtonElement>(
        `[data-nav-trigger="${openIndex}"]`,
      )
      close()
      trigger?.focus()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [openIndex, close])

  const isMobile = variant === 'mobile'

  /**
   * MASAÜSTÜ MENÜ TİPOGRAFİSİ — "tok ve net"
   * Önceki sürümde bağlantılar gövde metniyle aynı ağırlıktaydı (ink-700,
   * font-medium) ve hover'da alt çizgi beliriyordu. Kurumsal portallarda ana
   * menü, gövde metninden BİR KADEME KOYU ve KALIN olur: menü bir okuma
   * alanı değil, sitenin iskeletidir.
   *
   * Aktif öğe İKİ sinyalle işaretlenir — yumuşak dolgu + kalın alt çizgi.
   * Yalnızca renk kullanılsaydı 1.4.1 (Rengin Kullanımı) ihlal edilirdi.
   *
   * KONTRAST — beyaz zemin üzerinde ölçülen:
   *     shell-900 (#062822)  15.74:1   varsayılan bağlantı
   *     brand-800 (#0a4423)  11.27:1   aktif / hover
   *     brand-50 zemininde brand-800  10.61:1
   */
  const linkClasses = (active: boolean, highlight: boolean) =>
    [
      // WCAG 2.2 — 2.5.8: dokunma hedefi en az 44×44 CSS px (min-h-11)
      'inline-flex min-h-11 items-center rounded-md transition-colors',
      isMobile
        ? 'px-3 py-2 font-medium'
        : // `whitespace-nowrap`: 1024–1200px arasında "Ana Sayfa" gibi iki
          // sözcüklü öğeler buton içinde alt satıra kırılıyor ve menü iki
          // satıra çıkıyordu. Menü tek satır kalmalı; sığmadığı genişlikte
          // zaten mobil panele düşüyor.
          'whitespace-nowrap px-3 py-2 text-[0.9375rem] font-semibold tracking-tight',
      highlight
        ? 'bg-brand-700 text-white hover:bg-brand-800'
        : active
          ? 'bg-brand-50 text-brand-800 underline decoration-brand-700 decoration-2 underline-offset-8'
          : 'text-shell-900 hover:bg-surface-alt hover:text-brand-800',
    ].join(' ')

  const renderLeaf = (link: ResolvedNavLink, active: boolean) => {
    // EK-2 servisi "yakında" ise tıklanamaz metin + açıklama.
    if (!link.available || !link.href) {
      return (
        <span
          aria-disabled="true"
          className="inline-flex min-h-11 items-center px-3 py-2 text-ink-500"
        >
          {link.label}
          {link.notice ? (
            <span className="ml-2 rounded bg-surface-alt px-2 py-0.5 text-sm text-ink-600">
              {t('comingSoonBadge')}
            </span>
          ) : null}
          {link.notice ? <span className="sr-only">. {link.notice}</span> : null}
        </span>
      )
    }

    if (link.isExternal) {
      return (
        <ExternalLink
          href={link.href}
          trackId={link.trackId}
          className={linkClasses(false, link.highlight)}
        >
          {link.label}
        </ExternalLink>
      )
    }

    return (
      <Link
        href={link.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        aria-label={link.ariaLabel}
        className={linkClasses(active, link.highlight)}
      >
        {link.label}
      </Link>
    )
  }

  return (
    <ul
      ref={containerRef}
      className={
        isMobile ? 'flex flex-col gap-1' : 'flex items-center gap-x-0.5'
      }
    >
      {items.map((item, index) => {
        const hasChildren = item.children.length > 0
        const panelId = `${baseId}-panel-${index}`
        const expanded = openIndex === index
        const active = isActive(pathname, item.canonicalPath)

        if (!hasChildren) {
          return (
            <li key={`${item.label}-${index}`} className={isMobile ? 'w-full' : undefined}>
              {renderLeaf(item, active)}
            </li>
          )
        }

        return (
          <li
            key={`${item.label}-${index}`}
            className={isMobile ? 'w-full' : 'relative'}
          >
            <button
              type="button"
              data-nav-trigger={index}
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setOpenIndex(expanded ? null : index)}
              className={`${linkClasses(active, false)} gap-1`}
            >
              {item.label}
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 16 16"
                width="0.8em"
                height="0.8em"
                className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m3.5 6 4.5 4.5L12.5 6"
                />
              </svg>
            </button>

            <ul
              id={panelId}
              hidden={!expanded}
              className={
                isMobile
                  ? 'ml-3 flex flex-col gap-1 border-l border-line pl-3'
                  : // Açılır menü de gölgesiz: opak zemin + belirgin çizgi ayrımı taşır.
                    'absolute left-0 top-full z-40 mt-1 flex min-w-64 flex-col gap-1 rounded-card border border-line-strong bg-surface p-2'
              }
            >
              {item.children.map((child, childIndex) => (
                <li key={`${child.label}-${childIndex}`}>
                  {renderLeaf(child, isActive(pathname, child.canonicalPath))}
                </li>
              ))}
            </ul>
          </li>
        )
      })}
    </ul>
  )
}

export default MainNav
