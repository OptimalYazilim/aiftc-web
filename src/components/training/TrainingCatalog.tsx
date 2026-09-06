'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useDeferredValue, useId, useMemo, useState } from 'react'

import type { Locale } from '@/i18n/locales'
import { TOPIC_PARAM } from '@/lib/catalogParams'
import { formatDate } from '@/lib/dates'
import { matchesQuery } from '@/lib/searchText'

import { TrainingCard, type TrainingCardItem } from './TrainingCard'

/**
 * EĞİTİM KATALOĞU — ARAMA VE FİLTRELER  (Şartname 6.4, 11.4)
 * ============================================================================
 * NEDEN İSTEMCİ TARAFINDA FİLTRELEME?
 * Merkezin yayımladığı eğitim sayısı yüzler mertebesindedir, binler değil.
 * Tamamı tek sorguda gelir ve filtreleme tarayıcıda yapılır. Kazanç:
 *   - Her filtre tıklamasında sunucuya gidilmez; sonuç ANINDA gelir.
 *   - Neon'a giden sorgu sayısı sabit kalır (Şartname 14.1).
 *   - Sayfa, JavaScript kapalıyken de TÜM eğitimleri listeler; filtreler
 *     kaybolur ama içerik erişilebilir kalır (aşamalı geliştirme).
 * Liste birkaç bin kayda ulaşırsa bu karar sunucu tarafı filtrelemeye
 * dönmelidir; sınır burada belgelenmiştir.
 *
 * ERİŞİLEBİLİRLİK
 *   - Filtreler `aria-pressed` taşıyan gerçek `<button>`lardır: ekran okuyucu
 *     açık/kapalı durumu duyurur (WCAG 2.2 — 4.1.2).
 *   - Sonuç sayısı `aria-live="polite"` ile duyurulur; görme engelli kullanıcı
 *     filtrenin işe yaradığını fark eder (4.1.3 Durum Mesajları).
 *   - Arama alanının GÖRÜNÜR etiketi vardır; yalnızca placeholder kullanmak
 *     3.3.2'yi karşılamaz.
 *   - Tüm hedefler ≥44px (2.5.8).
 * ============================================================================
 */

export type CatalogTraining = TrainingCardItem & {
  code?: string | null
  venue?: string | null
  deliveryMode?: string | null
  deliveryModeLabel?: string | null
  levelLabel?: string | null
  applicationDeadline?: string | null
  /** Kontenjan — kart altında "24 kişilik kontenjan" olarak gösterilir. */
  quota?: number | null
  /** Filtreleme için konu id'leri. */
  topicIds: (string | number)[]
  /**
   * Aramaya dahil edilen konu adları. Ziyaretçi "iklim" yazdığında, başlığında
   * bu kelime geçmese bile o konuya bağlı eğitimler bulunmalıdır — konu
   * filtresini ayrıca açması beklenmez.
   */
  topicTitles: string[]
}

export type CatalogFilterOption = {
  value: string
  label: string
  /** Bu seçeneğe karşılık gelen eğitim sayısı; sıfırsa buton gösterilmez. */
  count: number
  /** Konu filtrelerinde URL'den önseçim için; durum filtrelerinde yoktur. */
  slug?: string | null
}


type Props = {
  locale: Locale
  items: CatalogTraining[]
  topics: CatalogFilterOption[]
  statuses: CatalogFilterOption[]
}

