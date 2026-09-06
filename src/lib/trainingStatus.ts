import { TRAINING_STATUSES } from '@/fields/options'
import type { Locale } from '@/i18n/locales'

import { optionLabel } from './optionLabel'

/**
 * EĞİTİM DURUMU → GÖRÜNÜR ROZET
 * ============================================================================
 * Durum listesinin TEK KAYNAĞI `fields/options.ts` içindeki
 * `TRAINING_STATUSES` dizisidir; panelde ve sitede aynı sözlük kullanılır.
 * Yeni bir durum eklendiğinde buradaki `TONE_BY_STATUS` haritasına da satır
 * eklenmelidir — eklenmezse rozet sessizce nötr tona düşer, kırılmaz.
 *
 * ERİŞİLEBİLİRLİK
 *   - Renk TEK BAŞINA anlam taşımaz (WCAG 2.2 — 1.4.1). Rozet her zaman
 *     metin içerir ve ekran okuyucular için "Eğitim durumu:" ön eki eklenir.
 *   - Tonların tamamı beyaz/açık zeminde ≥4.5:1 ölçülmüştür (globals.css'teki
 *     token ölçümleriyle aynı yöntem).
 *   - `onDark` varyantı Bento'nun büyük görselli kartında kullanılır: koyu
 *     fotoğraf üzerinde renkli metin güvenilir değildir, bu yüzden rozet
 *     opak beyaz zemine alınır ve metin ink-900 olur.
 * ============================================================================
 */

type Tone = 'neutral' | 'open' | 'active' | 'done' | 'warning' | 'danger'

const TONE_BY_STATUS: Record<string, Tone> = {
  planned: 'neutral',
  'applications-open': 'open',
  'applications-closed': 'neutral',
  ongoing: 'active',
  completed: 'done',
  postponed: 'warning',
  cancelled: 'danger',
}

/**
 * Açık zeminde kullanılan sınıflar — YUMUŞAK ZEMİN + KOYU METİN.
 *
 * Renk çiftleri `globals.css` içinde token olarak tanımlıdır ve orada
 * ölçülmüştür (6.58:1 – 10.5:1 aralığı, hepsi AA üstü). Yumuşak rozetlerde
 * en sık yapılan hata metni de zeminle birlikte açmaktır; burada metin
 * bilinçli olarak koyu bırakılır.
 *
 * Kenarlık YOK: rozetin sınırını dolgu rengi zaten taşıyor ve rozet bilgiyi
 * METİNLE veriyor (1.4.1). Çerçeve eklemek yumuşak tonu sertleştirirdi.
 */
const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-badge-neutral-bg text-ink-700',
  open: 'bg-badge-open-bg text-success-800',
  active: 'bg-badge-active-bg text-accent-700',
  done: 'bg-badge-neutral-bg text-ink-600',
  warning: 'bg-badge-warn-bg text-warn-800',
  danger: 'bg-badge-danger-bg text-danger-700',
}

/** Fotoğraf üzerinde: yumuşak tonlar okunmaz, opak beyaz zemin + koyu metin. */
const ON_DARK_CLASSES = 'bg-white text-ink-900'

/**
 * Durum kodunun ziyaretçi diline çevrilmiş etiketi.
 * Etiket sözlükte bulunamazsa ham kod döner (veri bozulsa bile sayfa çalışır).
 */
export const trainingStatusLabel = (
  status: string | null | undefined,
  locale: Locale,
): string | null => optionLabel(TRAINING_STATUSES, status, locale)

/** Rozetin Tailwind sınıfları. `onDark` görselli kart için. */
export const trainingStatusClasses = (
  status: string | null | undefined,
  { onDark = false }: { onDark?: boolean } = {},
): string => {
  // `tracking-wide` + `text-xs` + `font-semibold`: rozet tipografisi gövde
  // metninden net ayrışır, etiket gibi okunur.
  const base =
    'inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide'

  if (onDark) return `${base} ${ON_DARK_CLASSES}`

  const tone = (status && TONE_BY_STATUS[status]) || 'neutral'
  return `${base} ${TONE_CLASSES[tone]}`
}

/**
 * Şartname 6.4: "Başvur" butonu yalnızca başvuruya açık eğitimlerde görünür.
 * Bento kartındaki vurgu da bu bilgiye bakar.
 */
export const isApplicationOpen = (status: string | null | undefined): boolean =>
  status === 'applications-open'
