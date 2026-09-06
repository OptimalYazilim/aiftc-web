'use client'

import { useTranslations } from 'next-intl'
import React, { useDeferredValue, useId, useMemo, useState } from 'react'

import { matchesQuery } from '@/lib/searchText'

import { LibraryResourceCard, type LibraryResourceItem } from './LibraryResourceCard'

/**
 * DİJİTAL KÜTÜPHANE — ARAMA VE FİLTRELER  (Şartname 6.6, 11.4)
 * ============================================================================
 * NEDEN İSTEMCİ TARAFINDA FİLTRELEME?
 * Eğitim kataloğuyla AYNI gerekçe (bkz. components/training/TrainingCatalog):
 * kütüphanede yüzler mertebesinde kayıt olur, binler değil. Tamamı tek
 * sorguda gelir, filtre tıklaması sunucuya gitmez, sonuç anında görünür ve
 * JavaScript kapalıyken sayfa yine TÜM kayıtları listeler.
 *
 * Kayıt sayısı birkaç bine ulaşırsa bu karar sunucu tarafı filtrelemeye
 * dönmelidir; sınır burada belgelenmiştir.
 *
 * ---------------------------------------------------------------------------
 * İKİ FİLTRE EKSENİ
 * ---------------------------------------------------------------------------
 *   Doküman türü  → "Tümü" dahil TEK SEÇİMLİ (radyo mantığı). Bir yayın aynı
 *                   anda hem rapor hem sunum olamaz; çoklu seçim sunmak
 *                   ziyaretçiye anlamsız bir özgürlük verirdi.
 *   Tematik alan  → ÇOK SEÇİMLİ (VEYA mantığı). Bir yayın birden fazla
 *                   konuya bağlı olabilir.
 *
 * Bu ayrım görsel olarak da işaretlenir: tür filtreleri tek sıra hâlinde bir
 * "sekme şeridi" gibi, tematik filtreler hap butonlar olarak dizilir.
 *
 * ERİŞİLEBİLİRLİK
 *   - Tür şeridi `role="tablist"` DEĞİLDİR: sekme deseni ok tuşlarıyla
 *     gezinme zorunluluğu doğurur ve içerik panelleri gerektirir. Burada
 *     `aria-pressed` taşıyan sıradan butonlar kullanılır (4.1.2).
 *   - Sonuç sayısı `aria-live="polite"` ile duyurulur (4.1.3).
 *   - Arama alanının GÖRÜNÜR etiketi vardır; yalnızca placeholder 3.3.2'yi
 *     karşılamaz.
 *   - Tüm hedefler ≥44px (2.5.8).
 * ============================================================================
 */

export type LibraryFilterOption = {
  value: string
  label: string
  count: number
}

type Props = {
  items: LibraryResourceItem[]
  types: LibraryFilterOption[]
  topics: LibraryFilterOption[]
}

/** Tür şeridi: tek seçimli, "Tümü" dahil. */
const TypeBar: React.FC<{
  legend: string
  allLabel: string
  allCount: number
  options: LibraryFilterOption[]
  selected: string | null
  onSelect: (value: string | null) => void
}> = ({ legend, allLabel, allCount, options, selected, onSelect }) => (
  <fieldset className="min-w-0">
    <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">
      {legend}
    </legend>
    <div className="flex flex-wrap gap-2">
      {[{ value: '', label: allLabel, count: allCount }, ...options].map((option) => {
        const value = option.value || null
        const isOn = selected === value
        return (
          <button
            key={option.value || 'all'}
            type="button"
            aria-pressed={isOn}
            onClick={() => onSelect(value)}
            className={`inline-flex min-h-11 items-center rounded-sm border px-4 text-sm font-semibold transition-colors ${
              isOn
                ? 'border-shell-900 bg-shell-900 text-white'
                : 'border-line-strong bg-surface text-shell-900 hover:border-brand-700 hover:text-brand-800'
            }`}
          >
            {option.label}
            <span className={`ml-2 font-normal ${isOn ? 'text-white/80' : 'text-ink-500'}`}>
              {option.count}
            </span>
          </button>
        )
      })}
    </div>
  </fieldset>
)

