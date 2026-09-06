import type { CollectionConfig } from 'payload'

import { canAuthorContent, canDeleteContent, publishedOrAuthenticated } from '@/access'
import { translationStatusField } from '@/fields/publishing'
import { slugField } from '@/fields/slug'
import { FOCUS_COUNTRIES } from '@/fields/options'
import { revalidateCollection, revalidateOnDelete } from '@/hooks/revalidate'
import { syncTranslationStatus } from '@/hooks/syncTranslationStatus'

/**
 * PROJELER  (Sartname EK-1 / 10.1 "Proje Bilgi Alani")
 *
 * "Ileride yurutulecek yeni projelerin eklenebilecegi bir platform olacaktir."
 * -> Bu nedenle GCP/SEC/024/TUR sabit kodlanmaz; koleksiyon olarak tutulur.
 */
export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: {
    singular: { tr: 'Proje', en: 'Project', ru: 'Проект' },
    plural: { tr: 'Projeler ve İş Birlikleri', en: 'Projects & cooperation', ru: 'Проекты и сотрудничество' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'symbol', 'startDate', 'endDate', '_status'],
    group: { tr: 'Kurumsal', en: 'Institutional', ru: 'Институциональное' },
  },
  access: {
    read: publishedOrAuthenticated,
    create: canAuthorContent,
    update: canAuthorContent,
    delete: canDeleteContent,
  },
  versions: { drafts: { autosave: false } },
  hooks: {
    afterChange: [syncTranslationStatus(['title', 'objective']), revalidateCollection('/projeler')],
    afterDelete: [revalidateOnDelete('/projeler')],
  },
  fields: [
    slugField(),
    {
      name: 'isPrimary',
      type: 'checkbox',
      defaultValue: false,
      label: { tr: 'Ana proje (görünürlük şeridinde göster)', en: 'Primary project', ru: 'Основной проект' },
      admin: { position: 'sidebar' },
    },
    translationStatusField,
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: { tr: 'Proje Adı', en: 'Project title', ru: 'Название проекта' },
    },
    {
      name: 'symbol',
      type: 'text',
      required: true,
      unique: true,
      label: { tr: 'Proje Sembolü', en: 'Project symbol', ru: 'Символ проекта' },
      admin: { description: { tr: 'Örn. GCP/SEC/024/TUR', en: 'e.g. GCP/SEC/024/TUR', ru: 'Напр. GCP/SEC/024/TUR' } },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          label: { tr: 'Başlangıç', en: 'Start', ru: 'Начало' },
          admin: { width: '50%', date: { pickerAppearance: 'monthOnly', displayFormat: 'MM.yyyy' } },
        },
        {
          name: 'endDate',
          type: 'date',
          label: { tr: 'Bitiş', en: 'End', ru: 'Окончание' },
          admin: { width: '50%', date: { pickerAppearance: 'monthOnly', displayFormat: 'MM.yyyy' } },
        },
      ],
    },
    {
      name: 'nationalCounterpart',
      type: 'text',
      localized: true,
      defaultValue: 'Tarım ve Orman Bakanlığı, Orman Genel Müdürlüğü',
      label: { tr: 'Ulusal Karşı Kurum', en: 'National counterpart', ru: 'Национальный партнёр' },
    },
    {
      name: 'partners',
      type: 'array',
      label: { tr: 'İş Birliği Yapılan Kurumlar', en: 'Partners', ru: 'Партнёры' },
      fields: [
        { name: 'name', type: 'text', required: true, localized: true },
        { name: 'logo', type: 'upload', relationTo: 'media' },
        { name: 'url', type: 'text' },
      ],
    },
    {
      name: 'focusCountries',
      type: 'select',
      hasMany: true,
      label: { tr: 'Odak Ülkeler', en: 'Focus countries', ru: 'Целевые страны' },
      options: FOCUS_COUNTRIES,
    },
    {
      name: 'objective',
      type: 'richText',
      localized: true,
      label: { tr: 'Projenin Amacı', en: 'Objective', ru: 'Цель проекта' },
    },
    {
      name: 'capacityStatement',
      type: 'richText',
      localized: true,
      label: {
        tr: 'Merkezin Kapasitesine Katkısı',
        en: 'Contribution to the centre’s capacity',
        ru: 'Вклад в потенциал центра',
      },
    },
    {
      name: 'externalUrl',
      type: 'text',
      label: { tr: 'FAO Proje Sayfası', en: 'FAO project page', ru: 'Страница проекта FAO' },
    },
    {
      name: 'logos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: { tr: 'Görünürlük Logoları', en: 'Visibility logos', ru: 'Логотипы' },
      admin: {
        description: {
          tr: 'Şartname 10.2 — logo sırası ve kullanımı FAO/TOB/OGM görünürlük kurallarına uygun olmalıdır.',
          en: 'Spec 10.2 — logo order must follow FAO/MAF/OGM visibility rules.',
          ru: 'П. 10.2 — порядок логотипов по правилам FAO/OGM.',
        },
      },
    },
  ],
}

export default Projects
