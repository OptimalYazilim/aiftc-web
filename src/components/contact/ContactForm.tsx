'use client'

import { useTranslations } from 'next-intl'
import React, { useActionState, useId, useState } from 'react'

import { FOCUS_COUNTRIES, SUBMISSION_TYPES } from '@/fields/options'
import { FieldGroup } from '@/components/ui/FieldGroup'
import { FormErrorSummary } from '@/components/ui/FormErrorSummary'
import type { Locale } from '@/i18n/locales'
import { optionLabel } from '@/lib/optionLabel'

import {
  submitContactForm,
  type ContactFormState,
} from '@/app/(frontend)/[locale]/iletisim/actions'

/**
 * İLETİŞİM / ÖN BİLGİ FORMU  (Şartname 6.9, 12.2, 13)
 * ============================================================================
 * ERİŞİLEBİLİRLİK — her karar bir WCAG maddesine bağlı:
 *   - Her alanın GÖRÜNÜR `<label>`ı vardır (3.3.2). Yalnızca placeholder
 *     kullanmak yeterli değildir: metin yazılmaya başlayınca kaybolur.
 *   - Zorunlu alanlar hem `required` hem görünür bir "(zorunlu)" metni taşır;
 *     yıldız işareti tek başına ekran okuyucuda anlam taşımaz (1.4.1).
 *   - Hata mesajları alana `aria-describedby` ile BAĞLANIR ve `aria-invalid`
 *     işaretlenir (3.3.1). Özet mesaj `role="alert"` ile duyurulur.
 *   - `autoComplete` değerleri tarayıcının otomatik doldurmasını sağlar
 *     (1.3.5 Girdi Amacını Belirleme).
 *   - Gönderim sonucu `role="status"` ile duyurulur (4.1.3).
 *
 * AŞAMALI GELİŞTİRME
 * Form bir sunucu eylemine (`action`) bağlıdır. JavaScript yüklenmemişse
 * tarayıcı formu normal bir POST olarak gönderir ve eylem yine çalışır;
 * yalnızca satır içi hata gösterimi kaybolur.
 *
 * KVKK: onay kutusu işaretlenmeden gönderim SUNUCUDA reddedilir; buradaki
 * `required` yalnızca ilk savunma hattıdır.
 * ============================================================================
 */

const INITIAL_STATE: ContactFormState = { status: 'idle' }

type FieldProps = {
  id: string
  name: string
  label: string
  required?: boolean
  type?: string
  autoComplete?: string
  maxLength?: number
  error?: string
  requiredHint: string
  multiline?: boolean
  hint?: string
}

const Field: React.FC<FieldProps> = ({
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
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
    className: `mt-2 w-full rounded-card border bg-surface px-4 py-2.5 text-ink-900 placeholder:text-ink-500 ${
      error ? 'border-danger-700' : 'border-line-strong'
    }`,
  }

  return (
    <div>
      <label htmlFor={id} className="block font-medium text-ink-700">
        {label}
        {required ? (
          <span className="ms-1 font-normal text-ink-600">({requiredHint})</span>
        ) : null}
      </label>

      {multiline ? (
        <textarea {...shared} rows={6} className={`${shared.className} min-h-40`} />
      ) : (
        <input {...shared} type={type} className={`${shared.className} min-h-11`} />
      )}

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
    </div>
  )
}

/**
 * Seçim alanı. `Field` ile aynı etiket/hata düzenini kullanır; ayrı bir
 * bileşen çünkü `<select>` `maxLength`/`autoComplete` almaz ve seçenekleri
 * kendi çizer.
 */
const SelectField: React.FC<{
  id: string
  name: string
  label: string
  required?: boolean
  requiredHint: string
  hint?: string
  value?: string
  onChange?: (value: string) => void
  defaultValue?: string
  children: React.ReactNode
}> = ({ id, name, label, required, requiredHint, hint, value, onChange, defaultValue, children }) => (
  <div>
    <label htmlFor={id} className="block font-medium text-ink-900">
      {label}
      {required ? (
        <>
          {' '}
          <span className="text-danger-700" aria-hidden="true">
            *
          </span>
          <span className="sr-only"> ({requiredHint})</span>
        </>
      ) : null}
    </label>
    <select
      id={id}
      name={name}
      required={required}
      {...(onChange ? { value, onChange: (e) => onChange(e.target.value) } : { defaultValue })}
      className="mt-2 block min-h-11 w-full rounded border border-line-strong bg-surface px-3 text-ink-900 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700"
    >
      {children}
    </select>
    {hint ? <p className="mt-1 text-sm text-ink-600">{hint}</p> : null}
  </div>
)

export type TrainingOption = { id: number; title: string }

