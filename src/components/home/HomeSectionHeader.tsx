import React from 'react'

/**
 * ANA SAYFA BÖLÜM BAŞLIĞI
 * ============================================================================
 * Genel `SectionHeading` iç sayfalarda kullanılmaya devam eder; bu varyant
 * yalnızca ana sayfanın vitrin bölümleri içindir.
 *
 * Düzen: solda üst etiket (kısa çizgiyle) + büyük başlık, sağda açıklama ve
 * aksiyon. Geniş ekranda iki kolon, dar ekranda alt alta. Başlık ile açıklama
 * yan yana durunca bölüm girişi tek bir yatay blok olarak okunur ve dikey
 * alan kazanılır.
 *
 * `tone="dark"`: koyu zeminli bölümler için metin renkleri.
 * ============================================================================
 */
type Props = {
  id: string
  eyebrow?: string | null
  title: string
  intro?: string | null
  action?: React.ReactNode
  tone?: 'light' | 'dark'
}

export const HomeSectionHeader: React.FC<Props> = ({
  id,
  eyebrow,
  title,
  intro,
  action,
  tone = 'light',
}) => {
  const dark = tone === 'dark'

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-7">
        {eyebrow ? (
          <p
            className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] ${
              dark ? 'text-brand-100' : 'text-brand-700'
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-px w-8 ${dark ? 'bg-brand-100/70' : 'bg-brand-700'}`}
            />
            {eyebrow}
          </p>
        ) : null}
        <h2
          id={id}
          className={`mt-3 text-balance text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl ${
            dark ? 'text-white' : 'text-shell-900'
          }`}
        >
          {title}
        </h2>
      </div>

      {intro || action ? (
        <div
          className={`flex flex-col items-start gap-4 lg:col-span-5 lg:border-l lg:pl-8 ${
            dark ? 'lg:border-white/15' : 'lg:border-line'
          }`}
        >
          {intro ? (
            <p className={`max-w-md leading-relaxed ${dark ? 'text-white/75' : 'text-ink-600'}`}>
              {intro}
            </p>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  )
}

export default HomeSectionHeader
