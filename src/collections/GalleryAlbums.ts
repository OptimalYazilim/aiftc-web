import type { CollectionConfig } from 'payload'

import { canAuthorContent, canDeleteContent, publishedOrAuthenticated } from '@/access'
import { translationStatusField } from '@/fields/publishing'
import { slugField } from '@/fields/slug'
import { revalidateCollection, revalidateOnDelete } from '@/hooks/revalidate'
import { syncTranslationStatus } from '@/hooks/syncTranslationStatus'

/**
 * GALERI VE MEDYA  (Sartname EK-1 / 6.8)
 * Fotograf galerisi, video galerisi, egitim/tanitim videolari,
 * webinar kayitlari, simulasyon goruntuleri, infografikler.
 */
export const GalleryAlbums: CollectionConfig = {
  slug: 'gallery-albums',
  labels: {
    singular: { tr: 'Albüm', en: 'Album', ru: 'Альбом' },
    plural: { tr: 'Galeri ve Medya', en: 'Gallery & media', ru: 'Галерея и медиа' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'albumType', 'date', '_status'],
    group: { tr: 'Medya', en: 'Media', ru: 'Медиа' },
  },
  access: {
    read: publishedOrAuthenticated,
    create: canAuthorContent,
    update: canAuthorContent,
    delete: canDeleteContent,
  },
  versions: { drafts: { autosave: false } },
  defaultSort: '-date',
  hooks: {
    afterChange: [syncTranslationStatus(['title']), revalidateCollection('/galeri')],
    afterDelete: [revalidateOnDelete('/galeri')],
  },
  fields: [
    slugField(),
    {
      name: 'albumType',
      type: 'select',
      required: true,
      defaultValue: 'photo',
      index: true,
      label: { tr: 'Albüm Türü', en: 'Album type', ru: 'Тип альбома' },
      options: [
        { value: 'photo', label: { tr: 'Fotoğraf galerisi', en: 'Photo gallery', ru: 'Фотогалерея' } },
        { value: 'video', label: { tr: 'Video galerisi', en: 'Video gallery', ru: 'Видеогалерея' } },
        { value: 'training-video', label: { tr: 'Eğitim videoları', en: 'Training videos', ru: 'Учебные видео' } },
        { value: 'promo', label: { tr: 'Tanıtım videoları', en: 'Promotional videos', ru: 'Промо-видео' } },
        { value: 'webinar', label: { tr: 'Webinar kayıtları', en: 'Webinar recordings', ru: 'Записи вебинаров' } },
        { value: 'simulation', label: { tr: 'Simülasyon merkezi görüntüleri', en: 'Simulation centre', ru: 'Центр симуляции' } },
        { value: 'infographic', label: { tr: 'İnfografikler', en: 'Infographics', ru: 'Инфографика' } },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'date',
      type: 'date',
      label: { tr: 'Tarih', en: 'Date', ru: 'Дата' },
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } },
    },
    translationStatusField,
    { name: 'title', type: 'text', required: true, localized: true, label: { tr: 'Başlık', en: 'Title', ru: 'Заголовок' } },
    { name: 'description', type: 'textarea', localized: true, label: { tr: 'Açıklama', en: 'Description', ru: 'Описание' } },
    { name: 'coverImage', type: 'upload', relationTo: 'media', label: { tr: 'Kapak', en: 'Cover', ru: 'Обложка' } },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: { tr: 'Görseller', en: 'Images', ru: 'Изображения' },
      admin: { condition: (data) => ['photo', 'simulation', 'infographic'].includes(data?.albumType) },
    },
    {
      name: 'videos',
      type: 'array',
      label: { tr: 'Videolar', en: 'Videos', ru: 'Видео' },
      admin: {
        condition: (data) => ['video', 'training-video', 'promo', 'webinar'].includes(data?.albumType),
      },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'url', type: 'text', required: true, label: { tr: 'Video Adresi', en: 'Video URL', ru: 'Адрес видео' } },
        { name: 'poster', type: 'upload', relationTo: 'media' },
        { name: 'durationSeconds', type: 'number', min: 0 },
        {
          name: 'captionsUrl',
          type: 'text',
          label: { tr: 'Altyazı (WebVTT)', en: 'Captions (WebVTT)', ru: 'Субтитры (WebVTT)' },
          admin: { description: { tr: 'WCAG 2.2 gereği önerilir.', en: 'Recommended by WCAG 2.2.', ru: 'Рекомендуется WCAG 2.2.' } },
        },
      ],
    },
    {
      name: 'relatedTraining',
      type: 'relationship',
      relationTo: 'training-programs',
      label: { tr: 'İlgili Eğitim', en: 'Related training', ru: 'Связанное обучение' },
    },
  ],
}

export default GalleryAlbums
