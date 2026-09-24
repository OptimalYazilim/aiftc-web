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
 *   FilterConsole   çerçevesiz alan — üst/alt saç teli çizgi, kutu YOK
 *   ConsoleSearch   arama alanı (alt çizgili, ikonsuz)
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
  <div className="mt-7 flex flex-col gap-7 border-t border-line pt-7 lg:flex-row lg:gap-14">
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
    <label htmlFor={id} className="block text-xs font-bold uppercase tracking-[0.16em] text-ink-600">
      {label}
    </label>
    {/*
      BÜYÜTEÇ İKONU KALDIRILDI.
      Alanın görünür bir etiketi var, `type="search"` anlamı taşıyor ve yer
      tutucu metin ne aranacağını söylüyor. İkon üçüncü kez aynı şeyi
      söylüyordu — dekoratif tekrar. Yerini tipografi alıyor: etiket harf
      aralıklı ve kalın, alan geniş ve sakin.

      Yuvarlak hap biçimi de bırakıldı. Alt çizgili (underline) giriş, baskı
      formlarının dilidir ve kutu yığınını azaltır: alan bir "widget" gibi
      değil, yazılacak bir satır gibi durur.
    */}
    <input
      id={id}
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      /*
        Alt çizgi olabildiğince ince: koyu zeminde 1px beyaz/35 zaten net
        okunur (≈6:1). Açık zeminde aynı incelikte bir çizgi 1.4:1'e düşer ve
        alanın sınırı kaybolurdu — koyu bara geçmenin somut kazancı bu.
      */
      className="ease-editorial mt-2 min-h-11 w-full rounded-none border-0 border-b border-line-strong bg-transparent px-0 pb-2 text-xl text-ink-900 transition-colors duration-300 placeholder:font-normal placeholder:text-ink-500 focus:border-shell-950"
    />
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
    /*
      GÖLGE VE ZIPLAMA KALDIRILDI.
      Aktif hap artık en koyu orman tonuyla (`shell-950`) dolar; pasif hap
      zeminsiz durur ve yalnızca 1px çizgiyle var olur. Ayrım DEĞER
      KONTRASTIYLA kurulur — beyaz üstünde neredeyse siyah bir yeşil, yanında
      yalnızca çizgi. Bu, gölgeli bir "buton yığını"ndan çok daha sessiz ve
      çok daha okunur.

      Hover'da hap yerinden oynamaz; yalnızca çizgisi koyulaşır ve metni
      koyulaşır. `duration-300` + editoryal eğri: hareket fark edilir ama
      dikkat çekmez.
    */
    className={`ease-editorial inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors duration-300 ${
      active
        ? 'border-shell-950 bg-shell-950 font-semibold text-white'
        : 'border-line-strong bg-transparent font-medium text-ink-700 hover:border-shell-950 hover:text-shell-950 focus-visible:border-shell-950 focus-visible:text-shell-950'
    } focus-visible:border-shell-950 focus-visible:text-shell-950`}
  >
    {active ? <CheckIcon /> : null}
    {label}
    {typeof count === 'number' ? (
      <span
        /*
          Sayaç artık bir 'çip' değil: zemin kutusu kaldırıldı, ayrım
          yalnızca punto ve renk değeriyle yapılıyor. İki iç içe kutu
          (hap + çip) editoryal dilde gereksiz katman.
        */
        className={`text-xs tabular-nums ${active ? 'text-white/65' : 'text-ink-500'}`}
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
    <legend className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-ink-600">
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
        className="ease-editorial inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-700 underline decoration-line-strong underline-offset-4 transition-colors duration-300 hover:text-shell-900 hover:decoration-shell-900 focus-visible:text-shell-900 focus-visible:decoration-shell-900"
      >
        {clearLabel}
      </button>
    ) : null}
  </div>
)
