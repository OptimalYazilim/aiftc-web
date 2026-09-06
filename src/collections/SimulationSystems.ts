import type { CollectionConfig } from 'payload'

import { canAuthorContent, canDeleteContent, publishedOrAuthenticated } from '@/access'
import { translationStatusField } from '@/fields/publishing'
import { slugField } from '@/fields/slug'
import { revalidateCollection, revalidateOnDelete } from '@/hooks/revalidate'
import { syncTranslationStatus } from '@/hooks/syncTranslationStatus'

/**
 * SIMULASYON MERKEZI - SISTEMLER  (Sartname EK-1 / 6.5 ve 9.1-9.3)
 *
 * MIMARI NOT
 * ----------
 * Simulasyon Merkezi tek bir SAYFA'dir; sayfanin girisi, amaci ve teknik
 * kapasite metni `globals/SimulationCenter.ts` icindedir (tek kayit -> Global).
 *
 * Bu KOLEKSIYON ise sayfada listelenen SISTEMLERI tutar: OYMES, BTES ve
 * ileride eklenecek diger simulatorler. Boylece:
 *   - Yeni bir sistem eklemek icin kod degisikligi gerekmez (6.5 esneklik),
 *   - Egitim programlari ve egitim konulari sisteme relationship ile baglanir
 *     (9.3 "Egitimlerle Baglanti"),
 *   - Her sistemin kendi gorsel/video seti olur (9.2 "Gorsel Anlatim").
 */
