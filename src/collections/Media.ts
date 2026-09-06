import type { CollectionConfig } from 'payload'

import { canAuthorContent, canDeleteContent } from '@/access'

/**
 * Gorsel / video / infografik varliklari (Sartname 6.8, 9.2, 11.3, 13).
 *
 * - `alt` LOCALIZED: WCAG 2.2 AA "gorsellerde alternatif metin" maddesi
 *   her dil icin ayri alt metin gerektirir.
 * - `mimeTypes` beyaz liste: "guvenli dosya yukleme" (12.1).
 *
 * ---------------------------------------------------------------------------
 * VIDEO YUKLEME — HARICI SERVIS BAGIMLILIGI YOK
 * ---------------------------------------------------------------------------
 * Kutuphane videolari ARTIK YouTube/Vimeo'ya gomulmuyor; dosya dogrudan bu
 * koleksiyona yukleniyor ve sitede HTML5 `<video>` ile oynatiliyor
 * (bkz. collections/LibraryResources.ts -> videoFile).
 *
 * KABUL EDILEN VIDEO BICIMLERI
 *   video/mp4       (H.264 + AAC)  → TUM tarayicilarda oynar
 *   video/webm      (VP9 + Opus)   → acik bicim, Safari 14+ dahil genis destek
 *   video/quicktime (MOV)          → YUKLENIR ama HER YERDE OYNAMAZ
 *
 * MOV UYARISI — ONEMLI
 * Onceki surumde MOV bilerek reddediliyordu. Artik kabul ediliyor, cunku
 * kurumun elindeki ham cekimler cogunlukla MOV ve yukleme asamasinda
 * reddedilmeleri is akisini kiriyordu. Ancak sunu bilerek yapiyoruz:
 *   - Safari, icindeki kodek H.264 ise MOV'u oynatir.
 *   - Chrome ve Firefox cogu MOV'u OYNATMAZ.
 * Bu yuzden oynatici, kaynak yuklenemedigini ANLAR ve sessizce siyah bir
 * kutu birakmak yerine indirme secenegine duser
 * (bkz. components/library/MediaDialog.tsx `onError`).
 *
 * Yayina girecek videolarin MP4 (H.264) olmasi hala TAVSIYE EDILIR; panel
 * aciklamasi bunu soyler.
 *
 * DOSYA BOYUTU zinciri UC KATMANLIDIR ve en dusugu belirleyicidir:
 *   1. Payload  → payload.config.ts `upload.limits.fileSize` (MAX_UPLOAD_MB)
 *   2. Next.js  → App Router route handler'larinda govde siniri YOKTUR
 *                 (eski Pages API'sindeki 4 MB siniri burada gecerli degil)
 *   3. Ters vekil (nginx/Traefik/CDN) → UYGULAMA DISINDA. nginx varsayilani
 *      `client_max_body_size 1m`'dir ve ayarlanmazsa 1 MB'in ustundeki her
 *      yukleme 413 ile reddedilir. Bu, kodla cozulemez; dagitim yapilandirmasi
 *      guncellenmelidir (bkz. .env.example).
 *
 * - Bu koleksiyon EK-2 dijital kutuphane BELGELERINI tutmaz; onlar
 *   `document-files` koleksiyonundadir.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: { tr: 'Medya', en: 'Media', ru: 'Медиа' },
    plural: { tr: 'Medya Kütüphanesi', en: 'Media library', ru: 'Медиатека' },
  },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'mediaType', 'updatedAt'],
    group: { tr: 'Medya', en: 'Media', ru: 'Медиа' },
  },
  access: {
    read: () => true,
    create: canAuthorContent,
    update: canAuthorContent,
    delete: canDeleteContent,
  },
  upload: {
    staticDir: 'public/media',
    // MEDIA_STORAGE_ADAPTER=s3 ise storage-s3 plugin'i staticDir'i devre disi birakir.
    focalPoint: true,
    crop: true,
    imageSizes: [
      { name: 'thumbnail', width: 320, height: 240, position: 'centre' },
      { name: 'card', width: 768, height: 512, position: 'centre' },
      { name: 'hero', width: 1920, height: 900, position: 'centre' },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    formatOptions: {
      format: 'webp',
      options: { quality: 82 },
    },
    /*
      Sartname 12.1: zararli dosya kontrolu - MIME beyaz listesi.
      `imageSizes` ve `formatOptions` yalnizca GORSELLERE uygulanir; Payload
      video ve PDF icin sharp'i hic cagirmaz, dosya oldugu gibi saklanir.
    */
    mimeTypes: [
      /*
        GORSELLER ACIK ACIK SAYILIR, `image/*` KULLANILMAZ.
        Joker karakter TIFF/BMP gibi tarayicinin basmadigi bicimleri de
        gecirirdi. Daha onemlisi: bu listedeki tek gercek risk
        `image/svg+xml`'dir (icinde script tasiyabilir) ve joker bir listede
        onun bilincli bir karar oldugu gorunmez olurdu. Liste denetlenebilir
        kalsin diye acik birakildi (Sartname 12.1).
      */
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/svg+xml',

      // Video — gerekcesi ve MOV uyarisi dosya basinda.
      'video/mp4',
      'video/webm',
      'video/quicktime',

      'application/pdf',
    ],
  },

  hooks: {
    beforeChange: [
      /**
       * `mediaType` alanini yuklenen dosyanin MIME turunden TURETIR.
       *
       * Alanin varsayilani 'photo' idi ve editorler video yuklerken degistirmeyi
       * unutuyordu; medya kitapligi listesi bir sure sonra gercegi yansitmaz
       * hale geliyordu. Artik dosya ne ise tur odur.
       *
       * ELLE YAPILAN SECIM EZILMEZ: editor bir gorseli "Infografik" veya
       * "Logo" olarak isaretlediyse o secim korunur. Hook yalnizca tur ile
       * dosya CELISIYORSA duzeltir (video dosyasina 'photo' denmesi gibi).
       */
      ({ data }) => {
        const mime = typeof data?.mimeType === 'string' ? data.mimeType : ''
        if (!mime) return data

        if (mime.startsWith('video/') && data.mediaType !== 'video') {
          return { ...data, mediaType: 'video' }
        }
        if (mime === 'application/pdf' && data.mediaType !== 'document') {
          return { ...data, mediaType: 'document' }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      label: { tr: 'Alternatif Metin (alt)', en: 'Alternative text', ru: 'Альтернативный текст' },
      admin: {
        description: {
          tr: 'WCAG 2.2 AA zorunluluğu. Görseli görmeyen bir kullanıcıya ne anlatıyorsa onu yazın. Dekoratif görsellerde tek boşluk bırakın.',
          en: 'Required by WCAG 2.2 AA. Describe what the image conveys.',
          ru: 'Требование WCAG 2.2 AA. Опишите смысл изображения.',
        },
      },
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
      label: { tr: 'Açıklama / Künye', en: 'Caption', ru: 'Подпись' },
    },
    {
      name: 'credit',
      type: 'text',
      label: { tr: 'Telif / Kaynak', en: 'Credit', ru: 'Автор / источник' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Fotoğrafın sahibi kurum veya kişi. Görünürlük kuralları (10.2) gereği zorunludur.',
          en: 'Copyright holder. Required by visibility rules.',
          ru: 'Правообладатель.',
        },
      },
    },
    {
      name: 'mediaType',
      type: 'select',
      defaultValue: 'photo',
      label: { tr: 'Medya Türü', en: 'Media type', ru: 'Тип медиа' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Video ve PDF yüklemelerinde otomatik ayarlanır. Görsellerde elle seçebilirsiniz.',
          en: 'Set automatically for video and PDF uploads.',
          ru: 'Устанавливается автоматически для видео и PDF.',
        },
      },
      options: [
        { value: 'photo', label: { tr: 'Fotoğraf', en: 'Photo', ru: 'Фото' } },
        { value: 'video', label: { tr: 'Video', en: 'Video', ru: 'Видео' } },
        { value: 'infographic', label: { tr: 'İnfografik', en: 'Infographic', ru: 'Инфографика' } },
        { value: 'screenshot', label: { tr: 'Ekran görüntüsü', en: 'Screenshot', ru: 'Скриншот' } },
        { value: 'logo', label: { tr: 'Logo / Amblem', en: 'Logo', ru: 'Логотип' } },
        { value: 'document', label: { tr: 'Belge (PDF)', en: 'Document (PDF)', ru: 'Документ (PDF)' } },
      ],
    },
    {
      name: 'isDecorative',
      type: 'checkbox',
      defaultValue: false,
      label: { tr: 'Dekoratif görsel (ekran okuyucular atlasın)', en: 'Decorative image', ru: 'Декоративное изображение' },
      admin: { position: 'sidebar' },
    },
  ],
}

export default Media
