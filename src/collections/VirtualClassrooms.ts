import type { CollectionConfig } from 'payload'

import {
  canAuthorContent,
  canDeleteContent,
  isAdminOrEditorFieldLevel,
  isAuthenticated,
} from '@/access'
import { CLASSROOM_PLATFORMS, CLASSROOM_STATUSES } from '@/fields/options'
import { revalidateCollection, revalidateOnDelete } from '@/hooks/revalidate'

/**
 * SANAL SINIF ODALARI  (Şartname — Entegre Canlı Eğitim ve Sanal Sınıf)
 * ============================================================================
 * Bir eğitim programının canlı ders oturumunu tanımlar: hangi platformda,
 * hangi adreste, hangi saat aralığında ve hangi parolalarla.
 *
 * NEDEN AYRI KOLEKSİYON — TrainingPrograms İÇİNE BLOK OLARAK KONMADI
 * ---------------------------------------------------------------------------
 *  1. Bir eğitimin BİRDEN ÇOK oturumu olur (5 günlük programda 5 oda). Blok
 *     olsaydı her oturum eğitim kaydının versiyonuna yazılırdı; oda parolası
 *     değiştiğinde eğitim içeriğinin yeni bir sürümü oluşurdu.
 *  2. Parolalar İÇERİK DEĞİL, İŞLETİM VERİSİDİR. Ayrı koleksiyonda oldukları
 *     için erişim kuralları eğitim içeriğinden bağımsız sıkılaştırılabilir —
 *     aşağıya bakınız.
 *  3. `TrainingPrograms.ts` içindeki `dbName: 'program_status'` /
 *     `enumName: 'enum_tp_custom_status'` tanımlarına DOKUNULMAZ; şemanın o
 *     kısmı hiç değişmez.
 * İlişki bu yüzden ODA → EĞİTİM yönündedir (`training` alanı). Eğitim detay
 * sayfası odayı ters sorgu ile bulur.
 *
 * ============================================================================
 * GÜVENLİK — BU DOSYADAKİ EN ÖNEMLİ KISIM
 * ============================================================================
 * Bu koleksiyon SIR TAŞIR: toplantı adresi, eğitmen parolası, katılımcı
 * parolası. Toplantı adresinin kendisi de bir sırdır — adresi bilen odaya
 * girer. Bu yüzden üç katmanlı korunur:
 *
 *  1. KOLEKSİYON ERİŞİMİ `read: isAuthenticated`
 *     Genel REST/GraphQL uçları (`/api/virtual-classrooms`) oturum açmamış
 *     istemciye HİÇBİR kayıt döndürmez. Ön yüz sayfası Local API kullanır ve
 *     sunucuda çalışır; o yüzden bu kısıt siteyi bozmaz.
 *
 *  2. ALAN ERİŞİMİ (`meetingUrl`, `meetingId`, parolalar)
 *     `read: isAdminOrEditorFieldLevel`. Panelde oturum açmış bir `viewer` veya
 *     `author` rolü bile parolayı okuyamaz. Katmanlı savunma: (1) atlatılsa bile
 *     yine dönmez.
 *
 *  3. ÖN YÜZ SORGUSU `select` İLE DARALTILIR
 *     Katılım sayfası odayı çizerken YALNIZCA herkese açık alanları seçer.
 *     Sırlar sunucu bileşeninin değişkenine bile girmez; dolayısıyla RSC
 *     yükünde (sayfanın HTML'ine gömülen veri) yer alamaz. Sır yalnızca
 *     parola doğrulandıktan SONRA, ayrı bir sunucu eyleminde okunur.
 *     (bkz. app/(frontend)/[locale]/sanal-sinif/[id]/actions.ts)
 *
 * PAROLALAR NEDEN HASH'LENMİYOR
 * Hash'lense doğrulama yapılabilirdi ama BigBlueButton `join` çağrısı ve
 * Jitsi oda parolası PLAIN metin ister — hash'ten geri dönülemez. Bu yüzden
 * parolalar geri okunabilir tutulur; koruma yukarıdaki erişim katmanlarıyla
 * ve veritabanı erişiminin kısıtlanmasıyla sağlanır. Üretimde bu alanlar için
 * sütun düzeyinde şifreleme (pgcrypto / KMS) önerilir — AÇIK MADDE.
 * ============================================================================
 */
