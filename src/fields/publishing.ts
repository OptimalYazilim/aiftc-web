import type { Field } from 'payload'

import { canPublishFieldLevel } from '@/access'

/**
 * Yayin bilgileri (Sartname EK-2 1.6 icerik yonetim is akisi ile uyumlu,
 * EK-1 tarafinda haber/egitim/duyuru yayimlama icin kullanilir).
 *
 * Not: taslak/yayin durumunun kendisi (`_status`) Payload'in `versions.drafts`
 * ozelligi tarafindan yonetilir. Buradaki alanlar tarih ve sorumluluk bilgisidir.
 */
export const publishingFields: Field = {
  type: 'row',
  fields: [
    {
      name: 'publishedAt',
      type: 'date',
      label: { tr: 'Yayın Tarihi', en: 'Published at', ru: 'Дата публикации' },
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
      },
      access: { update: canPublishFieldLevel },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData?._status === 'published' && !value) return new Date().toISOString()
            return value
          },
        ],
      },
    },
  ],
}

/**
 * Icerigin hangi dillerde tamamlandigini gosteren, DILE BAGLI OLMAYAN alan.
 *
 * Sartname 5: "Eksik ceviri bulunan icerikler yonetim panelinde gorulebilmelidir."
 * Bu alan `syncTranslationStatus` hook'u tarafindan otomatik doldurulur ve
 * admin listesinde kolon olarak gosterilir; editor elle doldurmaz.
 */
export const translationStatusField: Field = {
  name: 'translationStatus',
  type: 'json',
  localized: false,
  label: { tr: 'Çeviri Durumu', en: 'Translation status', ru: 'Статус перевода' },
  admin: {
    position: 'sidebar',
    readOnly: true,
    description: {
      tr: 'Otomatik hesaplanır. Eksik dilleri gösterir.',
      en: 'Calculated automatically. Shows missing locales.',
      ru: 'Рассчитывается автоматически. Показывает недостающие языки.',
    },
  },
}
