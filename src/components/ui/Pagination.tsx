import Link from 'next/link'
import React from 'react'

/**
 * SAYFALAMA
 * ============================================================================
 * Tamamen SUNUCU tarafında çalışır: her sayfa gerçek bir `<a>` bağlantısıdır.
 * Bunun bedeli bir tam sayfa yüklemesidir; karşılığında JavaScript kapalıyken
 * de çalışır, sayfa numarası paylaşılabilir bir URL'e sahiptir ve arama
 * motoru arşivin tamamını tarayabilir. Bir haber arşivi için bu üç özellik
 * anlık geçişten daha değerlidir.
 *
 * ERİŞİLEBİLİRLİK (WCAG 2.2)
 *   - `<nav aria-label>`: sayfada birden fazla gezinme bölgesi var.
 *   - Bulunulan sayfa `aria-current="page"` taşır ve BAĞLANTI DEĞİLDİR.
 *   - Ok işaretleri `aria-hidden`; yön bilgisi metinle de verilir.
 *   - Tüm hedefler ≥44px (2.5.8).
 *   - Kısaltma (…) sadece görseldir; ekran okuyucuya "atlanan sayfalar"
 *     olarak duyurulmaz, çünkü zaten önceki/sonraki ile gezinilebilir.
 * ============================================================================
 */

type Props = {
  currentPage: number
  totalPages: number
  /** Sayfa numarası eklenecek temel adres, örn. "/tr/haberler". */
  basePath: string
  /** Sorgu parametresinin adı. */
  paramName?: string
  labels: {
    /** nav'ın aria-label'ı, örn. "Sayfalama". */
    navigation: string
    previous: string
    next: string
    /** "{page}. sayfa" — ekran okuyucu için tam etiket. */
    page: (page: number) => string
    current: string
  }
}

/**
 * Gösterilecek sayfa numaralarını seçer: ilk, son, bulunulanın etrafındaki
 * bir pencere ve aradaki boşluklar için `null` (kısaltma işareti).
 */
const buildRange = (current: number, total: number): (number | null)[] => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const pages = new Set<number>([1, total, current])
  if (current - 1 > 1) pages.add(current - 1)
  if (current + 1 < total) pages.add(current + 1)

  const sorted = [...pages].sort((a, b) => a - b)
  const result: (number | null)[] = []

  for (const [index, page] of sorted.entries()) {
    if (index > 0 && page - sorted[index - 1] > 1) result.push(null)
    result.push(page)
  }

  return result
}

export const Pagination: React.FC<Props> = ({
  currentPage,
  totalPages,
  basePath,
  paramName = 'page',
  labels,
}) => {
  if (totalPages <= 1) return null

  // 1. sayfa temiz adreste kalır: /haberler ile /haberler?page=1 aynı içeriği
  // iki farklı URL'den sunmaz (yinelenen içerik / canonical sorunu).
  const hrefFor = (page: number) => (page === 1 ? basePath : `${basePath}?${paramName}=${page}`)

  const linkBase =
    'inline-flex min-h-11 min-w-11 items-center justify-center rounded border px-3 font-medium'

  const range = buildRange(currentPage, totalPages)

  return (
    <nav aria-label={labels.navigation} className="mt-12">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          {currentPage > 1 ? (
            <Link
              href={hrefFor(currentPage - 1)}
              rel="prev"
              className={`${linkBase} border-line-strong text-ink-700 hover:border-brand-700 hover:text-brand-800`}
            >
              <span aria-hidden="true">←</span>
              <span className="ms-2">{labels.previous}</span>
            </Link>
          ) : (
            <span className={`${linkBase} border-line text-ink-500`} aria-hidden="true">
              ← {labels.previous}
            </span>
          )}
        </li>

        {range.map((page, index) =>
          page === null ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-ink-500">
              …
            </li>
          ) : (
            <li key={page}>
              {page === currentPage ? (
                <span
                  aria-current="page"
                  className={`${linkBase} border-brand-800 bg-brand-800 text-white`}
                >
                  <span className="sr-only">{labels.current}: </span>
                  {page}
                </span>
              ) : (
                <Link
                  href={hrefFor(page)}
                  aria-label={labels.page(page)}
                  className={`${linkBase} border-line-strong text-ink-700 hover:border-brand-700 hover:text-brand-800`}
                >
                  {page}
                </Link>
              )}
            </li>
          ),
        )}

        <li>
          {currentPage < totalPages ? (
            <Link
              href={hrefFor(currentPage + 1)}
              rel="next"
              className={`${linkBase} border-line-strong text-ink-700 hover:border-brand-700 hover:text-brand-800`}
            >
              <span className="me-2">{labels.next}</span>
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <span className={`${linkBase} border-line text-ink-500`} aria-hidden="true">
              {labels.next} →
            </span>
          )}
        </li>
      </ul>
    </nav>
  )
}

export default Pagination
