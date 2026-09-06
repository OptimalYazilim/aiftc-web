import type { CollectionConfig } from 'payload'

import { canAuthorContent, canDeleteContent, publishedOrAuthenticated } from '@/access'
import { translationStatusField } from '@/fields/publishing'
import { revalidateCollection, revalidateOnDelete } from '@/hooks/revalidate'
import { syncTranslationStatus } from '@/hooks/syncTranslationStatus'

/**
 * SIK SORULAN SORULAR  (Sartname EK-1 / 8.3, 11.2)
 * Uluslararasi katilimci rehberine ve iletisim sayfasina gomulur.
 * Frontend tarafinda schema.org FAQPage isaretlemesi uretilir (uluslararasi SEO).
 */
export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: {
    singular: { tr: 'Soru', en: 'Question', ru: 'Вопрос' },
    plural: { tr: 'Sık Sorulan Sorular', en: 'FAQs', ru: 'Часто задаваемые вопросы' },
  },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'group', 'order', '_status'],
    group: { tr: 'İçerik', en: 'Content', ru: 'Контент' },
    listSearchableFields: ['question'],
  },
  access: {
    read: publishedOrAuthenticated,
    create: canAuthorContent,
    update: canAuthorContent,
    delete: canDeleteContent,
  },
  versions: { drafts: { autosave: false } },
  defaultSort: 'order',
  hooks: {
    afterChange: [
      syncTranslationStatus(['question', 'answer']),
      revalidateCollection('/uluslararasi-katilimcilar'),
    ],
    afterDelete: [revalidateOnDelete('/uluslararasi-katilimcilar')],
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
      localized: true,
      label: { tr: 'Soru', en: 'Question', ru: 'Вопрос' },
    },
    {
      name: 'answer',
      type: 'richText',
      required: true,
      localized: true,
      label: { tr: 'Cevap', en: 'Answer', ru: 'Ответ' },
    },
    {
      name: 'group',
      type: 'select',
      required: true,
      defaultValue: 'applications',
      index: true,
      label: { tr: 'Grup', en: 'Group', ru: 'Группа' },
      options: [
        { value: 'applications', label: { tr: 'Başvuru', en: 'Applications', ru: 'Заявки' } },
        { value: 'languages', label: { tr: 'Eğitim dili', en: 'Language', ru: 'Язык' } },
        { value: 'certificates', label: { tr: 'Sertifika', en: 'Certificates', ru: 'Сертификаты' } },
        { value: 'accommodation', label: { tr: 'Konaklama', en: 'Accommodation', ru: 'Проживание' } },
        { value: 'materials', label: { tr: 'Eğitim materyalleri', en: 'Training materials', ru: 'Учебные материалы' } },
        { value: 'format', label: { tr: 'Çevrim içi / yüz yüze', en: 'Online / in person', ru: 'Онлайн / очно' } },
        { value: 'simulation', label: { tr: 'Simülasyon merkezi', en: 'Simulation centre', ru: 'Центр симуляции' } },
        { value: 'contact', label: { tr: 'İletişim', en: 'Contact', ru: 'Контакты' } },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      label: { tr: 'Sıralama', en: 'Sort order', ru: 'Порядок' },
      admin: { position: 'sidebar', step: 10 },
    },
    translationStatusField,
  ],
}

export default Faqs