export const SimulationSystems: CollectionConfig = {
  slug: 'simulation-systems',
  labels: {
    singular: { tr: 'Simülasyon Sistemi', en: 'Simulation system', ru: 'Система симуляции' },
    plural: { tr: 'Simülasyon Sistemleri', en: 'Simulation systems', ru: 'Системы симуляции' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'shortCode', 'order', '_status', 'updatedAt'],
    group: { tr: 'Simülasyon Merkezi', en: 'Simulation centre', ru: 'Центр симуляции' },
    description: {
      tr: 'OYMES, BTES ve diğer simülasyon altyapıları. Sayfanın giriş metni Genel > Simülasyon Merkezi bölümündedir.',
      en: 'OYMES, BTES and other simulation systems. Page intro lives under Globals.',
      ru: 'OYMES, BTES и другие системы. Вводный текст — в глобальных настройках.',
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
      syncTranslationStatus(['title', 'summary']),
      revalidateCollection('/simulasyon-merkezi'),
    ],
    afterDelete: [revalidateOnDelete('/simulasyon-merkezi')],
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
      type: 'tabs',
      tabs: [
        {
          label: { tr: 'Tanıtım', en: 'Overview', ru: 'Обзор' },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              localized: true,
              label: { tr: 'Sistem Adı', en: 'System name', ru: 'Название системы' },
              admin: {
                description: {
                  tr: 'Örn. OYMES — Orman Yangını Müdahale Eğitim Simülatörü',
                  en: 'e.g. OYMES — Forest Fire Response Training Simulator',
                  ru: 'Напр. OYMES',
                },
              },
            },
            {
              name: 'shortCode',
              type: 'text',
              required: true,
              unique: true,
              label: { tr: 'Kısa Kod', en: 'Short code', ru: 'Код' },
              admin: {
                description: { tr: 'Örn. OYMES, BTES', en: 'e.g. OYMES, BTES', ru: 'Напр. OYMES, BTES' },
              },
            },
            {
              name: 'summary',
              type: 'textarea',
              required: true,
              localized: true,
              maxLength: 400,
              label: { tr: 'Kısa Bilgi', en: 'Short description', ru: 'Краткое описание' },
            },
            {
              name: 'description',
              type: 'richText',
              localized: true,
              label: { tr: 'Detaylı Anlatım', en: 'Full description', ru: 'Подробное описание' },
            },
            {
              name: 'useCases',
              type: 'array',
              localized: true,
              label: { tr: 'Kullanım Alanları', en: 'Use cases', ru: 'Области применения' },
              fields: [{ name: 'text', type: 'text', required: true }],
            },
            {
              name: 'benefitsForInternational',
              type: 'richText',
              localized: true,
              label: {
                tr: 'Uluslararası Katılımcılara Sağladığı Fayda',
                en: 'Benefits for international participants',
                ru: 'Преимущества для международных участников',
              },
            },
          ],
        },
        {
          label: { tr: 'Teknik Kapasite', en: 'Technical capacity', ru: 'Технические возможности' },
          fields: [
            {
              name: 'technicalSpecs',
              type: 'array',
              localized: true,
              label: { tr: 'Teknik Özellikler', en: 'Technical specifications', ru: 'Технические характеристики' },
              labels: {
                singular: { tr: 'Özellik', en: 'Specification', ru: 'Характеристика' },
                plural: { tr: 'Özellikler', en: 'Specifications', ru: 'Характеристики' },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true, admin: { width: '40%' } },
                    { name: 'value', type: 'text', required: true, admin: { width: '60%' } },
                  ],
                },
              ],
            },
            {
              name: 'capacity',
              type: 'number',
              min: 0,
              localized: false,
              label: { tr: 'Eşzamanlı Kullanıcı Kapasitesi', en: 'Concurrent user capacity', ru: 'Одновременных пользователей' },
            },
            {
              name: 'supportsRemote',
              type: 'checkbox',
              defaultValue: false,
              label: {
                tr: 'Uzaktan eğitimde kullanılabilir',
                en: 'Available for remote training',
                ru: 'Доступна для дистанционного обучения',
              },
              admin: {
                description: {
                  tr: 'Şartname 6.5: “Simülasyonların uzaktan eğitimlerde kullanılmasına uygun bağlantıların sağlanması.”',
                  en: 'Spec 6.5: remote access links for simulations.',
                  ru: 'П. 6.5: доступ к симуляциям при дистанционном обучении.',
                },
              },
            },
            {
              name: 'accessLinks',
              type: 'array',
              label: { tr: 'Erişim Bağlantıları', en: 'Access links', ru: 'Ссылки доступа' },
              admin: {
                condition: (_, siblingData) => Boolean(siblingData?.supportsRemote),
                description: {
                  tr: 'Simülasyon modülü girişleri. Kimlik doğrulama hedef sistemde yapılır; burada yalnızca yönlendirme tutulur.',
                  en: 'Entry points to the simulation module. Authentication happens on the target system.',
                  ru: 'Точки входа в модуль симуляции.',
                },
              },
              fields: [
                {
                  name: 'audience',
                  type: 'select',
                  required: true,
                  defaultValue: 'trainer',
                  label: { tr: 'Kime Yönelik', en: 'Audience', ru: 'Для кого' },
                  options: [
                    { value: 'trainer', label: { tr: 'Eğitmenler', en: 'Trainers', ru: 'Тренеры' } },
                    { value: 'learner', label: { tr: 'Öğreniciler', en: 'Learners', ru: 'Обучающиеся' } },
                    { value: 'public', label: { tr: 'Herkese açık demo', en: 'Public demo', ru: 'Открытая демонстрация' } },
                  ],
                },
                { name: 'label', type: 'text', required: true, localized: true, label: { tr: 'Bağlantı Metni', en: 'Link label', ru: 'Текст ссылки' } },
                { name: 'url', type: 'text', required: true, label: { tr: 'Adres', en: 'URL', ru: 'Адрес' } },
              ],
            },
          ],
        },
        {
          label: { tr: 'Görsel Anlatım', en: 'Visual content', ru: 'Визуальные материалы' },
          description: {
            tr: 'Şartname 9.2: bu bölüm yalnızca metin ağırlıklı olmamalıdır.',
            en: 'Spec 9.2: this section must not be text-only.',
            ru: 'П. 9.2: раздел не должен быть только текстовым.',
          },
          fields: [
            { name: 'coverImage', type: 'upload', relationTo: 'media', label: { tr: 'Kapak Görseli', en: 'Cover image', ru: 'Обложка' } },
            { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true, label: { tr: 'Fotoğraf / Ekran Görüntüsü', en: 'Photos & screenshots', ru: 'Фото и скриншоты' } },
            {
              name: 'videos',
              type: 'array',
              label: { tr: 'Videolar', en: 'Videos', ru: 'Видео' },
              admin: {
                description: {
                  tr: 'CDN üzerinden servis edilen kaynak adresi veya gömülü oynatıcı bağlantısı (Şartname 6.5 — CDN).',
                  en: 'CDN-served source URL or embed link (spec 6.5 — CDN).',
                  ru: 'Адрес источника через CDN или ссылка для встраивания.',
                },
              },
              fields: [
                { name: 'title', type: 'text', required: true, localized: true },
                { name: 'url', type: 'text', required: true, label: { tr: 'Video Adresi (CDN)', en: 'Video URL (CDN)', ru: 'Адрес видео (CDN)' } },
                { name: 'poster', type: 'upload', relationTo: 'media', label: { tr: 'Kapak Karesi', en: 'Poster', ru: 'Постер' } },
                {
                  name: 'captionsUrl',
                  type: 'text',
                  label: { tr: 'Altyazı Dosyası (WebVTT)', en: 'Captions file (WebVTT)', ru: 'Файл субтитров (WebVTT)' },
                  admin: {
                    description: {
                      tr: 'WCAG 2.2 — video içerikleri için altyazı desteği (Şartname 13).',
                      en: 'WCAG 2.2 — captions for video content.',
                      ru: 'WCAG 2.2 — субтитры для видео.',
                    },
                  },
                },
                {
                  name: 'transcript',
                  type: 'textarea',
                  localized: true,
                  label: { tr: 'Metin Dökümü', en: 'Transcript', ru: 'Текстовая расшифровка' },
                },
              ],
            },
          ],
        },
        {
          label: { tr: 'Eğitim Bağlantıları', en: 'Training links', ru: 'Связь с обучением' },
          description: {
            tr: 'Şartname 9.3: simülasyon sayfası ilgili eğitim duyuruları ve konularıyla ilişkilendirilir.',
            en: 'Spec 9.3: link the simulation page to related trainings and topics.',
            ru: 'П. 9.3: связь с программами и темами обучения.',
          },
          fields: [
            {
              name: 'relatedTopics',
              type: 'relationship',
              relationTo: 'training-topics',
              hasMany: true,
              label: { tr: 'İlgili Eğitim Konuları', en: 'Related training topics', ru: 'Связанные темы' },
            },
            {
              name: 'usageInTraining',
              type: 'richText',
              localized: true,
              label: {
                tr: 'Eğitimlerde Kullanım Şekli',
                en: 'How it is used in training',
                ru: 'Как используется в обучении',
              },
            },
          ],
        },
      ],
    },
  ],
}

export default SimulationSystems
