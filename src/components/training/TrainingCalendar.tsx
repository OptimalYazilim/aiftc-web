'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import type { Locale } from '@/i18n/locales'

import { CardMeta } from '../ui/CardMeta'

import {
  FilterConsole,
  FilterGroup,
  FilterPill,
  ResultBar,
} from '../ui/FilterConsole'
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

export const TrainingCalendar: React.FC<Props> = ({ locale, items, topics }) => {
  const t = useTranslations('calendar')
  const tt = useTranslations('training')
  const th = useTranslations('home')

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
      {/*
        --- FİLTRELEME KONSOLU ---------------------------------------------
        Görünüm ortak bileşenden (components/ui/FilterConsole). Takvimin üç
        süzgeç ekseni de artık aynı hap biçimini kullanır; eskiden yıl/ay
        köşeli, konu hap biçimindeydi ve tek ekranda iki ayrı düğme dili
        vardı. Tek seçimli / çok seçimli ayrımı GÖRÜNÜMDE değil DAVRANIŞTA:
        yıl ve ay seçimi değiştirir, konu ekler/çıkarır.
      */}
      <FilterConsole label={t('filterHeading')}>
        <div className="flex flex-col gap-6">
          <FilterGroup legend={t('filterByYear')}>
            <FilterPill
              label={t('allYears')}
              count={items.length}
              active={year === null}
              onClick={() => pickYear(null)}
            />
            {years.map(([value, count]) => (
              <FilterPill
                key={value}
                label={value}
                count={count}
                active={year === value}
                onClick={() => pickYear(value)}
              />
            ))}
          </FilterGroup>

          {months.length > 1 ? (
            <FilterGroup legend={t('filterByMonth')}>
              <FilterPill
                label={t('allMonths')}
                active={month === null}
                onClick={() => setMonth(null)}
              />
              {months.map(([key, count]) => {
                /*
                  Yıl seçiliyken etiket sadeleşir; seçili değilken yılı taşır
                  — aksi hâlde iki farklı yılın aynı ayı ayırt edilemezdi.
                */
                const label = formatMonthKey(locale, key)
                return (
                  <FilterPill
                    key={key}
                    label={year ? label.replace(` ${year}`, '') : label}
                    count={count}
                    active={month === key}
                    onClick={() => setMonth(key)}
                  />
                )
              })}
            </FilterGroup>
          ) : null}

          {topics.length > 0 ? (
            <FilterGroup legend={t('filterByTopic')}>
              {topics.map((topic) => (
                <FilterPill
                  key={topic.value}
                  label={topic.label}
                  count={topic.count}
                  active={selectedTopics.includes(topic.value)}
                  onClick={() =>
                    setSelectedTopics((list) =>
                      list.includes(topic.value)
                        ? list.filter((v) => v !== topic.value)
                        : [...list, topic.value],
                    )
                  }
                />
              ))}
            </FilterGroup>
          ) : null}
        </div>
      </FilterConsole>

      <ResultBar
        count={t('resultsCount', { count: filtered.length })}
        onClear={hasFilters ? clearAll : null}
        clearLabel={t('clearFilters')}
      />

      {groups.length === 0 ? (
        <p className="mt-8 rounded-card border border-line bg-surface p-6 text-ink-700">
          {hasFilters ? t('noResults') : t('empty')}
        </p>
      ) : (
        <div className="mt-12 space-y-20">
          {groups.map((group) => (
            <section key={group.year} aria-labelledby={`yil-${group.year}`}>
              {/*
                YIL BAŞLIĞI — ana sayfa bölüm başlıklarının dili: kısa çizgili
                üst etiket + büyük rakam. Sağda o yılın kayıt sayısı.
                `scroll-mt`: yapışkan başlık, hedefe atlarken yılı örtmesin.
              */}
              <div className="flex items-end justify-between gap-6 border-b border-line pb-5">
                <div>
                  <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                    <span aria-hidden="true" className="h-px w-8 bg-brand-700" />
                    {t('eyebrow')}
                  </p>
                  <h2
                    id={`yil-${group.year}`}
                    className="mt-2 scroll-mt-24 text-5xl font-bold leading-none tracking-[-0.04em] text-shell-900 sm:text-6xl"
                  >
                    {group.year}
                  </h2>
                </div>
                <p className="pb-1 text-sm font-semibold text-ink-600">
                  {th('programCount', {
                    count: group.months.reduce((sum, m) => sum + m.items.length, 0),
                  })}
                </p>
              </div>

              <div className="mt-10 space-y-12">
                {group.months.map((monthGroup) => (
                  <section
                    key={monthGroup.key}
                    aria-labelledby={`ay-${monthGroup.key}`}
                    className="grid gap-5 lg:grid-cols-12 lg:gap-10"
                  >
                    {/* Ay başlığı — geniş ekranda liste boyunca yapışık kalır. */}
                    <div className="lg:col-span-3">
                      <div className="lg:sticky lg:top-28">
                        <h3
                          id={`ay-${monthGroup.key}`}
                          className="text-2xl font-bold capitalize tracking-tight text-shell-900"
                        >
                          {formatMonthKey(locale, monthGroup.key).replace(` ${group.year}`, '')}
                          <span className="sr-only"> {group.year}</span>
                        </h3>
                        <p className="mt-1 text-sm text-ink-600">
                          {th('programCount', { count: monthGroup.items.length })}
                        </p>
                        <span
                          aria-hidden="true"
                          className="mt-4 hidden h-0.5 w-10 bg-brand-500 lg:block"
                        />
                      </div>
                    </div>

                    <ul className="flex flex-col gap-4 lg:col-span-9">
                      {monthGroup.items.map((item) => (
                        <CalendarRow
                          key={String(item.id)}
                          locale={locale}
                          item={item}
                          labels={{
                            status: tt('statusLabel'),
                            past: t('pastTraining'),
                            deliveryMode: tt('deliveryMode'),
                            venue: tt('venue'),
                            quota: tt('quota'),
                            quotaValue: (count: number) => t('quotaValue', { count }),
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

/** Tarih bloğu için gün/ay parçaları — `lib/dates` ile aynı UTC kabulü. */
const dateParts = (locale: Locale, value: string | null | undefined) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return {
    day: new Intl.DateTimeFormat(locale, { day: 'numeric', timeZone: 'UTC' }).format(date),
    month: new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(date),
    weekday: new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(date),
  }
}

/**
 * TAKVİM KARTI
 * Ana sayfa kartlarının dili: beyaz yüzey, ince kenarlık, hover'da koyu
 * kenarlık; kartın TAMAMI tıklanabilir, odak durağı TEK (başlık bağlantısı).
 * Solda koyu orman tonlu tarih bloğu (beyaz metin shell-950 üzerinde 17:1).
 *
 * GEÇMİŞ EĞİTİMLER listeden ÇIKARILMAZ — merkezin geçmiş faaliyeti kurumsal
 * bir kayıttır. Tarih bloğu nötr tona döner; durum rozeti ("Tamamlandı")
 * ayrımı metinle zaten taşır, renk tek başına anlam taşımaz (WCAG 1.4.1).
 */
const CalendarRow: React.FC<{
  locale: Locale
  item: TimelineTraining
  labels: {
    status: string
    /** "Geçmiş eğitim" — soluklaştırmanın metinsel karşılığı (Madde 44/47). */
    past: string
    deliveryMode: string
    venue: string
    quota: string
    quotaValue: (count: number) => string
  }
}> = ({ locale, item, labels }) => {
  const dayRange = formatDayRange(locale, item.startDate, item.endDate)
  const parts = dateParts(locale, item.startDate)
  const statusText = trainingStatusLabel(item.status, locale)
  const quota = Number(item.quota)
  const hasQuota = Number.isFinite(quota) && quota > 0

  /*
    "Geçmiş" hesabı RENDER ANINDA yapılır: sunucuda hesaplansaydı ISR ile
    önbelleğe alınır ve beş dakika boyunca yanlış kalabilirdi.
  */
  const isPast = item.startDate ? new Date(item.startDate) < new Date() : false

  return (
    <li className="group ease-editorial relative flex overflow-hidden rounded-card border border-line bg-surface transition-colors duration-500 hover:border-shell-900 focus-within:border-shell-900">
      {/* Tarih bloğu */}
      <div
        className={`flex w-24 shrink-0 flex-col items-center justify-center px-2 py-5 text-center sm:w-32 ${
          isPast ? 'bg-surface-alt text-ink-700' : 'bg-shell-950 text-white'
        }`}
      >
        {parts ? (
          <>
            <span
              className={`text-xs font-semibold uppercase tracking-[0.14em] ${
                isPast ? 'text-ink-600' : 'text-brand-100'
              }`}
            >
              {parts.month}
            </span>
            <span className="mt-1 text-4xl font-bold leading-none tracking-tight sm:text-5xl">
              {parts.day}
            </span>
            <span className={`mt-2 text-xs ${isPast ? 'text-ink-600' : 'text-white/70'}`}>
              {parts.weekday}
            </span>
          </>
        ) : null}
      </div>

      {/* İçerik */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {/*
              "GEÇMİŞ" YALNIZCA RENKLE ANLATILMIYOR  (Kontrol Listesi 44 · 47)
              Tarih bloğunun soluk zemini ekran okuyucuya hiçbir şey söylemez;
              karşılığı metinle verilir. `sr-only`: görsel düzen değişmez.
            */}
            {isPast ? <span className="sr-only">{labels.past}: </span> : null}
            {statusText ? (
              <p className={trainingStatusClasses(item.status)}>
                <span className="sr-only">{labels.status}: </span>
                {statusText}
              </p>
            ) : null}
            {dayRange ? (
              <time
                dateTime={item.startDate ?? undefined}
                className="text-xs font-semibold uppercase tracking-wider text-brand-700"
              >
                {dayRange} {dayRange.includes(' ') ? null : parts?.month}
              </time>
            ) : null}
          </div>

          <h4 className="mt-2 text-lg font-bold leading-snug tracking-tight sm:text-xl">
            <Link
              href={detailHref('training-program', locale, item.slug ?? '')}
              className="text-shell-900 underline-offset-4 transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-brand-800 group-focus-within:text-brand-800"
            >
              {item.title}
            </Link>
          </h4>

          <CardMeta
            className="mt-3"
            items={[
              item.deliveryModeLabel
                ? { key: 'mode', label: labels.deliveryMode, value: item.deliveryModeLabel }
                : null,
              item.venue ? { key: 'venue', label: labels.venue, value: item.venue } : null,
              /* Girilmemiş veya sıfır kontenjan basılmaz ("0 kişilik" kapalı izlenimi verir). */
              hasQuota ? { key: 'quota', label: labels.quota, value: labels.quotaValue(quota) } : null,
            ]}
          />

          {item.topicTitles.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {item.topicTitles.map((topic) => (
                <li
                  key={topic}
                  className="rounded-full border border-line bg-canvas px-3 py-0.5 text-xs font-medium text-ink-700"
                >
                  {topic}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Görsel ipucu — bağlantının kendisi başlıktır (tek odak durağı). */}
        <span
          aria-hidden="true"
          className="ease-editorial hidden size-11 shrink-0 items-center justify-center rounded-full border border-line text-shell-900 transition-colors duration-500 group-hover:border-shell-900 group-hover:bg-shell-900 group-hover:text-white group-focus-within:border-shell-900 group-focus-within:bg-shell-900 group-focus-within:text-white sm:inline-flex"
        >
          <svg
            viewBox="0 0 16 16"
            width="1.1em"
            height="1.1em"
            className="ease-editorial transition-transform duration-500 group-hover:translate-x-0.5 group-focus-within:translate-x-0.5"
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
        </span>
      </div>
    </li>
  )
}

export default TrainingCalendar
