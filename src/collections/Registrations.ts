import type { CollectionConfig } from 'payload'

import { canApproveAccounts, canDeleteContent, canManageRegistrations, registrationReadAccess } from '@/access'
import { FOCUS_COUNTRIES, REGISTRATION_STATUSES } from '@/fields/options'

/**
 * EĞİTİM BAŞVURULARI / KATILIMCILAR  (Şartname 6.4 · 1.7 · 12.2 KVKK)
 * ============================================================================
 * Bir eğitime katılmak isteyen kişinin başvurusu ve o başvurunun YAŞAM
 * DÖNGÜSÜ burada tutulur: bekliyor → onaylandı / reddedildi → tamamlandı.
 * Karar panelde verilir; dış bir portal YOKTUR (kurumun kararı).
 *
 * NEDEN `form-requests` DEĞİL
 * ---------------------------------------------------------------------------
 * `form-requests` bir GELEN KUTUSUDUR: "okundu / bekliyor" işareti taşır ve
 * kaydın sonucu yoktur. Başvuru ise bir KARAR ister ve o karar kişinin
 * eğitime katılıp katılmayacağını belirler; sonradan sertifika aşamasına
 * geçer. İki şeyi tek koleksiyonda tutmak, gelen kutusuna "onaylandı" gibi
 * anlamsız durumlar ekleyip listeyi okunmaz yapardı. `form-requests`
 * içindeki eski `training-application` kayıtları DOKUNULMADAN kalır (tarih);
 * yeni başvurular yalnızca buraya düşer.
 *
 * ============================================================================
 * KVKK / GÜVENLİK
 * ============================================================================
 *  - KİŞİSEL VERİ: ad, e-posta, telefon (isteğe bağlı), kurum, ülke, görev.
 *    `read` yalnızca personelde ve KİŞİNİN KENDİSİNDE (access/index.ts ->
 *    registrationReadAccess).
 *  - `create` HERKESE KAPALI. Kayıt yalnızca sunucu eyleminden düşer
 *    (app/(frontend)/[locale]/basvuru/actions.ts). Genel REST'e yazma
 *    açılsaydı bal küpü, uzunluk sınırı, açık rıza ve "eğitim gerçekten
 *    başvuruya açık mı" denetimleri atlanabilirdi.
 *  - KARAR ALANLARI (`status`, `adminNotes`, `reviewedBy`…) yalnızca karar
 *    verebilenlerce yazılır. Alan düzeyi kural, koleksiyon düzeyindeki
 *    `update` kuralının ÜSTÜNE gelir: ileride kişinin kendi başvurusunu
 *    güncellemesine (örn. telefonunu düzeltmesine) izin verilse bile kendini
 *    ONAYLAYAMAZ.
 *  - AÇIK RIZA KANITI: onay anı + o an gösterilen metin, form-requests ile
 *    aynı biçimde.
 *  - VERİ ASGARİLİĞİ: IP, tarayıcı, oturum kimliği TOPLANMAZ.
 *  - SAKLAMA: bu kayıtlar `lib/kvkkRetention.ts` süpürmesine BİLİNÇLİ OLARAK
 *    DAHİL DEĞİLDİR. Bir iletişim mesajı 6 ay sonra silinebilir; bir katılım
 *    kaydı (kim, hangi eğitimi, ne zaman tamamladı) kurumun sertifika
 *    doğrulama ve raporlama dayanağıdır. Saklama süresi kurumun KVKK
 *    envanterinde ayrıca belirlenmelidir — bu kod o kararı VERMEZ.
 *
 * ============================================================================
 * DURUM MAKİNESİ ZORLANMAZ — BİLİNÇLİ
 * ============================================================================
 * "completed yalnızca approved'dan gelir" gibi kilitli geçişler kodda YOK.
 * Panelde veri düzeltmek günlük iştir: yanlışlıkla reddedilen bir kişi
 * onaylanır, yanlış işaretlenen "tamamlandı" geri alınır. Kilit, bu işi
 * engeller ve editörü kaydı silip yeniden açmaya zorlar — asıl iz kaybı budur.
 *
 * Bunun yerine kancalar KARARIN İZİNİ damgalar: `status` değiştiğinde kimin,
 * ne zaman; `completed` olduğunda ne zaman. Geçmişe dönük sorgu ("bu ay kaç
 * başvuru onaylandı") bu damgalarla yapılır.
 * ============================================================================
 */
