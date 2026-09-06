import Link from 'next/link'
import React from 'react'

import type { Locale } from '@/i18n/locales'
import { detailHref } from '@/i18n/routes'
import { formatDateRange } from '@/lib/dates'
import { trainingStatusClasses, trainingStatusLabel } from '@/lib/trainingStatus'

import { TopicIcon } from './TopicIcon'

/**
 * EĞİTİM KARTI — TEK GÖRÜNÜM KAYNAĞI
 * ============================================================================
 * Ana sayfadaki Bento şeridi ve katalog sayfası AYNI kartı kullanır. Ayrı ayrı
 * yazılsalardı biri değiştiğinde diğeri sessizce farklılaşırdı; şartnamedeki
 * "tutarlı arayüz" beklentisi tam olarak bunun kaybolmasıyla bozulur.
 *
 * Bileşen SAF sunumdur: veri çekmez, çeviri kancası kullanmaz. Bu sayede hem
 * sunucu bileşeninden (Bento) hem de istemci bileşeninden (katalog filtresi)
 * çağrılabilir — `useTranslations` kullansaydı sunucu tarafında patlar,
 * `getTranslations` kullansaydı istemci tarafında patlardı. Bu yüzden ekran
 * okuyucuya okunacak durum ön eki `statusPrefix` ile DIŞARIDAN verilir.
 *
 * ERİŞİLEBİLİRLİK
 *   - Kartın tamamı tıklanabilir DEĞİLDİR. Odaklanılabilir tek öğe başlıktaki
 *     bağlantıdır (WCAG 2.2 — 2.4.3 Odak Sırası, 2.4.4 Bağlantı Amacı).
 *     Kart yüzeyine tıklama isteniyorsa `::after` ile genişletilmeli, ikinci
 *     bir odak durağı eklenmemelidir.
 *   - Durum rozeti renge ek olarak METİN taşır (1.4.1 Rengin Kullanımı).
 * ============================================================================
 */

export type TrainingCardItem = {
  id: string | number
  title?: string | null
  slug?: string | null
  summary?: string | null
  status?: string | null
  startDate?: string | null
  endDate?: string | null
  /** İlk konusunun kategorisi; tematik ikonu seçer. */
  categoryKey?: string | null
}

type Props = {
  locale: Locale
  item: TrainingCardItem
  /** Ekran okuyucu için rozet ön eki, örn. "Eğitim durumu". */
  statusPrefix: string
  /** Izgara yerleşimi için dışarıdan verilen sınıflar (örn. Bento sütunları). */
  className?: string
  /** Büyük kartta başlık punto olarak büyür. */
  size?: 'default' | 'large'
  showStatus?: boolean
  /** Kart altındaki mikro metin, örn. "Detayları İncele". */
  detailLabel?: string | null
  /** Kartın altına eklenecek serbest içerik (katalogdaki bilgi etiketleri). */
  footer?: React.ReactNode
}

export const TrainingCard: React.FC<Props> = ({
  locale,
  item,
  statusPrefix,
  className = '',
  size = 'default',
  showStatus = true,
  detailLabel,
  footer,
}) => {
  /**
   * MİKRO ETKİLEŞİM
   * `hover:-translate-y-1` + gölge derinleşmesi. `transition-all duration-200`
   * globals.css'teki `prefers-reduced-motion` kuralıyla otomatik olarak
   * 0.01ms'ye iner: hareketten rahatsız olan kullanıcı yer değiştirmeyi
   * animasyon olarak GÖRMEZ, durum yine de doğru kalır (WCAG 2.2 — 2.3.3).
   */
  const dateRange = formatDateRange(locale, item.startDate, item.endDate)
  const statusText = showStatus ? trainingStatusLabel(item.status, locale) : null

  return (
    <li
      className={`group flex flex-col rounded-card border border-line-soft bg-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-700/30 hover:shadow-lg ${
        size === 'large' ? 'justify-center md:p-7' : ''
      } ${className}`}
    >
      {/* Rozet + tematik ikon aynı satırda; ikon dekoratiftir. */}
      <div className="mb-3 flex items-center gap-2">
        <TopicIcon category={item.categoryKey} className="text-brand-700" />
        {statusText ? (
          <p className={trainingStatusClasses(item.status)}>
            <span className="sr-only">{statusPrefix}: </span>
            {statusText}
          </p>
        ) : null}
      </div>

      {dateRange ? (
        <time dateTime={item.startDate ?? undefined} className="text-sm text-ink-600">
          {dateRange}
        </time>
      ) : null}

      <h3 className={`mt-1 font-semibold ${size === 'large' ? 'text-xl lg:text-2xl' : 'text-lg'}`}>
        <Link
          href={detailHref('training-program', locale, item.slug ?? '')}
          className="text-brand-800 underline-offset-4 hover:underline"
        >
          {item.title}
        </Link>
      </h3>

      {item.summary ? <p className="mt-2 text-ink-600">{item.summary}</p> : null}

      {footer ? <div className="mt-4">{footer}</div> : null}

      {/*
        MİKRO METİN — bağlantı DEĞİLDİR.
        Başlık zaten aynı yere gidiyor; bunu da odaklanabilir yapmak klavye
        kullanıcısına aynı hedefi iki kez dolaştırırdı (WCAG 2.2 — 2.4.3).
        `aria-hidden` ile ekran okuyucudan gizlenir, `mt-auto` ile kartın
        altına yapışır. Ok, karta gelindiğinde sağa kayar.
      */}
      {detailLabel ? (
        <p
          aria-hidden="true"
          className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-medium text-brand-800"
        >
          {detailLabel}
          <svg
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
        </p>
      ) : null}
    </li>
  )
}

export default TrainingCard
