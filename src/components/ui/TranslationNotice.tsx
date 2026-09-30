import { getTranslations } from 'next-intl/server'
import React from 'react'

import { DEFAULT_LOCALE, type Locale } from '@/i18n/locales'

/**
 * ÇEVİRİSİ EKSİK İÇERİK NOTU  (kurum kararı, 29.09.2026)
 * ============================================================================
 * Kurum, EN/RU sürümlerin Türkçenin BİREBİR karşılığı olmasını istedi.
 * Yerelleştirme `fallback: true` çalışır: çevrilmemiş bir alan o dilde boş
 * kalmaz, Türkçe aslı gösterilir (sayfa yarım görünmesin diye). Bu not, o
 * durumu okuyucudan GİZLEMEZ: İngilizce sayfada habersizce Türkçe paragraf
 * okuyan ziyaretçi bunun bir hata mı yoksa eksik çeviri mi olduğunu bilemez.
 *
 * Karar kaydın `translationStatus.missing` alanından okunur (lib/
 * translationStatus.ts — kaynak dilde dolu olup o dilde boş kalan alan).
 * Hangi alanın Türkçe kaldığı ayrıca bilinmediği için içerik tek tek
 * `lang="tr"` ile işaretlenemez; not bu yüzden sayfa düzeyindedir. Editör
 * paneldeki "Eksik Çeviriler" panosundan aynı listeyi görür.
 * ============================================================================
 */
export const TranslationNotice = async ({
  locale,
  status,
  className = '',
}: {
  locale: Locale
  /** Kaydın `translationStatus` alanı; bazı koleksiyonlarda JSON tipli olduğu için `unknown`. */
  status?: unknown
  className?: string
}) => {
  if (locale === DEFAULT_LOCALE) return null
  const eksik = (status as { missing?: unknown } | null | undefined)?.missing
  if (!Array.isArray(eksik) || !eksik.includes(locale)) return null

  const t = await getTranslations('common')
  /*
    Kendi kabı vardır: sayfaların gövdesi çoğunlukla bir ızgaradır ve not o
    ızgaranın içine girerse bir hücre kaplar. Hero ile gövde arasına,
    ızgaranın DIŞINA konur.
  */
  return (
    <div className={`container-page pt-8 ${className}`}>
      <p
        role="note"
        className="rounded-card border border-line bg-surface-alt px-4 py-3 text-sm text-ink-700"
      >
        {t('translationMissingNotice')}
      </p>
    </div>
  )
}

export default TranslationNotice
