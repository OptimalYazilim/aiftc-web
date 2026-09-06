import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { CookieBanner } from '@/components/layout/CookieBanner'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { buildAlternates, getLocaleMeta, isLocale, LOCALE_CODES } from '@/i18n/locales'
import { pageHref } from '@/i18n/routes'
import { getSiteSettings } from '@/lib/queries'

import '../globals.css'

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }))
}

/**
 * Yazı tipi build sırasında indirilip kendi origin'imizden servis edilir.
 * Çalışma anında Google'a istek gitmez — ziyaretçinin IP'si üçüncü tarafa
 * ulaşmaz (Şartname 12.2 / 12.3, KVKK–GDPR).
 * `cyrillic` alt kümesi Rusça içerik için ZORUNLUDUR.
 */
const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
})

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

/**
 * Uluslararası SEO (Şartname 3.5): her sayfa üç dilin tamamına hreflang
 * verir ve x-default varsayılan dile işaret eder.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const settings = await getSiteSettings(locale)
  const siteName = (settings as { siteName?: string }).siteName ?? 'AIFTC'
  const description = (settings as { defaultDescription?: string }).defaultDescription

  return {
    title: { default: siteName, template: `%s | ${(settings as { siteShortName?: string }).siteShortName ?? 'AIFTC'}` },
    description,
    alternates: buildAlternates({ tr: '', en: '', ru: '' }),
    openGraph: {
      siteName,
      locale: getLocaleMeta(locale).hrefLang.replace('-', '_'),
      type: 'website',
    },
    robots: { index: true, follow: true },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  // Statik üretimin çalışabilmesi için istek dilini sabitle.
  setRequestLocale(locale)

  const meta = getLocaleMeta(locale)
  const [messages, t, settings] = await Promise.all([
    getMessages(),
    getTranslations('nav'),
    getSiteSettings(locale),
  ])

  const cookieBanner = (settings as {
    cookieBanner?: {
      enabled?: boolean | null
      text?: string | null
      allowPreferenceManagement?: boolean | null
      policyPage?: { slug?: string | null } | number | null
    }
  }).cookieBanner

  const policySlug =
    cookieBanner?.policyPage && typeof cookieBanner.policyPage === 'object'
      ? cookieBanner.policyPage.slug
      : null

  return (
    <html lang={meta.hrefLang} dir={meta.direction} className={inter.variable}>
      <body className="flex min-h-dvh flex-col bg-canvas font-sans">
        <NextIntlClientProvider messages={messages}>
          {/* WCAG 2.2 — 2.4.1 Blokları Atlama. DOM'daki ilk odaklanabilir öğe. */}
          <a href="#main-content" className="skip-link">
            {t('skipToContent')}
          </a>

          <SiteHeader locale={locale} />

          {/* tabIndex={-1}: atlama bağlantısı odağı buraya taşıyabilsin diye. */}
          <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>

          <SiteFooter locale={locale} />

          {/* DOM'da en sonda: klavye sırasını kesmez (WCAG 2.4.3). */}
          <CookieBanner
            enabled={cookieBanner?.enabled !== false}
            text={cookieBanner?.text}
            showPreferences={cookieBanner?.allowPreferenceManagement !== false}
            policyHref={policySlug ? pageHref(locale, policySlug) : null}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
