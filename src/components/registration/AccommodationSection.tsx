'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { FieldGroup } from '@/components/ui/FieldGroup'
import { TextField } from '@/components/ui/FormField'
import type { Locale } from '@/i18n/locales'
import {
  konaklamaDogrula,
  konaklamaHesapla,
  type KonaklamaAyarlari,
  type KonaklamaHatasi,
} from '@/lib/accommodation'

/**
 * KONAKLAMA ÖN BAŞVURUSU — FORM BÖLÜMÜ  (kurum kararı, 29.09.2026)
 * ============================================================================
 * "Konaklamak istiyorum" işaretlenince giriş/çıkış tarihleri sorulur. Seçim
 * değiştikçe gece dağılımı ve (tarifeler girilmişse) tahmini ücret, kapalı ve
 * dolu tarihler ile kuralı ihlal eden bir seçim ANINDA gösterilir. Bu yalnızca
 * yardımdır: bağlayıcı denetim ve ücret hesabı sunucuda aynı fonksiyonlarla
 * yeniden yapılır (lib/accommodation.ts, basvuru/actions.ts).
 *
 * Özet `aria-live="polite"` ile duyurulur: tarih değiştiren ekran okuyucu
 * kullanıcısı ücretin değiştiğini öğrenir. Dolu/kapalı tarihler görsel bir
 * takvim yerine OKUNUR bir liste olarak verilir — klavye ve ekran okuyucuyla
 * erişilebilir olan budur; tarih alanları tarayıcının kendi seçicisidir.
 * ============================================================================
 */

export type KonaklamaFormAyari = Pick<
  KonaklamaAyarlari,
  'maxNights' | 'rateInTraining' | 'rateOutsideTraining' | 'currency' | 'closedPeriods'
>

type Props = {
  base: string
  locale: Locale
  ayar: KonaklamaFormAyari
  /** Önümüzdeki dönemde kapasitesi dolmuş geceler ("YYYY-AA-GG"). */
  doluGeceler: string[]
  /** Seçili eğitimin tarihleri — gece dağılımı için. */
  egitim: { start: string | null; end: string | null }
  bugun: string
  errors: Record<string, string | undefined>
  /** Sunucu hatası sonrası geri gelen değerler. */
  g: Record<string, string>
  requiredHint: string
}

const tarihYaz = (gun: string, locale: Locale) =>
  new Date(`${gun}T00:00:00Z`).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  })

/** Ardışık günleri "a – b" aralıklarına indirger (uzun listeyi okunur tutar). */
const araliklar = (gunler: string[]): [string, string][] => {
  const sirali = [...gunler].sort()
  const sonuc: [string, string][] = []
  for (const g of sirali) {
    const son = sonuc.at(-1)
    const ertesi = son ? new Date(Date.parse(`${son[1]}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10) : null
    if (son && ertesi === g) son[1] = g
    else sonuc.push([g, g])
  }
  return sonuc
}

export const AccommodationSection: React.FC<Props> = ({
  base,
  locale,
  ayar,
  doluGeceler,
  egitim,
  bugun,
  errors,
  g,
  requiredHint,
}) => {
  const t = useTranslations('registration')
  const [istiyor, setIstiyor] = useState(g.accRequested === 'on')
  const [giris, setGiris] = useState(g.accCheckIn ?? '')
  const [cikis, setCikis] = useState(g.accCheckOut ?? '')

  const dolu = useMemo(() => new Set(doluGeceler), [doluGeceler])
  const hataMetni = (h: KonaklamaHatasi) => {
    switch (h.kod) {
      case 'zorunlu':
        return t('errorRequired')
      case 'gecersiz':
        return t('accErrInvalid')
      case 'gecmis':
        return t('accErrPast')
      case 'sira':
        return t('accErrOrder')
      case 'uzun':
        return t('accErrTooLong', { max: h.max })
      case 'kapali':
        return t('accErrClosed', { from: tarihYaz(h.from, locale), to: tarihYaz(h.to, locale) })
      case 'dolu':
        return t('accErrFull', { night: tarihYaz(h.gece, locale) })
    }
  }

  const anlik = giris && cikis ? konaklamaDogrula(giris, cikis, ayar, bugun, dolu) : null
  const hesap = giris && cikis && !anlik ? konaklamaHesapla(giris, cikis, egitim, ayar) : null
  const ucret =
    hesap?.estimatedCost != null
      ? new Intl.NumberFormat(locale, { style: 'currency', currency: ayar.currency, maximumFractionDigits: 2 }).format(
          hesap.estimatedCost,
        )
      : null

  const kapaliListe = ayar.closedPeriods.filter((d) => d.to >= bugun)
  const doluListe = araliklar(doluGeceler)
  const ozetId = `${base}-acc-summary`

  return (
    <FieldGroup baslik={t('groupAccommodation')} className="space-y-5">
      <div className="flex items-start gap-3">
        <input
          id={`${base}-accRequested`}
          name="accRequested"
          type="checkbox"
          checked={istiyor}
          onChange={(e) => setIstiyor(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-brand-700"
        />
        <label htmlFor={`${base}-accRequested`} className="text-ink-700">
          {t('accRequest')}
        </label>
      </div>

      {istiyor ? (
        <>
          <p className="text-sm text-ink-600">{t('accNote', { max: ayar.maxNights })}</p>

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id={`${base}-accCheckIn`}
              name="accCheckIn"
              type="date"
              label={t('accCheckIn')}
              required
              requiredHint={requiredHint}
              min={bugun}
              value={giris}
              onChange={setGiris}
              error={errors.accCheckIn}
            />
            <TextField
              id={`${base}-accCheckOut`}
              name="accCheckOut"
              type="date"
              label={t('accCheckOut')}
              required
              requiredHint={requiredHint}
              min={giris || bugun}
              value={cikis}
              onChange={setCikis}
              error={errors.accCheckOut}
            />
          </div>

          <div id={ozetId} aria-live="polite" className="rounded-card border border-line bg-surface-alt p-4 text-sm text-ink-700">
            {anlik ? (
              <p className="font-medium text-danger-700">{hataMetni(anlik)}</p>
            ) : hesap ? (
              <>
                <p>
                  {t('accSummary', {
                    nights: hesap.nights,
                    inTraining: hesap.nightsInTraining,
                    outside: hesap.nightsOutside,
                  })}
                </p>
                <p className="mt-1 font-semibold">{ucret ? t('accCost', { cost: ucret }) : t('accCostUnknown')}</p>
              </>
            ) : (
              <p>{t('accPickDates')}</p>
            )}
          </div>

          {kapaliListe.length > 0 || doluListe.length > 0 ? (
            <div className="text-sm text-ink-700">
              <p className="font-medium">{t('accUnavailable')}</p>
              <ul className="mt-1 list-disc ps-5">
                {kapaliListe.map((d) => (
                  <li key={`k-${d.from}`}>
                    {t('accClosedItem', { from: tarihYaz(d.from, locale), to: tarihYaz(d.to, locale) })}
                  </li>
                ))}
                {doluListe.map(([a, b]) => (
                  <li key={`d-${a}`}>
                    {a === b
                      ? t('accFullItemOne', { night: tarihYaz(a, locale) })
                      : t('accFullItemRange', { from: tarihYaz(a, locale), to: tarihYaz(b, locale) })}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </FieldGroup>
  )
}

export default AccommodationSection
