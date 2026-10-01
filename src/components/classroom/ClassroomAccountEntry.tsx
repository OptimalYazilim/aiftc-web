'use client'

import { useTranslations } from 'next-intl'
import React, { useActionState, useId } from 'react'

import {
  enterWithAccount,
  type ClassroomFormState,
} from '@/app/(frontend)/[locale]/sanal-sinif/[id]/actions'
import type { Locale } from '@/i18n/locales'

/**
 * SANAL SINIFA HESAPLA GİRİŞ
 * ============================================================================
 * Oturum açmış ve eğitime onaylı başvurusu olan kişiye sayfa bu kartı gösterir.
 * Şifre sorulmaz; karar sunucuda yeniden verilir (actions.ts →
 * `enterWithAccount`), bu bileşen yalnızca isteği gönderir. Başarılı olunca
 * sunucu jeton çerezini yazar ve sayfa yenilenerek sahneyi gösterir.
 *
 * Erişilebilirlik ClassroomGate ile aynıdır: hata `role="alert"`, gönderim
 * sırasında metin değişir (durum yalnızca renkle anlatılmaz).
 * ============================================================================
 */

const INITIAL_STATE: ClassroomFormState = { status: 'idle' }

type Props = {
  locale: Locale
  roomId: number
}

export const ClassroomAccountEntry: React.FC<Props> = ({ locale, roomId }) => {
  const t = useTranslations('classroom')
  const [state, formAction, pending] = useActionState(enterWithAccount, INITIAL_STATE)
  const errorId = `${useId()}-error`
  const hasError = state.status === 'error' && Boolean(state.message)

  return (
    <div className="rounded-card border border-brand-700 bg-surface p-6 sm:p-8">
      <h2 className="text-xl font-bold tracking-tight text-ink-900">{t('accountTitle')}</h2>
      <p className="mt-2 text-ink-700">{t('accountIntro')}</p>

      <form action={formAction} className="mt-6">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="roomId" value={roomId} />

        {hasError ? (
          <p
            id={errorId}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="mb-4 rounded border border-danger-700 bg-surface p-3 font-medium text-danger-700"
          >
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          aria-describedby={hasError ? errorId : undefined}
          className="inline-flex min-h-11 w-full items-center justify-center rounded bg-brand-800 px-5 font-semibold text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:bg-ink-500 sm:w-auto focus-visible:bg-brand-900"
        >
          {pending ? t('accountSubmitting') : t('accountSubmit')}
        </button>
      </form>
    </div>
  )
}

export default ClassroomAccountEntry
