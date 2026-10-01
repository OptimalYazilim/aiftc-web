import type { CollectionConfig } from 'payload'

import { canManageRegistrations, isAdmin } from '@/access'

/**
 * SANAL SINIF KATILIMLARI — kim, hangi odaya, ne zaman, nasıl girdi
 * ============================================================================
 * Toplantıda istenen "personelin eğitimi izleyip izlemediği takip edilecek"
 * maddesinin ALTYAPISI. Sanal sınıf sayfasından her başarılı girişte bir
 * satır yazılır (app/(frontend)/[locale]/sanal-sinif/[id]/actions.ts):
 *
 *   method = account  → oturum açmış ve o eğitime ONAYLI başvurusu olan kişi;
 *                       kimliği ve başvurusu bilinir.
 *   method = code     → katılım şifresiyle giriş (yedek yol; hesabı olmayan
 *                       yurt dışı katılımcılar). Şifre ortaktır: kişi ancak
 *                       o anda oturum açmışsa bilinir, değilse satır anonimdir.
 *
 * Bu bir GİRİŞ kaydıdır, izleme süresi ölçümü DEĞİLDİR: toplantı platformu
 * (Jitsi/BigBlueButton) sitenin dışındadır, kişinin odada ne kadar kaldığını
 * site bilemez. Süre ölçümü platform entegrasyonuyla gelir.
 *
 * KİŞİSEL VERİ: ad ve e-posta, giriş anındaki başvurudan/hesaptan KOPYALANIR
 * ki başvuru sonradan silinse de katılım kaydı okunabilir kalsın. IP adresi
 * TUTULMAZ. Okuma, başvuruları yönetenlerle sınırlıdır.
 *
 * İLİŞKİLER ZORUNLU DEĞİLDİR — BİLİNÇLİ: oda, başvuru ya da hesap silinirse
 * Payload bağı NULL yapar. Zorunlu olsalardı sütun NOT NULL olur ve silme
 * Postgres'te düşerdi (aynı kusur ölçülerek bulunmuştu:
 * hooks/guardVirtualClassrooms.ts). Katılım geçmişi böylece kaybolmaz.
 * ============================================================================
 */
export const ClassroomAttendance: CollectionConfig = {
  slug: 'classroom-attendance',
  labels: {
    singular: { tr: 'Sanal Sınıf Katılımı', en: 'Classroom attendance', ru: 'Посещение класса' },
    plural: { tr: 'Sanal Sınıf Katılımları', en: 'Classroom attendance', ru: 'Посещения классов' },
  },
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'room', 'method', 'role', 'createdAt'],
    group: { tr: 'Eğitim', en: 'Training', ru: 'Обучение' },
    description: {
      tr: 'Sanal sınıf sayfasından yapılan her başarılı giriş. Kayıtlar otomatik oluşur; elle eklenmez ve değiştirilmez.',
      en: 'Every successful entry through a virtual classroom page. Created automatically; not editable.',
      ru: 'Каждый успешный вход через страницу виртуального класса. Создаётся автоматически; не редактируется.',
    },
  },
  access: {
    read: canManageRegistrations,
    // Tek giriş yolu sanal sınıf sayfasının sunucu eylemidir (Local API).
    create: () => false,
    update: () => false,
    delete: isAdmin,
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'room',
      type: 'relationship',
      relationTo: 'virtual-classrooms',
      index: true,
      label: { tr: 'Oda', en: 'Room', ru: 'Комната' },
    },
    {
      name: 'training',
      type: 'relationship',
      relationTo: 'training-programs',
      index: true,
      label: { tr: 'Eğitim', en: 'Training', ru: 'Обучение' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'method',
          type: 'select',
          required: true,
          label: { tr: 'Giriş yolu', en: 'Entry method', ru: 'Способ входа' },
          options: [
            { value: 'account', label: { tr: 'Hesapla', en: 'Account', ru: 'Учётная запись' } },
            { value: 'code', label: { tr: 'Katılım şifresiyle', en: 'Access code', ru: 'Код доступа' } },
          ],
        },
        {
          name: 'role',
          type: 'select',
          required: true,
          label: { tr: 'Rol', en: 'Role', ru: 'Роль' },
          options: [
            { value: 'attendee', label: { tr: 'Katılımcı', en: 'Attendee', ru: 'Участник' } },
            { value: 'moderator', label: { tr: 'Eğitmen', en: 'Moderator', ru: 'Преподаватель' } },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'fullName',
          type: 'text',
          label: { tr: 'Ad Soyad', en: 'Full name', ru: 'ФИО' },
          admin: {
            description: {
              tr: 'Şifreyle ve oturum açmadan girildiyse boştur.',
              en: 'Empty when the code was used without signing in.',
              ru: 'Пусто, если вход был по коду без авторизации.',
            },
          },
        },
        { name: 'email', type: 'text', label: { tr: 'E-posta', en: 'Email', ru: 'Эл. почта' } },
      ],
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      label: { tr: 'Hesap', en: 'Account', ru: 'Учётная запись' },
      admin: { position: 'sidebar' },
    },
    {
      name: 'registration',
      type: 'relationship',
      relationTo: 'registrations',
      index: true,
      label: { tr: 'Eğitim başvurusu', en: 'Registration', ru: 'Заявка' },
      admin: { position: 'sidebar' },
    },
  ],
}
