'use client'

import React from 'react'

/**
 * FİLTRELEME KONSOLU — TÜM LİSTELEME SAYFALARININ ORTAK DENETİM ALANI
 * ============================================================================
 * Kütüphane, eğitim kataloğu, eğitim takvimi ve arama sayfaları aynı işi
 * yapıyordu: "listeyi daralt". Üçü üç ayrı görünümle yapıyordu — biri düz
 * zeminde, biri yatay çizgiyle ayrılmış, biri kartın içinde. Bu dosya o üç
 * görünümü tek bir yüzeyde birleştirir.
 *
 * PARÇALAR
 *   FilterConsole   kap — zeminden gölge + kenarlıkla ayrılan panel
 *   ConsoleSearch   arama alanı (büyüteç ikonlu, hap biçimli)
 *   FilterGroup     bir filtre kümesi (başlık + haplar)
 *   FilterPill      tek bir hap
 *   ResultBar       sonuç sayısı + "temizle" — konsolun DIŞINDA kullanılır
 *
 * ---------------------------------------------------------------------------
 * SEÇİLİ DURUM YALNIZCA RENKLE ANLATILMAZ (WCAG 2.2 — 1.4.1)
 * ---------------------------------------------------------------------------
 * Aktif hapta koyu yeşil zemin GÖRSEL vurgudur; yanındaki onay işareti,
 * rengi ayırt edemeyen kullanıcı için ikinci taşıyıcıdır. Ekran okuyucu
 * tarafında durumu `aria-pressed` bildirir — bu yüzden ikon `aria-hidden`.
 *
 * ODAK HALKASI KALDIRILMAZ
 * `focus:outline-none` HİÇBİR yerde kullanılmaz: globals.css'teki genel
 * `:focus-visible` kuralı Tailwind yardımcı sınıfları tarafından ezilir ve
 * klavye kullanıcısı nerede olduğunu göremez (2.4.7). Buradaki kenarlık/zemin
 * değişimleri odak halkasının YERİNE değil, YANINA gelir.
 * ============================================================================
 */

export const FilterConsole: React.FC<{
  children: React.ReactNode
  /** Görsel olarak gizli başlık — konsol bir bölgedir, adı olmalıdır. */
  label: string
  className?: string
}> = ({ children, label, className = '' }) => (
  <section aria-label={label} className={`filter-console ${className}`}>
    {children}
  </section>
)

/** Konsol içindeki bölümleri ayıran ince çizgi + üst boşluk. */
export const ConsoleDivider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-6 flex flex-col gap-6 border-t border-line-soft pt-6 lg:flex-row lg:gap-12">
    {children}
  </div>
)

export const ConsoleSearch: React.FC<{
  id: string
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
}> = ({ id, label, placeholder, value, onChange, className = 'max-w-xl' }) => (
  <div className={className}>
    <label htmlFor={id} className="block text-xs font-bold uppercase tracking-[0.12em] text-ink-600">
      {label}
    </label>
    <div className="relative mt-2">
      {/*
        Büyüteç dekoratiftir — alanın görünür etiketi zaten var ve
        `type="search"` anlamı taşır. `pointer-events-none` olmasaydı ikona
        tıklamak alana odaklanmayı engellerdi.
      */}
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 20 20"
        className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-500"
      >
        <circle cx="8.5" cy="8.5" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12.8 12.8 17 17"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-full border border-line-strong bg-surface-alt py-2 pl-11 pr-4 text-ink-900 transition-colors placeholder:text-ink-500 focus:border-brand-700 focus:bg-surface"
      />
    </div>
  </div>
)

const CheckIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 16 16"
    width="0.85em"
    height="0.85em"
    className="shrink-0"
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 8.4l3.2 3.2L13 4.8"
    />
  </svg>
)

export const FilterPill: React.FC<{
  label: string
  active: boolean
  onClick: () => void
  /** Bu seçeneğe düşen kayıt sayısı. Verilmezse çip basılmaz. */
  count?: number | null
}> = ({ label, active, onClick, count }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
      active
        ? 'border-brand-800 bg-brand-800 text-white shadow-md shadow-brand-900/25'
        : 'border-line-strong bg-surface text-ink-700 shadow-sm hover:-translate-y-px hover:border-brand-700 hover:bg-brand-50 hover:text-brand-800 hover:shadow'
    }`}
  >
    {active ? <CheckIcon /> : null}
    {label}
    {typeof count === 'number' ? (
      <span
        className={`inline-flex min-w-5 justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
          active ? 'bg-white/20 text-white' : 'bg-surface-alt text-ink-600'
        }`}
      >
        {count}
      </span>
    ) : null}
  </button>
)

export const FilterGroup: React.FC<{
  legend: string
  children: React.ReactNode
}> = ({ legend, children }) => (
  <fieldset className="min-w-0">
    <legend className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-ink-600">
      {legend}
    </legend>
    <div className="flex flex-wrap gap-2">{children}</div>
  </fieldset>
)

/**
 * Sonuç şeridi — konsolun DIŞINDA durur.
 * İçeride dursaydı "ayarlanabilir bir şey" gibi okunurdu; oysa bu, ayarların
 * SONUCU. `aria-live="polite"`: filtre değişince sonuç sayısı duyurulur
 * (WCAG 2.2 — 4.1.3).
 */
export const ResultBar: React.FC<{
  count: string
  onClear?: (() => void) | null
  clearLabel?: string
}> = ({ count, onClear, clearLabel }) => (
  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
    <p aria-live="polite" className="text-sm font-medium text-ink-700">
      {count}
    </p>
    {onClear && clearLabel ? (
      <button
        type="button"
        onClick={onClear}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-ink-700 transition-colors hover:border-brand-700 hover:text-brand-800"
      >
        <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="0.9em" height="0.9em">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            d="M4 4l8 8M12 4l-8 8"
          />
        </svg>
        {clearLabel}
      </button>
    ) : null}
  </div>
)