export const Registrations: CollectionConfig = {
  slug: 'registrations',
  labels: {
    singular: { tr: 'Eğitim Başvurusu', en: 'Training registration', ru: 'Заявка на обучение' },
    plural: { tr: 'Eğitim Başvuruları', en: 'Training registrations', ru: 'Заявки на обучение' },
  },
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'training', 'status', 'organization', 'createdAt'],
    group: { tr: 'Eğitim', en: 'Training', ru: 'Обучение' },
    listSearchableFields: ['fullName', 'email', 'organization'],
    description: {
      tr: 'Eğitimlere yapılan başvurular ve katılımcı kararları. Durumu buradan yönetin: Bekliyor → Onaylandı / Reddedildi → Tamamlandı. KVKK: kişisel veri içerir.',
      en: 'Training applications and participant decisions. Manage the status here: Pending → Approved / Rejected → Completed. Contains personal data.',
      ru: 'Заявки на обучение и решения по участникам. Статус: Ожидает → Одобрено / Отклонено → Завершено. Содержит персональные данные.',
    },
  },
  access: {
    read: registrationReadAccess,
    /* Genel API'den kayıt AÇILMAZ — gerekçe yukarıda. */
    create: () => false,
    update: canManageRegistrations,
    delete: canDeleteContent,
  },
  defaultSort: '-createdAt',
  hooks: {
    beforeChange: [
      /*
        KARAR DAMGASI.
        `status` değiştiğinde kimin ve ne zaman değiştirdiği yazılır;
        `completed` olduğunda tamamlanma anı ayrıca damgalanır. Damgalar
        editörün eliyle DEĞİŞTİRİLEMEZ (readOnly) — iz, elle düzeltilebilen
        bir alan olsaydı iz olmaktan çıkardı.

        `req.user` sunucu eyleminde YOKTUR (kayıt ziyaretçi adına açılır);
        o yolda status `pending` olarak gelir, koşul hiç tetiklenmez ve
        alanlar boş kalır — doğru olan da bu: henüz karar yok.
      */
      ({ data, originalDoc, operation, req }) => {
        if (!data) return data

        const oncekiDurum = operation === 'update' ? originalDoc?.status : undefined
        const yeniDurum = data.status

        if (yeniDurum && yeniDurum !== oncekiDurum && yeniDurum !== 'pending') {
          const simdi = new Date().toISOString()
          data.reviewedAt = simdi
          if (req.user?.id !== undefined) data.reviewedBy = req.user.id
          if (yeniDurum === 'completed') data.completedAt = simdi
        }

        return data
      },
    ],
  },
  fields: [
    // --- Karar ---------------------------------------------------------------
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: REGISTRATION_STATUSES,
      label: { tr: 'Durum', en: 'Status', ru: 'Статус' },
      access: {
        /* Koleksiyon `update` kuralının üstüne: kişi kendini onaylayamaz. */
        update: canApproveAccounts,
      },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Yeni başvurular "Bekliyor" gelir. Kararı burada verin; kimin ve ne zaman verdiği otomatik kaydedilir.',
          en: 'New applications arrive as “Pending”. Decide here; who decided and when is recorded automatically.',
          ru: 'Новые заявки — «Ожидает». Решение принимается здесь; кто и когда — записывается автоматически.',
        },
      },
    },
    {
      name: 'training',
      type: 'relationship',
      relationTo: 'training-programs',
      required: true,
      index: true,
      label: { tr: 'Eğitim', en: 'Training', ru: 'Обучение' },
      admin: { position: 'sidebar' },
    },
    {
      /*
        Oturum AÇIKKEN yapılan başvuruda dolar; anonim başvuruda boştur.
        Profil sayfasındaki "Katıldığım Eğitimler" listesi ve okuma kuralı
        buna (ve e-postaya) bakar. Panelde salt okunur: bağı sonradan elle
        değiştirmek, başkasının başvurusunu bir hesaba iliştirmek olurdu.
      */
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      label: { tr: 'Bağlı Hesap', en: 'Linked account', ru: 'Учётная запись' },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: {
          tr: 'Başvuru oturum açıkken yapıldıysa otomatik bağlanır. Anonim başvuruda boştur.',
          en: 'Linked automatically when the application was made while signed in. Empty for anonymous applications.',
          ru: 'Привязывается автоматически, если заявка подана после входа.',
        },
      },
    },

    // --- Başvuran ------------------------------------------------------------
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
          index: true,
          label: { tr: 'E-posta', en: 'E-mail', ru: 'Эл. почта' },
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          /*
            İSTEĞE BAĞLI. Telefon, iletişim formunda yoktu; başvuruda kurumun
            kişiye ulaşması gerekebildiği için eklendi. Zorunlu tutulmadı:
            uluslararası katılımcıdan sabit biçimde numara istemek hem
            biçim sorunu çıkarır hem gereksiz veri toplar. Serbest metin,
            biçim zorlanmaz.
          */
          name: 'phone',
          type: 'text',
          maxLength: 40,
          label: { tr: 'Telefon', en: 'Phone', ru: 'Телефон' },
          admin: { width: '50%' },
        },
        {
          name: 'position',
          type: 'text',
          maxLength: 120,
          label: { tr: 'Görev / Unvan', en: 'Position / title', ru: 'Должность' },
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
          /* ISO kodlu seçim; gerekçe FormRequests.ts ile aynı. */
          name: 'country',
          type: 'select',
          options: FOCUS_COUNTRIES,
          label: { tr: 'Ülke', en: 'Country', ru: 'Страна' },
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      maxLength: 2000,
      label: { tr: 'Başvuranın Notu', en: 'Applicant note', ru: 'Примечание заявителя' },
      admin: {
        description: {
          tr: 'Başvuranın formda yazdığı ek açıklama (motivasyon, özel ihtiyaç vb.).',
          en: 'Anything the applicant added on the form (motivation, special needs, etc.).',
          ru: 'Дополнительная информация от заявителя.',
        },
      },
    },

    // --- Değerlendirme (yalnızca personel) -----------------------------------
    {
      type: 'collapsible',
      label: { tr: 'Değerlendirme', en: 'Review', ru: 'Рассмотрение' },
      admin: { initCollapsed: false },
      fields: [
        {
          /*
            Personelin iç notu. Başvuran bunu HİÇ göremez: alan düzeyi
            `read` kararı verenlerle sınırlıdır. Kişinin kendi kaydını okuma
            hakkı bu alanı kapsamaz — ret gerekçesi kişiye AYRICA ve uygun
            dille iletilmelidir, iç not olduğu gibi gösterilmez.
          */
          name: 'adminNotes',
          type: 'textarea',
          maxLength: 2000,
          label: { tr: 'Personel Notu (iç)', en: 'Staff note (internal)', ru: 'Служебная заметка' },
          access: { read: canApproveAccounts, update: canApproveAccounts },
          admin: {
            description: {
              tr: 'Başvuran bu notu göremez.',
              en: 'The applicant cannot see this note.',
              ru: 'Заявитель не видит эту заметку.',
            },
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'reviewedBy',
              type: 'relationship',
              relationTo: 'users',
              label: { tr: 'Kararı Veren', en: 'Reviewed by', ru: 'Кто рассмотрел' },
              access: { update: canApproveAccounts },
              admin: { readOnly: true, width: '50%' },
            },
            {
              name: 'reviewedAt',
              type: 'date',
              label: { tr: 'Karar Zamanı', en: 'Reviewed at', ru: 'Время решения' },
              access: { update: canApproveAccounts },
              admin: {
                readOnly: true,
                width: '50%',
                date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm' },
              },
            },
          ],
        },
        {
          name: 'completedAt',
          type: 'date',
          label: { tr: 'Tamamlanma Zamanı', en: 'Completed at', ru: 'Время завершения' },
          access: { update: canApproveAccounts },
          admin: {
            readOnly: true,
            date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm' },
            condition: (data) => data?.status === 'completed',
          },
        },
      ],
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
              ru: 'Текст уведомления на момент отправки; не меняется при правках.',
            },
          },
        },
      ],
    },

    {
      name: 'locale',
      type: 'text',
      label: { tr: 'Başvuru Dili', en: 'Submitted in', ru: 'Язык заявки' },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: {
          tr: 'Kişiye hangi dilde yazılması gerektiğini gösterir.',
          en: 'Indicates which language to write to the applicant in.',
          ru: 'Показывает, на каком языке писать заявителю.',
        },
      },
    },
  ],
}

export default Registrations
