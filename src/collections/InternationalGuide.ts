import type { CollectionConfig } from 'payload'

import { canAuthorContent, canDeleteContent, publishedOrAuthenticated } from '@/access'
import { translationStatusField } from '@/fields/publishing'
import { slugField } from '@/fields/slug'
import { FOCUS_COUNTRIES } from '@/fields/options'
import { revalidateCollection, revalidateOnDelete } from '@/hooks/revalidate'
import { syncTranslationStatus } from '@/hooks/syncTranslationStatus'

/**
 * ULUSLARARASI KATILIMCI REHBERI  (Sartname EK-1 / 8.1 ve 8.2)
 *
 * 8.1'deki sabit basliklar (basvuru sureci, konaklama, ulasim, Antalya'ya
 * erisim, transfer, sertifika, iletisim) BOLUM olarak burada tutulur; boylece
 * editor yeni bir baslik eklemek istediginde kod degistirmeye gerek kalmaz.
 *
 * 8.2 "Ulke ve Kurum Bazli Bilgilendirme" icin her bolum belirli ulkelere
 * daraltilabilir (`scope`): ornegin vize bilgisi ulkeye gore degisir.
 *
 * SSS (8.3) ayri bir koleksiyondur: `faqs`.
 */
export const InternationalGuide: CollectionConfig = {
  slug: 'international-guide',
  labels: {
    singular: { tr: 'Rehber Bölümü', en: 'Guide section', ru: 'Раздел руководства' },
    plural: {
      tr: 'Uluslararası Katılımcı Rehberi',
      en: 'International participants guide',
      ru: 'Руководство для международных участников',
    },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'sectionKey', 'order', '_status', 'updatedAt'],
    group: { tr: 'İçerik', en: 'Content', ru: 'Контент' },
    description: {
      tr: 'Şartname 8.1–8.2. Bölümler sırasıyla tek sayfada gösterilir; her bölümün kendi çapa bağlantısı olur.',
      en: 'Spec 8.1–8.2. Sections render on one page, each with its own anchor.',
      ru: 'П. 8.1–8.2. Разделы отображаются на одной странице.',
    },
  },
  access: {
    read: publishedOrAuthenticated,
    create: canAuthorContent,
    update: canAuthorContent,
    delete: canDeleteContent,
  },
  versions: { drafts: { autosave: false }, maxPerDoc: 20 },
  defaultSort: 'order',
  hooks: {
    afterChange: [
      syncTranslationStatus(['title', 'content']),
      revalidateCollection('/uluslararasi-katilimcilar'),
    ],
    afterDelete: [revalidateOnDelete('/uluslararasi-katilimcilar')],
  },
  fields: [
    slugField(),
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      label: { tr: 'Sıralama', en: 'Sort order', ru: 'Порядок' },
      admin: { position: 'sidebar', step: 10 },
    },
    translationStatusField,
    {
      name: 'sectionKey',
      type: 'select',
      required: true,
      index: true,
      label: { tr: 'Bölüm Türü', en: 'Section type', ru: 'Тип раздела' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Şartname 8.1’de sayılan başlıklar. Simge ve sıralama bu seçime göre belirlenir.',
          en: 'Headings listed in spec 8.1. Icon and ordering derive from this.',
          ru: 'Заголовки из п. 8.1.',
        },
      },
      options: [
        { value: 'about-centre', label: { tr: 'Merkez hakkında kısa bilgi', en: 'About the centre', ru: 'О центре' } },
        { value: 'eligibility', label: { tr: 'Eğitimlere kimler katılabilir', en: 'Who can attend', ru: 'Кто может участвовать' } },
        { value: 'application', label: { tr: 'Başvuru süreci', en: 'Application process', ru: 'Процесс подачи заявки' } },
        { value: 'language', label: { tr: 'Eğitim dili', en: 'Language of instruction', ru: 'Язык обучения' } },
        { value: 'accommodation', label: { tr: 'Konaklama bilgisi', en: 'Accommodation', ru: 'Проживание' } },
        { value: 'travel', label: { tr: 'Ulaşım bilgisi', en: 'Travel information', ru: 'Транспорт' } },
        { value: 'arrival-antalya', label: { tr: 'Antalya’ya erişim', en: 'Getting to Antalya', ru: 'Как добраться до Антальи' } },
        { value: 'transfer', label: { tr: 'Transfer bilgisi', en: 'Transfer service', ru: 'Трансфер' } },
        { value: 'visa', label: { tr: 'Vize ve giriş işlemleri', en: 'Visa & entry', ru: 'Виза и въезд' } },
        { value: 'certificate', label: { tr: 'Sertifika bilgisi', en: 'Certificate information', ru: 'О сертификате' } },
        { value: 'contact', label: { tr: 'İletişim kişisi / birimi', en: 'Contact person or unit', ru: 'Контактное лицо' } },
        { value: 'practical', label: { tr: 'Pratik bilgiler', en: 'Practical information', ru: 'Практическая информация' } },
        { value: 'other', label: { tr: 'Diğer', en: 'Other', ru: 'Другое' } },
      ],
    },

    {
      type: 'tabs',
      tabs: [
        {
          label: { tr: 'İçerik', en: 'Content', ru: 'Содержание' },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              localized: true,
              label: { tr: 'Bölüm Başlığı', en: 'Section title', ru: 'Заголовок раздела' },
            },
            {
              name: 'summary',
              type: 'textarea',
              localized: true,
              maxLength: 300,
              label: { tr: 'Kısa Özet', en: 'Summary', ru: 'Краткое описание' },
              admin: {
                description: {
                  tr: 'Sayfa başındaki hızlı bakış kartlarında gösterilir.',
                  en: 'Shown in the quick-overview cards at the top of the page.',
                  ru: 'Отображается в карточках обзора.',
                },
              },
            },
            {
              name: 'content',
              type: 'richText',
              required: true,
              localized: true,
              label: { tr: 'Bölüm Metni', en: 'Body', ru: 'Текст раздела' },
              admin: {
                description: {
                  tr: 'Sade ve kısa cümleler kullanın; okuyucuların çoğu ana dili İngilizce/Rusça olmayan uzmanlardır.',
                  en: 'Use plain, short sentences — most readers are non-native speakers.',
                  ru: 'Используйте простые короткие предложения.',
                },
              },
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: { tr: 'Görsel', en: 'Image', ru: 'Изображение' },
            },
            {
              name: 'attachments',
              type: 'relationship',
              relationTo: 'document-files',
              hasMany: true,
              label: { tr: 'İndirilebilir Belgeler', en: 'Downloadable documents', ru: 'Документы для скачивания' },
            },
          ],
        },
        {
          label: { tr: 'Kapsam (Ülke/Kurum)', en: 'Scope (country/institution)', ru: 'Область (страна)' },
          description: {
            tr: 'Şartname 8.2 — ülke ve kurum bazlı bilgilendirme. Boş bırakılırsa bölüm tüm ziyaretçilere gösterilir.',
            en: 'Spec 8.2 — country-specific information. Leave empty to show to everyone.',
            ru: 'П. 8.2 — информация по странам.',
          },
          fields: [
            {
              name: 'countries',
              type: 'select',
              hasMany: true,
              label: { tr: 'Yalnızca Bu Ülkeler İçin', en: 'Applies to these countries only', ru: 'Только для этих стран' },
              options: FOCUS_COUNTRIES,
            },
            {
              name: 'countryNotes',
              type: 'array',
              label: { tr: 'Ülkeye Özel Notlar', en: 'Country-specific notes', ru: 'Примечания по странам' },
              fields: [
                {
                  name: 'country',
                  type: 'select',
                  required: true,
                  options: FOCUS_COUNTRIES,
                  label: { tr: 'Ülke', en: 'Country', ru: 'Страна' },
                },
                {
                  name: 'note',
                  type: 'richText',
                  required: true,
                  localized: true,
                  label: { tr: 'Not', en: 'Note', ru: 'Примечание' },
                },
              ],
            },
          ],
        },
        {
          label: { tr: 'Bağlantılar', en: 'Links', ru: 'Ссылки' },
          fields: [
            {
              name: 'links',
              type: 'array',
              label: { tr: 'İlgili Bağlantılar', en: 'Related links', ru: 'Связанные ссылки' },
              fields: [
                { name: 'label', type: 'text', required: true, localized: true },
                { name: 'url', type: 'text', required: true },
                {
                  name: 'isExternal',
                  type: 'checkbox',
                  defaultValue: true,
                  label: { tr: 'Harici bağlantı', en: 'External link', ru: 'Внешняя ссылка' },
                  admin: {
                    description: {
                      tr: 'Harici bağlantılar yeni sekmede açılır ve ekran okuyucular için “(yeni pencerede açılır)” uyarısı eklenir (WCAG 2.2).',
                      en: 'External links open in a new tab with an accessible warning (WCAG 2.2).',
                      ru: 'Внешние ссылки открываются в новой вкладке.',
                    },
                  },
                },
              ],
            },
            {
              name: 'relatedFaqs',
              type: 'relationship',
              relationTo: 'faqs',
              hasMany: true,
              label: { tr: 'İlgili SSS', en: 'Related FAQs', ru: 'Связанные вопросы' },
            },
          ],
        },
      ],
    },
  ],
}

export default InternationalGuide
