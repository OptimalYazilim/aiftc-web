import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { searchPlugin } from '@payloadcms/plugin-search'
import { seoPlugin } from '@payloadcms/plugin-seo'
import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { en } from '@payloadcms/translations/languages/en'
import { ru } from '@payloadcms/translations/languages/ru'
import { tr } from '@payloadcms/translations/languages/tr'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { collections } from '@/collections'
import { globals } from '@/globals'
import { DEFAULT_LOCALE, LOCALES } from '@/i18n/locales'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? serverURL)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const useS3 = process.env.MEDIA_STORAGE_ADAPTER === 's3'

/**
 * S3 NESNE ACL'I — VARSAYILAN `private`  (Kilavuz 5.1.2)
 * ============================================================================
 * "Kovadaki dosyalar `public-read` OLMAMALIDIR" sartinin kod tarafindaki
 * karsiligi. Uc davranis vardir:
 *
 *   S3_ACL tanimsiz / 'private'  -> her nesne `private` ACL ile yazilir
 *   S3_ACL='none'                -> ACL basligi HIC gonderilmez
 *   S3_ACL='public-read'         -> UYGULAMA BASLAMAZ (asagida)
 *
 * NEDEN 'none' SECENEGI VAR — GERCEK BIR DAGITIM TUZAGI
 * ---------------------------------------------------------------------------
 * AWS'nin 2023'ten beri varsayilani olan "Bucket owner enforced" (Object
 * Ownership) modunda ACL'ler TAMAMEN KAPALIDIR ve ACL basligi TASIYAN her
 * PUT istegi `AccessControlListNotSupported` (400) ile reddedilir. Yani dogru
 * yapilandirilmis modern bir kovada `private` gondermek YUKLEMEYI BOZAR.
 * O kovada nesneler zaten herkese kapalidir; basligi birakmak dogru cozumdur.
 *
 * Varsayilanin yine de `private` olmasinin sebebi: yanlis tarafa dusen hata
 * GURULTULU olmalidir. `private` + modern kova = yuklemede acik hata (fark
 * edilir). Baslik hic gonderilmeseydi ve kova eski/gevsek olsaydi = SESSIZ
 * sizinti. Ikisi arasinda gurultulu hata secilir.
 *
 * ACL TEK BASINA YETMEZ — bir kova politikasi (`s3:GetObject` herkese acik)
 * her nesneyi yine de yayinlar ve bunu hicbir ACL geri alamaz. Gercek kontrol
 * "Block Public Access"tir; dogrulamasi `pnpm s3:denetle` betigiyle yapilir.
 */
const s3Acl: 'private' | undefined = (() => {
  const deger = (process.env.S3_ACL ?? 'private').trim().toLowerCase()

  if (deger === 'public-read') {
    /*
      Sessizce yok saymak yerine BASLATMAYI REDDEDER. Bu deger yazilmissa bir
      yanlis anlasilma vardir ve sonucu, kurumun butun belgelerinin adresini
      bilen herkese acilmasidir. Onun yerine dagitim aninda patlar.
    */
    throw new Error(
      "S3_ACL='public-read' KABUL EDILMIYOR: yuklenen belgeler herkese acik olamaz " +
        '(bkz. docs/access-control-guide.md 5.1.2). Gecerli degerler: private | none',
    )
  }

  if (deger === 'none' || deger === '') return undefined
  return 'private'
})()