export const VirtualClassrooms: CollectionConfig = {
  slug: 'virtual-classrooms',
  labels: {
    singular: { tr: 'Sanal Sınıf', en: 'Virtual classroom', ru: 'Виртуальный класс' },
    plural: { tr: 'Sanal Sınıflar', en: 'Virtual classrooms', ru: 'Виртуальные классы' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'training', 'platform', 'startsAt', 'roomStatus'],
    group: { tr: 'Eğitim', en: 'Training', ru: 'Обучение' },
    description: {
      tr: 'Canlı ders odaları. Parolalar yalnızca yönetici ve editör rollerine görünür; katılım sayfası parolayı doğrulamadan toplantı adresini açmaz.',
      en: 'Live session rooms. Passwords are visible to admin/editor roles only.',
      ru: 'Комнаты живых занятий. Пароли видны только администраторам и редакторам.',
    },
  },
  access: {
    // Genel API'ye kapalı — gerekçe dosya başındaki GÜVENLİK notunda.
    read: isAuthenticated,
    create: canAuthorContent,
    update: canAuthorContent,
    delete: canDeleteContent,
  },
  /*
    Versiyon/taslak YOK. Bu kayıt yayımlanan bir içerik değil, işletim
    kaydıdır; "taslak oda" diye bir şey olmaz. `_status` alanı da bu yüzden
    yoktur — oda görünürlüğünü `roomStatus` belirler.
  */
  defaultSort: '-startsAt',
  hooks: {
    afterChange: [revalidateCollection('/egitim-programlari')],
    afterDelete: [revalidateOnDelete('/egitim-programlari')],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: { tr: 'Oda Adı', en: 'Room name', ru: 'Название комнаты' },
      admin: {
        description: {
          tr: 'Katılımcının göreceği ad. Örn. "1. Gün — Yangın Davranışı Oturumu".',
          en: 'Name shown to participants.',
          ru: 'Название, которое видит участник.',
        },
      },
    },
    {
      name: 'training',
      type: 'relationship',
      relationTo: 'training-programs',
      required: true,
      index: true,
      label: { tr: 'Bağlı Eğitim', en: 'Training programme', ru: 'Программа обучения' },
      admin: {
        description: {
          tr: '"Sanal Sınıfa Katıl" butonu bu eğitimin detay sayfasında belirir.',
          en: 'The join button appears on this training’s detail page.',
          ru: 'Кнопка входа появится на странице этого обучения.',
        },
      },
    },
    {
      name: 'roomStatus',
      type: 'select',
      required: true,
      defaultValue: 'closed',
      index: true,
      options: CLASSROOM_STATUSES,
      label: { tr: 'Oda Durumu', en: 'Room status', ru: 'Статус комнаты' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Kapalı odada katılım formu gösterilmez. Varsayılan KAPALI: oda yanlışlıkla açık kalmasın.',
          en: 'A closed room shows no join form. Defaults to closed.',
          ru: 'Закрытая комната не показывает форму входа.',
        },
      },
    },
    {
      name: 'platform',
      type: 'select',
      required: true,
      defaultValue: 'jitsi',
      options: CLASSROOM_PLATFORMS,
      label: { tr: 'Platform Türü', en: 'Platform', ru: 'Платформа' },
      admin: { position: 'sidebar' },
    },

    // --- Zaman aralığı ------------------------------------------------------
    {
      type: 'row',
      fields: [
        {
          name: 'startsAt',
          type: 'date',
          required: true,
          admin: {
            width: '50%',
            date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm' },
          },
          label: { tr: 'Başlangıç', en: 'Starts at', ru: 'Начало' },
        },
        {
          name: 'endsAt',
          type: 'date',
          required: true,
          admin: {
            width: '50%',
            date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm' },
          },
          label: { tr: 'Bitiş', en: 'Ends at', ru: 'Окончание' },
        },
      ],
    },
    {
      name: 'joinWindowMinutes',
      type: 'number',
      defaultValue: 15,
      min: 0,
      max: 240,
      label: {
        tr: 'Erken Giriş Payı (dakika)',
        en: 'Early join window (minutes)',
        ru: 'Ранний вход (минут)',
      },
      admin: {
        description: {
          tr: 'Katılımcı, başlangıçtan bu kadar dakika önce odaya girebilir.',
          en: 'How early participants may enter before the start time.',
          ru: 'За сколько минут до начала можно войти.',
        },
      },
    },

    // --- Katılımcıya gösterilecek açıklama ---------------------------------
    {
      name: 'instructions',
      type: 'textarea',
      localized: true,
      maxLength: 1000,
      label: { tr: 'Katılım Yönergesi', en: 'Joining instructions', ru: 'Инструкция по входу' },
      admin: {
        description: {
          tr: 'Katılım sayfasında parola alanının üstünde gösterilir. Parolayı BURAYA YAZMAYIN — bu metin herkese açıktır.',
          en: 'Shown above the password field. Do NOT put the password here — this text is public.',
          ru: 'Показывается над полем пароля. НЕ указывайте здесь пароль — текст общедоступен.',
        },
      },
    },

    /*
      ----------------------------------------------------------------------
      SIRLAR — alan düzeyinde okuma kısıtlı (dosya başındaki 2. katman)
      ----------------------------------------------------------------------
      `access.read` bir ALAN üzerinde tanımlandığında Payload, koşul sağlanmazsa
      alanı yanıttan tamamen çıkarır. Bu yüzden `viewer`/`author` rolüne sahip
      bir personel panelde bu alanları göremez.
    */
    {
      name: 'meetingUrl',
      type: 'text',
      label: { tr: 'Toplantı Linki', en: 'Meeting link', ru: 'Ссылка на встречу' },
      access: { read: isAdminOrEditorFieldLevel },
      admin: {
        description: {
          tr: 'Tam adres (https://...). Parola doğrulanmadan katılımcıya GÖSTERİLMEZ.',
          en: 'Full URL. Never shown before the access code is verified.',
          ru: 'Полный адрес. Не показывается до проверки пароля.',
        },
      },
      validate: (value: unknown) => {
        if (value === null || value === undefined || value === '') return true
        const text = String(value)
        if (!/^https?:\/\//i.test(text)) return 'Adres http:// veya https:// ile başlamalıdır.'
        return true
      },
    },
    {
      name: 'meetingId',
      type: 'text',
      label: { tr: 'Toplantı / API Kimliği', en: 'Meeting / API ID', ru: 'ID встречи / API' },
      access: { read: isAdminOrEditorFieldLevel },
      admin: {
        description: {
          tr: 'Jitsi oda adı veya BigBlueButton meetingID. API çağrısı bu değerle kurulur.',
          en: 'Jitsi room name or BigBlueButton meetingID.',
          ru: 'Имя комнаты Jitsi или meetingID BigBlueButton.',
        },
      },
    },
    {
      name: 'moderatorPassword',
      type: 'text',
      label: { tr: 'Eğitmen Şifresi', en: 'Moderator password', ru: 'Пароль преподавателя' },
      access: { read: isAdminOrEditorFieldLevel },
      admin: {
        description: {
          tr: 'Bu şifreyle girilen katılım sayfası EĞİTMEN yetkisi verir.',
          en: 'Grants moderator rights on the join page.',
          ru: 'Даёт права преподавателя на странице входа.',
        },
      },
    },
    {
      name: 'attendeePassword',
      type: 'text',
      label: { tr: 'Katılımcı Şifresi', en: 'Attendee password', ru: 'Пароль участника' },
      access: { read: isAdminOrEditorFieldLevel },
      admin: {
        description: {
          tr: 'Katılımcılara duyurulan şifre. Katılım sayfasında bu şifre sorulur.',
          en: 'The code announced to participants; asked for on the join page.',
          ru: 'Пароль для участников, запрашивается на странице входа.',
        },
      },
    },
  ],
}

export default VirtualClassrooms
