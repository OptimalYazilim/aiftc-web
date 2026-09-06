import type { CollectionConfig } from 'payload'

import { canAuthorContent, canDeleteContent, publishedOrAuthenticated } from '@/access'
import { publishingFields, reviewStatusField, translationStatusField } from '@/fields/publishing'
import { slugField } from '@/fields/slug'
import {
  CERTIFICATE_TYPES,
  DELIVERY_MODES,
  FOCUS_COUNTRIES,
  INSTRUCTION_LANGUAGES,
  TRAINING_LEVELS,
  TRAINING_STATUSES,
} from '@/fields/options'
import { guardVirtualClassrooms } from '@/hooks/guardVirtualClassrooms'
import { revalidateCollection, revalidateOnDelete } from '@/hooks/revalidate'
import { syncTranslationStatus } from '@/hooks/syncTranslationStatus'

/**
 * EGITIMLER VE EGITIM PROGRAMLARI  (Sartname EK-1 / 6.4, 7.1 + EK-2 / 2.1-2.4)
 *
 * Tek koleksiyon uc isi birden gorur:
 *   1) Egitim DUYURUSU        -> 6.4 / EK-2 2.1 alanlari
 *   2) Egitim TAKVIMI kaydi   -> EK-2 2.2 (status + tarih araligi)
 *   3) Egitim PROGRAMI sayfasi-> EK-2 2.3 (gunluk program, oturumlar)
 * ve tamamlandiginda 4) SONUC ozeti -> EK-2 2.4
 *
 * Boylece editor tek kayit acar; sayfa, takvim ve duyuru ayni veriden beslenir.
 * Sartname acikca belirtiyor: "tam kapsamli bir LMS zorunlulugu dogurmadan".
 * Bu nedenle basvuru ALINMAZ, yalnizca yonlendirilir (applicationTarget).
 */