/**
 * ON IMZALI (SIGNED) INDIRME — VARSAYILAN KAPALI, YALNIZCA `media` ICIN
 * ============================================================================
 * Acikken Payload, erisim denetimini gectikten SONRA istemciyi suresi dolan
 * bir S3 adresine 302 ile yonlendirir; dosya baytlari uygulama sunucusundan
 * gecmez. Buyuk video dosyalarinda bant genisligi kazanci gercektir.
 *
 * `document-files` ICIN ASLA ACILMAZ — bilincli.
 * On imzali adres bir HAMILINE BELGEDIR: uretildikten sonra o sureyle
 * sinirli olarak, LINKI ELINDE TUTAN HERKESTE calisir. Yetkili bir katilimci
 * adresi kopyalayip paylastiginda, kurumun erisim kurali o sure boyunca
 * devre disi kalir. Kutuphanenin kisitli belgeleri icin bu kabul edilemez;
 * onlar her baytiyla Payload uzerinden akar ve her istek yeniden denetlenir.
 *
 * `media` (logo, kapak gorseli, galeri karesi) zaten herkese aciktir; orada
 * paylasilabilir adres bir kayip degildir.
 *
 * VARSAYILAN KAPALI TUTULDU cunku 302 yanitini bir CDN veya ara katman
 * onbellege alirsa, sure dolduktan sonra OLU adres servis edilir. Acmadan
 * once o katmanin yonlendirmeyi onbellege ALMADIGI dogrulanmalidir.
 */
const s3ImzaliMedya = process.env.S3_SIGNED_DOWNLOADS === 'true'

/**
 * E-POSTA ADAPTORU  (Sartname 12.1 / Kilavuz 5.2)
 * ============================================================================
 * Adaptor TANIMLI DEGILKEN Payload su uyariyi verir ve e-postayi konsola
 * yazar: "No email adapter provided." Pratik sonucu: parola sifirlama
 * baglantisi ve hesap onay bildirimi KULLANICIYA ULASMAZ. Kayit ekrani
 * yayina girdigi icin bu artik teorik bir eksik degil.
 *
 * ---------------------------------------------------------------------------
 * KOSULLU BAGLANIR — SMTP_HOST YOKSA HIC KURULMAZ
 * ---------------------------------------------------------------------------
 * Adaptor kosulsuz tanimlansaydi, SMTP ayari olmayan bir gelistirme
 * makinesinde her e-posta denemesi ECONNREFUSED ile patlar ve onu tetikleyen
 * islem (ornegin parola sifirlama istegi) 500 donerdi. `SMTP_HOST` bos
 * birakildiginda Payload'in kendi konsol davranisina DUSULUR: gelistirme
 * akisi bozulmaz, uretimde ise degisken tanimlidir.
 *
 * Bu, "sessizce calismiyor" durumundan farklidir: hangi modda oldugu
 * asagidaki `emailAdapter` degerinden ve sunucu gunlugunden okunur.
 *
 * ---------------------------------------------------------------------------
 * `transportOptions` KULLANILIR, HAZIR `transport` DEGIL
 * ---------------------------------------------------------------------------
 * Boylece nodemailer baglantiyi kendi kurar ve kimlik bilgileri yalnizca
 * ortam degiskenlerinde durur. `auth` YALNIZCA kullanici adi verildiginde
 * eklenir: kimlik dogrulamasi istemeyen ic aglardaki bir rolede bos bir
 * `auth` nesnesi baglantiyi reddettirebiliyor.
 *
 * `SMTP_SECURE` 465 (dogrudan TLS) icin `true`, 587 (STARTTLS) icin `false`
 * olmalidir — 587'de `true` yazmak el sikismayi kilitler.
 */
const smtpHost = process.env.SMTP_HOST?.trim()

const emailAdapter = smtpHost
  ? nodemailerAdapter({
      defaultFromName: process.env.SMTP_FROM_NAME || 'AIFTC',
      defaultFromAddress: process.env.SMTP_FROM_ADDRESS || 'no-reply@localhost',
      transportOptions: {
        host: smtpHost,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        ...(process.env.SMTP_USER
          ? {
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD ?? '',
              },
            }
          : {}),
      },
    })
  : undefined