const FilterGroup: React.FC<{
  legend: string
  options: CatalogFilterOption[]
  selected: string[]
  onToggle: (value: string) => void
}> = ({ legend, options, selected, onToggle }) => (
  <fieldset className="min-w-0">
    <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">
      {legend}
    </legend>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isOn = selected.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isOn}
            onClick={() => onToggle(option.value)}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors ${
              isOn
                ? 'border-brand-800 bg-brand-800 text-white'
                : 'border-line-strong bg-surface text-ink-700 hover:border-brand-700 hover:text-brand-800'
            }`}
          >
            {option.label}
            <span className={`ml-2 ${isOn ? 'text-white/80' : 'text-ink-500'}`}>
              {option.count}
            </span>
          </button>
        )
      })}
    </div>
  </fieldset>
)

export const TrainingCatalog: React.FC<Props> = ({ locale, items, topics, statuses }) => {
  const t = useTranslations('catalog')
  const tt = useTranslations('training')
  // Kontenjan metni takvim sözlüğünde tanımlı; iki yerde ayrı çeviri tutulmaz.
  const tc = useTranslations('calendar')

  const searchParams = useSearchParams()

  /**
   * Adresteki `?konu=slug` konu filtresini ÖNSEÇER (footer bağlantıları).
   * Yalnızca ilk render'da okunur: sonrasında filtreler kullanıcının
   * denetimindedir, adres değişikliği seçimi geri almaz.
   *
   * Bilinmeyen bir slug gelirse sessizce yok sayılır — bozuk bir bağlantı
   * boş sonuç listesi değil, filtresiz katalog gösterir.
   */
  const initialTopics = useMemo(() => {
    const raw = searchParams.get(TOPIC_PARAM)
    if (!raw) return []

    const wanted = new Set(raw.split(',').map((value) => value.trim()))
    return topics.filter((topic) => topic.slug && wanted.has(topic.slug)).map((t) => t.value)
    // Yalnızca ilk değer için; bağımlılıklar bilerek dışarıda bırakılmadı,
    // `useState` başlangıç değeri olarak bir kez kullanılıyor.
  }, [searchParams, topics])

  const [query, setQuery] = useState('')
  const [selectedTopics, setSelectedTopics] = useState<string[]>(initialTopics)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  const searchId = useId()

  /**
   * Yazarken her tuş vuruşunda tüm liste yeniden süzülür. `useDeferredValue`
   * bu işi düşük öncelikli hale getirir: giriş alanı takılmadan yazmayı
   * sürdürür, sonuçlar bir adım geriden gelir.
   */
  const deferredQuery = useDeferredValue(query)

  const toggle = (list: string[], value: string): string[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

  const filtered = useMemo(() => {
    return items.filter((item) => {
      // Birden fazla konu seçiliyse "VEYA" mantığı: herhangi biri eşleşsin.
      if (selectedTopics.length > 0) {
        const ids = item.topicIds.map(String)
        if (!selectedTopics.some((topicId) => ids.includes(topicId))) return false
      }

      if (selectedStatuses.length > 0 && !selectedStatuses.includes(item.status ?? '')) {
        return false
      }

      return matchesQuery(deferredQuery, [
        item.title,
        item.summary,
        item.code,
        item.venue,
        ...item.topicTitles,
      ])
    })
  }, [items, deferredQuery, selectedTopics, selectedStatuses])

  const hasFilters = query.length > 0 || selectedTopics.length > 0 || selectedStatuses.length > 0

  const clearAll = () => {
    setQuery('')
    setSelectedTopics([])
    setSelectedStatuses([])
  }

  return (
    <>
      {/* --- Arama ------------------------------------------------------- */}
      <div className="max-w-xl">
        <label htmlFor={searchId} className="block text-sm font-semibold text-ink-700">
          {t('searchLabel')}
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('searchPlaceholder')}
          className="mt-2 min-h-11 w-full rounded-card border border-line-strong bg-surface px-4 text-ink-900 placeholder:text-ink-500"
        />
      </div>

      {/* --- Filtreler --------------------------------------------------- */}
      <div className="mt-8 flex flex-col gap-6 border-t border-line pt-6 lg:flex-row lg:gap-10">
        {topics.length > 0 ? (
          <FilterGroup
            legend={t('filterByTopic')}
            options={topics}
            selected={selectedTopics}
            onToggle={(value) => setSelectedTopics((list) => toggle(list, value))}
          />
        ) : null}

        {statuses.length > 0 ? (
          <FilterGroup
            legend={t('filterByStatus')}
            options={statuses}
            selected={selectedStatuses}
            onToggle={(value) => setSelectedStatuses((list) => toggle(list, value))}
          />
        ) : null}
      </div>

      {/* --- Sonuç sayısı ------------------------------------------------ */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p aria-live="polite" className="text-ink-600">
          {t('resultsCount', { count: filtered.length })}
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex min-h-11 items-center text-brand-800 underline underline-offset-4"
          >
            {t('clearFilters')}
          </button>
        ) : null}
      </div>

      {/* --- Kartlar ----------------------------------------------------- */}
      {filtered.length === 0 ? (
        <p className="mt-8 rounded-card border border-line bg-surface-alt p-6 text-ink-700">
          {t('noResults')}
        </p>
      ) : (
        <ul className="mt-8 grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const deadline = formatDate(locale, item.applicationDeadline)

            return (
              <TrainingCard
                key={String(item.id)}
                locale={locale}
                item={item}
                statusPrefix={tt('statusLabel')}
                detailLabel={tt('viewDetails')}
                footer={
                  <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-600">
                    {item.deliveryModeLabel ? (
                      <div className="flex gap-1">
                        <dt className="sr-only">{tt('deliveryMode')}</dt>
                        <dd>{item.deliveryModeLabel}</dd>
                      </div>
                    ) : null}
                    {item.venue ? (
                      <div className="flex gap-1">
                        <dt className="sr-only">{tt('venue')}</dt>
                        <dd>{item.venue}</dd>
                      </div>
                    ) : null}
                    {deadline ? (
                      <div className="flex gap-1">
                        <dt>{tt('deadline')}:</dt>
                        <dd>{deadline}</dd>
                      </div>
                    ) : null}
                    {/*
                      KONTENJAN — sayı tek başına anlamsızdır ("24"), birimiyle
                      basılır. Girilmemiş veya sıfır kontenjan HİÇ gösterilmez:
                      "0 kişilik kontenjan" eğitimin kapalı olduğu izlenimi
                      verirdi.
                    */}
                    {Number(item.quota) > 0 ? (
                      <div className="flex gap-1">
                        <dt className="sr-only">{tt('quota')}</dt>
                        <dd>{tc('quotaValue', { count: Number(item.quota) })}</dd>
                      </div>
                    ) : null}
                  </dl>
                }
              />
            )
          })}
        </ul>
      )}
    </>
  )
}

export default TrainingCatalog
