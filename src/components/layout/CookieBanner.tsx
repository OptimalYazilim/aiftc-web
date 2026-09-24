'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { ANALYTICS_CONSENT_KEY } from '@/lib/analytics'

/**
 * ÇEREZ BİLDİRİMİ VE TERCİH YÖNETİMİ  (Şartname 12.3)
 * ============================================================================
 * "Çerez bildirimi / Çerez tercih yönetimi, uygulanabilir ise /
 *  Analitik verilerin anonimleştirilmesi"
 *
 * KVKK duruşu:
 *  - Varsayılan RED. Onay verilene kadar hiçbir analitik olay gönderilmez
 *    (`lib/analytics.ts` içindeki `hasAnalyticsConsent` bekçisi).
 *  - "Kabul et" ve "Reddet" görsel olarak EŞİT ağırlıktadır; karanlık desen
 *    (dark pattern) kullanılmaz.
 *  - Tercih yalnızca tarayıcıda (`localStorage`) saklanır, sunucuya gitmez.
 *  - Zorunlu çerezler zaten onay gerektirmez; burada yalnızca analitik sorulur.
 *
 * Erişilebilirlik:
 *  - `role="region"` + `aria-label` ile landmark; içerik ANİDEN odak çalmaz.
 *  - Görsel olarak sayfanın altında sabittir ama DOM'da son sıradadır, böylece
 *    klavye sırası içeriği kesmez.
 *  - Kapatıldığında odak, sayfada kaybolmaması için gövdeye taşınır.
 * ============================================================================
 */

type Props = {
  text?: string | null
  policyHref?: string | null
  enabled?: boolean
  showPreferences?: boolean
}

type Decision = 'granted' | 'denied'

export const CookieBanner: React.FC<Props> = ({
  text,
  policyHref,
  enabled = true,
  showPreferences = true,
}) => {
  const t = useTranslations('cookies')
  const [visible, setVisible] = useState(false)
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return
    try {
      setVisible(window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === null)
    } catch {
      // localStorage kapalıysa (gizli mod, kurumsal politika) banner gösterme;
      // onay alınamadığı için analitik zaten çalışmayacaktır.
      setVisible(false)
    }
  }, [enabled])

  const decide = (decision: Decision) => {
    try {
      window.localStorage.setItem(ANALYTICS_CONSENT_KEY, decision)
    } catch {
      /* sessizce geç */
    }
    setVisible(false)
    document.getElementById('main-content')?.focus()
  }

  if (!enabled || !visible) return null

  const buttonBase =
    'inline-flex min-h-11 items-center justify-center rounded px-4 font-semibold transition-colors'

  return (
    <div
      ref={regionRef}
      role="region"
      aria-label={t('regionLabel')}
      // Yüzen katman gölgeyle değil, kalın bir üst çizgiyle ayrılır.
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-shell-900 bg-surface"
    >
      <div className="container-page flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <p className="m-0 max-w-3xl text-ink-700">
          {text || t('defaultText')}{' '}
          {policyHref ? (
            <Link
              href={policyHref}
              className="text-accent-700 underline underline-offset-4 hover:text-accent-600 focus-visible:text-accent-600"
            >
              {t('policyLink')}
            </Link>
          ) : null}
        </p>

        <div className="flex shrink-0 flex-wrap gap-2">
          {showPreferences ? (
            <button
              type="button"
              onClick={() => decide('denied')}
              className={`${buttonBase} border border-line-strong text-ink-700 hover:bg-surface-alt focus-visible:bg-surface-alt`}
            >
              {t('reject')}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => decide('granted')}
            className={`${buttonBase} bg-brand-700 text-white hover:bg-brand-800 focus-visible:bg-brand-800`}
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CookieBanner