type ContactFormProps = {
  locale: Locale
  consentText?: string | null
  /** Başvuru türü seçildiğinde listelenecek YAYINDAKİ eğitimler. */
  trainings?: TrainingOption[]
  /** Eğitim sayfasından gelindiğinde ön seçim (bkz. ApplicationCta). */
  defaultType?: string
  defaultTrainingId?: number | null
}

export const ContactForm: React.FC<ContactFormProps> = ({
  locale,
  consentText,
  trainings = [],
  defaultType,
  defaultTrainingId,
}) => {
  const t = useTranslations('contact')
  const [state, formAction, pending] = useActionState(submitContactForm, INITIAL_STATE)
  const base = useId()

  /*
    Talep türü DENETİMLİ (controlled) bir alandır: seçim değişince "Bağlı
    Eğitim" alanının görünürlüğü de değişmeli. Diğer alanlar denetimsiz
    bırakıldı — gereksiz yeniden çizim yapmasınlar.

    Eğitim listesi boşsa başvuru seçeneği yine sunulur; kullanıcı hangi
    eğitim olduğunu mesaj alanında yazabilir. Seçeneği gizlemek, başvurmak
    isteyen ziyaretçiyi çıkmaza sokardı.
  */
  const [submissionType, setSubmissionType] = useState(
    SUBMISSION_TYPES.some((option) => option.value === defaultType) ? String(defaultType) : 'contact',
  )

  const errors = state.fieldErrors ?? {}

  /*
    HATA ÖZETİ LİSTESİ  (Kontrol Listesi 103 · 105 · 106 · 107)
    Alan bazlı mesajlar yerinde kalır; bu liste onların yerine GEÇMEZ. Uzun
    bir formda kullanıcının "kaç hata var, nerede" sorusunu tek bakışta
    yanıtlar ve her satır ilgili alana bağlantı verir — araya giren alanları
    tek tek gezmek gerekmez (105).

    Mesaj GÖRÜNÜR ETİKETLE başlar (89): "Ad Soyad: Bu alan gereklidir".
    Yalnız "Bu alan gereklidir" hangi alan olduğunu söylemezdi.
  */
  const hataEtiketleri: Record<string, string> = {
    fullName: t('fieldFullName'),
    organization: t('fieldOrganization'),
    email: t('fieldEmail'),
    subject: t('fieldSubject'),
    message: t('fieldMessage'),
    consent: t('fieldConsent'),
  }

  const hataListesi = Object.entries(errors)
    .filter(([, mesaj]) => Boolean(mesaj))
    .map(([alan, mesaj]) => ({
      alanId: `${base}-${alan}`,
      mesaj: `${hataEtiketleri[alan] ?? alan}: ${mesaj}`,
    }))

  if (state.status === 'success') {
    return (
      /*
        BAŞARI BİLDİRİMİ
        `role="status"` ile ekran okuyucuya duyurulur (WCAG 4.1.3): form
        kaybolduğu için görsel değişikliği görmeyen kullanıcı aksi hâlde ne
        olduğunu anlayamazdı.

        Onay YALNIZCA renkle anlatılmaz (1.4.1): yeşil zeminin yanında hem
        onay ikonu hem açık bir başlık metni vardır. İkon `aria-hidden` —
        bilgiyi yanındaki metin taşıyor, iki kez duyurulmamalı (1.1.1).
      */
      <div
        role="status"
        className="flex gap-4 rounded-card border-2 border-success-800 bg-brand-50 p-6 text-ink-900"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          className="mt-0.5 h-7 w-7 shrink-0 text-success-800"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9.5" strokeWidth="1.6" />
          <path d="m7.8 12.3 2.9 2.9 5.5-5.9" />
        </svg>
        <div className="min-w-0">
          <p className="text-lg font-bold">{t('formSuccessTitle')}</p>
          <p className="mt-1.5 text-ink-700">{state.message ?? t('formSuccess')}</p>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} noValidate={false} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />

      {/*
        Bal küpü: ekrandan ve odak sırasından tamamen çıkarılır. `hidden`
        yerine konumlandırma kullanılır — bazı botlar `hidden` alanları atlar.
        `tabIndex={-1}` ve `aria-hidden` gerçek kullanıcıya asla ulaşmamasını
        sağlar; dolduran biri varsa bottur.
      */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${base}-website`}>Web sitesi</label>
        <input
          id={`${base}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {state.status === 'error' && state.message ? (
        <p
          role="alert"
          className="rounded-card border border-danger-700 bg-surface p-4 font-medium text-danger-700"
        >
          {state.message}
        </p>
      ) : null}

      {/* Alan bazlı hataların listesi — formun başında, alanlardan önce. */}
      <FormErrorSummary
        hatalar={hataListesi}
        baslik={t('errorSummaryCount', { sayi: hataListesi.length })}
        belgeBasligiSablonu={String(t.raw('errorTitlePrefix'))}
      />

      {/*
        TALEP TÜRÜ — Şartname 6.4 "başvuru süreçleri" ile 6.9 "iletişim" aynı
        gelen kutusuna düşer; ayrımı bu alan yapar. Sunucu değeri yeniden
        doğrular (bkz. actions.ts), buradaki seçim tek başına güvenilmez.
      */}
      {/*
        BENZER ALANLAR GRUPLANDI  (Kontrol Listesi 112 · 113)
        Dort anlamli kume: talep turu, iletisim bilgileri, mesaj, onay.
        `fieldset` kenarliksiz ve dolgusuzdur — gorsel duzen degismez,
        degisen yalnizca yardimci teknolojinin duyurdugu yapidir.
      */}
      <FieldGroup baslik={t('groupRequest')} className="space-y-5">
      <SelectField
        id={`${base}-submissionType`}
        name="submissionType"
        label={t('fieldSubmissionType')}
        required
        requiredHint={t('requiredHint')}
        value={submissionType}
        onChange={setSubmissionType}
      >
        {SUBMISSION_TYPES.map((option) => (
          <option key={option.value} value={option.value}>
            {optionLabel(SUBMISSION_TYPES, option.value, locale)}
          </option>
        ))}
      </SelectField>

      {submissionType === 'training-application' && trainings.length > 0 ? (
        <SelectField
          id={`${base}-relatedTraining`}
          name="relatedTraining"
          label={t('fieldRelatedTraining')}
          requiredHint={t('requiredHint')}
          hint={t('fieldRelatedTrainingHint')}
          defaultValue={defaultTrainingId ? String(defaultTrainingId) : ''}
        >
          <option value="">{t('optionNotSpecified')}</option>
          {trainings.map((training) => (
            <option key={training.id} value={training.id}>
              {training.title}
            </option>
          ))}
        </SelectField>
      ) : null}

      </FieldGroup>

      <FieldGroup baslik={t('groupContact')} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={`${base}-fullName`}
          name="fullName"
          label={t('fieldFullName')}
          required
          autoComplete="name"
          maxLength={120}
          error={errors.fullName}
          requiredHint={t('requiredHint')}
        />
        <Field
          id={`${base}-organization`}
          name="organization"
          label={t('fieldOrganization')}
          autoComplete="organization"
          maxLength={160}
          error={errors.organization}
          requiredHint={t('requiredHint')}
          hint={t('fieldOrganizationHint')}
        />

        {/*
          Ülke serbest metin değil ISO kodlu seçimdir (Şartname 21). Aynı
          ülkenin üç dilde üç ayrı değer olarak birikmesini önler; panelde
          süzülebilir.
        */}
        <SelectField
          id={`${base}-country`}
          name="country"
          label={t('fieldCountry')}
          requiredHint={t('requiredHint')}
          defaultValue=""
        >
          <option value="">{t('optionNotSpecified')}</option>
          {FOCUS_COUNTRIES.map((option) => (
            <option key={option.value} value={option.value}>
              {optionLabel(FOCUS_COUNTRIES, option.value, locale)}
            </option>
          ))}
        </SelectField>
      </div>

      <Field
        id={`${base}-email`}
        name="email"
        label={t('fieldEmail')}
        required
        type="email"
        autoComplete="email"
        maxLength={200}
        error={errors.email}
        requiredHint={t('requiredHint')}
      />

      </FieldGroup>

      <FieldGroup baslik={t('groupMessage')} className="space-y-5">
      <Field
        id={`${base}-subject`}
        name="subject"
        label={t('fieldSubject')}
        required
        maxLength={160}
        error={errors.subject}
        requiredHint={t('requiredHint')}
      />

      <Field
        id={`${base}-message`}
        name="message"
        label={t('fieldMessage')}
        required
        multiline
        maxLength={4000}
        error={errors.message}
        requiredHint={t('requiredHint')}
      />

      </FieldGroup>

      {/* --- Açık rıza (Şartname 12.2) ------------------------------------ */}
      <FieldGroup baslik={t('groupConsent')} gizliBaslik>
        <div className="flex gap-3">
          <input
            id={`${base}-consent`}
            name="consent"
            type="checkbox"
            required
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? `${base}-consent-error` : undefined}
            className="mt-1 h-5 w-5 shrink-0"
          />
          <label htmlFor={`${base}-consent`} className="text-ink-700">
            {consentText?.trim() || t('consentFallback')}
          </label>
        </div>
        {errors.consent ? (
          <p
            id={`${base}-consent-error`}
            className="mt-1 text-sm font-medium text-danger-700"
          >
            {errors.consent}
          </p>
        ) : null}
      </FieldGroup>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center rounded bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-ink-500 focus-visible:bg-brand-800"
      >
        {pending ? t('formSending') : t('formSubmit')}
      </button>
    </form>
  )
}

export default ContactForm
