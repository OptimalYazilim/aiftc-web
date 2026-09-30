'use client'

import { useTranslations } from 'next-intl'
import React, { useActionState, useId, useState } from 'react'

import {
  submitRegistration,
  type RegistrationFormState,
} from '@/app/(frontend)/[locale]/basvuru/actions'
import { AuthNotice } from '@/components/auth/AuthField'
import { FieldGroup } from '@/components/ui/FieldGroup'
import { SelectField, TextField } from '@/components/ui/FormField'
import { FormErrorSummary } from '@/components/ui/FormErrorSummary'
import { LiveRegion } from '@/components/ui/LiveRegion'
import { FOCUS_COUNTRIES } from '@/fields/options'
import { ekAlanAdi, type BasvuruSorusu } from '@/lib/applicationQuestions'
import type { Locale } from '@/i18n/locales'
import { optionLabel } from '@/lib/optionLabel'

/**
 * EĞİTİM BAŞVURU FORMU
 * ============================================================================
 * `contact/ContactForm.tsx` ile aynı iskelet (useActionState + ortak alan
 * bileşenleri + hata özeti + açık rıza grubu); farkı hedef koleksiyon ve
 * alan kümesidir. Ortak alan bileşenleri `ui/FormField` içindedir — iki form
 * aynı erişilebilirlik düzeltmelerini paylaşır.
 *
 * DENETİMSİZ ALANLAR. Hiçbir alan React durumunda tutulmaz; sunucu eylemi
 * FormData'yı okur. Böylece form JavaScript hidrasyonundan ÖNCE de
 * gönderilebilir ve gereksiz yeniden çizim olmaz. Tek istisna yok — eğitim
 * seçimi de denetimsiz: seçim değişince gizlenecek/gösterilecek bir alan
 * bulunmuyor.
 *
 * OTURUM VARSA AD/E-POSTA ÖN DOLU GELİR (sunucu sayfadan `varsayilan` ile).
 * Alanlar yine düzenlenebilir: kişi başkası adına (örn. ekip arkadaşı) da
 * başvurabilir; kilitlemek bu yolu kapatırdı. Kayıt yine de oturumdaki
 * hesaba bağlanır — `user` ilişkisi kimin GÖNDERDİĞİNİ, `email` alanı kimin
 * KATILACAĞINI söyler.
 * ============================================================================
 */

const INITIAL_STATE: RegistrationFormState = { status: 'idle' }

export type TrainingOption = { id: number; title: string; questions?: BasvuruSorusu[] }

type Props = {
  locale: Locale
  consentText?: string | null
  /** Başvuruya AÇIK, yayındaki eğitimler. */
  trainings: TrainingOption[]
  /** `?egitim=<id>` ile gelindiğinde ön seçim. */
  defaultTrainingId?: number | null
  varsayilan?: { fullName?: string | null; email?: string | null }
}

