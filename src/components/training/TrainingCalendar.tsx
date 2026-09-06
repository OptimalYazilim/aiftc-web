'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import type { Locale } from '@/i18n/locales'
import { detailHref } from '@/i18n/routes'
import { formatDayRange, formatMonthKey, monthKey } from '@/lib/dates'
import { trainingStatusClasses, trainingStatusLabel } from '@/lib/trainingStatus'

/**
 * EĞİTİM TAKVİMİ — SÜZME VE ZAMAN ÇİZELGESİ  (Şartname 6.4 / EK-2 2.2)
 * ============================================================================
 * Eğitimler başlangıç tarihine göre KRONOLOJİK sıralanır ve YIL → AY olarak
 * gruplanır; üstünde yıl / ay / tematik konu süzgeçleri bulunur.
 *
 * ---------------------------------------------------------------------------
 * NEDEN TABLO DEĞİL, BAŞLIKLI LİSTE
 * ---------------------------------------------------------------------------
 * Bir takvim ızgarası (7 sütunlu ay görünümü) burada yanlış araç olurdu:
 * kayıtlar tek güne değil, günlerce süren ARALIKLARA yayılır; ızgarada bir
 * eğitim aynı anda 12 hücreyi kaplar ve ekran okuyucuda anlamsızlaşır.
 * Başlıklı liste (h2 = yıl, h3 = ay) hem görsel hem işitsel olarak aynı
 * hiyerarşiyi verir ve klavyeyle gezilebilir (WCAG 2.2 — 1.3.1, 2.4.10).
 *
 * ---------------------------------------------------------------------------
 * NEDEN İSTEMCİ TARAFINDA SÜZME
 * ---------------------------------------------------------------------------
 * Katalog ve kütüphaneyle AYNI gerekçe: merkezin yayımladığı eğitim sayısı
 * yüzler mertebesindedir. Tamamı tek sorguda gelir, süzme tarayıcıda yapılır;
 * her tıklamada sunucuya gidilmez ve JavaScript kapalıyken sayfa yine TÜM
 * takvimi listeler (süzgeçler kaybolur, içerik erişilebilir kalır).
 *
 * ---------------------------------------------------------------------------
 * SÜZGEÇ MANTIĞI
 * ---------------------------------------------------------------------------
 *   Yıl   → TEK SEÇİM. Bir eğitim iki yıla ait olamaz.
 *   Ay    → TEK SEÇİM ve YILA BAĞLI. Yıl seçilmemişken ay etiketleri yılı da
 *           taşır ("Ekim 2026"), çünkü "Ekim" tek başına iki farklı yıla ait
 *           iki ayrı grubu işaret ederdi. Yıl seçilince etiket sadeleşir.
 *           Yıl değişince ay seçimi SIFIRLANIR — aksi hâlde 2027 seçilip
 *           2026'nın ayı seçili kalır ve liste sessizce boşalırdı.
 *   Konu  → ÇOK SEÇİM, "VEYA" mantığı. Bir eğitim birden fazla konuya bağlıdır.
 *
 * ERİŞİLEBİLİRLİK
 *   - Süzgeçler `aria-pressed` taşıyan gerçek `<button>`lardır (4.1.2).
 *   - Sonuç sayısı `aria-live="polite"` ile duyurulur (4.1.3).
 *   - Tüm hedefler ≥44px (2.5.8).
 *   - Durum rozeti renge EK OLARAK metin taşır (1.4.1).
 * ============================================================================
 */

export type TimelineTraining = {
  id: string | number
  title?: string | null
  slug?: string | null
  status?: string | null
  startDate?: string | null
  endDate?: string | null
  /** Ziyaretçinin dilinde çözülmüş katılım biçimi etiketi. */
  deliveryModeLabel?: string | null
  venue?: string | null
  /** Kontenjan — kartta "24 kişilik kontenjan" olarak gösterilir. */
  quota?: number | null
  /** Süzme için konu id'leri. */
  topicIds: (string | number)[]
  topicTitles: string[]
}

export type CalendarTopicOption = {
  value: string
  label: string
  count: number
}

type Props = {
  locale: Locale
  items: TimelineTraining[]
  topics: CalendarTopicOption[]
}

type MonthGroup = { key: string; items: TimelineTraining[] }
type YearGroup = { year: string; months: MonthGroup[] }

