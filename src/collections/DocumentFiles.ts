import type { CollectionConfig } from 'payload'

import { canAuthorContent, canDeleteContent, documentFileReadAccess } from '@/access'
import { ACCESS_LEVELS, INSTRUCTION_LANGUAGES, LICENSE_TYPES } from '@/fields/options'

/**
 * SITE BELGELERI  (Sartname EK-1 / 11.3 "Dosya Yonetimi")
 *
 * KAPSAM SINIRI — ONEMLI
 * ----------------------
 * Bu koleksiyon EK-2 DIJITAL KUTUPHANESI DEGILDIR.
 * Burada yalnizca web sitesinin kendi ekleri tutulur: egitim duyurusu eki,
 * program PDF'i, basvuru formu sablonu, rehber brosuru, kurumsal kilavuz.
 *
 * Dublin Core meta-verili, tam metin aranabilir, erisim seviyeli, surumlu
 * dijital kutuphane kayitlari EK-2 kapsamindadir ve SUBDOMAIN uzerindeki
 * ayri sistemde tutulur. Web sitesi oraya yalnizca baglanti verir
 * (bkz. globals/ExternalServices.ts).
 *
 * Yine de 11.3'un asgari gereksinimleri burada karsilanir:
 *   dosya turu kontrolu, boyut bilgisi, aciklama, surum, indirme baglantisi,
 *   erisim seviyesi, arsivleme.
 */
