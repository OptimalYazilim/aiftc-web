import type { CollectionConfig } from 'payload'

import { canAuthorContent, canDeleteContent, isAuthenticated } from '@/access'
import { FOCUS_COUNTRIES, SUBMISSION_STATUSES, SUBMISSION_TYPES } from '@/fields/options'

/**
 * FORM GÖNDERİMLERİ  (Şartname 6.9 iletişim · 6.4 başvuru süreçleri · 12.2 KVKK)
 * ============================================================================
 * İletişim taleplerini ve eğitim başvuru bildirimlerini TEK bir gelen kutusunda
 * toplar. Alanlar TİPLİDİR; anahtar/değer listesi değildir.
 *
 * NEDEN PLUGIN'İN `form-submissions` KOLEKSİYONU KULLANILMADI
 * ---------------------------------------------------------------------------
 * `@payloadcms/plugin-form-builder`, gönderimi `submissionData: [{field,value}]`
 * biçiminde saklar. Bu yapıyla:
 *   - "Bağlı Eğitim" bir İLİŞKİ olamaz (eğitim silinse bile metin kalır,
 *     eğitim adı değişse kayıt eskisini gösterir),
 *   - "Durum" (Okundu/Bekliyor) alanı gönderiye ait bir sütun olamaz,
 *   - panelde liste sütunu / süzgeç kurulamaz — editör her kaydı açmak zorunda.
 * Şartname bu üçünü de istiyor, bu yüzden tipli koleksiyon yazıldı.
 *
 * Plugin KALDIRILMADI: `forms` koleksiyonu açık rıza metnini (KVKK aydınlatma)
 * editörün düzenlediği yer olarak duruyor ve iletişim sayfası onu oradan okuyor.
 * Plugin'in kendi `form-submissions` koleksiyonu ise BOŞ (ölçüldü: 0 kayıt) ve
 * artık yazılmıyor; panelde adı ayrıştırıldı (bkz. payload.config.ts).
 *
 * ============================================================================
 * KVKK / GÜVENLİK
 * ============================================================================
 *  - KAYITLAR KİŞİSEL VERİ İÇERİR. `read` yalnızca oturum açmış personelde.
 *  - `create` HERKESE KAPALI. Kayıt yalnızca sunucu eylemi üzerinden düşer
 *    (app/(frontend)/[locale]/iletisim/actions.ts). Genel REST/GraphQL'e
 *    yazma açılsaydı koleksiyon doğrudan spam hedefi olurdu: bal küpü,
 *    uzunluk sınırı ve açık rıza denetimi atlanabilirdi.
 *  - AÇIK RIZA KANITI kayda yazılır: onayın verildiği an ve o an ekranda
 *    gösterilen metnin kopyası. Metin sonradan değişirse eski kayıt hangi
 *    metne onay verildiğini göstermeye devam eder.
 *  - VERİ ASGARİLİĞİ: IP adresi, tarayıcı bilgisi veya oturum kimliği
 *    TOPLANMAZ.
 *  - SAKLAMA SÜRESİ: `forms` kaydındaki `retentionDays` alanı bağlayıcıdır.
 *    Süresi dolan kayıtlar `lib/kvkkRetention.ts` tarafından silinir; işlem
 *    `POST /api/kvkk/temizlik` ucundan tetiklenir.
 *    AÇIK MADDE — o ucu ÇAĞIRAN ZAMANLAYICI dağıtım tarafında kurulmalıdır;
 *    kurulmazsa temizlik hiç çalışmaz (bkz. .env.example > CRON_SECRET).
 * ============================================================================
 */
