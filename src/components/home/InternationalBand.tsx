import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { FOCUS_COUNTRIES } from '@/fields/options'
import type { Locale } from '@/i18n/locales'
import { href } from '@/i18n/routes'
import { optionLabel } from '@/lib/optionLabel'

/**
 * ANA SAYFA — ULUSLARARASI KATILIMCILAR KAPANIŞ BANDI  (Şartname 6.1, 8)
 * ============================================================================
 * Sayfanın son bölümü bir sonraki adımı söyler: merkezin hedef kitlesi Orta
 * Asya ve komşu ülkelerin ormancılık personelidir. Odak ülkeler, katılımcı
 * rehberi ve iletişim tek bir bantta toplanır.
 *
 * Ülke listesi `fields/options.ts > FOCUS_COUNTRIES` sözlüğünden gelir
 * (ISO 3166-1 kodu + üç dilde ad); "Diğer" seçeneği gösterilmez.
 *
 * Arka plandaki eş yükselti çizgileri dekoratiftir (`aria-hidden`) — arazi
 * ve orman planlamasının haritacılık diline gönderme yapar.
 * ============================================================================
 */
export const InternationalBand = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations('home')
  const ulkeler = FOCUS_COUNTRIES.filter((ulke) => ulke.value !== 'OTHER')

  return (
    <section aria-labelledby="home-international" className="bg-surface-warm">
      <div className="container-page py-16 lg:py-24">
        <div className="relative isolate overflow-hidden rounded-card bg-shell-900 px-6 py-12 text-white sm:px-10 lg:px-16 lg:py-16">
          {/* Eş yükselti çizgileri */}
          <svg
            aria-hidden="true"
            className="absolute -right-24 -top-24 -z-10 h-[34rem] w-[34rem] text-white/[0.07]"
            viewBox="0 0 400 400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            {[40, 70, 100, 130, 160, 190, 220].map((r, i) => (
              <path
                key={r}
                d={`M ${200 - r} 200 C ${200 - r} ${200 - r * 0.9 - i * 4}, ${200 + r * 0.8} ${200 - r - i * 6}, ${200 + r} ${200 - i * 3} S ${200 + r * 0.3} ${200 + r * 1.05}, ${200 - r * 0.2} ${200 + r * 0.95} S ${200 - r} ${200 + r * 0.4}, ${200 - r} 200 Z`}
              />
            ))}
          </svg>

          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-100">
                <span aria-hidden="true" className="h-px w-8 bg-brand-100/70" />
                {t('guideEyebrow')}
              </p>
              <h2
                id="home-international"
                className="mt-3 text-balance text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl"
              >
                {t('guideTitle')}
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/80">{t('guideIntro')}</p>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <Link
                  href={href('international-guide', locale)}
                  className="group inline-flex min-h-12 items-center gap-2 rounded-md bg-white px-6 font-semibold text-shell-950 transition-colors duration-300 hover:bg-brand-50 focus-within:bg-brand-50"
                >
                  {t('guideCta')}
                  <svg aria-hidden="true" viewBox="0 0 16 16" width="1em" height="1em" className="transition-transform duration-300 group-hover:translate-x-1 group-focus-within:translate-x-1">
                    <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M2.5 8h11M9.5 4l4 4-4 4" />
                  </svg>
                </Link>
                <Link
                  href={href('contact', locale)}
                  className="inline-flex min-h-12 items-center font-semibold text-white underline decoration-white/40 decoration-2 underline-offset-8 transition-colors hover:decoration-white focus-visible:decoration-white"
                >
                  {t('contactCta')}
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                {t('countriesLabel')}
              </p>
              <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                {ulkeler.map((ulke) => (
                  <li
                    key={ulke.value}
                    className="flex items-center gap-3 rounded-md border border-white/15 bg-white/[0.04] px-3 py-2.5"
                  >
                    <span className="font-mono text-xs font-semibold tracking-wider text-brand-100">
                      {ulke.value}
                    </span>
                    <span className="text-sm text-white/90">{optionLabel(FOCUS_COUNTRIES, ulke.value, locale)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default InternationalBand
