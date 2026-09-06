import React from 'react'

/**
 * BÖLÜM BAŞLIĞI + KURUMSAL VURGU ÇİZGİSİ
 * ============================================================================
 * Ana sayfadaki bölümler arasında görsel ritim kurar: başlık, sağında isteğe
 * bağlı bir aksiyon bağlantısı, altında kısa bir kurumsal vurgu çizgisi.
 *
 * Çizgi TAMAMEN DEKORATİFTİR (`aria-hidden`): bilgi taşımaz, yalnızca bölüm
 * sınırını gözle ayırt edilir kılar. Ekran okuyucu için bölümü ayıran şey
 * zaten `<section aria-labelledby>` ilişkisidir.
 *
 * Başlık ve aksiyon `items-baseline` ile aynı satırda tutulur; dar ekranda
 * başlık sarar, bağlantı bütün kalır (bkz. FeaturedTrainingsBento içindeki
 * mobil hizalama notu).
 * ============================================================================
 */

type Props = {
  /** `<section aria-labelledby>` ile eşleşen id. */
  id: string
  title: string
  /** Başlığın üstünde küçük kategori etiketi. */
  eyebrow?: string | null
  /** Başlığın altında açıklama. */
  intro?: string | null
  /** Sağdaki aksiyon (genellikle `ArrowLink`). */
  action?: React.ReactNode
  className?: string
}

export const SectionHeading: React.FC<Props> = ({
  id,
  title,
  eyebrow,
  intro,
  action,
  className = '',
}) => (
  <div className={className}>
    {eyebrow ? (
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
        {eyebrow}
      </p>
    ) : null}

    <div className="flex items-baseline justify-between gap-4">
      <h2 id={id} className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {action}
    </div>

    {/* Kurumsal vurgu çizgisi — dekoratif. */}
    <span aria-hidden="true" className="mt-3 block h-0.5 w-12 rounded-full bg-brand-700" />

    {intro ? <p className="mt-4 max-w-2xl text-ink-600">{intro}</p> : null}
  </div>
)

export default SectionHeading
