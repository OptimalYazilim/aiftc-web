import type { CollectionConfig, Field } from 'payload'

import { canAuthorContent, canDeleteContent, publishedOrAuthenticated } from '@/access'
import { publishingFields, translationStatusField } from '@/fields/publishing'
import { slugField } from '@/fields/slug'
import { revalidateCollection, revalidateOnDelete } from '@/hooks/revalidate'
import { syncTranslationStatus } from '@/hooks/syncTranslationStatus'

/**
 * SERBEST SAYFALAR  (Sartname EK-1 / 6.1, 6.2, 6.9, 12.2, 12.3)
 *
 * Kuruluş alt basliklari (Hakkimizda, Tarihce, Misyon, Vizyon, Kurumsal yapi,
 * Yonetim, Egitmenler, Paydaslar), Ana Sayfa bloklari, Iletisim, KVKK aydinlatma
 * metni ve cerez politikasi bu koleksiyonda tutulur.
 *
 * Blok tabanli (layout builder) yapi: editor kod yazmadan sayfa kurar.
 * Bloklarin on yuz karsiligi: components/pages/PageBlocks.tsx
 */

/**
 * BLOK BASLIGI — istege bagli, GORUNUR bir baslik.
 * ============================================================================
 * `statsBlock`, `peopleBlock`, `partnersBlock` ve `timelineBlock` bloklarinda
 * baslik alani YOKTU. Bloklar on yuze baglandiginda ortaya cikan sorun sudur:
 * sayfanin ortasinda, neyin listesi oldugu soylenmeyen bir kisi izgarasi ya da
 * bir yil dizisi belirir. "Yonetim Kadrosu" ya da "Tarihce" yazan bir baslik,
 * icerigin kendisi kadar gereklidir.
 *
 * Payload'in yerlesik `blockName` alani KULLANILMADI: o alan panelde bloklari
 * birbirinden ayirmak icindir, ziyaretciye basilmasi amaclanmamistir. Gorunur
 * metni gorunmez bir yonetim etiketine bindirmek, ileride birinin blogu
 * "eski surum" diye yeniden adlandirmasiyla sayfaya sizardi.
 *
 * ZORUNLU DEGILDIR: art arda gelen iki kisi blogunda ikinci basligin
 * tekrarlanmasi gerekmez. Bos birakildiginda hicbir baslik basilmaz.
 *
 * Ayrica YERELLESTIRILMEZ — cunku kapsayici `layout` alani zaten
 * `localized: true`'dur; her dil kendi blok dizisini tasir.
 */
