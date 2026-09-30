import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

/**
 * KONAKLAMA AYARLARI — ön başvurunun kuralları panelden
 * ============================================================================
 * Kurum kararı (29.09.2026): eğitim başvurusunda "konaklamak istiyorum"
 * seçeneği; talep → kurum onayı; online ödeme YOK. Kural ve gerekçeler:
 * lib/accommodation.ts.
 *
 * RAKAMLAR KURUMDAN GELİR. Tarifeler ve kapasite boş gelir; boşken başvuran
 * "ücret kurum tarafından bildirilecek" notunu görür, doluluk hesaplanmaz.
 * Gece sınırının varsayılanı toplantıda konuşulan 20'dir; kurum tarafında 15
 * de dile geldi — kesin değeri kurum teyit etmeli.
 *
 * Varsayılan olarak KAPALIDIR: kurum tarifeleri ve kapalı dönemleri girip
 * özelliği bilerek açar.
 * ============================================================================
 */
export const AccommodationSettings: GlobalConfig = {
  slug: 'accommodation-settings',
  label: { tr: 'Konaklama Ayarları', en: 'Accommodation settings', ru: 'Настройки проживания' },
  admin: {
    group: { tr: 'Eğitim', en: 'Training', ru: 'Обучение' },
    description: {
      tr: 'Eğitim başvurusundaki konaklama ön başvurusunun kuralları. Online ödeme alınmaz; talepler "Konaklama Talepleri" bölümüne düşer ve personel kişiyi arar.',
      en: 'Rules for the accommodation pre-application on the training form. No online payment; requests arrive in "Accommodation requests" and staff call the applicant.',
      ru: 'Правила предварительной заявки на проживание. Онлайн-оплаты нет.',
    },
  },
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  hooks: {
    afterChange: [revalidateGlobal('accommodation-settings')],
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      label: {
        tr: 'Başvuru formunda "Konaklamak istiyorum" seçeneğini göster',
        en: 'Show "I need accommodation" on the application form',
        ru: 'Показывать «Нужно проживание» в форме заявки',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'maxNights',
          type: 'number',
          required: true,
          defaultValue: 20,
          min: 1,
          label: { tr: 'En fazla gece', en: 'Maximum nights', ru: 'Максимум ночей' },
          admin: {
            width: '33%',
            description: {
              tr: 'Bir talepte seçilebilecek en fazla gece sayısı. Konaklama eğitim tarihlerinin dışına taşabilir.',
              en: 'The most nights a single request may cover. The stay may extend beyond the training dates.',
              ru: 'Максимальное число ночей в одной заявке. Проживание может выходить за даты обучения.',
            },
          },
        },
        {
          name: 'capacity',
          type: 'number',
          min: 1,
          label: { tr: 'Gecelik kapasite', en: 'Capacity per night', ru: 'Вместимость за ночь' },
          admin: {
            width: '33%',
            description: {
              tr: 'Aynı gece onaylanabilecek en fazla talep. Boşsa doluluk hesaplanmaz.',
              en: 'Most approved requests per night. Empty = occupancy not enforced.',
              ru: 'Пусто — занятость не учитывается.',
            },
          },
        },
        {
          name: 'currency',
          type: 'select',
          defaultValue: 'TRY',
          options: [
            { value: 'TRY', label: 'TRY (₺)' },
            { value: 'EUR', label: 'EUR (€)' },
            { value: 'USD', label: 'USD ($)' },
          ],
          label: { tr: 'Para birimi', en: 'Currency', ru: 'Валюта' },
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'rateInTraining',
          type: 'number',
          min: 0,
          label: { tr: 'Eğitim süresince günlük ücret', en: 'Daily rate during the training', ru: 'Суточная ставка во время обучения' },
          admin: { width: '50%' },
        },
        {
          name: 'rateOutsideTraining',
          type: 'number',
          min: 0,
          label: { tr: 'Eğitim dışı günlük ücret', en: 'Daily rate outside the training', ru: 'Суточная ставка вне обучения' },
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'closedPeriods',
      type: 'array',
      label: { tr: 'Kapalı dönemler', en: 'Closed periods', ru: 'Закрытые периоды' },
      labels: {
        singular: { tr: 'Kapalı dönem', en: 'Closed period', ru: 'Закрытый период' },
        plural: { tr: 'Kapalı dönemler', en: 'Closed periods', ru: 'Закрытые периоды' },
      },
      admin: {
        description: {
          tr: 'Bu tarihlerin (başlangıç ve bitiş dahil) gecelerine konaklama talebi yapılamaz.',
          en: 'No accommodation can be requested for nights within these dates (inclusive).',
          ru: 'На эти даты (включительно) проживание запросить нельзя.',
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'from', type: 'date', required: true, label: { tr: 'Başlangıç', en: 'From', ru: 'С' }, admin: { width: '30%', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
            { name: 'to', type: 'date', required: true, label: { tr: 'Bitiş', en: 'To', ru: 'По' }, admin: { width: '30%', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
            {
              name: 'note',
              type: 'text',
              label: { tr: 'Not (iç kullanım)', en: 'Note (internal)', ru: 'Заметка' },
              /* Global herkese açık okunur (form kuralları için); not sızmasın. */
              access: { read: ({ req }) => Boolean(req.user) },
              admin: { width: '40%' },
            },
          ],
        },
      ],
    },
  ],
}

export default AccommodationSettings