/**
 * Düz listeyi yıl → ay ağacına çevirir.
 * Giriş listesi ZATEN sıralı gelir (sorgu `startDate` artan); gruplama sırayı
 * korur, yeniden sıralamaz.
 */
export const groupByMonth = (items: TimelineTraining[]): YearGroup[] => {
  const years = new Map<string, Map<string, TimelineTraining[]>>()

  for (const item of items) {
    const key = monthKey(item.startDate)
    if (!key) continue // Tarihi bozuk kayıt takvime girmez.

    const year = key.slice(0, 4)
    const months = years.get(year) ?? new Map<string, TimelineTraining[]>()
    const bucket = months.get(key) ?? []

    bucket.push(item)
    months.set(key, bucket)
    years.set(year, months)
  }

  return [...years.entries()].map(([year, months]) => ({
    year,
    months: [...months.entries()].map(([key, monthItems]) => ({ key, items: monthItems })),
  }))
}

/** Süzgeç düğmesi — üç eksende de aynı görünüm. */
const FilterChip: React.FC<{
  active: boolean
  onClick: () => void
  children: React.ReactNode
  count?: number
  /** Tek seçimli eksenler köşeli, çok seçimli eksen hap biçiminde. */
  shape?: 'square' | 'pill'
}> = ({ active, onClick, children, count, shape = 'square' }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`inline-flex min-h-11 items-center border px-4 text-sm font-semibold transition-colors ${
      shape === 'pill' ? 'rounded-full font-medium' : 'rounded-sm'
    } ${
      active
        ? 'border-shell-900 bg-shell-900 text-white'
        : 'border-line-strong bg-surface text-shell-900 hover:border-brand-700 hover:text-brand-800'
    }`}
  >
    {children}
    {typeof count === 'number' ? (
      <span className={`ml-2 font-normal ${active ? 'text-white/80' : 'text-ink-500'}`}>
        {count}
      </span>
    ) : null}
  </button>
)

