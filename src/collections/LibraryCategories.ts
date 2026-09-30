import type { CollectionConfig, RelationshipFieldSingleValidation, Where } from 'payload'

import { canDeleteContent, canManageLibrary } from '@/access'
import { slugField } from '@/fields/slug'
import { revalidateCollection, revalidateOnDelete } from '@/hooks/revalidate'

/**
 * DİJİTAL KÜTÜPHANE KATEGORİLERİ — ANA BAŞLIK / ALT BAŞLIK
 * ============================================================================
 * Kurum kararı (29.09.2026): kütüphane yalnızca eğitim merkezini değil bütün
 * OGM'yi kapsar ve içerikler dal/alan bazında sınıflanır. Örnek olarak ORBİS
 * ana başlığı ve onun altında birimlere göre alt başlıklar anıldı; genel
 * videolar (orman okulu, çocuk videoları vb.) ayrı bir ana başlıkta durur.
 * İçerik yüklenirken başlık seçilir, alt başlık varsa o seçilir, yoksa ana
 * başlık yeterlidir.
 *
 * LİSTE KURUMDAN GELİR — BURADA HİÇBİR BAŞLIK TOHUMLANMAZ. ORBİS alt
 * başlıklarını kurum ekran paylaşarak gösterecek; tahminle girilen bir
 * başlık kurumun gerçek yapısını yanlış anlatırdı.
 *
 * İKİ DÜZEY: bir alt başlığın üst başlığı, kendisi bir ANA başlık olmalıdır.
 * Daha derin ağaç istenmedi; ziyaretçi süzgecinde üç kademeli bir liste
 * okunmaz hâle gelirdi. Kural `parent` doğrulayıcısındadır.
 * ============================================================================
 */
export const LibraryCategories: CollectionConfig = {
  slug: 'library-categories',
  labels: {
    singular: { tr: 'Kütüphane Kategorisi', en: 'Library category', ru: 'Категория библиотеки' },
    plural: { tr: 'Kütüphane Kategorileri', en: 'Library categories', ru: 'Категории библиотеки' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'parent', 'order', 'updatedAt'],
    group: { tr: 'Medya', en: 'Media', ru: 'Медиа' },
    description: {
      tr: 'Dijital kütüphanenin ana başlık / alt başlık yapısı (ör. ORBİS ve altındaki birimler). Alt başlık oluştururken "Üst Başlık" seçin; ana başlıkta boş bırakın.',
      en: 'Main heading / sub-heading structure of the digital library. Pick a parent for a sub-heading; leave it empty for a main heading.',
      ru: 'Структура разделов и подразделов цифровой библиотеки.',
    },
  },
  access: {
    read: () => true,
    create: canManageLibrary,
    update: canManageLibrary,
    delete: canDeleteContent,
  },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidateCollection('/kutuphane')],
    afterDelete: [revalidateOnDelete('/kutuphane')],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: { tr: 'Başlık', en: 'Title', ru: 'Название' },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'library-categories',
      label: { tr: 'Üst Başlık', en: 'Parent heading', ru: 'Родительский раздел' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Boş = ana başlık. Yalnızca ana başlıklar seçilebilir.',
          en: 'Empty = main heading. Only main headings can be chosen.',
          ru: 'Пусто = основной раздел.',
        },
      },
      /* Seçim listesinde yalnızca ANA başlıklar ve kaydın kendisi hariç. */
      filterOptions: ({ id }): Where =>
        id
          ? { and: [{ parent: { exists: false } }, { id: { not_equals: id } }] }
          : { parent: { exists: false } },
      validate: (async (value, { req, id }) => {
        if (!value) return true
        const ustId =
          typeof value === 'object' ? (value as unknown as { id: number | string }).id : value
        if (id !== undefined && String(ustId) === String(id)) return 'Bir başlık kendisinin üst başlığı olamaz.'
        try {
          const ust = await req.payload.findByID({
            collection: 'library-categories',
            id: ustId as number,
            depth: 0,
            req,
            overrideAccess: true,
          })
          if ((ust as { parent?: unknown }).parent) {
            return 'Üst başlık bir ana başlık olmalıdır (en fazla iki düzey).'
          }
        } catch {
          return 'Seçilen üst başlık bulunamadı.'
        }
        return true
      }) satisfies RelationshipFieldSingleValidation,
    },
    slugField(),
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      label: { tr: 'Sıralama', en: 'Sort order', ru: 'Порядок' },
      admin: { position: 'sidebar', step: 10 },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      label: { tr: 'Açıklama', en: 'Description', ru: 'Описание' },
    },
  ],
}

export default LibraryCategories
