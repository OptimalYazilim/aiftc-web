'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useDeferredValue, useId, useMemo, useState } from 'react'

import type { Locale } from '@/i18n/locales'
import { TOPIC_PARAM } from '@/lib/catalogParams'
import { formatDate } from '@/lib/dates'
import { matchesQuery } from '@/lib/searchText'

import {
  ConsoleDivider,
  ConsoleSearch,
  FilterConsole,
  FilterGroup,
  FilterPill,
  ResultBar,
} from '../ui/FilterConsole'

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
      {/*
        --- FİLTRELEME KONSOLU ---------------------------------------------
        Görünüm artık ORTAK bileşenden gelir (components/ui/FilterConsole).
        Bu dosyada yalnızca HANGİ filtrelerin olduğu ve nasıl süzüldüğü
        durur; nasıl göründüğü kütüphane, takvim ve arama sayfalarıyla
        aynı yerden yönetilir.
      */}
      <FilterConsole label={t('filterHeading')}>
        <ConsoleSearch
          id={searchId}
          label={t('searchLabel')}
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={setQuery}
        />

        {topics.length > 0 || statuses.length > 0 ? (
          <ConsoleDivider>
            {topics.length > 0 ? (
              <FilterGroup legend={t('filterByTopic')}>
                {topics.map((option) => (
                  <FilterPill
                    key={option.value}
                    label={option.label}
                    count={option.count}
                    active={selectedTopics.includes(option.value)}
                    onClick={() => setSelectedTopics((list) => toggle(list, option.value))}
                  />
                ))}
              </FilterGroup>
            ) : null}

            {statuses.length > 0 ? (
              <FilterGroup legend={t('filterByStatus')}>
                {statuses.map((option) => (
                  <FilterPill
                    key={option.value}
                    label={option.label}
                    count={option.count}
                    active={selectedStatuses.includes(option.value)}
                    onClick={() => setSelectedStatuses((list) => toggle(list, option.value))}
                  />
                ))}
              </FilterGroup>
            ) : null}
          </ConsoleDivider>
        ) : null}
      </FilterConsole>

      <ResultBar
        count={t('resultsCount', { count: filtered.length })}
        onClear={hasFilters ? clearAll : null}
        clearLabel={t('clearFilters')}
      />

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
