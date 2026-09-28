'use client'

import React from 'react'

/**
 * GENEL FORM ALANLARI  (metin / çok satır / seçim)
 * ============================================================================
 * `contact/ContactForm.tsx` içinde özel (module-private) duran `Field` ve
 * `SelectField` buraya taşındı; iletişim formu ve eğitim başvuru formu AYNI
 * bileşenleri kullanır. Üçüncü bir kopya yazılsaydı erişilebilirlik
 * düzeltmeleri (aşağıdaki `aria-hidden` işareti gibi) bir formda yapılıp
 * ötekinde unutulurdu — bu projede bir kez tam olarak böyle oldu.
 *
 * ERİŞİLEBİLİRLİK (Kontrol Listesi 89 · 103 · 117)
 *   - Görünür `<label>`; yer tutucu etiket yerine geçmez (3.3.2).
 *   - Hata `aria-describedby` ile alana BAĞLANIR, `aria-invalid` işaretlenir.
 *   - Zorunluluk işareti `aria-hidden`: etiketin içinde durduğu için
 *     erişilebilir isme karışıyordu ("Konu(zorunlu)"); zorunluluk yardımcı
 *     teknolojiye `required` + `aria-required` ile ulaşır
 *     (gerekçe: auth/AuthField.tsx).
 * ============================================================================
 */

type OrtakProps = {
  id: string
  name: string
  label: string
  required?: boolean
  error?: string
  /** "(zorunlu)" — parantez burada eklenir. */
  requiredHint: string
  hint?: string
}

export type TextFieldProps = OrtakProps & {
  type?: string
  autoComplete?: string
  maxLength?: number
  multiline?: boolean
  defaultValue?: string
}

const ALAN_SINIFI = (hatali: boolean) =>
  `mt-2 w-full rounded-card border bg-surface px-4 py-2.5 text-ink-900 placeholder:text-ink-500 ${
    hatali ? 'border-danger-700' : 'border-line-strong'
  }`

const Etiket: React.FC<{ id: string; label: string; required?: boolean; requiredHint: string }> = ({
  id,
  label,
  required,
  requiredHint,
}) => (
  <label htmlFor={id} className="block font-medium text-ink-700">
    {label}
    {required ? (
      <span aria-hidden="true" className="ms-1 font-normal text-ink-600">
        ({requiredHint})
      </span>
    ) : null}
  </label>
)

const AltMetin: React.FC<{ hintId: string; errorId: string; hint?: string; error?: string }> = ({
  hintId,
  errorId,
  hint,
  error,
}) => (
  <>
    {hint ? (
      <p id={hintId} className="mt-1 text-sm text-ink-600">
        {hint}
      </p>
    ) : null}
    {error ? (
      <p id={errorId} className="mt-1 text-sm font-medium text-danger-700">
        {error}
      </p>
    ) : null}
  </>
)

export const TextField: React.FC<TextFieldProps> = ({
  id,
  name,
  label,
  required,
  type = 'text',
  autoComplete,
  maxLength,
  error,
  requiredHint,
  multiline,
  hint,
  defaultValue,
}) => {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  const shared = {
    id,
    name,
    required,
    maxLength,
    autoComplete,
    defaultValue,
    'aria-required': required || undefined,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
    className: ALAN_SINIFI(Boolean(error)),
  }

  return (
    <div>
      <Etiket id={id} label={label} required={required} requiredHint={requiredHint} />
      {multiline ? (
        <textarea {...shared} rows={6} className={`${shared.className} min-h-40`} />
      ) : (
        <input {...shared} type={type} className={`${shared.className} min-h-11`} />
      )}
      <AltMetin hintId={hintId} errorId={errorId} hint={hint} error={error} />
    </div>
  )
}

/**
 * Seçim alanı. `TextField` ile aynı etiket/hata düzeni; ayrı bileşen çünkü
 * `<select>` `maxLength`/`autoComplete` almaz ve seçenekleri çocuk olarak alır.
 * Denetimli (`value`+`onChange`) ya da denetimsiz (`defaultValue`) kullanılır.
 */
export const SelectField: React.FC<
  OrtakProps & {
    value?: string
    onChange?: (value: string) => void
    defaultValue?: string
    children: React.ReactNode
  }
> = ({ id, name, label, required, requiredHint, hint, error, value, onChange, defaultValue, children }) => {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  return (
    <div>
      <Etiket id={id} label={label} required={required} requiredHint={requiredHint} />
      <select
        id={id}
        name={name}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...(onChange ? { value, onChange: (e) => onChange(e.target.value) } : { defaultValue })}
        className={`${ALAN_SINIFI(Boolean(error))} min-h-11`}
      >
        {children}
      </select>
      <AltMetin hintId={hintId} errorId={errorId} hint={hint} error={error} />
    </div>
  )
}
