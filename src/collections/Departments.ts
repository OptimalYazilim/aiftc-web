import type { CollectionConfig } from 'payload'

import { hasRole } from '@/access'

/**
 * DAİRELER — DAİRE BAZLI İÇERİK YETKİSİ İÇİN
 * ============================================================================
 * Kurum kararı (29.09.2026): dijital kütüphanedeki eğitim içeriklerine OGM
 * personeli, giriş yaptıktan sonra DAİRESİNE göre, kurumun verdiği yetkiyle
 * erişir; diğer içerikler herkese açıktır.
 *
 * Kullanıcının dairesi ileride OGM personel API'sinden gelecek (kurum
 * verecek). O gün gelen daire, `externalCode` üzerinden bu kayıtlarla
 * eşleştirilir. API bağlanana kadar daireyi kullanıcı kaydına yönetici girer.
 *
 * LİSTE KURUMDAN GELİR — hiçbir daire adı tohumlanmaz; tahminle girilen bir
 * daire kurum yapısını yanlış anlatır ve yetkiyi yanlış kişiye açabilirdi.
 *
 * Yalnızca sistem yöneticisi düzenler: bir daire kaydını değiştirmek, o
 * daireye bağlı herkesin kütüphane yetkisini değiştirmek demektir.
 * ============================================================================
 */
export const Departments: CollectionConfig = {
  slug: 'departments',
  labels: {
    singular: { tr: 'Daire', en: 'Department', ru: 'Департамент' },
    plural: { tr: 'Daireler', en: 'Departments', ru: 'Департаменты' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'externalCode', 'updatedAt'],
    group: { tr: 'Sistem', en: 'System', ru: 'Система' },
    description: {
      tr: 'Daire bazlı kütüphane yetkisi için OGM daireleri. Liste kurum tarafından girilir. OGM personel entegrasyonu bağlandığında kullanıcının dairesi "Dış Kod" ile eşleştirilir.',
      en: 'OGM departments for department-based library access. Entered by the institution.',
      ru: 'Департаменты OGM для доступа к библиотеке по департаментам.',
    },
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => hasRole('admin')(req.user),
    update: ({ req }) => hasRole('admin')(req.user),
    delete: ({ req }) => hasRole('admin')(req.user),
  },
  defaultSort: 'title',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: { tr: 'Daire Adı', en: 'Name', ru: 'Название' },
    },
    {
      name: 'externalCode',
      type: 'text',
      unique: true,
      index: true,
      label: { tr: 'Dış Kod', en: 'External code', ru: 'Внешний код' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'OGM personel sistemindeki daire kodu. Entegrasyon bağlanınca kullanıcının dairesi bu kodla eşleşir. Bilinmiyorsa boş bırakın.',
          en: 'Department code in the OGM staff system, used to match users once the integration is connected.',
          ru: 'Код департамента в кадровой системе OGM.',
        },
      },
    },
  ],
}

export default Departments