/** Tematik alanlar: çok seçimli hap butonlar. */
const TopicPills: React.FC<{
  legend: string
  options: LibraryFilterOption[]
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

export const LibraryCatalog: React.FC<Props> = ({ items, types, topics }) => {
  const t = useTranslations('library')

  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  const searchId = useId()

  /**
   * Yazarken her tuş vuruşunda tüm liste yeniden süzülür. `useDeferredValue`
   * bu işi düşük öncelikli hâle getirir: giriş alanı takılmaz, sonuçlar bir
   * adım geriden gelir.
   */
  const deferredQuery = useDeferredValue(query)

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (selectedType && item.resourceType !== selectedType) return false

      // Birden fazla konu seçiliyse "VEYA" mantığı: herhangi biri eşleşsin.
      if (selectedTopics.length > 0) {
        const ids = item.topicIds.map(String)
        if (!selectedTopics.some((topicId) => ids.includes(topicId))) return false
      }

      /*
        Arama başlık + özet + yazar + tür + konu adlarında yapılır. Yıl da
        dahildir: ziyaretçi "2026" yazdığında o yılın yayınlarını bulmalıdır,
        ayrı bir yıl filtresi sunulmasa bile.
      */
      return matchesQuery(deferredQuery, [
        item.title,
        item.description,
        item.author,
        item.resourceTypeLabel,
        item.publicationYear,
        ...item.topicTitles,
      ])
    })
  }, [items, deferredQuery, selectedType, selectedTopics])

  const hasFilters = query.length > 0 || selectedType !== null || selectedTopics.length > 0

  const clearAll = () => {
    setQuery('')
    setSelectedType(null)
    setSelectedTopics([])
  }

  return (
    <>
      {/* --- Anlık arama -------------------------------------------------- */}
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
          className="mt-2 min-h-12 w-full rounded-sm border border-line-strong bg-surface px-4 text-ink-900 placeholder:text-ink-500"
        />
      </div>

      {/* --- Filtre çubuğu ------------------------------------------------ */}
      <div className="mt-8 flex flex-col gap-6 border-t border-line pt-6">
        <TypeBar
          legend={t('filterByType')}
          allLabel={t('allTypes')}
          allCount={items.length}
          options={types}
          selected={selectedType}
          onSelect={setSelectedType}
        />

        {topics.length > 0 ? (
          <TopicPills
            legend={t('filterByTopic')}
            options={topics}
            selected={selectedTopics}
            onToggle={(value) =>
              setSelectedTopics((list) =>
                list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
              )
            }
          />
        ) : null}
      </div>

      {/* --- Sonuç sayısı -------------------------------------------------- */}
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

      {/* --- Liste --------------------------------------------------------- */}
      {filtered.length === 0 ? (
        <p className="mt-8 rounded-sm border border-line bg-surface-alt p-6 text-ink-700">
          {t('noResults')}
        </p>
      ) : (
        <ul className="mt-2 border-t border-line-soft">
          {filtered.map((item) => (
            <LibraryResourceCard
              key={String(item.id)}
              item={item}
              /*
                Etiketler kart bileşenine PROP olarak verilir, bileşen kendi
                `useTranslations`'ını çağırmaz. Sebep: kart hem burada hem
                ileride sunucu bileşenlerinden çağrılabilsin diye SAF tutulur
                (eğitim kartında da aynı kural uygulanıyor).
              */
              labels={{
                download: t('download'),
                watch: t('watch'),
                openAlbum: t('openAlbum'),
                openExternal: t('openExternal'),
                unavailable: t('fileUnavailable'),
                closeDialog: t('closeDialog'),
                downloadVideo: t('downloadVideo'),
                videoUnsupported: t('videoUnsupported'),
                formatLabel: t('formatLabel'),
                downloadsBadge: (count) => t('downloadsBadge', { count }),
                photoCount: (count) => t('photoCount', { count }),
                openAlbumWithCount: (count) => t('openAlbumWithCount', { count }),
                galleryPrevious: t('galleryPrevious'),
                galleryNext: t('galleryNext'),
                galleryCounter: (current, total) => t('galleryCounter', { current, total }),
                galleryDownloadImage: t('galleryDownloadImage'),
                galleryThumbnails: t('galleryThumbnails'),
              }}
            />
          ))}
        </ul>
      )}
    </>
  )
}

export default LibraryCatalog