export const TrainingPrograms: CollectionConfig = {
  slug: 'training-programs',
  labels: {
    singular: { tr: 'Eğitim Programı', en: 'Training programme', ru: 'Программа обучения' },
    plural: { tr: 'Eğitimler ve Programlar', en: 'Training programmes', ru: 'Программы обучения' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'startDate', 'deliveryMode', '_status', 'updatedAt'],
    group: { tr: 'Eğitim', en: 'Training', ru: 'Обучение' },
    listSearchableFields: ['title', 'summary', 'venue'],
    description: {
      tr: 'Duyuru, takvim kaydı ve program detay sayfası tek kayıttan üretilir.',
      en: 'Announcement, calendar entry and detail page all come from one record.',
      ru: 'Объявление, календарь и страница программы — одна запись.',
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
    maxPerDoc: 30,
  },
  defaultSort: '-startDate',
  hooks: {
    afterChange: [
      syncTranslationStatus(['title', 'summary']),
      revalidateCollection('/egitim-programlari'),
    ],
    // Bagli sanal sinif varsa silmeyi anlasilir bir mesajla durdurur.
    beforeDelete: [guardVirtualClassrooms],
    afterDelete: [revalidateOnDelete('/egitim-programlari')],
  },
  fields: [
    slugField(),
    reviewStatusField,
    {
      name: 'status',
dbName: 'program_status',
enumName: 'enum_tp_custom_status',
      type: 'select',
      required: true,
      defaultValue: 'planned',
      index: true,
      label: { tr: 'Eğitim Durumu', en: 'Training status', ru: 'Статус обучения' },
      options: TRAINING_STATUSES,
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Takvimdeki rozet ve “Başvur” butonunun görünürlüğü bu alana bağlıdır.',
          en: 'Drives the calendar badge and the visibility of the Apply button.',
          ru: 'Определяет метку в календаре и кнопку «Подать заявку».',
        },
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: { tr: 'Ana sayfada öne çıkar', en: 'Feature on homepage', ru: 'На главной' },
      admin: { position: 'sidebar' },
    },
    translationStatusField,
    publishingFields,

    {
      type: 'tabs',
      tabs: [
        // ------------------------------------------------------------------
        // 1) DUYURU  (6.4 / EK-2 2.1)
        // ------------------------------------------------------------------
        {
          label: { tr: 'Duyuru', en: 'Announcement', ru: 'Объявление' },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              localized: true,
              label: { tr: 'Eğitim Adı', en: 'Training title', ru: 'Название обучения' },
            },
            {
              name: 'code',
              type: 'text',
              unique: true,
              label: { tr: 'Eğitim Kodu', en: 'Training code', ru: 'Код обучения' },
              admin: {
                description: {
                  tr: 'Örn. AIFTC-2027-IFM-01. Sertifika numarası ve kütüphane bağlantısı bu kodu kullanır.',
                  en: 'e.g. AIFTC-2027-IFM-01. Used by certificate numbers and library links.',
                  ru: 'Напр. AIFTC-2027-IFM-01.',
                },
              },
            },
            {
              name: 'summary',
              type: 'textarea',
              required: true,
              localized: true,
              maxLength: 400,
              label: { tr: 'Kısa Tanıtım', en: 'Summary', ru: 'Краткое описание' },
            },
            {
              name: 'topics',
              type: 'relationship',
              relationTo: 'training-topics',
              hasMany: true,
              required: true,
              index: true,
              label: { tr: 'Eğitim Konusu', en: 'Training topics', ru: 'Темы обучения' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'startDate',
                  type: 'date',
                  required: true,
                  index: true,
                  label: { tr: 'Başlangıç Tarihi', en: 'Start date', ru: 'Дата начала' },
                  admin: {
                    width: '50%',
                    date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' },
                  },
                },
                {
                  name: 'endDate',
                  type: 'date',
                  label: { tr: 'Bitiş Tarihi', en: 'End date', ru: 'Дата окончания' },
                  admin: {
                    width: '50%',
                    date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' },
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'durationDays',
                  type: 'number',
                  min: 0,
                  label: { tr: 'Süre (gün)', en: 'Duration (days)', ru: 'Продолжительность (дней)' },
                  admin: { width: '50%' },
                },
                {
                  name: 'durationHours',
                  type: 'number',
                  min: 0,
                  label: { tr: 'Süre (saat)', en: 'Duration (hours)', ru: 'Продолжительность (часов)' },
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'deliveryMode',
                  type: 'select',
                  required: true,
                  defaultValue: 'in-person',
                  label: { tr: 'Eğitim Biçimi', en: 'Delivery mode', ru: 'Формат' },
                  options: DELIVERY_MODES,
                  admin: { width: '50%' },
                },
                {
                  name: 'level',
                  type: 'select',
                  label: { tr: 'Eğitim Düzeyi', en: 'Level', ru: 'Уровень' },
                  options: TRAINING_LEVELS,
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'venue',
              type: 'text',
              localized: true,
              label: { tr: 'Eğitim Yeri', en: 'Venue', ru: 'Место проведения' },
              admin: {
                description: {
                  tr: 'Örn. AIFTC Kampüsü, Antalya. Çevrim içi eğitimlerde boş bırakılabilir.',
                  en: 'e.g. AIFTC Campus, Antalya. May be empty for online training.',
                  ru: 'Напр. Кампус AIFTC, Анталья.',
                },
                condition: (_, siblingData) => siblingData?.deliveryMode !== 'online',
              },
            },
            {
              name: 'instructionLanguages',
              type: 'select',
              hasMany: true,
              required: true,
              label: { tr: 'Eğitim Dili', en: 'Language of instruction', ru: 'Язык обучения' },
              options: INSTRUCTION_LANGUAGES,
              admin: {
                description: {
                  tr: 'Eğitimin verildiği dil(ler). Sayfanın görüntülendiği dilden bağımsızdır.',
                  en: 'Language(s) the training is delivered in — independent of the page locale.',
                  ru: 'Язык проведения обучения.',
                },
              },
            },
            {
              name: 'targetAudience',
              type: 'textarea',
              localized: true,
              label: { tr: 'Hedef Kitle', en: 'Target audience', ru: 'Целевая аудитория' },
            },
            {
              name: 'participantCountries',
              type: 'select',
              hasMany: true,
              label: { tr: 'Katılımcı Ülkeler', en: 'Participating countries', ru: 'Страны-участницы' },
              options: FOCUS_COUNTRIES,
              admin: {
                description: {
                  tr: 'ISO 3166-1 alpha-2 kodları. Uygulanabilir değilse boş bırakın.',
                  en: 'ISO 3166-1 alpha-2. Leave empty if not applicable.',
                  ru: 'Коды ISO 3166-1 alpha-2.',
                },
              },
            },
            {
              name: 'quota',
              type: 'number',
              min: 0,
              label: { tr: 'Kontenjan', en: 'Quota', ru: 'Количество мест' },
            },
          ],
        },

        // ------------------------------------------------------------------
        // 2) BASVURU  (6.4 - "Basvuru veya iletisim yonlendirmesi")
        // ------------------------------------------------------------------
        {
          label: { tr: 'Başvuru', en: 'Application', ru: 'Заявка' },
          description: {
            tr: 'EK-1 kapsamında başvuru FORMU tutulmaz; başvuru yalnızca yönlendirilir. Kişisel veri toplanmaz (Şartname 12.2).',
            en: 'No application form is stored here; applicants are redirected. No personal data is collected.',
            ru: 'Форма заявки не хранится; выполняется перенаправление.',
          },
          fields: [
            {
              name: 'applicationRequirements',
              type: 'richText',
              localized: true,
              label: { tr: 'Başvuru Koşulları', en: 'Application requirements', ru: 'Условия подачи заявки' },
            },
            {
              name: 'applicationDeadline',
              type: 'date',
              label: { tr: 'Son Başvuru Tarihi', en: 'Application deadline', ru: 'Крайний срок подачи' },
              admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } },
            },
            {
              name: 'applicationTarget',
              type: 'group',
              label: { tr: 'Başvuru Yönlendirmesi', en: 'Application target', ru: 'Перенаправление заявки' },
              fields: [
                {
                  name: 'type',
                  type: 'select',
                  defaultValue: 'contact',
                  label: { tr: 'Yönlendirme Türü', en: 'Type', ru: 'Тип' },
                  options: [
                    { value: 'contact', label: { tr: 'İletişim birimine yönlendir', en: 'Contact unit', ru: 'Контактное лицо' } },
                    { value: 'external', label: { tr: 'Harici başvuru bağlantısı', en: 'External link', ru: 'Внешняя ссылка' } },
                    { value: 'portal', label: { tr: 'Yönetim portalı (subdomain)', en: 'Management portal (subdomain)', ru: 'Портал управления' } },
                    { value: 'email', label: { tr: 'E-posta ile başvuru', en: 'Apply by e-mail', ru: 'Заявка по e-mail' } },
                    { value: 'none', label: { tr: 'Başvuru alınmıyor', en: 'Not accepting applications', ru: 'Заявки не принимаются' } },
                  ],
                },
                {
                  name: 'url',
                  type: 'text',
                  label: { tr: 'Bağlantı Adresi', en: 'URL', ru: 'Ссылка' },
                  validate: (value: unknown) => {
                    if (!value || typeof value !== 'string') return true
                    return /^https?:\/\//i.test(value)
                      ? true
                      : 'Bağlantı http:// veya https:// ile başlamalıdır.'
                  },
                  admin: {
                    condition: (_, siblingData) => siblingData?.type === 'external',
                  },
                },
                {
                  name: 'portalPath',
                  type: 'text',
                  label: { tr: 'Portal Yolu', en: 'Portal path', ru: 'Путь портала' },
                  defaultValue: '/basvuru',
                  admin: {
                    condition: (_, siblingData) => siblingData?.type === 'portal',
                    description: {
                      tr: 'Portalın ana adresi Genel Ayarlar > Dış Servisler’den gelir. Buraya yalnızca yol yazın (örn. /basvuru).',
                      en: 'The portal base URL comes from Site Settings > External Services. Enter only the path.',
                      ru: 'Базовый адрес портала берётся из настроек. Укажите только путь.',
                    },
                  },
                },
                {
                  name: 'email',
                  type: 'email',
                  label: { tr: 'Başvuru E-postası', en: 'Application e-mail', ru: 'E-mail для заявок' },
                  admin: { condition: (_, siblingData) => siblingData?.type === 'email' },
                },
                {
                  name: 'contactUnit',
                  type: 'text',
                  localized: true,
                  label: { tr: 'İletişim Kişisi / Birimi', en: 'Contact person or unit', ru: 'Контактное лицо / отдел' },
                  admin: { condition: (_, siblingData) => siblingData?.type === 'contact' },
                },
              ],
            },
          ],
        },

        // ------------------------------------------------------------------
        // 3) PROGRAM DETAYI  (EK-2 2.3)
        // ------------------------------------------------------------------
        {
          label: { tr: 'Program Detayı', en: 'Programme', ru: 'Программа' },
          fields: [
            {
              name: 'objective',
              type: 'richText',
              localized: true,
              label: { tr: 'Eğitim Amacı', en: 'Objective', ru: 'Цель обучения' },
            },
            {
              name: 'learningOutcomes',
              type: 'array',
              localized: true,
              label: { tr: 'Öğrenme Çıktıları', en: 'Learning outcomes', ru: 'Результаты обучения' },
              fields: [{ name: 'text', type: 'text', required: true }],
            },
            {
              name: 'schedule',
              type: 'array',
              localized: true,
              label: { tr: 'Günlük Program', en: 'Daily schedule', ru: 'Расписание по дням' },
              labels: {
                singular: { tr: 'Gün', en: 'Day', ru: 'День' },
                plural: { tr: 'Günler', en: 'Days', ru: 'Дни' },
              },
              admin: { initCollapsed: true },
              fields: [
                {
                  name: 'dayLabel',
                  type: 'text',
                  required: true,
                  label: { tr: 'Gün Başlığı', en: 'Day label', ru: 'Заголовок дня' },
                  admin: { description: { tr: 'Örn. 1. Gün — 12 Mayıs', en: 'e.g. Day 1 — 12 May', ru: 'Напр. День 1' } },
                },
                {
                  name: 'sessions',
                  type: 'array',
                  label: { tr: 'Oturumlar', en: 'Sessions', ru: 'Сессии' },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'time', type: 'text', label: { tr: 'Saat', en: 'Time', ru: 'Время' }, admin: { width: '25%' } },
                        { name: 'title', type: 'text', required: true, label: { tr: 'Oturum', en: 'Session', ru: 'Сессия' }, admin: { width: '45%' } },
                        {
                          name: 'type',
                          type: 'select',
                          defaultValue: 'theory',
                          label: { tr: 'Tür', en: 'Type', ru: 'Тип' },
                          admin: { width: '30%' },
                          options: [
                            { value: 'theory', label: { tr: 'Teorik', en: 'Theory', ru: 'Теория' } },
                            { value: 'practice', label: { tr: 'Uygulamalı', en: 'Practical', ru: 'Практика' } },
                            { value: 'simulation', label: { tr: 'Simülasyon', en: 'Simulation', ru: 'Симуляция' } },
                            { value: 'field', label: { tr: 'Saha uygulaması', en: 'Field exercise', ru: 'Полевые занятия' } },
                            { value: 'assessment', label: { tr: 'Değerlendirme', en: 'Assessment', ru: 'Оценка' } },
                          ],
                        },
                      ],
                    },
                    { name: 'trainer', type: 'text', label: { tr: 'Eğitmen', en: 'Trainer', ru: 'Тренер' } },
                  ],
                },
              ],
            },
            {
              name: 'trainers',
              type: 'array',
              label: { tr: 'Eğitmen Bilgisi', en: 'Trainers', ru: 'Тренеры' },
              fields: [
                { name: 'name', type: 'text', required: true, label: { tr: 'Ad Soyad', en: 'Name', ru: 'Имя' } },
                { name: 'titleAndRole', type: 'text', localized: true, label: { tr: 'Unvan / Görev', en: 'Title / role', ru: 'Должность' } },
                { name: 'organization', type: 'text', label: { tr: 'Kurum', en: 'Organisation', ru: 'Организация' } },
                { name: 'photo', type: 'upload', relationTo: 'media', label: { tr: 'Fotoğraf', en: 'Photo', ru: 'Фото' } },
              ],
            },
            {
              name: 'assessmentMethod',
              type: 'richText',
              localized: true,
              label: { tr: 'Değerlendirme Yöntemi', en: 'Assessment method', ru: 'Метод оценки' },
            },
            {
              name: 'usesSimulation',
              type: 'checkbox',
              defaultValue: false,
              label: { tr: 'Simülasyon merkezi kullanılıyor', en: 'Uses the simulation centre', ru: 'Используется центр симуляции' },
            },
            {
              name: 'simulationSystems',
              type: 'relationship',
              relationTo: 'simulation-systems',
              hasMany: true,
              label: { tr: 'Kullanılan Sistemler', en: 'Systems used', ru: 'Используемые системы' },
              admin: { condition: (_, siblingData) => Boolean(siblingData?.usesSimulation) },
            },
            {
              name: 'hasFieldExercise',
              type: 'checkbox',
              defaultValue: false,
              label: { tr: 'Saha uygulaması var', en: 'Includes field exercise', ru: 'Есть полевые занятия' },
            },
          ],
        },

        // ------------------------------------------------------------------
        // 4) SERTIFIKA  (7.1)
        // ------------------------------------------------------------------
        {
          label: { tr: 'Sertifika', en: 'Certificate', ru: 'Сертификат' },
          fields: [
            {
              name: 'certificateType',
              type: 'select',
              defaultValue: 'attendance',
              required: true,
              label: { tr: 'Verilecek Belge Türü', en: 'Document type', ru: 'Тип документа' },
              options: CERTIFICATE_TYPES,
              admin: {
                description: {
                  tr: 'Şartname 7.1: her eğitim sayfasında belge türü açıkça belirtilir.',
                  en: 'Spec 7.1: the document type must be stated on every training page.',
                  ru: 'П. 7.1: тип документа указывается на каждой странице.',
                },
              },
            },
            {
              name: 'certificateConditions',
              type: 'richText',
              localized: true,
              label: { tr: 'Sertifika Koşulları', en: 'Certificate conditions', ru: 'Условия получения' },
              admin: { condition: (_, siblingData) => siblingData?.certificateType !== 'none' },
            },
            {
              name: 'issuingBodies',
              type: 'array',
              label: { tr: 'Düzenleyen Kurumlar', en: 'Issuing bodies', ru: 'Организации-эмитенты' },
              admin: {
                description: {
                  tr: 'Görünürlük kuralları (10.2) gereği logo sırası önemlidir.',
                  en: 'Logo order matters under the visibility rules (10.2).',
                  ru: 'Порядок логотипов важен (п. 10.2).',
                },
              },
              fields: [
                { name: 'name', type: 'text', required: true, localized: true },
                { name: 'logo', type: 'upload', relationTo: 'media' },
              ],
            },
          ],
        },

        // ------------------------------------------------------------------
        // 5) MATERYAL VE KUTUPHANE BAGLANTISI  (EK-2 koprusu)
        // ------------------------------------------------------------------
        {
          label: { tr: 'Materyal ve Kütüphane', en: 'Materials & library', ru: 'Материалы и библиотека' },
          description: {
            tr: 'Dosyalar EK-2 dijital kütüphanesinde tutulur. Buradan yalnızca bağlantı verilir.',
            en: 'Files live in the EK-2 digital library. Only links are stored here.',
            ru: 'Файлы хранятся в цифровой библиотеке EK-2. Здесь только ссылки.',
          },
          fields: [
            {
              name: 'attachments',
              type: 'relationship',
              relationTo: 'document-files',
              hasMany: true,
              label: { tr: 'İlgili Dokümanlar', en: 'Related documents', ru: 'Связанные документы' },
              admin: {
                description: {
                  tr: 'Duyuru eki, program PDF’i gibi doğrudan siteden indirilecek küçük dosyalar.',
                  en: 'Small files served directly from the site (announcement annex, programme PDF).',
                  ru: 'Небольшие файлы, размещаемые на самом сайте.',
                },
              },
            },
            {
              name: 'libraryCollectionKey',
              type: 'text',
              label: {
                tr: 'Kütüphane Koleksiyon Anahtarı',
                en: 'Library collection key',
                ru: 'Ключ коллекции библиотеки',
              },
              admin: {
                description: {
                  tr: 'EK-2 kütüphanesinde bu eğitimin materyallerini gösteren koleksiyon/etiket kodu. Doldurulursa “Eğitim materyalleri” butonu otomatik oluşur.',
                  en: 'Collection/tag key in the EK-2 library. Enables the “Training materials” button.',
                  ru: 'Ключ коллекции в библиотеке EK-2.',
                },
              },
            },
          ],
        },

        // ------------------------------------------------------------------
        // 6) SONUC  (EK-2 2.4)
        // ------------------------------------------------------------------
        {
          label: { tr: 'Sonuç', en: 'Results', ru: 'Итоги' },
          description: {
            tr: 'Yalnızca “Tamamlandı” durumundaki eğitimler için doldurulur.',
            en: 'Fill in only for trainings marked as Completed.',
            ru: 'Заполняется только для завершённых обучений.',
          },
          fields: [
            {
              name: 'results',
              type: 'group',
              label: { tr: 'Eğitim Sonucu', en: 'Training results', ru: 'Итоги обучения' },
              admin: {
                condition: (data) => data?.status === 'completed',
              },
              fields: [
                {
                  name: 'participantCount',
                  type: 'number',
                  min: 0,
                  label: { tr: 'Katılımcı Sayısı', en: 'Number of participants', ru: 'Количество участников' },
                  admin: {
                    description: {
                      tr: 'Yalnızca toplam sayı. Katılımcı adları web sitesinde tutulmaz (KVKK).',
                      en: 'Aggregate count only. No participant names are stored on the website.',
                      ru: 'Только общее количество. Имена участников не хранятся.',
                    },
                  },
                },
                {
                  name: 'summary',
                  type: 'richText',
                  localized: true,
                  label: { tr: 'Sonuç Özeti', en: 'Summary of results', ru: 'Краткие итоги' },
                },
                {
                  name: 'photos',
                  type: 'upload',
                  relationTo: 'media',
                  hasMany: true,
                  label: { tr: 'Fotoğraflar', en: 'Photos', ru: 'Фотографии' },
                },
                {
                  name: 'videoUrl',
                  type: 'text',
                  label: { tr: 'Video Bağlantısı', en: 'Video link', ru: 'Ссылка на видео' },
                },
                {
                  name: 'hadCertificateCeremony',
                  type: 'checkbox',
                  defaultValue: false,
                  label: { tr: 'Sertifika töreni yapıldı', en: 'Certificate ceremony held', ru: 'Церемония вручения проведена' },
                },
                {
                  name: 'relatedNews',
                  type: 'relationship',
                  relationTo: 'news',
                  hasMany: true,
                  label: { tr: 'İlgili Haberler', en: 'Related news', ru: 'Связанные новости' },
                },
              ],
            },
          ],
        },

        // ------------------------------------------------------------------
        // 7) GORSEL
        // ------------------------------------------------------------------
        {
          label: { tr: 'Görsel', en: 'Media', ru: 'Медиа' },
          fields: [
            { name: 'coverImage', type: 'upload', relationTo: 'media', label: { tr: 'Kapak Görseli', en: 'Cover image', ru: 'Обложка' } },
            { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true, label: { tr: 'Galeri', en: 'Gallery', ru: 'Галерея' } },
          ],
        },
      ],
    },
  ],
}

export default TrainingPrograms
