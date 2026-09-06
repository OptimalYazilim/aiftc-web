import React from 'react'

/**
 * KONU İKONU — eğitim kartlarındaki tematik işaret
 * ============================================================================
 * `training-topics` koleksiyonundaki `category` alanına göre seçilir. Kategori
 * sözlüğü `collections/TrainingTopics.ts` içindedir; oraya yeni bir kategori
 * eklendiğinde buraya da satır eklenmelidir. Eşleşme bulunamazsa NÖTR bir
 * kitap işareti basılır — ikon eksikliği kartı bozmaz.
 *
 * İkonlar TAMAMEN DEKORATİFTİR (`aria-hidden`): konu adı zaten metin olarak
 * kartın içinde ve rozetlerde geçer. Ekran okuyucuya ayrıca duyurulması
 * gürültü olurdu (WCAG 2.2 — 1.1.1).
 * ============================================================================
 */

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
}

/** Alev — orman yangınları / entegre yangın yönetimi. */
const Flame = () => (
  <svg {...svgProps}>
    <path d="M12 3s5 4.2 5 8.6a5 5 0 0 1-10 0C7 9.4 9 7.6 9 7.6s.4 2 1.6 2.6C11 8.4 12 6 12 3Z" />
  </svg>
)

/** Uydu / radar — CBS ve uzaktan algılama. */
const Satellite = () => (
  <svg {...svgProps}>
    <circle cx="12" cy="12" r="2.2" />
    <path d="M12 4.2a7.8 7.8 0 0 1 7.8 7.8M12 7.6a4.4 4.4 0 0 1 4.4 4.4" />
    <path d="M4.5 19.5 9 15M4.2 15.5a6 6 0 0 0 4.3 4.3" />
  </svg>
)

/** Fidan — fidanlık, ağaçlandırma, peyzaj restorasyonu. */
const Sapling = () => (
  <svg {...svgProps}>
    <path d="M12 20v-7" />
    <path d="M12 13c0-3 2.2-5 5-5 0 3-2.2 5-5 5ZM12 14c0-2.6-1.9-4.4-4.4-4.4 0 2.6 1.9 4.4 4.4 4.4Z" />
    <path d="M8 20h8" />
  </svg>
)

/** Terazi/döngü — sürdürülebilir orman yönetimi. */
const Cycle = () => (
  <svg {...svgProps}>
    <path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3M19.5 12a7.5 7.5 0 0 1-12.8 5.3" />
    <path d="M17.3 3.5v3.2h-3.2M6.7 20.5v-3.2h3.2" />
  </svg>
)

/** Bulut/termometre — iklim değişikliği. */
const Climate = () => (
  <svg {...svgProps}>
    <path d="M7 15.5a3.5 3.5 0 0 1 .4-7 5 5 0 0 1 9.5 1.4A3 3 0 0 1 16.5 16H7Z" />
    <path d="M9 19.5h1.5M13 19.5h1.5" />
  </svg>
)

/** Varsayılan: kitap. */
const Book = () => (
  <svg {...svgProps}>
    <path d="M12 7.5C10.5 6.2 8.5 5.5 4 5.5v12c4.5 0 6.5.7 8 2 1.5-1.3 3.5-2 8-2v-12c-4.5 0-6.5.7-8 2Z" />
    <path d="M12 7.5v12" />
  </svg>
)

/** Kategori kodu → işaret. Bilinmeyen kod nötr kitaba düşer. */
const BY_CATEGORY: Record<string, React.FC> = {
  'forest-fires': Flame,
  'integrated-fire-management': Flame,
  'gis-rs': Satellite,
  'nursery-afforestation': Sapling,
  flr: Sapling,
  'land-degradation': Sapling,
  sfm: Cycle,
  silviculture: Cycle,
  'protected-areas': Cycle,
  'climate-change': Climate,
}

export const TopicIcon: React.FC<{ category?: string | null; className?: string }> = ({
  category,
  className = '',
}) => {
  const Icon = (category && BY_CATEGORY[category]) || Book
  return (
    <span className={`inline-flex h-5 w-5 shrink-0 ${className}`}>
      <Icon />
    </span>
  )
}

export default TopicIcon