export const FormRequests: CollectionConfig = {
  slug: 'form-requests',
  labels: {
    singular: { tr: 'Form Gönderimi', en: 'Form submission', ru: 'Заявка с формы' },
    plural: { tr: 'Form Gönderimleri', en: 'Form submissions', ru: 'Заявки с форм' },
  },
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'submissionType', 'organization', 'status', 'createdAt'],
    group: { tr: 'Sistem', en: 'System', ru: 'Система' },
    listSearchableFields: ['fullName', 'email', 'organization', 'subject'],
    description: {
      tr: 'İletişim ve eğitim başvurusu talepleri. KVKK: bu kayıtlar kişisel veri içerir, saklama süresi sonunda silinmelidir.',
      en: 'Contact and training application requests. These records contain personal data.',
      ru: 'Обращения и заявки на обучение. Записи содержат персональные данные.',
    },
  },
  access: {
    read: isAuthenticated,
    /*
      Genel API'den kayıt AÇILMAZ. Ön yüz sunucu eylemi Local API kullanır ve
      erişimi kendi içinde aşar; ziyaretçinin tarayıcısı bu koleksiyona
      doğrudan yazamaz.
    */
    create: () => false,
    update: canAuthorContent,
    delete: canDeleteContent,
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'submissionType',
      type: 'select',
      required: true,
      defaultValue: 'contact',
      index: true,
      options: SUBMISSION_TYPES,
      label: { tr: 'Form Türü', en: 'Form type', ru: 'Тип формы' },
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: SUBMISSION_STATUSES,
      label: { tr: 'Durum', en: 'Status', ru: 'Статус' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Yeni kayıtlar "Bekliyor" gelir. Talep yanıtlandığında "Okundu" yapın.',
          en: 'New records arrive as “Pending”. Mark as “Read” once handled.',
          ru: 'Новые записи — «Ожидает». После обработки отметьте «Прочитано».',
        },
      },
    },

    // --- Gönderen -----------------------------------------------------------
    {
      type: 'row',
      fields: [
        {
          name: 'fullName',
          type: 'text',
          required: true,
          maxLength: 120,
          label: { tr: 'Ad Soyad', en: 'Full name', ru: 'Имя и фамилия' },
          admin: { width: '50%' },
        },
        {
          name: 'email',
          type: 'email',
          required: true,
          label: { tr: 'E-posta', en: 'E-mail', ru: 'Эл. почта' },
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'organization',
          type: 'text',
          maxLength: 160,
          label: { tr: 'Kurum', en: 'Organisation', ru: 'Организация' },
          admin: { width: '50%' },
        },
        {
          /*
            Ülke SERBEST METİN DEĞİL, ISO kodlu seçimdir. Şartname 21 ISO
            kodlarını şart koşuyor; ayrıca "Kazakistan / Kazakhstan / Казахстан"
            üç ayrı kayıt gibi görünmesin diye.
          */
          name: 'country',
          type: 'select',
          options: FOCUS_COUNTRIES,
          label: { tr: 'Ülke', en: 'Country', ru: 'Страна' },
          admin: { width: '50%' },
        },
      ],
    },

    // --- Talep --------------------------------------------------------------
    {
      name: 'subject',
      type: 'text',
      maxLength: 160,
      label: { tr: 'Konu', en: 'Subject', ru: 'Тема' },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      maxLength: 4000,
      label: { tr: 'Mesaj', en: 'Message', ru: 'Сообщение' },
    },
    {
      name: 'relatedTraining',
      type: 'relationship',
      relationTo: 'training-programs',
      index: true,
      label: { tr: 'Bağlı Eğitim', en: 'Related training', ru: 'Связанное обучение' },
      admin: {
        // Yalnızca başvuru türünde anlamlı; iletişim taleplerinde gizlenir.
        condition: (data) => data?.submissionType === 'training-application',
        description: {
          tr: 'Ziyaretçi eğitim sayfasından geldiyse otomatik doldurulur.',
          en: 'Filled automatically when the visitor arrives from a training page.',
          ru: 'Заполняется автоматически при переходе со страницы обучения.',
        },
      },
    },

    // --- Açık rıza kanıtı (Şartname 12.2) -----------------------------------
    {
      type: 'collapsible',
      label: { tr: 'Açık Rıza Kaydı', en: 'Consent record', ru: 'Запись согласия' },
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'consentAcceptedAt',
          type: 'date',
          label: { tr: 'Onay Zamanı', en: 'Consent given at', ru: 'Время согласия' },
          admin: {
            readOnly: true,
            date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm' },
          },
        },
        {
          name: 'consentSnapshot',
          type: 'textarea',
          label: { tr: 'Onaylanan Metin', en: 'Text consented to', ru: 'Текст согласия' },
          admin: {
            readOnly: true,
            description: {
              tr: 'Gönderim anında ekranda gösterilen aydınlatma metni. Metin sonradan değiştirilse bile bu kayıt değişmez.',
              en: 'The notice shown at submission time; unchanged even if the text is later edited.',
              ru: 'Текст уведомления на момент отправки; не меняется при последующих правках.',
            },
          },
        },
      ],
    },

    {
      name: 'locale',
      type: 'text',
      label: { tr: 'Gönderim Dili', en: 'Submitted in', ru: 'Язык отправки' },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: {
          tr: 'Yanıtın hangi dilde yazılması gerektiğini gösterir.',
          en: 'Indicates which language the reply should be written in.',
          ru: 'Показывает, на каком языке отвечать.',
        },
      },
    },
  ],
}

export default FormRequests
