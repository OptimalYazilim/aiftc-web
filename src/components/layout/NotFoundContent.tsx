'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import React from 'react'

import { PageHero } from '@/components/ui/PageHero'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locales'
import { href } from '@/i18n/routes'

/**
 * 404 SAYFASININ GÖVDESİ — NEDEN İSTEMCİ BİLEŞENİ
 * ============================================================================
 * `not-found` dosyası `params` almaz. Sunucuda dili öğrenmenin tek yolu
 * next-intl'in `getLocale()`'u, o da istek dili önbellekte yoksa `headers()`
 * okur. Statik (ISR) üretilen bir rotada bu, ÜRETİMDE 500'e dönüştü
 * (ölçüldü, 2026-10: "Page changed from static to dynamic at runtime …
 * reason: headers"). Geliştirme kipinde statik kısıt olmadığı için görünmedi.
 *
 * Dil ve metinler burada dil katmanının `NextIntlClientProvider`ından okunur
 * (`useLocale`, `useTranslations`) — istek başlığına dokunulmaz; sayfa yine
 * sunucuda HTML olarak basılır.
 * ============================================================================
 */
export const NotFoundContent: React.FC = () => {
  const t = useTranslations('errors')
  const tn = useTranslations('nav')
  const etkin = useLocale()
  const locale = isLocale(etkin) ? etkin : DEFAULT_LOCALE

  const baglantilar = [
    { label: tn('home'), href: href('home', locale) },
    { label: tn('trainingPrograms'), href: href('training-programs', locale) },
    { label: tn('library'), href: href('library', locale) },
    { label: tn('news'), href: href('news', locale) },
    { label: tn('contact'), href: href('contact', locale) },
  ]

  return (
    <>
      <PageHero variant="record" eyebrow={t('notFoundEyebrow')} title={t('notFoundTitle')} intro={t('notFoundIntro')} />

      <div className="container-page section-block">
        <h2 className="text-xl font-bold tracking-tight text-ink-900">{t('notFoundLinksHeading')}</h2>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
          {baglantilar.map((baglanti) => (
            <li key={baglanti.href}>
              <Link
                href={baglanti.href}
                className="inline-flex min-h-11 items-center font-semibold text-brand-800 underline underline-offset-4 hover:text-brand-900 focus-visible:text-brand-900"
              >
                {baglanti.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default NotFoundContent
