'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

/**
 * BAŞLIK KABUĞU (istemci bileşeni)
 * ============================================================================
 * ÇİFT KATMANLI KURUMSAL HEADER
 *
 *   1. Üst şerit (`topBar`)  — ince, koyu; kardeş portallar, dil, arama.
 *      Mobilde de görünür kalır: dil seçimi kurumsal bir portalda mobil
 *      menünün ARKASINA saklanmamalıdır (Şartname 5).
 *   2. Ana header             — geniş beyaz zemin; solda kurum kimliği ve
 *      ortak logoları, sağda ana menü.
 *
 * Menü masaüstünde marka bloğunun SAĞINA, aynı satıra alınır. Önceki
 * sürümde marka üstte, menü altta ayrı bir satırdaydı; iki tam genişlik
 * şeridi header'ı gereksiz yükseltiyor ve içeriği aşağı itiyordu.
 *
 * Yalnızca mobil menünün açık/kapalı durumu burada yönetilir. İçerik
 * (marka, menü, dil değiştirici) sunucudan `children` olarak gelir —
 * böylece CMS verisi istemci paketine girmez.
 *
 * Erişilebilirlik:
 *  - Mobil tetikleyici <button aria-expanded aria-controls>, disclosure deseni.
 *  - Panel açıkken Escape kapatır ve odak butona döner.
 *  - Panel açıkken gövde kaydırması kilitlenir; kilit kapanışta MUTLAKA
 *    geri alınır (aksi halde klavye kullanıcısı sayfada mahsur kalır).
 *  - `<header>` landmark'ı ve `<nav aria-label>` ile bölge etiketlenir.
 * ============================================================================
 */

type Props = {
  brand: React.ReactNode
  nav: React.ReactNode
  mobileNav: React.ReactNode
  topBar: React.ReactNode
  /**
   * YALNIZCA mobil menü panelinde görünen ek blok (kardeş portallar).
   * Masaüstünde bu bağlantılar üst hizmet şeridinde durduğu için burada
   * ikinci kez basılmaz — aynı bağlantının iki odak durağı olmaz.
   */
  mobileUtility?: React.ReactNode
}

export const HeaderShell: React.FC<Props> = ({ brand, nav, mobileNav, topBar, mobileUtility }) => {
  const t = useTranslations('nav')
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    /*
      ODAK PANELE ALINIR  (Kontrol Listesi 57 · 62)
      Panel açıldığında odak ilk bağlantıya taşınır. Alınmasaydı klavye
      kullanıcısı menüyü AÇAR ama odak düğmede kalırdı; Tab'a bastığında
      panelin içine girer — bu çalışır ama ekran okuyucu "menü açıldı"
      bilgisini içeriğe bağlayamaz.

      `preventScroll`: panel zaten başlığın hemen altındadır; kaydırma isteği
      sayfayı oynatır ve kullanıcı menüyü açar açmaz yerini kaybeder.
    */
    const ilkBaglanti = panelRef.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled])',
    )
    ilkBaglanti?.focus({ preventScroll: true })

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow

      /*
        ODAK GERİ VERİLİR — YALNIZCA PANELİN İÇİNDEYSE.
        Panel `hidden` olunca içindeki odaklı öğe erişilemez hâle gelir ve
        tarayıcı odağı `<body>`ye düşürür: Tab'a basan kullanıcı sayfanın en
        başına döner. Koşul önemlidir — kullanıcı paneli kapatmadan önce
        sayfadaki başka bir yere tıkladıysa odağı ondan ÇALMAMALIYIZ.
      */
      const odak = document.activeElement
      if (odak && panelRef.current?.contains(odak)) {
        triggerRef.current?.focus({ preventScroll: true })
      }
    }
  }, [open])

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface">
      {/* --- 1) Üst hizmet şeridi ---------------------------------------- */}
      {topBar}

      {/* --- 2) Ana header ------------------------------------------------ */}
      <div className="container-page flex items-center justify-between gap-6 py-3 lg:gap-10 lg:py-4">
        {brand}

        {/*
          Masaüstü menüsü marka bloğunun sağında, aynı hizada. `justify-end`
          ile sağa yaslanır; kurum adı ne kadar uzun olursa olsun menü sağ
          kenarda sabit kalır.
        */}
        <nav
          aria-label={t('mainMenu')}
          className="hidden flex-1 items-center justify-end gap-4 lg:flex"
        >
          {nav}
        </nav>

        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded border border-line-strong px-3 font-medium text-ink-700 lg:hidden"
        >
          <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20" width="20" height="20">
            {open ? (
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="m4 4 12 12M16 4 4 16"
              />
            ) : (
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M3 5h14M3 10h14M3 15h14"
              />
            )}
          </svg>
          {open ? t('close') : t('menu')}
        </button>
      </div>

      {/* --- Mobil menü paneli -------------------------------------------- */}
      <div
        ref={panelRef}
        id={panelId}
        hidden={!open}
        className="max-h-[calc(100dvh-6rem)] overflow-y-auto border-t border-line bg-surface lg:hidden"
      >
        <nav aria-label={t('mainMenu')} className="container-page py-3">
          {mobileNav}
          {mobileUtility ? (
            <div className="mt-3 border-t border-line pt-3">{mobileUtility}</div>
          ) : null}
        </nav>
      </div>
    </header>
  )
}

export default HeaderShell
