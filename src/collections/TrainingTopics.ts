import type { CollectionConfig } from 'payload'

import { canAuthorContent, canDeleteContent, publishedOrAuthenticated } from '@/access'
import { publishingFields, translationStatusField } from '@/fields/publishing'
import { slugField } from '@/fields/slug'
import { TRAINING_LEVELS, TRAINING_TOPIC_CATEGORIES } from '@/fields/options'
import { revalidateCollection, revalidateOnDelete } from '@/hooks/revalidate'
import { syncTranslationStatus } from '@/hooks/syncTranslationStatus'

/**
 * EGITIM KONULARI  (Sartname EK-1 / 6.3)
 *
 * "Her egitim konusu icin kisa aciklama, hedef kitle, egitim duzeyi ve varsa
 *  egitim materyallerine baglanti verilebilmelidir."
 *
 * Bu koleksiyon ayni zamanda EK-2 dijital kutuphanesinin konu taksonomisiyle
 * ortak sozluk gorevi gorur (EK-2 / 1.3 ana konu kategorileri). Kutuphane
 * subdomaini bu listeyi REST uzerinden okuyabilir:
 *   GET /api/training-topics?locale=en&where[_status][equals]=published
 */
export const TrainingTopics: CollectionConfig = {
  slug: 'training-topics',
  labels: {
    singular: { tr: 'Eğitim Konusu', en: 'Training topic', ru: 'Тема обучения' },
    plural: { tr: 'Eğitim Konuları', en: 'Training topics', ru: 'Темы обучения' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'level', '_status', 'updatedAt'],
    group: { tr: 'Eğitim', en: 'Training', ru: 'Обучение' },
    description: {
      tr: 'Merkezin eğitim kapasitesini gösteren konu başlıkları. Eğitim programları bu konulara bağlanır.',
      en: 'Thematic areas of the centre. Training programmes link to these topics.',
      ru: 'Тематические направления центра.',
    },
  },
  access: {
    read: publishedOrAuthenticated,
    create: canAuthorContent,
    update: canAuthorContent,
    delete: canDeleteContent,
  },
  versions: {
    drafts: { autosave: false, schedulePublish: true },
    maxPerDoc: 20,
  },
  defaultSort: 'order',
  hooks: {
    afterChange: [
      syncTranslationStatus(['title', 'summary']),
      revalidateCollection('/egitim-konulari'),
    ],
    afterDelete: [revalidateOnDelete('/egitim-konulari')],
  },
  fields: [
    // ---- Sidebar -----------------------------------------------------------
    slugField(),
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      label: { tr: 'Sıralama', en: 'Sort order', ru: 'Порядок' },
      admin: { position: 'sidebar', step: 10 },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: { tr: 'Ana sayfada öne çıkar', en: 'Feature on homepage', ru: 'На главной странице' },
      admin: { position: 'sidebar' },
    },
    translationStatusField,
    publishingFields,

    // ---- Sekmeler ----------------------------------------------------------
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
              label: { tr: 'Konu Adı', en: 'Topic title', ru: 'Название темы' },
            },
            {
              name: 'summary',
              type: 'textarea',
              required: true,
              localized: true,
              maxLength: 400,
              label: { tr: 'Kısa Açıklama', en: 'Short description', ru: 'Краткое описание' },
              admin: {
                description: {
                  tr: 'Kart görünümünde ve arama sonuçlarında gösterilir. En fazla 400 karakter.',
                  en: 'Shown on cards and in search results. Max 400 characters.',
                  ru: 'Отображается в карточках и результатах поиска.',
                },
              },
            },
            {
              name: 'description',
              type: 'richText',
              localized: true,
              label: { tr: 'Detaylı Açıklama', en: 'Full description', ru: 'Подробное описание' },
            },
            {
              name: 'learningOutcomes',
              type: 'array',
              localized: true,
              label: { tr: 'Kazanımlar', en: 'Learning outcomes', ru: 'Результаты обучения' },
              labels: {
                singular: { tr: 'Kazanım', en: 'Outcome', ru: 'Результат' },
                plural: { tr: 'Kazanımlar', en: 'Outcomes', ru: 'Результаты' },
              },
              fields: [{ name: 'text', type: 'text', required: true }],
            },
          ],
        },
        {
          label: { tr: 'Sınıflandırma', en: 'Classification', ru: 'Классификация' },
          fields: [
            {
              name: 'category',
              type: 'select',
              required: true,
              label: { tr: 'Ana Kategori', en: 'Main category', ru: 'Основная категория' },
              admin: {
                description: {
                  tr: 'EK-2 dijital kütüphane konu kategorileriyle ortak sözlüktür. Değiştirmeden önce kütüphane ekibiyle koordine olun.',
                  en: 'Shared vocabulary with the EK-2 digital library. Coordinate before changing.',
                  ru: 'Общий словарь с цифровой библиотекой (EK-2).',
                },
              },
              options: TRAINING_TOPIC_CATEGORIES,
            },
            {
              name: 'level',
              type: 'select',
              hasMany: true,
              label: { tr: 'Eğitim Düzeyi', en: 'Training level', ru: 'Уровень обучения' },
              options: TRAINING_LEVELS,
            },
            {
              name: 'targetAudience',
              type: 'textarea',
              localized: true,
              label: { tr: 'Hedef Kitle', en: 'Target audience', ru: 'Целевая аудитория' },
            },
            {
              name: 'keywords',
              type: 'text',
              hasMany: true,
              localized: true,
              label: { tr: 'Anahtar Kelimeler', en: 'Keywords', ru: 'Ключевые слова' },
              admin: {
                description: {
                  tr: 'Site içi arama ve filtreleme için (Şartname 11.4).',
                  en: 'Used by on-site search and filtering.',
                  ru: 'Используются для поиска и фильтрации.',
                },
              },
            },
          ],
        },
        {
          label: { tr: 'Görsel ve Bağlantılar', en: 'Media & links', ru: 'Медиа и ссылки' },
          fields: [
            {
              name: 'icon',
              type: 'upload',
              relationTo: 'media',
              label: { tr: 'Simge', en: 'Icon', ru: 'Иконка' },
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
              label: { tr: 'Galeri', en: 'Gallery', ru: 'Галерея' },
            },
            {
              name: 'usesSimulation',
              type: 'checkbox',
              defaultValue: false,
              label: {
                tr: 'Bu konuda simülasyon merkezi kullanılıyor',
                en: 'Simulation centre is used for this topic',
                ru: 'Используется центр симуляции',
              },
              admin: {
                description: {
                  tr: 'İşaretlenirse konu sayfasından Simülasyon Merkezi’ne bağlantı verilir (Şartname 9.3).',
                  en: 'Adds a link to the Simulation Centre page (spec 9.3).',
                  ru: 'Добавляет ссылку на страницу центра симуляции.',
                },
              },
            },
            {
              name: 'relatedSimulationSystems',
              type: 'relationship',
              relationTo: 'simulation-systems',
              hasMany: true,
              label: { tr: 'İlgili Simülasyon Sistemleri', en: 'Related simulation systems', ru: 'Связанные системы симуляции' },
              admin: { condition: (_, siblingData) => Boolean(siblingData?.usesSimulation) },
            },
            {
              /**
               * EK-2 KOPRUSU
               * Dijital kutuphane subdomaininde bu konuya karsilik gelen
               * kategori/koleksiyon anahtari. Web sitesi, kutuphaneye
               * onceden filtrelenmis bir arama URL'i uretir:
               *   {libraryBaseUrl}/search?subject={librarySubjectKey}&lang={locale}
               */
              name: 'librarySubjectKey',
              type: 'text',
              label: {
                tr: 'Dijital Kütüphane Konu Anahtarı',
                en: 'Digital library subject key',
                ru: 'Ключ темы в цифровой библиотеке',
              },
              admin: {
                description: {
                  tr: 'EK-2 kütüphane sistemindeki konu kodu. Doldurulursa konu sayfasında “Bu konudaki yayınlar” bağlantısı otomatik oluşur.',
                  en: 'Subject code in the EK-2 library system. Enables the “Publications on this topic” link.',
                  ru: 'Код темы в системе библиотеки EK-2.',
                },
              },
            },
          ],
        },
      ],
    },
  ],
}

export default TrainingTopics