const blockHeading: Field = {
  name: 'heading',
  type: 'text',
  label: { tr: 'Bölüm Başlığı', en: 'Section heading', ru: 'Заголовок раздела' },
  admin: {
    description: {
      tr: 'İsteğe bağlı. Örn. “Yönetim Kadrosu”, “Tarihçe”, “Sayılarla Merkez”. Boş bırakılırsa başlık gösterilmez.',
      en: 'Optional. e.g. “Management”, “History”. Left empty, no heading is shown.',
      ru: 'Необязательно. Если оставить пустым, заголовок не отображается.',
    },
  },
}
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: { tr: 'Sayfa', en: 'Page', ru: 'Страница' },
    plural: { tr: 'Sayfalar', en: 'Pages', ru: 'Страницы' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'pageType', '_status', 'updatedAt'],
    group: { tr: 'İçerik', en: 'Content', ru: 'Контент' },
    livePreview: {
      url: ({ data, locale }) =>
        `${process.env.NEXT_PUBLIC_SERVER_URL}/${locale?.code ?? 'tr'}/${data?.slug ?? ''}`,
    },
  },
  access: {
    read: publishedOrAuthenticated,
    create: canAuthorContent,
    update: canAuthorContent,
    delete: canDeleteContent,
  },
  versions: { drafts: { autosave: false, schedulePublish: true }, maxPerDoc: 30 },
  hooks: {
    afterChange: [syncTranslationStatus(['title']), revalidateCollection('')],
    afterDelete: [revalidateOnDelete('')],
  },
  fields: [
    slugField(),
    {
      name: 'pageType',
      type: 'select',
      required: true,
      defaultValue: 'standard',
      label: { tr: 'Sayfa Tipi', en: 'Page type', ru: 'Тип страницы' },
      options: [
        { value: 'home', label: { tr: 'Ana Sayfa', en: 'Homepage', ru: 'Главная' } },
        { value: 'standard', label: { tr: 'Standart Sayfa', en: 'Standard page', ru: 'Обычная страница' } },
        { value: 'institution', label: { tr: 'Kuruluş alt sayfası', en: 'About subsection', ru: 'Подраздел «О центре»' } },
        { value: 'contact', label: { tr: 'İletişim', en: 'Contact', ru: 'Контакты' } },
        { value: 'legal', label: { tr: 'Hukuki metin (KVKK / çerez)', en: 'Legal (privacy / cookies)', ru: 'Правовой текст' } },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'pages',
      label: { tr: 'Üst Sayfa', en: 'Parent page', ru: 'Родительская страница' },
      admin: { position: 'sidebar' },
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
    },
    translationStatusField,
    publishingFields,
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: { tr: 'Başlık', en: 'Title', ru: 'Заголовок' },
    },
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      label: { tr: 'Alt Başlık', en: 'Subtitle', ru: 'Подзаголовок' },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      label: { tr: 'Üst Görsel', en: 'Hero image', ru: 'Главное изображение' },
    },
    {
      name: 'layout',
      type: 'blocks',
      localized: true,
      label: { tr: 'Sayfa Blokları', en: 'Page blocks', ru: 'Блоки страницы' },
      blocks: [
        {
          slug: 'richText',
          labels: { singular: { tr: 'Metin', en: 'Rich text', ru: 'Текст' }, plural: { tr: 'Metinler', en: 'Rich texts', ru: 'Тексты' } },
          fields: [{ name: 'content', type: 'richText', required: true }],
        },
        {
          slug: 'mediaBlock',
          labels: { singular: { tr: 'Görsel', en: 'Media', ru: 'Медиа' }, plural: { tr: 'Görseller', en: 'Media', ru: 'Медиа' } },
          fields: [
            { name: 'media', type: 'upload', relationTo: 'media', required: true },
            { name: 'caption', type: 'text' },
            {
              name: 'width',
              type: 'select',
              defaultValue: 'container',
              options: [
                { value: 'container', label: { tr: 'Normal', en: 'Container', ru: 'Обычная' } },
                { value: 'wide', label: { tr: 'Geniş', en: 'Wide', ru: 'Широкая' } },
                { value: 'full', label: { tr: 'Tam ekran', en: 'Full bleed', ru: 'На всю ширину' } },
              ],
            },
          ],
        },
        {
          slug: 'statsBlock',
          labels: { singular: { tr: 'Sayılarla', en: 'Statistics', ru: 'Статистика' }, plural: { tr: 'Sayılarla', en: 'Statistics', ru: 'Статистика' } },
          fields: [
            blockHeading,
            {
              name: 'items',
              type: 'array',
              maxRows: 4,
              fields: [
                { name: 'value', type: 'text', required: true },
                { name: 'label', type: 'text', required: true },
              ],
            },
          ],
        },
        {
          slug: 'peopleBlock',
          labels: { singular: { tr: 'Kişiler (Yönetim / Eğitmenler)', en: 'People', ru: 'Люди' }, plural: { tr: 'Kişi Blokları', en: 'People blocks', ru: 'Блоки людей' } },
          fields: [
            blockHeading,
            {
              name: 'people',
              type: 'array',
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'role', type: 'text' },
                { name: 'unit', type: 'text' },
                { name: 'photo', type: 'upload', relationTo: 'media' },
              ],
            },
          ],
        },
        {
          slug: 'partnersBlock',
          labels: { singular: { tr: 'Paydaşlar / İş Birlikleri', en: 'Partners', ru: 'Партнёры' }, plural: { tr: 'Paydaş Blokları', en: 'Partner blocks', ru: 'Блоки партнёров' } },
          fields: [
            blockHeading,
            {
              name: 'partners',
              type: 'array',
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'logo', type: 'upload', relationTo: 'media' },
                { name: 'url', type: 'text' },
              ],
            },
          ],
        },
        {
          slug: 'timelineBlock',
          labels: { singular: { tr: 'Tarihçe / Zaman Çizelgesi', en: 'Timeline', ru: 'Хронология' }, plural: { tr: 'Zaman Çizelgeleri', en: 'Timelines', ru: 'Хронологии' } },
          fields: [
            blockHeading,
            {
              name: 'entries',
              type: 'array',
              fields: [
                { name: 'year', type: 'text', required: true },
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'textarea' },
              ],
            },
          ],
        },
        {
          slug: 'ctaBlock',
          labels: { singular: { tr: 'Yönlendirme Kutusu', en: 'Call to action', ru: 'Призыв к действию' }, plural: { tr: 'Yönlendirme Kutuları', en: 'CTAs', ru: 'Призывы' } },
          fields: [
            { name: 'heading', type: 'text', required: true },
            { name: 'text', type: 'textarea' },
            {
              name: 'target',
              type: 'select',
              defaultValue: 'internal',
              options: [
                { value: 'internal', label: { tr: 'Site içi', en: 'Internal', ru: 'Внутренняя' } },
                { value: 'library', label: { tr: 'Dijital Kütüphane (subdomain)', en: 'Digital library (subdomain)', ru: 'Цифровая библиотека' } },
                { value: 'portal', label: { tr: 'Yönetim Portalı (subdomain)', en: 'Management portal (subdomain)', ru: 'Портал управления' } },
                { value: 'external', label: { tr: 'Harici adres', en: 'External URL', ru: 'Внешний адрес' } },
              ],
            },
            {
              name: 'href',
              type: 'text',
              admin: {
                description: {
                  tr: 'Kütüphane/portal seçildiyse yalnızca yol yazın (örn. /koleksiyonlar). Ana adres Genel Ayarlar’dan gelir.',
                  en: 'For library/portal, enter only the path. The base URL comes from Site Settings.',
                  ru: 'Для библиотеки/портала укажите только путь.',
                },
              },
            },
            { name: 'buttonLabel', type: 'text', required: true },
          ],
        },
        {
          slug: 'faqBlock',
          labels: { singular: { tr: 'SSS Listesi', en: 'FAQ list', ru: 'Список вопросов' }, plural: { tr: 'SSS Listeleri', en: 'FAQ lists', ru: 'Списки вопросов' } },
          fields: [
            { name: 'heading', type: 'text' },
            { name: 'faqs', type: 'relationship', relationTo: 'faqs', hasMany: true },
          ],
        },
        {
          slug: 'contactBlock',
          labels: { singular: { tr: 'İletişim Bilgileri + Harita', en: 'Contact + map', ru: 'Контакты и карта' }, plural: { tr: 'İletişim Blokları', en: 'Contact blocks', ru: 'Контактные блоки' } },
          fields: [
            { name: 'showMap', type: 'checkbox', defaultValue: true },
            { name: 'showForm', type: 'checkbox', defaultValue: true },
            {
              name: 'form',
              type: 'relationship',
              relationTo: 'forms',
              admin: { condition: (_, siblingData) => Boolean(siblingData?.showForm) },
            },
          ],
        },
      ],
    },
  ],
}

export default Pages