export const DocumentFiles: CollectionConfig = {
  slug: 'document-files',
  labels: {
    singular: { tr: 'Belge', en: 'Document', ru: 'Документ' },
    plural: { tr: 'Site Belgeleri', en: 'Site documents', ru: 'Документы сайта' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'documentType', 'language', 'version', 'isArchived'],
    group: { tr: 'Medya', en: 'Media', ru: 'Медиа' },
    description: {
      tr: 'Sitenin kendi ekleri (program PDF’i, form, broşür). VİDEO: kütüphanede OYNATILACAK videolar buraya değil, Medya Kütüphanesi’ne yüklenir — buraya yüklenen video yalnızca indirilebilir bir ek olur.',
      en: 'Site attachments (programme PDFs, forms, brochures). Videos meant to PLAY in the library belong in the Media library, not here.',
      ru: 'Вложения сайта. Видео для воспроизведения в библиотеке загружайте в медиатеку, а не сюда.',
    },
  },
  access: {
    /*
      DOSYAYI DA KORUR — yalnizca panel listesini degil.
      Payload'in `/api/document-files/file/<ad>` ucu bu kuraldan gecer;
      yetkisi olmayan istek dosyayi hic alamaz. Gerekce ve seviye->rol
      eslestirmesi: access/index.ts -> `documentFileReadAccess`.
    */
    read: documentFileReadAccess,
    create: canAuthorContent,
    update: canAuthorContent,
    delete: canDeleteContent,
  },
  upload: {
    /*
      DOSYALAR `public/` ICINDE DURAMAZ — OLCULMUS BIR ACIK.
      ------------------------------------------------------------------
      Bu deger once `public/documents` idi. Next.js `public/` altindaki her
      seyi HICBIR KOD CALISTIRMADAN, dogrudan diskten servis eder. Yani
      Payload'in erisim kurali ne yazarsa yazsin, dosyanin ikinci ve
      TAMAMEN KORUMASIZ bir adresi vardi.

      Olcum (2026-09-07, anonim istek):
          GET /api/document-files/file/videoplayback%20(1).mp4  -> 206
          GET /documents/videoplayback%20(1).mp4                -> 206
      Ikisi de dosyayi verdi. Ilkini erisim kurali kapatir; IKINCISINI
      HICBIR KURAL KAPATAMAZ, cunku istek Payload'a hic ugramaz.

      `private/documents` depo kokunde, `public/` DISINDA ve `.gitignore`
      icindedir. Artik dosyaya tek yoldan ulasilir: Payload'in erisim
      denetiminden gecen uc noktadan.

      NOT: `media` koleksiyonu bilincli olarak `public/media` altinda kalir
      — logolar, kapak gorselleri ve galeri kareleri anonim ziyaretciye
      acik olmak ZORUNDADIR (bkz. Media.ts ve docs/access-control-guide).
    */
    staticDir: 'private/documents',
    /*
      Sartname 12.1: guvenli dosya yukleme - beyaz liste.

      VIDEO NEDEN BURAYA DA EKLENDI
      Panelde "Invalid MIME type: video/mp4" hatasi buradan geliyordu: bir
      egitim kaydi eke olarak video yuklenmek istendiginde liste bunu
      reddediyordu. Video artik kabul ediliyor.

      ANCAK — KUTUPHANE VIDEOSU BURAYA YUKLENMEZ.
      Kutuphane oynaticisi `media` koleksiyonuna bakar
      (LibraryResources.videoFile -> media). Buraya yuklenen bir video
      oynaticida SECILEMEZ; yalnizca indirilebilir bir ek olur. Ayrimi
      koleksiyon aciklamasi ve alan aciklamalari acikca soyler.
    */
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/csv',
      'image/jpeg',
      'image/png',
      // Ek olarak dagitilan kayitlar. Oynatma icin degil, indirme icindir.
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ],
    filesRequiredOnCreate: false,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: { tr: 'Belge Adı', en: 'Document title', ru: 'Название документа' },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      label: { tr: 'Açıklama', en: 'Description', ru: 'Описание' },
      admin: {
        description: {
          tr: 'Şartname 13: “Dosya indirme süreçlerinde açıklayıcı bilgi.” İndirme bağlantısının yanında gösterilir.',
          en: 'Spec 13: descriptive information next to download links.',
          ru: 'П. 13: пояснение рядом со ссылкой на скачивание.',
        },
      },
    },
    {
      name: 'documentType',
      type: 'select',
      required: true,
      defaultValue: 'other',
      label: { tr: 'Belge Türü', en: 'Document type', ru: 'Тип документа' },
      options: [
        { value: 'programme', label: { tr: 'Eğitim programı', en: 'Training programme', ru: 'Программа обучения' } },
        { value: 'announcement-annex', label: { tr: 'Duyuru eki', en: 'Announcement annex', ru: 'Приложение к объявлению' } },
        { value: 'form', label: { tr: 'Form / şablon', en: 'Form / template', ru: 'Форма / шаблон' } },
        { value: 'guide', label: { tr: 'Kılavuz / broşür', en: 'Guide / brochure', ru: 'Руководство / брошюра' } },
        { value: 'report', label: { tr: 'Rapor', en: 'Report', ru: 'Отчёт' } },
        { value: 'legal', label: { tr: 'Mevzuat / politika belgesi', en: 'Legal / policy document', ru: 'Нормативный документ' } },
        { value: 'video', label: { tr: 'Video kaydı (ek)', en: 'Video recording (attachment)', ru: 'Видеозапись (вложение)' } },
        { value: 'other', label: { tr: 'Diğer', en: 'Other', ru: 'Другое' } },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'language',
      type: 'select',
      hasMany: true,
      label: { tr: 'Belge Dili', en: 'Document language', ru: 'Язык документа' },
      options: INSTRUCTION_LANGUAGES,
      admin: { position: 'sidebar' },
    },
    {
      name: 'version',
      type: 'text',
      defaultValue: '1.0',
      label: { tr: 'Sürüm', en: 'Version', ru: 'Версия' },
      admin: { position: 'sidebar' },
    },
    {
      name: 'accessLevel',
      type: 'select',
      required: true,
      defaultValue: 'public',
      label: { tr: 'Erişim Seviyesi', en: 'Access level', ru: 'Уровень доступа' },
      options: ACCESS_LEVELS,
      admin: {
        position: 'sidebar',
        /*
          ACIKLAMA DEGISTI — ESKISI ARTIK DOGRU DEGIL.
          Onceki metin "indirme EK-2 portalina yonlendirilir" diyordu; oyle
          bir yonlendirme hicbir zaman kurulmadi ve alan pratikte bir ETIKET
          olarak duruyordu. Artik alan ZORLANIYOR: dosyanin kendisi bu
          seviyeye gore korunuyor (access/index.ts -> documentFileReadAccess).
        */
        description: {
          tr: 'ZORLANIR: dosyanın indirme adresi bu seviyeye göre korunur. “Herkese açık” dışındaki bir belgeyi, adresini bilse bile yetkisiz kimse indiremez. Seviye→rol eşleşmesi: personel → OGM/UOEM personeli, katılımcı → eğitim katılımcıları, eğitmen → eğitmenler, kurum içi → yalnızca yönetici.',
          en: 'ENFORCED: the download URL itself is protected by this level. Anything other than Public cannot be downloaded without the matching role, even with the direct link.',
          ru: 'ПРИМЕНЯЕТСЯ: сам адрес файла защищён этим уровнем.',
        },
      },
    },
    {
      name: 'isArchived',
      type: 'checkbox',
      defaultValue: false,
      label: { tr: 'Arşivlendi', en: 'Archived', ru: 'В архиве' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Arşivlenen belgeler listelerde görünmez; mevcut bağlantılar çalışmaya devam eder.',
          en: 'Archived documents disappear from listings; existing links keep working.',
          ru: 'Архивные документы скрыты из списков.',
        },
      },
    },
    {
      name: 'license',
      type: 'select',
      label: { tr: 'Lisans / Kullanım Hakkı', en: 'License', ru: 'Лицензия' },
      options: LICENSE_TYPES,
    },
    {
      name: 'copyrightHolder',
      type: 'text',
      label: { tr: 'Telif Sahibi', en: 'Copyright holder', ru: 'Правообладатель' },
    },
    {
      /**
       * Salt okunur, otomatik doldurulan alan.
       * Sartname 11.3 "dosya boyutu bilgisi" — indirme baglantisinin yaninda
       * "PDF · 2,4 MB" seklinde gosterilir (Sartname 13 erisilebilirlik).
       */
      name: 'humanFileSize',
      type: 'text',
      label: { tr: 'Dosya Boyutu', en: 'File size', ru: 'Размер файла' },
      admin: { readOnly: true, position: 'sidebar' },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            const bytes = Number(siblingData?.filesize ?? 0)
            if (!bytes) return undefined
            const units = ['B', 'KB', 'MB', 'GB']
            const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
            return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
          },
        ],
      },
    },
  ],
}

export default DocumentFiles
