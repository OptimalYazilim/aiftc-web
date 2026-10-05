'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import React, { useEffect } from 'react'

import { PageHero } from '@/components/ui/PageHero'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locales'
import { href } from '@/i18n/routes'

/**
 * BEKLENMEYEN HATA SAYFASI
 * ============================================================================
 * ÖLÇÜLEN EKSİK (2026-10 denetimi): bir sayfa çalışma anında hata verirse
 * (ör. veritabanı geçici olarak yanıt vermezse) Next'in genel, İngilizce
 * "Application error" ekranı çıkıyordu. Bu sınır `[locale]` katmanındadır:
 * menü ve alt bilgi yerinde kalır, yalnızca sayfa gövdesi bu mesajla
 * değişir.
 *
 * İstemci bileşenidir (Next'in kuralı): `reset` sayfayı yeniden çizmeyi
 * dener. Hatanın ayrıntısı ziyaretçiye GÖSTERİLMEZ — üretimde Next mesajı
 * zaten gizler; yalnızca sunucu günlüğüyle eşleştirilebilen `digest` kodu
 * basılır ki ziyaretçi bildirirken personel kaydı bulabilsin.
 *
 * Dil katmanının KENDİ hatası (layout.tsx) bu sınıra düşmez; o durum için
 * kök `global-error` gerekir ve bu projede yoktur.
 * ============================================================================
 */
export default function HataSayfasi({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('errors')
  const etkin = useLocale()
  const locale = isLocale(etkin) ? etkin : DEFAULT_LOCALE

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <>
      <PageHero variant="record" eyebrow={t('errorEyebrow')} title={t('errorTitle')} intro={t('errorIntro')} />

      <div className="container-page section-block">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-11 items-center justify-center rounded bg-brand-800 px-5 font-semibold text-white hover:bg-brand-900 focus-visible:bg-brand-900"
          >
            {t('errorRetry')}
          </button>
          <Link
            href={href('home', locale)}
            className="inline-flex min-h-11 items-center font-semibold text-brand-800 underline underline-offset-4 hover:text-brand-900 focus-visible:text-brand-900"
          >
            {t('backHome')}
          </Link>
        </div>
        {error.digest ? <p className="mt-6 text-sm text-ink-600">{t('errorReference', { code: error.digest })}</p> : null}
      </div>
    </>
  )
}