export default buildConfig({
  serverURL,

  /*
    `undefined` gecmek adaptoru hic tanimlamamakla aynidir; Payload konsol
    davranisina duser. Kosul yukarida, degiskenin tanimlandigi yerde
    aciklanmistir.
  */
  email: emailAdapter,

  // ==========================================================================
  // ADMIN PANELI  (Sartname 11.2 "kullanici dostu yonetim paneli")
  // ==========================================================================
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname, '..'),
    },
    /**
     * KURUMSAL KIMLIK (white-label)
     * `title` + `titleSuffix` birlesip tarayici sekmesinde su basligi verir:
     *   "Antalya Uluslararasi Ormancilik Egitim Merkezi — Yonetim Paneli"
     * Payload varsayilan olarak kendi adini basar; kurum panelinde bu
     * gorunmemelidir.
     */
    meta: {
      title: 'Antalya Uluslararası Ormancılık Eğitim Merkezi',
      titleSuffix: ' — Yönetim Paneli',
      description:
        'Antalya Uluslararası Ormancılık Eğitim Merkezi içerik yönetim sistemi. Yalnızca yetkili personel erişebilir.',
      icons: [{ rel: 'icon', type: 'image/png', url: '/favicon.png' }],
    },
    components: {
      /**
       * Varsayilan Payload logosunun yerine kurumsal isaret.
       *   Icon → sol ust kose ve panel basligi
       *   Logo → giris (login) ekranindaki buyuk baslik
       * Iki bilesen de RESMI AMBLEM DEGILDIR; kurumun gorsel kimlik dosyasi
       * saglandiginda icerikleri degistirilmelidir (bkz. BrandIcon notu).
       */
      graphics: {
        Icon: '@/components/admin/BrandIcon#BrandIcon',
        Logo: '@/components/admin/BrandLogo#BrandLogo',
      },
      // Panele giris ekranindaki kisa yonlendirme metni.
      beforeLogin: ['@/components/admin/LoginNotice#LoginNotice'],
      /**
       * Kontrol paneli ust bolumu. Payload bu diziyi varsayilan koleksiyon
       * kartlarinin USTUNDE render eder.
       *
       * Ceviri durumu ARTIK AYRI BIR BILESEN DEGILDIR: kontrol panelinin
       * ortasinda tam genislikte bir tablo basiyordu. Ozet rozet olarak
       * DashboardOverview basligina, ayrintili tablo ise ayni bilesendeki
       * acilir bloga tasindi (Sartname 5 gorunurluk kosulu korunur).
       */
      beforeDashboard: ['@/components/admin/DashboardOverview#DashboardOverview'],
    },
    livePreview: {
      breakpoints: [
        { name: 'mobile', label: 'Mobil', width: 390, height: 844 },
        { name: 'tablet', label: 'Tablet', width: 834, height: 1112 },
        { name: 'desktop', label: 'Masaüstü', width: 1440, height: 900 },
      ],
    },
  },

  // ==========================================================================
  // COK DILLI YAPI  (Sartname 5)
  // ==========================================================================
  localization: {
    locales: LOCALES.map((locale) => ({
      code: locale.code,
      label: locale.label,
      // Panel bu dile gecince arayuz de o dile doner.
      ...(locale.adminLanguage ? { adminLanguage: locale.adminLanguage } : {}),
    })),
    defaultLocale: DEFAULT_LOCALE,
    /**
     * fallback: true -> RU cevirisi henuz girilmemis bir alan, panelde ve
     * API'de TR degeriyle doldurulur. Bu, sitenin yarim gorunmesini engeller.
     * Eksik cevirilerin izlenmesi `translationStatus` alani ile yapilir.
     */
    fallback: true,
  },

  /** Panel arayuz dilleri (@payloadcms/translations). */
  i18n: {
    supportedLanguages: { tr, en, ru },
    fallbackLanguage: 'tr',
  },

  // ==========================================================================
  // VERI KATMANI  (PostgreSQL + Drizzle)
  // ==========================================================================
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: 20,
    },
    /**
     * Uretimde migration zorunlu: `pnpm migrate:create` -> `pnpm migrate`.
     * Gelistirmede push:true sema degisikliklerini otomatik uygular.
     */
    push: process.env.NODE_ENV !== 'production',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),

  // ==========================================================================
  // EDITOR
  // ==========================================================================
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      // Erisilebilirlik: h1 sayfa basligina ayrilir, icerikte h2'den baslanir.
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
      HorizontalRuleFeature(),
      BlocksFeature({
        blocks: [
          {
            slug: 'calloutBlock',
            labels: {
              singular: { tr: 'Bilgi Kutusu', en: 'Callout', ru: 'Информационный блок' },
              plural: { tr: 'Bilgi Kutuları', en: 'Callouts', ru: 'Информационные блоки' },
            },
            fields: [
              {
                name: 'tone',
                type: 'select',
                defaultValue: 'info',
                options: [
                  { value: 'info', label: { tr: 'Bilgi', en: 'Info', ru: 'Информация' } },
                  { value: 'warning', label: { tr: 'Uyarı', en: 'Warning', ru: 'Предупреждение' } },
                  { value: 'success', label: { tr: 'Olumlu', en: 'Success', ru: 'Успех' } },
                ],
              },
              { name: 'text', type: 'textarea', required: true },
            ],
          },
        ],
      }),
    ],
  }),

  // ==========================================================================
  // SEMA
  // ==========================================================================
  collections,
  globals,

  // ==========================================================================
  // GUVENLIK  (Sartname 12.1)
  // ==========================================================================
  secret: process.env.PAYLOAD_SECRET || '',
  cors: allowedOrigins,
  csrf: allowedOrigins,
  cookiePrefix: 'aiftc',
  /**
   * HIZ SINIRLAMA — BURADA DEĞİL, MIDDLEWARE'DE  (Şartname 12.1)
   *
   * Burada bir `rateLimit` bloğu vardı. Payload 2'de Express tabanlı sunucu
   * bu ayarı uygulardı; Payload 3 Next.js route handler'ları üzerinde
   * çalıştığı için ayar CONFIG TİPİNDEN KALDIRILDI. Doğrulandı (3.88.0):
   *
   *     grep -rn "rateLimit" node_modules/payload/dist/config/  →  hiç sonuç
   *
   * Nesne bırakıldığında Payload onu sessizce yok sayıyordu: yani sınırlama
   * ZATEN ETKİN DEĞİLDİ, yalnızca etkinmiş gibi görünüyordu.
   *
   * ARTIK GERÇEK BİR SINIRLAYICI VAR: `src/middleware.ts` + `src/lib/
   * rateLimit.ts`. Kimlik uçlarını (kayıt ve giriş, yalnızca POST) IP bazlı
   * korur. Sınırları ve neden ters vekil/WAF katmanının yerine geçmediği o
   * dosyada ve docs/access-control-guide.md 5.4'te yazılıdır.
   */
  graphQL: {
    // EK-1 kapsaminda GraphQL'e ihtiyac yok; saldiri yuzeyini kucultur.
    disable: true,
  },
  /**
   * YUKLEME BOYUTU — UC KATMANLI ZINCIR, EN DUSUGU BELIRLEYICI
   * ==========================================================================
   * Kutuphane videolari artik dogrudan panele yukleniyor (harici YouTube/Vimeo
   * bagimliligi kaldirildi, bkz. collections/LibraryResources.ts). 50 MB'lik
   * eski sinir 10 dakikalik bir egitim kaydi icin bile yetmiyordu.
   *
   *   1. BURASI (Payload)  → asagidaki `fileSize`. MAX_UPLOAD_MB ile
   *      ortamdan ayarlanir; tanimsizsa 512 MB.
   *   2. Next.js           → App Router route handler'larinda govde siniri
   *      YOKTUR. (Eski Pages API'sindeki 4 MB siniri burayi baglamaz;
   *      `serverActions.bodySizeLimit` de yalnizca server action'lar icindir,
   *      Payload'in yukleme ucu bir route handler'dir.)
   *   3. TERS VEKIL        → UYGULAMA DISINDA ve pratikte EN SIK TAKILAN yer.
   *      nginx varsayilani `client_max_body_size 1m`; ayarlanmazsa 1 MB
   *      ustundeki her yukleme 413 ile reddedilir ve panelde "beklenmeyen
   *      hata" gibi gorunur. Dagitimda mutlaka yukseltilmelidir
   *      (bkz. .env.example).
   *
   * S3 kullaniliyorsa (MEDIA_STORAGE_ADAPTER=s3) dosya yine once uygulamadan
   * gecer; bu sinir orada da gecerlidir.
   */
  upload: {
    limits: { fileSize: Number(process.env.MAX_UPLOAD_MB ?? 512) * 1024 * 1024 },
  },

  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // ==========================================================================
  // EKLENTILER
  // ==========================================================================
  plugins: [
    // --- Uluslararasi SEO (Sartname 3.5) -----------------------------------
    seoPlugin({
      collections: ['pages', 'training-programs', 'training-topics', 'news', 'simulation-systems'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) =>
        `${(doc as { title?: string })?.title ?? ''} | AIFTC`.trim(),
      generateDescription: ({ doc }) =>
        (doc as { summary?: string })?.summary?.slice(0, 155) ?? '',
      generateURL: ({ doc, locale }) =>
        `${serverURL}/${locale ?? DEFAULT_LOCALE}/${(doc as { slug?: string })?.slug ?? ''}`,
    }),

    // --- Site ici arama (Sartname 11.4) ------------------------------------
    searchPlugin({
      collections: ['pages', 'training-programs', 'training-topics', 'news', 'simulation-systems', 'faqs', 'library-resources'],
      localize: true,
      defaultPriorities: {
        'training-programs': 30,
        'training-topics': 25,
        'simulation-systems': 20,
        news: 15,
        'library-resources': 12,
        pages: 10,
        faqs: 5,
      },
      searchOverrides: {
        slug: 'search-index',
        labels: {
          singular: { tr: 'Arama Kaydı', en: 'Search record', ru: 'Поисковая запись' },
          plural: { tr: 'Arama Dizini', en: 'Search index', ru: 'Поисковый индекс' },
        },
        admin: { group: { tr: 'Sistem', en: 'System', ru: 'Система' } },
      },
    }),

    // --- Iletisim / basvuru formlari (Sartname 6.9, 12.2) ------------------
    formBuilderPlugin({
      fields: {
        payment: false,
        country: true,
        state: false,
      },
      /**
       * KVKK: form gonderimleri kisisel veri icerir.
       * Saklama suresi ve erisim yetkisi asagida sinirlandirilmistir.
       */
      /**
       * DIKKAT — SITENIN ILETISIM FORMU BURAYA YAZMAZ.
       * Gonderimler tipli `form-requests` koleksiyonuna dusuyor (bkz.
       * collections/FormRequests.ts): sartname "Form Turu", "Bagli Egitim"
       * (iliski) ve "Durum" alanlarini istiyor; plugin'in anahtar/deger
       * yapisi bunlari tasiyamiyor.
       *
       * Plugin yine de duruyor cunku `forms` kaydi acik riza (KVKK) metninin
       * editor tarafindan duzenlendigi yer. Asagidaki koleksiyon BOSTUR
       * (olculdu: 0 kayit) ve panelde adi ayrilir ki editor iki benzer
       * baslik arasinda kalmasin.
       */
      formSubmissionOverrides: {
        labels: {
          singular: {
            tr: 'Ham Form Kaydı (kullanılmıyor)',
            en: 'Raw form record (unused)',
            ru: 'Сырая запись формы (не используется)',
          },
          plural: {
            tr: 'Ham Form Kayıtları (kullanılmıyor)',
            en: 'Raw form records (unused)',
            ru: 'Сырые записи форм (не используются)',
          },
        },
        admin: {
          group: { tr: 'Sistem', en: 'System', ru: 'Система' },
          description: {
            tr: 'Bu bölüm kullanılmıyor. İletişim ve başvuru talepleri için Sistem > Form Gönderimleri bölümüne bakın.',
            en: 'Unused. See System > Form submissions for contact and application requests.',
            ru: 'Не используется. См. Система > Заявки с форм.',
          },
        },
        access: {
          read: ({ req: { user } }) => Boolean(user),
          update: () => false,
        },
      },
      formOverrides: {
        admin: { group: { tr: 'Genel Ayarlar', en: 'Site settings', ru: 'Настройки сайта' } },
        fields: ({ defaultFields }) => [
          ...defaultFields,
          {
            name: 'consentText',
            type: 'textarea',
            localized: true,
            label: { tr: 'Açık Rıza / Aydınlatma Metni', en: 'Consent text', ru: 'Текст согласия' },
            admin: {
              description: {
                tr: 'Şartname 12.2 — form gönderilmeden önce onay kutusu ile birlikte gösterilir. Boş bırakılamaz.',
                en: 'Spec 12.2 — shown with a consent checkbox before submission.',
                ru: 'П. 12.2 — отображается вместе с флажком согласия.',
              },
            },
          },
          {
            name: 'retentionDays',
            type: 'number',
            defaultValue: 180,
            min: 1,
            label: { tr: 'Saklama Süresi (gün)', en: 'Retention period (days)', ru: 'Срок хранения (дней)' },
          },
        ],
      },
    }),

    // --- Yonlendirmeler: eski OGM sayfasindan gecis -------------------------
    redirectsPlugin({
      collections: ['pages', 'news', 'training-programs'],
      overrides: {
        admin: { group: { tr: 'Genel Ayarlar', en: 'Site settings', ru: 'Настройки сайта' } },
      },
    }),

    /*
      ======================================================================
      MEDYA DEPOLAMA — S3 / MinIO   (Sartname 12.1 · Kilavuz 5.1.2)
      ======================================================================
      `MEDIA_STORAGE_ADAPTER=s3` degilse bu eklenti HIC kurulmaz ve dosyalar
      yerel diskte kalir (`media` -> public/media, `document-files` ->
      private/documents). Iki modda da dosyanin ADRESI ayni kalir:
      `/api/<koleksiyon>/file/<ad>`.

      ----------------------------------------------------------------------
      `disablePayloadAccessControl` ASLA VERILMEZ — EN KRITIK SATIR BURADA
      OLMAYAN SATIRDIR.
      ----------------------------------------------------------------------
      O secenek verilirse eklenti, dosyanin `url` alanini DOGRUDAN S3
      adresine cevirir. Sonuc: istek Payload'a hic ugramaz, koleksiyonun
      `read` kurali (documentFileReadAccess) CALISMAZ ve erisim seviyesi
      yeniden bir etikete doner. Bu, `public/documents` tuzaginin (bkz.
      DocumentFiles.ts) S3 uzerindeki birebir esidir.

      Tipi geregi yalnizca `true` alabilir — `false` yazip niyeti belgeye
      dokemek MUMKUN DEGILDIR. Bu yuzden koruma iki yerde durur:
        1. bu yorum,
        2. `pnpm s3:denetle` betigi, `url` alaninin hala `/api/...` ile
           basladigini OLCER ve `http` ile basliyorsa hata verir.
    */
    ...(useS3
      ? [
          s3Storage({
            collections: {
              /* Herkese acik gorseller. On imzali indirme yalnizca burada ve
                 yalnizca acikca istendiginde (bkz. `s3ImzaliMedya`). */
              media: s3ImzaliMedya ? { signedDownloads: { expiresIn: 900 } } : true,
              /* Kisitli belgeler: HER ZAMAN Payload uzerinden akar. */
              'document-files': true,
            },
            /* Nesneler `private` yazilir; gerekcesi ve `none` kacis kapisi
               icin dosyanin basindaki `s3Acl` notu. */
            acl: s3Acl,
            bucket: process.env.S3_BUCKET ?? '',
            config: {
              region: process.env.S3_REGION,
              endpoint: process.env.S3_ENDPOINT,
              forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
              },
            },
          }),
        ]
      : []),
  ],
})