export const TrainingCalendar: React.FC<Props> = ({ locale, items, topics }) => {
  const t = useTranslations('calendar')
  const tt = useTranslations('training')

  const [year, setYear] = useState<string | null>(null)
  const [month, setMonth] = useState<string | null>(null)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  /** Verideki yıllar — sabit değil, kayıtlardan türer. */
  const years = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of items) {
      const key = monthKey(item.startDate)
      if (!key) continue
      const y = key.slice(0, 4)
      counts.set(y, (counts.get(y) ?? 0) + 1)
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [items])

  /**
   * Ay seçenekleri SEÇİLİ YILA GÖRE daralır. Yıl seçilmemişken tüm yıl-ay
   * anahtarları listelenir ve etiket yılı da taşır.
   */
  const months = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of items) {
      const key = monthKey(item.startDate)
      if (!key) continue
      if (year && key.slice(0, 4) !== year) continue
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [items, year])

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const key = monthKey(item.startDate)
        if (!key) return false

        if (year && key.slice(0, 4) !== year) return false
        if (month && key !== month) return false

        if (selectedTopics.length > 0) {
          const ids = item.topicIds.map(String)
          if (!selectedTopics.some((id) => ids.includes(id))) return false
        }

        return true
      }),
    [items, year, month, selectedTopics],
  )

  const groups = groupByMonth(filtered)
  const hasFilters = year !== null || month !== null || selectedTopics.length > 0

  const clearAll = () => {
    setYear(null)
    setMonth(null)
    setSelectedTopics([])
  }

  /** Yıl değişince ay seçimi düşer (bkz. dosya başındaki süzgeç notu). */
  const pickYear = (next: string | null) => {
    setYear(next)
    setMonth(null)
  }

  return (
    <>
      {/* --- Süzgeç çubuğu ------------------------------------------------ */}
      <div className="flex flex-col gap-6 border-b border-line pb-6">
        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">
            {t('filterByYear')}
          </legend>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={year === null} onClick={() => pickYear(null)} count={items.length}>
              {t('allYears')}
            </FilterChip>
            {years.map(([value, count]) => (
              <FilterChip
                key={value}
                active={year === value}
                onClick={() => pickYear(value)}
                count={count}
              >
                {value}
              </FilterChip>
            ))}
          </div>
        </fieldset>

        {months.length > 1 ? (
          <fieldset className="min-w-0">
            <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">
              {t('filterByMonth')}
            </legend>
            <div className="flex flex-wrap gap-2">
              <FilterChip active={month === null} onClick={() => setMonth(null)}>
                {t('allMonths')}
              </FilterChip>
              {months.map(([key, count]) => {
                /*
                  Yıl seçiliyken etiket sadeleşir ("Ekim"); seçili değilken
                  yılı taşır ("Ekim 2026") — aksi hâlde iki farklı yılın aynı
                  ayı ayırt edilemezdi.
                */
                const label = formatMonthKey(locale, key)
                return (
                  <FilterChip
                    key={key}
                    active={month === key}
                    onClick={() => setMonth(key)}
                    count={count}
                  >
                    {year ? label.replace(` ${year}`, '') : label}
                  </FilterChip>
                )
              })}
            </div>
          </fieldset>
        ) : null}

        {topics.length > 0 ? (
          <fieldset className="min-w-0">
            <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">
              {t('filterByTopic')}
            </legend>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <FilterChip
                  key={topic.value}
                  shape="pill"
                  active={selectedTopics.includes(topic.value)}
                  onClick={() =>
                    setSelectedTopics((list) =>
                      list.includes(topic.value)
                        ? list.filter((v) => v !== topic.value)
                        : [...list, topic.value],
                    )
                  }
                  count={topic.count}
                >
                  {topic.label}
                </FilterChip>
              ))}
            </div>
          </fieldset>
        ) : null}
      </div>

      {/* --- Sonuç sayısı -------------------------------------------------- */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
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

      {groups.length === 0 ? (
        <p className="mt-8 rounded-card border border-line bg-surface-alt p-6 text-ink-700">
          {hasFilters ? t('noResults') : t('empty')}
        </p>
      ) : (
        <div className="mt-8 space-y-14">
          {groups.map((group) => (
            <section key={group.year} aria-labelledby={`yil-${group.year}`}>
              {/* `scroll-mt`: yapışkan başlık, hedefe atlarken yılı örtmesin. */}
              <h2
                id={`yil-${group.year}`}
                className="scroll-mt-24 border-b-2 border-brand-700 pb-2 text-2xl font-bold sm:text-3xl"
              >
                {group.year}
              </h2>

              <div className="mt-8 space-y-10">
                {group.months.map((monthGroup) => (
                  <section key={monthGroup.key} aria-labelledby={`ay-${monthGroup.key}`}>
                    <h3
                      id={`ay-${monthGroup.key}`}
                      className="text-lg font-semibold uppercase tracking-wide text-ink-600"
                    >
                      {formatMonthKey(locale, monthGroup.key)}
                    </h3>

                    <ul className="mt-4 border-t border-line">
                      {monthGroup.items.map((item) => (
                        <CalendarRow
                          key={String(item.id)}
                          locale={locale}
                          item={item}
                          labels={{
                            status: tt('statusLabel'),
                            deliveryMode: tt('deliveryMode'),
                            venue: tt('venue'),
                            quota: tt('quota'),
                            quotaValue: (count: number) => t('quotaValue', { count }),
                            details: tt('viewDetails'),
                          }}
                        />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}

/**
 * TAKVİM SATIRI
 * Solda gün aralığı, sağda künye ve belirgin bir detay düğmesi.
 *
 * GEÇMİŞ EĞİTİMLER listeden ÇIKARILMAZ — merkezin geçmiş faaliyeti kurumsal
 * bir kayıttır. Yalnızca görsel olarak soluklaştırılır; durum rozeti
 * ("Tamamlandı") ayrımı metinle zaten taşır, renk tek başına anlam taşımaz
 * (WCAG 2.2 — 1.4.1). `aria-hidden` KULLANILMAZ.
 */
const CalendarRow: React.FC<{
  locale: Locale
  item: TimelineTraining
  labels: {
    status: string
    deliveryMode: string
    venue: string
    quota: string
    quotaValue: (count: number) => string
    details: string
  }
}> = ({ locale, item, labels }) => {
  const dayRange = formatDayRange(locale, item.startDate, item.endDate)
  const statusText = trainingStatusLabel(item.status, locale)
  const quota = Number(item.quota)
  const hasQuota = Number.isFinite(quota) && quota > 0

  /*
    "Geçmiş" hesabı RENDER ANINDA yapılır, sunucudan gelmez. Sunucuda
    hesaplansaydı ISR ile önbelleğe alınır ve beş dakika boyunca yanlış
    kalabilirdi; ayrıca sunucu/istemci arasında farklı "şimdi" değerleri
    hidrasyon uyuşmazlığı üretirdi. Tarih karşılaştırması gün başına
    yuvarlanmaz — saat farkı takvimde anlamlı değil, sadece soluklaştırmayı
    etkiler.
  */
  const isPast = item.startDate ? new Date(item.startDate) < new Date() : false

  return (
    <li
      className={`flex flex-col gap-3 border-b border-line py-5 sm:flex-row sm:gap-6 ${
        isPast ? 'opacity-70' : ''
      }`}
    >
      {/* Sol sütun: gün aralığı */}
      <p className="shrink-0 sm:w-28">
        <time dateTime={item.startDate ?? undefined} className="text-xl font-bold text-brand-800">
          {dayRange}
        </time>
      </p>

      {/* Sağ sütun: içerik */}
      <div className="min-w-0 flex-1">
        <h4 className="text-lg font-semibold leading-snug tracking-tight">
          <Link
            href={detailHref('training-program', locale, item.slug ?? '')}
            className="text-shell-900 decoration-2 underline-offset-4 transition-colors hover:text-brand-800 hover:underline"
          >
            {item.title}
          </Link>
        </h4>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          {statusText ? (
            <p className={trainingStatusClasses(item.status)}>
              <span className="sr-only">{labels.status}: </span>
              {statusText}
            </p>
          ) : null}

          {item.deliveryModeLabel ? (
            <p className="text-sm text-ink-600">
              <span className="sr-only">{labels.deliveryMode}: </span>
              {item.deliveryModeLabel}
            </p>
          ) : null}

          {item.venue ? (
            <p className="text-sm text-ink-600">
              <span className="sr-only">{labels.venue}: </span>
              {item.venue}
            </p>
          ) : null}

          {/*
            KONTENJAN — sayı tek başına anlamsızdır ("24"), bu yüzden birimiyle
            birlikte basılır ("24 kişilik kontenjan"). Ekran okuyucuya ayrıca
            alan adı verilir.
            Girilmemiş veya sıfır kontenjan HİÇ BASILMAZ: "0 kişilik kontenjan"
            eğitimin kapalı olduğu izlenimi verirdi.
          */}
          {hasQuota ? (
            <p className="inline-flex items-center gap-1.5 text-sm text-ink-600">
              <span className="sr-only">{labels.quota}: </span>
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 16 16"
                width="1em"
                height="1em"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="6" cy="5.5" r="2.5" />
                <path d="M1.5 13.5c0-2.2 2-3.6 4.5-3.6s4.5 1.4 4.5 3.6" />
                <path d="M11 3.4a2.4 2.4 0 0 1 0 4.2M12.6 13.5c0-1.5-.5-2.6-1.4-3.3" />
              </svg>
              {labels.quotaValue(quota)}
            </p>
          ) : null}
        </div>

        {item.topicTitles.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {item.topicTitles.map((topic) => (
              <li
                key={topic}
                className="rounded-full bg-surface-alt px-3 py-1 text-sm text-ink-700"
              >
                {topic}
              </li>
            ))}
          </ul>
        ) : null}

        {/*
          DETAY DÜĞMESİ — başlıktan AYRI ikinci bir odak durağıdır.
          Kart bileşenlerinde bundan kaçınılıyor (aynı hedefe iki durak), ama
          takvim satırı bir kart değil bir TABLO SATIRI gibi taranıyor: göz
          tarihe ve duruma bakıp "bunu aç" diyor ve o eylem için belirgin bir
          hedef arıyor. Ekran okuyucuda ayırt edilebilsin diye düğmenin
          erişilebilir adına eğitimin başlığı `sr-only` olarak eklenir
          (WCAG 2.2 — 2.4.4 Bağlantı Amacı).
        */}
        <p className="mt-4">
          <Link
            href={detailHref('training-program', locale, item.slug ?? '')}
            className="group inline-flex min-h-11 items-center gap-2 rounded-sm border border-line-strong px-4 text-sm font-semibold text-shell-900 transition-colors hover:border-brand-700 hover:bg-brand-50/60 hover:text-brand-800"
          >
            {labels.details}
            <span className="sr-only"> — {item.title}</span>
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 16 16"
              width="1em"
              height="1em"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.5 8h11M9.5 4l4 4-4 4"
              />
            </svg>
          </Link>
        </p>
      </div>
    </li>
  )
}

export default TrainingCalendar