export const RegistrationForm: React.FC<Props> = ({
  locale,
  consentText,
  trainings,
  defaultTrainingId,
  varsayilan,
}) => {
  const t = useTranslations('registration')
  const [state, formAction, pending] = useActionState(submitRegistration, INITIAL_STATE)
  const base = useId()

  const errors = state.fieldErrors ?? {}
  /* Sunucu hatasında gönderilen değerler (bkz. RegistrationFormState.values). */
  const g = state.values ?? {}

  /*
    SEÇİLİ EĞİTİM DURUMDA TUTULUR — sorular ona göre değişir. Hook'lar erken
    dönüşlerden ÖNCE çağrılmalı; başlangıç değeri de bu yüzden burada.
  */
  const [secilenEgitim, setSecilenEgitim] = useState(
    defaultTrainingId && trainings.some((e) => e.id === defaultTrainingId)
      ? String(defaultTrainingId)
      : '',
  )
  const sorular = trainings.find((e) => String(e.id) === secilenEgitim)?.questions ?? []

  const etiketler: Record<string, string> = {
    ...Object.fromEntries(sorular.map((s) => [ekAlanAdi(s.id), s.label])),
    training: t('fieldTraining'),
    fullName: t('fieldFullName'),
    email: t('fieldEmail'),
    phone: t('fieldPhone'),
    organization: t('fieldOrganization'),
    position: t('fieldPosition'),
    country: t('fieldCountry'),
    notes: t('fieldNotes'),
    consent: t('fieldConsent'),
  }

  const hataListesi = Object.entries(errors)
    .filter(([, mesaj]) => Boolean(mesaj))
    .map(([alan, mesaj]) => ({ alanId: `${base}-${alan}`, mesaj: `${etiketler[alan] ?? alan}: ${mesaj}` }))

  /*
    Başarı: form kaldırılır, `role="status"` bildirimi kalır. Formu bırakmak
    kişiyi ikinci kez göndermeye davet ederdi — mükerrer denetimi onu zaten
    reddeder ama kafa karıştırmanın anlamı yok.
  */
  if (state.status === 'success') {
    return (
      <>
        <LiveRegion mesaj={`${t('formSuccessTitle')}. ${state.message ?? ''}`} />
        <AuthNotice ton="basari" baslik={t('formSuccessTitle')} rol="status">
          <p>{state.message}</p>
        </AuthNotice>
      </>
    )
  }

  if (trainings.length === 0) {
    return (
      <AuthNotice ton="bilgi" baslik={t('noOpenTrainingsTitle')} rol="status">
        <p>{t('noOpenTrainings')}</p>
      </AuthNotice>
    )
  }

  /*
    Aydınlatma metni sayfadan gelir (üç kademeli yedekle — basvuru/page.tsx);
    burada yalnızca güvenlik ağı: yine de boşsa form GÖNDERİLEMEZ. Rıza,
    hangi metne verildiği belli olmayan bir kutuyla alınamaz.
  */
  const rizaMetni = consentText?.trim()
  if (!rizaMetni) {
    return (
      <AuthNotice ton="uyari" baslik={t('formUnavailableTitle')} rol="status">
        <p>{t('formUnavailable')}</p>
      </AuthNotice>
    )
  }

  return (
    <form action={formAction} noValidate={false} className="space-y-8">
      <FormErrorSummary
        hatalar={hataListesi}
        baslik={t('errorSummaryCount', { sayi: hataListesi.length })}
        belgeBasligiSablonu={String(t.raw('errorTitlePrefix'))}
      />

      {state.status === 'error' && hataListesi.length === 0 && state.message ? (
        <AuthNotice ton="hata" baslik={t('formFailedTitle')} rol="alert">
          <p>{state.message}</p>
        </AuthNotice>
      ) : null}

      <input type="hidden" name="locale" value={locale} />

      {/* Bal küpü — ekran dışı, Tab sırasında değil, otomatik doldurma kapalı. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor={`${base}-website`}>Website</label>
        <input id={`${base}-website`} type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <FieldGroup baslik={t('groupTraining')} className="space-y-5">
        <SelectField
          id={`${base}-training`}
          name="training"
          label={t('fieldTraining')}
          required
          requiredHint={t('requiredHint')}
          hint={t('fieldTrainingHint')}
          error={errors.training}
          value={secilenEgitim}
          onChange={setSecilenEgitim}
        >
          <option value="">{t('optionChoose')}</option>
          {trainings.map((egitim) => (
            <option key={egitim.id} value={egitim.id}>
              {egitim.title}
            </option>
          ))}
        </SelectField>
      </FieldGroup>

      {/*
        EĞİTİME ÖZEL SORULAR — yalnızca seçili eğitimin soruları. Eğitim
        değişince grup yeniden kurulur (`key`), önceki eğitimin cevapları
        sessizce gönderilmez. Alanlar diğer alanlarla aynı erişilebilirlik
        kalıbını kullanır: görünür etiket, programatik zorunluluk, hata
        `aria-describedby` ile bağlı ve hata özetinde listelenir.
      */}
      {sorular.length > 0 ? (
        <FieldGroup key={secilenEgitim} baslik={t('groupQuestions')} className="space-y-5">
          {sorular.map((soru) => {
            const ad = ekAlanAdi(soru.id)
            const id = `${base}-${ad}`
            if (soru.type === 'checkbox') {
              const hataId = `${id}-error`
              const ipucuId = `${id}-hint`
              const tarif = [errors[ad] ? hataId : null, soru.help ? ipucuId : null].filter(Boolean).join(' ')
              return (
                <div key={soru.id}>
                  <div className="flex items-start gap-3">
                    <input
                      id={id}
                      name={ad}
                      type="checkbox"
                      defaultChecked={g[ad] === 'on'}
                      required={soru.required}
                      aria-required={soru.required || undefined}
                      aria-invalid={errors[ad] ? true : undefined}
                      aria-describedby={tarif || undefined}
                      className="mt-1 h-5 w-5 shrink-0 accent-brand-700"
                    />
                    <label htmlFor={id} className="text-ink-700">
                      {soru.label}
                      {soru.required ? (
                        <span aria-hidden="true" className="ms-1 text-ink-600">
                          ({t('requiredHint')})
                        </span>
                      ) : null}
                    </label>
                  </div>
                  {soru.help ? (
                    <p id={ipucuId} className="mt-1 text-sm text-ink-600">
                      {soru.help}
                    </p>
                  ) : null}
                  {errors[ad] ? (
                    <p id={hataId} className="mt-1 text-sm font-medium text-danger-700">
                      {errors[ad]}
                    </p>
                  ) : null}
                </div>
              )
            }
            if (soru.type === 'select') {
              return (
                <SelectField
                  key={soru.id}
                  id={id}
                  name={ad}
                  label={soru.label}
                  required={soru.required}
                  requiredHint={t('requiredHint')}
                  hint={soru.help ?? undefined}
                  error={errors[ad]}
                  defaultValue={g[ad] ?? ''}
                >
                  <option value="">{t('optionChoose')}</option>
                  {soru.options?.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </SelectField>
              )
            }
            return (
              <TextField
                key={soru.id}
                id={id}
                name={ad}
                label={soru.label}
                required={soru.required}
                requiredHint={t('requiredHint')}
                multiline={soru.type === 'textarea'}
                maxLength={soru.type === 'textarea' ? 2000 : 300}
                hint={soru.help ?? undefined}
                error={errors[ad]}
                defaultValue={g[ad]}
              />
            )
          })}
        </FieldGroup>
      ) : null}

      <FieldGroup baslik={t('groupApplicant')} className="space-y-5">
        <TextField
          id={`${base}-fullName`}
          name="fullName"
          label={t('fieldFullName')}
          required
          requiredHint={t('requiredHint')}
          autoComplete="name"
          maxLength={120}
          defaultValue={g.fullName ?? varsayilan?.fullName ?? undefined}
          error={errors.fullName}
        />
        <TextField
          id={`${base}-email`}
          name="email"
          type="email"
          label={t('fieldEmail')}
          required
          requiredHint={t('requiredHint')}
          autoComplete="email"
          maxLength={200}
          defaultValue={g.email ?? varsayilan?.email ?? undefined}
          error={errors.email}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id={`${base}-phone`}
            name="phone"
            type="tel"
            label={t('fieldPhone')}
            requiredHint={t('requiredHint')}
            autoComplete="tel"
            defaultValue={g.phone}
            maxLength={40}
            hint={t('fieldPhoneHint')}
            error={errors.phone}
          />
          <TextField
            id={`${base}-position`}
            name="position"
            label={t('fieldPosition')}
            requiredHint={t('requiredHint')}
            autoComplete="organization-title"
            defaultValue={g.position}
            maxLength={120}
            error={errors.position}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id={`${base}-organization`}
            name="organization"
            label={t('fieldOrganization')}
            requiredHint={t('requiredHint')}
            autoComplete="organization"
            defaultValue={g.organization}
            maxLength={160}
            error={errors.organization}
          />
          <SelectField
            id={`${base}-country`}
            name="country"
            label={t('fieldCountry')}
            requiredHint={t('requiredHint')}
            defaultValue={g.country ?? ''}
            error={errors.country}
          >
            <option value="">{t('optionNotSpecified')}</option>
            {FOCUS_COUNTRIES.map((ulke) => (
              <option key={ulke.value} value={ulke.value}>
                {optionLabel(FOCUS_COUNTRIES, ulke.value, locale)}
              </option>
            ))}
          </SelectField>
        </div>
        <TextField
          id={`${base}-notes`}
          name="notes"
          label={t('fieldNotes')}
          requiredHint={t('requiredHint')}
          multiline
          maxLength={2000}
          hint={t('fieldNotesHint')}
          defaultValue={g.notes}
          error={errors.notes}
        />
      </FieldGroup>

      <FieldGroup baslik={t('groupConsent')} gizliBaslik>
        <div className="flex items-start gap-3">
          <input
            id={`${base}-consent`}
            name="consent"
            type="checkbox"
            defaultChecked={g.consent === 'on'}
            required
            aria-required="true"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? `${base}-consent-error` : undefined}
            className="mt-1 h-5 w-5 shrink-0 accent-brand-700"
          />
          <label htmlFor={`${base}-consent`} className="text-ink-700">
            {rizaMetni}
          </label>
        </div>
        {errors.consent ? (
          <p id={`${base}-consent-error`} className="mt-1 text-sm font-medium text-danger-700">
            {errors.consent}
          </p>
        ) : null}
      </FieldGroup>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 items-center justify-center rounded-sm bg-brand-700 px-8 text-sm font-bold text-white transition-colors duration-300 hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-ink-500 focus-visible:bg-brand-800"
      >
        {pending ? t('formSending') : t('formSubmit')}
      </button>
    </form>
  )
}

export default RegistrationForm
