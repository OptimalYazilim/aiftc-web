'use client'

import React, { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import Link from 'next/link'

import { LOCALES, type Locale } from '@/i18n/locales'
import { usePathname, useRouter } from '@/i18n/routing'

/**
 * DİL DEĞİŞTİRİCİ  (Şartname 5: "Kullanıcı dil seçimi yapabilmelidir.")
 * ============================================================================
 * İKİ ÇALIŞMA BİÇİMİ VAR — sebebi slug'ların da yerelleştirilmiş olması:
 *
 * 1) `alternates` verildiğinde (detay sayfaları):
 *    Aynı kaydın diğer dildeki slug'ı zaten hesaplanmıştır
 *    (`getSlugAlternates`). Doğrudan o URL'e gidilir. Bir haberin TR slug'ı
 *    `orman-yangini-calistayi`, EN slug'ı `forest-fire-workshop` ise
 *    kullanıcı dili değiştirdiğinde doğru habere düşer, ana sayfaya değil.
 *
 * 2) `alternates` verilmediğinde (statik bölümler):
 *    next-intl'in kanonik yolu + router'ı kullanılır; bölüm segmenti
 *    otomatik yerelleştirilir.
 *
 * Erişilebilirlik: <nav aria-label> içinde bir liste. Seçili dil
 * `aria-current="true"` taşır. Her bağlantıda `lang` ve `hreflang`
 * bulunur ki ekran okuyucu doğru telaffuz motoruna geçsin — Kiril için
 * bu şart.
 * ============================================================================
 */

type Props = {
  /** Detay sayfalarından gelen, dile göre TAM yol haritası. */
  alternates?: Partial<Record<Locale, string>>
  className?: string
  /**
   * 'bar'     → koyu üst hizmet şeridi (varsayılan kurumsal yerleşim)
   * 'default' → açık zemin
   *
   * İki ayrı palet gerekiyor çünkü seçili dil, RENGİN YANI SIRA zeminle
   * arasındaki farkla da işaretleniyor; koyu şeritte açık zeminli bir
   * "seçili" rozeti kullanılırsa 1.4.11 sınırının altına düşüyordu.
   */
  variant?: 'default' | 'bar'
}

export const LanguageSwitcher: React.FC<Props> = ({ alternates, className, variant = 'default' }) => {
  const t = useTranslations('nav')
  const active = useLocale() as Locale
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  /**
   * next-intl'in `router.replace` imzası rota bazlı olarak tiplenir
   * (pathnames tablosundan türer). Burada rota çalışma anında belli olduğu
   * için gevşek bir imzaya daraltıyoruz. `@ts-expect-error` kullanılmıyor:
   * next-intl sürümü imzayı genişletirse o direktif kendisi hata üretirdi.
   */
  const replaceLocale = router.replace as unknown as (
    target: { pathname: string; params?: Record<string, string | string[]> },
    options: { locale: Locale },
  ) => void

  const switchTo = (locale: Locale) => {
    startTransition(() => {
      replaceLocale(
        {
          pathname: pathname as unknown as string,
          params: params as Record<string, string | string[]>,
        },
        { locale },
      )
    })
  }

  return (
    <nav aria-label={t('languageSwitcher')} className={className}>
      <ul className={variant === 'bar' ? 'flex items-center gap-0.5' : 'flex items-center gap-1'}>
        {LOCALES.map((locale) => {
          const current = locale.code === active
          const alternate = alternates?.[locale.code]

          const shared = {
            lang: locale.code,
            hrefLang: locale.hrefLang,
            'aria-current': current ? ('true' as const) : undefined,
            className: [
              // WCAG 2.2 — 2.5.8: koyu şeritte yükseklik 36px'e iner ama
              // aradaki 4px boşlukla birlikte etkin hedef 44px'i korur.
              variant === 'bar'
                ? 'inline-flex min-h-9 min-w-9 items-center justify-center rounded px-2 text-xs font-bold uppercase tracking-wide transition-colors'
                : 'inline-flex min-h-11 min-w-11 items-center justify-center rounded px-2.5 text-sm font-semibold uppercase transition-colors',
              variant === 'bar'
                ? current
                  ? // Seçili: beyaz dolgu + koyu metin. Ölçüm 17.6:1.
                    'bg-white text-shell-950'
                  : // Seçilmemiş: white/75 → shell-950 üzerinde 10.5:1.
                    'text-white/75 hover:bg-white/15 hover:text-white focus-visible:bg-white/15 focus-visible:text-white'
                : current
                  ? 'bg-brand-100 text-brand-900'
                  : 'text-ink-600 hover:bg-surface-alt hover:text-brand-800 focus-visible:bg-surface-alt focus-visible:text-brand-800',
              isPending ? 'opacity-70' : '',
            ].join(' '),
          }

          const label = (
            <>
              <span aria-hidden="true">{locale.code}</span>
              <span className="sr-only">{locale.label}</span>
            </>
          )

          return (
            <li key={locale.code}>
              {alternate ? (
                <Link href={alternate} {...shared}>
                  {label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => switchTo(locale.code)}
                  disabled={current || isPending}
                  {...shared}
                >
                  {label}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default LanguageSwitcher
