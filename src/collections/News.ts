import type { CollectionConfig } from 'payload'

import { canAuthorContent, canDeleteContent, publishedOrAuthenticated } from '@/access'
import { publishingFields, translationStatusField } from '@/fields/publishing'
import { slugField } from '@/fields/slug'
import { FOCUS_COUNTRIES, NEWS_CATEGORIES } from '@/fields/options'
import { revalidateCollection, revalidateOnDelete } from '@/hooks/revalidate'
import { syncTranslationStatus } from '@/hooks/syncTranslationStatus'

/**
 * HABERLER VE DUYURULAR  (Sartname EK-1 / 6.7 ve 10.3)
 *
 * Tek koleksiyon, iki davranis:
 *   kind = 'news'         -> haber akisinda, tarih sirali
 *   kind = 'announcement' -> duyuru; ana sayfada "Guncel Duyurular" seridinde,
 *                            `expiresAt` gecince otomatik olarak seritten duser
 *
 * 10.3 geregi her kayit ISTEGE BAGLI olarak projeye baglanabilir; proje
 * baglantisi olan haberler proje gorunurluk seridiyle (FAO + OGM logolari)
 * birlikte yayinlanir.
 */
export const News: CollectionConfig = {
  slug: 'news',
  labels: {
    singular: { tr: 'Haber / Duyuru', en: 'News / announcement', ru: 'Новость / объявление' },
    plural: { tr: 'Haberler ve Duyurular', en: 'News & announcements', ru: 'Новости и объявления' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'category', 'publishedAt', '_status'],
    group: { tr: 'İçerik', en: 'Content', ru: 'Контент' },
    listSearchableFields: ['title', 'summary'],
  },
  access: {
    read: publishedOrAuthenticated,
    create: canAuthorContent,
    update: canAuthorContent,
    delete: canDeleteContent,
  },
  versions: {
    drafts: { autosave: false, schedulePublish: true },
    maxPerDoc: 30,
  },
  defaultSort: '-publishedAt',
  hooks: {
    afterChange: [syncTranslationStatus(['title', 'summary']), revalidateCollection('/haberler')],
    afterDelete: [revalidateOnDelete('/haberler')],
  },
  fields: [
    slugField(),
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'news',
      index: true,
      label: { tr: 'Kayıt Türü', en: 'Record type', ru: 'Тип записи' },
      options: [
        { value: 'news', label: { tr: 'Haber', en: 'News', ru: 'Новость' } },
        { value: 'announcement', label: { tr: 'Duyuru', en: 'Announcement', ru: 'Объявление' } },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      index: true,
      label: { tr: 'Kategori', en: 'Category', ru: 'Категория' },
      options: NEWS_CATEGORIES,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: { tr: 'Ana sayfada öne çıkar', en: 'Feature on homepage', ru: 'На главной' },
      admin: { position: 'sidebar' },
    },
    {
      name: 'expiresAt',
      type: 'date',
      label: { tr: 'Duyuru Bitiş Tarihi', en: 'Announcement expiry', ru: 'Срок действия объявления' },
      admin: {
        position: 'sidebar',
        condition: (data) => data?.kind === 'announcement',
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
        description: {
          tr: 'Bu tarihten sonra duyuru ana sayfa şeridinden düşer; arşivde kalır.',
          en: 'After this date the item leaves the homepage strip but stays in the archive.',
          ru: 'После этой даты объявление исчезает с главной, но остаётся в архиве.',
        },
      },
    },
    translationStatusField,
    publishingFields,

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
              label: { tr: 'Başlık', en: 'Title', ru: 'Заголовок' },
            },
            {
              name: 'summary',
              type: 'textarea',
              required: true,
              localized: true,
              maxLength: 400,
              label: { tr: 'Spot / Özet', en: 'Summary', ru: 'Краткое содержание' },
            },
            {
              name: 'content',
              type: 'richText',
              required: true,
              localized: true,
              label: { tr: 'Haber Metni', en: 'Body', ru: 'Текст' },
            },
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
              label: { tr: 'Kapak Görseli', en: 'Cover image', ru: 'Обложка' },
            },
            {
              name: 'gallery',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              label: { tr: 'Fotoğraf Galerisi', en: 'Photo gallery', ru: 'Фотогалерея' },
            },
            {
              name: 'videoUrl',
              type: 'text',
              label: { tr: 'Video Bağlantısı', en: 'Video link', ru: 'Ссылка на видео' },
            },
          ],
        },
        {
          label: { tr: 'İlişkiler', en: 'Relations', ru: 'Связи' },
          fields: [
            {
              name: 'relatedTrainings',
              type: 'relationship',
              relationTo: 'training-programs',
              hasMany: true,
              label: { tr: 'İlgili Eğitimler', en: 'Related trainings', ru: 'Связанные обучения' },
            },
            {
              name: 'relatedTopics',
              type: 'relationship',
              relationTo: 'training-topics',
              hasMany: true,
              label: { tr: 'İlgili Konular', en: 'Related topics', ru: 'Связанные темы' },
            },
            {
              name: 'countries',
              type: 'select',
              hasMany: true,
              label: { tr: 'İlgili Ülkeler', en: 'Related countries', ru: 'Связанные страны' },
              options: FOCUS_COUNTRIES,
            },
            {
              name: 'attachments',
              type: 'relationship',
              relationTo: 'document-files',
              hasMany: true,
              label: { tr: 'Ekler', en: 'Attachments', ru: 'Приложения' },
            },
          ],
        },
        {
          label: { tr: 'Proje Görünürlüğü', en: 'Project visibility', ru: 'Видимость проекта' },
          description: {
            tr: 'Şartname 10.2 — logo, proje adı ve sembol kullanımı kurumsal görünürlük kurallarına tabidir.',
            en: 'Spec 10.2 — logos, project name and symbol follow the visibility rules.',
            ru: 'П. 10.2 — правила видимости логотипов и названия проекта.',
          },
          fields: [
            {
              name: 'isProjectOutput',
              type: 'checkbox',
              defaultValue: false,
              label: {
                tr: 'Bu içerik bir proje çıktısıdır',
                en: 'This is a project output',
                ru: 'Это результат проекта',
              },
            },
            {
              name: 'project',
              type: 'relationship',
              relationTo: 'projects',
              label: { tr: 'İlgili Proje', en: 'Related project', ru: 'Связанный проект' },
              admin: { condition: (_, siblingData) => Boolean(siblingData?.isProjectOutput) },
            },
          ],
        },
      ],
    },
  ],
}

export default News
