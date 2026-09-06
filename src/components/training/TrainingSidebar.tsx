import { getTranslations } from 'next-intl/server'
import React from 'react'

import type { ExternalService, TrainingProgram } from '@/payload-types'

import {
  CERTIFICATE_TYPES,
  DELIVERY_MODES,
  FOCUS_COUNTRIES,
  INSTRUCTION_LANGUAGES,
  TRAINING_LEVELS,
} from '@/fields/options'
import type { Locale } from '@/i18n/locales'
import { formatDate, formatDateRange } from '@/lib/dates'
import { optionLabel, optionLabels } from '@/lib/optionLabel'

import { VirtualClassroomCta } from '../classroom/VirtualClassroomCta'

import { ApplicationCta } from './ApplicationCta'

/**
 * EĞİTİM ÖZET KARTI + AKSİYON  (Şartname 6.4, 7.1)
 * ============================================================================
 * Detay sayfasının sağ kolonu. Ziyaretçinin "bu eğitim bana uygun mu?"
 * sorusunu uzun metni okumadan yanıtlayabilmesi için kritik veriler burada
 * toplanır: tarih, süre, dil, biçim, kontenjan ve VERİLECEK BELGE.
 *
 * Belge türü şartname 7.1 gereği her eğitim sayfasında AÇIKÇA belirtilmek
 * zorundadır; bu yüzden alan boş bile olsa (`none` = belge verilmiyor)
 * satır basılır, gizlenmez.
 *
 * YAPIŞKAN (STICKY) DAVRANIŞ
 * `lg:sticky lg:top-6` yalnızca geniş ekranda. Mobilde kart normal akışta
 * kalır; küçük ekranda yapışkan bir blok içeriğin yarısını kapatır.
 * Uzun kartlarda `max-h` + `overflow-y-auto` YOKTUR: iç içe kaydırma alanı
 * klavye ve ekran okuyucu kullanıcıları için tuzaktır.
 * ============================================================================
 */

type Props = {
  locale: Locale
  doc: TrainingProgram
  services: ExternalService
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="border-t border-line py-3 first:border-t-0 first:pt-0">
    <dt className="text-sm text-ink-600">{label}</dt>
    <dd className="mt-0.5 font-medium text-ink-900">{children}</dd>
  </div>
)

export const TrainingSidebar = async ({ locale, doc, services }: Props) => {
  const t = await getTranslations('training')
  // Kontenjan metni takvim sözlüğünde tanımlı; iki yerde ayrı çeviri tutulmaz.
  const tc = await getTranslations('calendar')

  const dateRange = formatDateRange(locale, doc.startDate, doc.endDate)
  const deadline = formatDate(locale, doc.applicationDeadline)
  const languages = optionLabels(INSTRUCTION_LANGUAGES, doc.instructionLanguages, locale)
  const deliveryMode = optionLabel(DELIVERY_MODES, doc.deliveryMode, locale)
  const level = optionLabel(TRAINING_LEVELS, doc.level, locale)
  const certificate = optionLabel(CERTIFICATE_TYPES, doc.certificateType, locale)
  /*
    KATILIMCI ÜLKELER — ISO 3166-1 alpha-2 kodları ziyaretçinin dilindeki
    ülke adlarına çözülür. Merkez uluslararası bir eğitim kurumu olduğu için
    "bu eğitim benim ülkeme açık mı?" en sık sorulan sorulardan biridir;
    özet kartında durması gerekir.
  */
  const countries = optionLabels(FOCUS_COUNTRIES, doc.participantCountries, locale)

  /** "12 gün · 90 saat" — yalnızca girilmiş olanlar. */
  const duration = [
    doc.durationDays ? t('durationDays', { count: doc.durationDays }) : null,
    doc.durationHours ? t('durationHours', { count: doc.durationHours }) : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="lg:sticky lg:top-6">
      <div className="rounded-card border border-line bg-surface-alt p-6">
        <h2 className="text-lg font-semibold">{t('summaryHeading')}</h2>

        <dl className="mt-4">
          {dateRange ? <Row label={t('dates')}>{dateRange}</Row> : null}
          {duration ? <Row label={t('duration')}>{duration}</Row> : null}
          {deliveryMode ? <Row label={t('deliveryMode')}>{deliveryMode}</Row> : null}
          {doc.venue ? <Row label={t('venue')}>{doc.venue}</Row> : null}
          {languages.length > 0 ? <Row label={t('language')}>{languages.join(', ')}</Row> : null}
          {level ? <Row label={t('level')}>{level}</Row> : null}
          {/*
            Kontenjan birimiyle basılır: "24" tek başına neyin sayısı olduğunu
            söylemez. Sıfır veya girilmemiş kontenjan HİÇ gösterilmez —
            "0 kişilik kontenjan" eğitimin kapalı olduğu izlenimi verirdi.
          */}
          {Number(doc.quota) > 0 ? (
            <Row label={t('quota')}>{tc('quotaValue', { count: Number(doc.quota) })}</Row>
          ) : null}
          {countries.length > 0 ? (
            <Row label={t('participantCountries')}>{countries.join(', ')}</Row>
          ) : null}
          {deadline ? <Row label={t('deadline')}>{deadline}</Row> : null}

          {/* Şartname 7.1 — belge türü her koşulda gösterilir. */}
          <Row label={t('certificate')}>{certificate ?? '—'}</Row>

          {doc.code ? <Row label={t('code')}>{doc.code}</Row> : null}
        </dl>

        {/*
          Canlı oturum aksiyonu BAŞVURU BUTONUNUN ÜSTÜNDEDİR. Eğitim
          'Devam Ediyor' durumundayken başvuru zaten kapalıdır; o anda
          ziyaretçinin aradığı şey derse girmektir. Koşullar sağlanmazsa
          bileşen null döner ve hiç boşluk bırakmaz.
        */}
        <div className="mt-6 empty:mt-0">
          <VirtualClassroomCta locale={locale} trainingId={doc.id} status={doc.status} />
        </div>

        <div className="mt-6">
          <ApplicationCta
            locale={locale}
            trainingId={doc.id}
            status={doc.status}
            target={doc.applicationTarget}
            services={services}
          />
        </div>
      </div>
    </div>
  )
}

export default TrainingSidebar
