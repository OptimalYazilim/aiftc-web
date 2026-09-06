'use client'

import { useTranslations } from 'next-intl'
import React, { useActionState, useId } from 'react'

import {
  enterVirtualClassroom,
  type ClassroomFormState,
} from '@/app/(frontend)/[locale]/sanal-sinif/[id]/actions'
import type { Locale } from '@/i18n/locales'

/**
 * SANAL SINIF ERİŞİM KAPISI
 * ============================================================================
 * Katılım şifresini alan form. Doğrulamanın TAMAMI sunucudadır
 * (`enterVirtualClassroom`); bu bileşen şifreyi bilmez, karşılaştırmaz ve
 * doğru şifreyi hiçbir biçimde taşımaz. İstemcide yapılan tek denetim
 * "alan boş mu" düzeyindedir ve yalnızca kullanıcıya erken geri bildirim
 * içindir — sunucu aynı denetimi tekrar yapar.
 *
 * ERİŞİLEBİLİRLİK
 *   - Hata `role="alert"` ile duyurulur ve alanla `aria-describedby`
 *     üzerinden ilişkilendirilir (WCAG 2.2 — 3.3.1).
 *   - Gönderim sırasında buton `aria-busy` alır; metni de değişir, yani
 *     durum yalnızca renkle anlatılmaz (1.4.1).
 *   - Alan `type="password"` ve `autoComplete="off"`: şifre omuz üstünden
 *     okunmasın, tarayıcı da kurumsal bir oda şifresini kaydetmeye çalışmasın.
 * ============================================================================
 */

const INITIAL_STATE: ClassroomFormState = { status: 'idle' }

type Props = {
  locale: Locale
  roomId: number
  /** Panelden girilen katılım yönergesi. Şifre BURAYA yazılmaz (şema notu). */
  instructions?: string | null
}

export const ClassroomGate: React.FC<Props> = ({ locale, roomId, instructions }) => {
  const t = useTranslations('classroom')
  const [state, formAction, pending] = useActionState(enterVirtualClassroom, INITIAL_STATE)
  const base = useId()

  const errorId = `${base}-error`
  const hasError = state.status === 'error' && Boolean(state.message)

  return (
    <div className="rounded-card border border-line bg-surface p-6 sm:p-8">
      <h2 className="text-xl font-bold tracking-tight text-ink-900">{t('gateTitle')}</h2>
      <p className="mt-2 text-ink-700">{t('gateIntro')}</p>

      {instructions ? (
        <p className="mt-4 whitespace-pre-line rounded border border-line bg-surface-alt p-4 text-ink-700">
          {instructions}
        </p>
      ) : null}

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="roomId" value={roomId} />

        <div>
          <label htmlFor={`${base}-code`} className="block font-medium text-ink-900">
            {t('fieldAccessCode')}{' '}
            <span className="text-danger-700" aria-hidden="true">
              *
            </span>
            <span className="sr-only">({t('requiredHint')})</span>
          </label>

          <input
            id={`${base}-code`}
            name="accessCode"
            type="password"
            required
            maxLength={200}
            autoComplete="off"
            aria-describedby={hasError ? errorId : undefined}
            aria-invalid={hasError || undefined}
            className="mt-2 block min-h-11 w-full rounded border border-line-strong bg-surface px-3 text-ink-900 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700"
          />
        </div>

        {hasError ? (
          <p
            id={errorId}
            role="alert"
            className="rounded border border-danger-700 bg-surface p-3 font-medium text-danger-700"
          >
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="inline-flex min-h-11 w-full items-center justify-center rounded bg-brand-800 px-5 font-semibold text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:bg-ink-500 sm:w-auto"
        >
          {pending ? t('gateSubmitting') : t('gateSubmit')}
        </button>
      </form>

      <p className="mt-6 border-t border-line pt-4 text-sm text-ink-600">{t('gateHelp')}</p>
    </div>
  )
}

export default ClassroomGate
