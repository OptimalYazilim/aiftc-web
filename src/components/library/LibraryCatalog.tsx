'use client'

import { useTranslations } from 'next-intl'
import React, { useDeferredValue, useId, useMemo, useState } from 'react'

import type { Locale } from '@/i18n/locales'
import { matchesQuery } from '@/lib/searchText'

import {
  ConsoleDivider,
  ConsoleSearch,
  FilterConsole,
  FilterGroup,
  FilterPill,
  ResultBar,
} from '../ui/FilterConsole'

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
  /** Kartın künye sayfası adresini üretebilmesi için gerekir. */
  locale: Locale
}

export const LibraryCatalog: React.FC<Props> = ({ items, types, topics, locale }) => {
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
      {/*
        --- FİLTRELEME KONSOLU ---------------------------------------------
        Görünüm ortak bileşenden gelir (components/ui/FilterConsole); eğitim
        kataloğu, takvim ve arama sayfalarıyla AYNI yüzeydir. Bu dosyada
        yalnızca kütüphaneye özgü filtre mantığı kalır.

        TÜR filtresi TEK SEÇİMLİDİR (bir kaynak aynı anda hem video hem
        rapor olamaz); tematik alanlar ÇOK SEÇİMLİ. Fark hapların
        görünümünde değil, tıklama davranışındadır: türde seçim değişir,
        konuda eklenir/çıkarılır.
      */}
      <FilterConsole label={t('filterHeading')}>
        <ConsoleSearch
          id={searchId}
          label={t('searchLabel')}
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={setQuery}
        />

        <ConsoleDivider>
          <FilterGroup legend={t('filterByType')}>
            {[{ value: '', label: t('allTypes'), count: items.length }, ...types].map((option) => {
              const value = option.value || null
              return (
                <FilterPill
                  key={option.value || 'all'}
                  label={option.label}
                  count={option.count}
                  active={selectedType === value}
                  onClick={() => setSelectedType(value)}
                />
              )
            })}
          </FilterGroup>

          {topics.length > 0 ? (
            <FilterGroup legend={t('filterByTopic')}>
              {topics.map((option) => (
                <FilterPill
                  key={option.value}
                  label={option.label}
                  count={option.count}
                  active={selectedTopics.includes(option.value)}
                  onClick={() =>
                    setSelectedTopics((list) =>
                      list.includes(option.value)
                        ? list.filter((item) => item !== option.value)
                        : [...list, option.value],
                    )
                  }
                />
              ))}
            </FilterGroup>
          ) : null}
        </ConsoleDivider>
      </FilterConsole>

      <ResultBar
        count={t('resultsCount', { count: filtered.length })}
        onClear={hasFilters ? clearAll : null}
        clearLabel={t('clearFilters')}
      />

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
              locale={locale}
              /*
                Etiketler kart bileşenine PROP olarak verilir, bileşen kendi
                useTranslations çağrısını yapmaz. Sebep: kart hem burada hem
                ileride sunucu bileşenlerinden çağrılabilsin diye SAF tutulur
                (eğitim kartında da aynı kural uygulanıyor). Kart artık pencere
                açmadığı için liste ÜÇ etikete inmiştir; oynatıcı ve albüm
                etiketleri künye sayfasında toplanır.
              */
              labels={{
                viewRecord: t('viewRecord'),
                downloadsBadge: (count) => t('downloadsBadge', { count }),
                photoCount: (count) => t('photoCount', { count }),
              }}
            />
          ))}
        </ul>
      )}
    </>
  )
}

export default LibraryCatalog
