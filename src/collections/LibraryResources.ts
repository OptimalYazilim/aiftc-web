import type { CollectionConfig } from 'payload'

import { canAuthorContent, canDeleteContent, publishedOrAuthenticated } from '@/access'
import {
  LIBRARY_ALBUM_TYPE,
  LIBRARY_RESOURCE_TYPES,
  LIBRARY_VIDEO_TYPE,
} from '@/fields/options'
import { publishingFields, translationStatusField } from '@/fields/publishing'
import { slugField } from '@/fields/slug'
import { revalidateCollection, revalidateOnDelete } from '@/hooks/revalidate'
import { syncTranslationStatus } from '@/hooks/syncTranslationStatus'

/**
 * DİJİTAL KÜTÜPHANE KAYITLARI  (Şartname 6.6 / EK-2)
 * ============================================================================
 * KAPSAM — `document-files` İLE FARKI
 * ---------------------------------------------------------------------------
 * İki koleksiyon birbirinin yerine geçmez, birbirini TAMAMLAR:
 *
 *   document-files   → DOSYANIN KENDİSİ. Upload koleksiyonudur: MIME beyaz
 *                      listesi, boyut hesabı, sürüm, lisans, erişim seviyesi.
 *                      Sitenin her yerinde kullanılır (eğitim eki, form,
 *                      duyuru eki).
 *   library-resources → KATALOG KAYDI. Kütüphanede yayımlanan bir yayının
 *                      künyesidir: başlık, özet, tür, konu, yayın yılı.
 *                      Dosyayı `document-files`ten İLİŞKİYLE alır.
 *
 * Bu ayrım bilinçlidir. Aynı PDF birden fazla katalog kaydına bağlanabilir
 * (örneğin bir rehberin hem "Teknik Rehber" hem eğitim eki olması), ve bir
 * katalog kaydı dosya yerine dış bir adrese de işaret edebilir (`externalUrl`).
 * Dosya alanları katalog kaydına kopyalansaydı boyut/sürüm bilgisi iki yerde
 * tutulur ve zamanla ayrışırdı.
 *
 * ---------------------------------------------------------------------------
 * NEDEN ARTIK SİTE İÇİNDE
 * ---------------------------------------------------------------------------
 * Kütüphane başlangıçta EK-2 kapsamında AYRI BİR SUBDOMAIN olarak
 * tasarlanmıştı ve site oraya yalnızca bağlantı veriyordu
 * (bkz. globals/ExternalServices.ts). Bu koleksiyonla birlikte kütüphane ana
 * mimariye alt dizin olarak alındı: /tr/kutuphane · /en/library · /ru/biblioteka
 *
 * `ExternalServices.library` ayarı SİLİNMEDİ — ileride gerçekten ayrı bir
 * kütüphane sistemi kurulursa o bağlantı hâlâ tanımlanabilir. Ancak ana menü
 * ve ana sayfa kartı artık bu iç bölüme bakar.
 *
 * ---------------------------------------------------------------------------
 * ÇOK DİLLİLİK
 * ---------------------------------------------------------------------------
 * `title`, `description` ve `slug` yerelleştirilmiştir. Dosyanın KENDİSİ
 * değildir: bir rapor tek dilde yayımlanmış olabilir. Yayının dili
 * `document-files.language` alanında durur ve kartta gösterilir.
 * ============================================================================
 */
export const LibraryResources: CollectionConfig = {
  slug: 'library-resources',
  labels: {
    singular: { tr: 'Kütüphane Kaydı', en: 'Library resource', ru: 'Ресурс библиотеки' },
    plural: { tr: 'Dijital Kütüphane', en: 'Digital library', ru: 'Цифровая библиотека' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'resourceType', 'publicationYear', '_status'],
    group: { tr: 'Medya', en: 'Media', ru: 'Медиа' },
    listSearchableFields: ['title', 'description'],
    description: {
      tr: 'Kütüphanede yayımlanan yayınların künyesi. Dosyayı önce “Site Belgeleri”ne yükleyin, sonra buradan ilişkilendirin.',
      en: 'Catalogue records for library publications. Upload the file under “Site documents” first, then link it here.',
      ru: 'Каталожные записи публикаций библиотеки. Сначала загрузите файл в «Документы сайта».',
    },
  },
  access: {
    read: publishedOrAuthenticated,
    create: canAuthorContent,
    update: canAuthorContent,
    delete: canDeleteContent,
  },
  versions: {
    drafts: { autosave: false, schedulePublish: true },
    maxPerDoc: 20,
  },
  /**
   * Varsayılan sıralama: en yeni yayın önce. Kütüphanede kronoloji anlamlıdır
   * — 2019 tarihli bir teknik rehber, 2027 tarihli bir raporun üstünde
   * durmamalıdır.
   */
  defaultSort: '-publicationYear',
  hooks: {
    afterChange: [
      syncTranslationStatus(['title', 'description']),
      revalidateCollection('/kutuphane'),
    ],
    afterDelete: [revalidateOnDelete('/kutuphane')],
  },
  fields: [
    slugField(),

    {
      name: 'resourceType',
      type: 'select',
      required: true,
      index: true,
      defaultValue: 'report',
      label: { tr: 'Doküman Türü', en: 'Resource type', ru: 'Тип документа' },
      options: LIBRARY_RESOURCE_TYPES,
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Kütüphane sayfasındaki filtre çubuğu bu alandan üretilir.',
          en: 'Drives the filter bar on the library page.',
          ru: 'Определяет панель фильтров на странице библиотеки.',
        },
      },
    },
    {
      /**
       * Yıl, tam tarih değil.
       * Kurumsal yayınlarda gün/ay çoğu zaman bilinmez ya da anlamsızdır
       * ("2026 Faaliyet Raporu"). Tam tarih alanı zorlansaydı editör uydurma
       * bir gün girmek zorunda kalırdı. Filtreleme ve sıralama için yıl yeter.
       */
      name: 'publicationYear',
      type: 'number',
      required: true,
      index: true,
      min: 1950,
      max: 2100,
      label: { tr: 'Yayın Yılı', en: 'Publication year', ru: 'Год издания' },
      admin: {
        position: 'sidebar',
        step: 1,
        description: {
          tr: 'Yalnızca yıl. Yayında gün/ay bilgisi varsa özete yazın.',
          en: 'Year only. Put a fuller date in the description if the publication has one.',
          ru: 'Только год. Полную дату укажите в описании.',
        },
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: { tr: 'Öne çıkar', en: 'Feature', ru: 'Рекомендуемое' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Kütüphane listesinin başında gösterilir.',
          en: 'Shown at the top of the library listing.',
          ru: 'Показывается в начале списка.',
        },
      },
    },
    {
      /**
       * İNDİRME / İZLENME SAYACI
       * ---------------------------------------------------------------------
       * Ziyaretçi indirme veya izleme butonuna bastığında istemciden
       * `/api/library/[id]/hit` uç noktasına haber gönderilir ve bu alan
       * bir artırılır (bkz. app/api/library/[id]/hit/route.ts).
       *
       * DÜRÜSTÇE SÖYLENMESİ GEREKEN SINIRLAR
       *   - TEKİLLEŞTİRME YOK. Aynı kişi beş kez indirirse sayaç beşe çıkar.
       *     Tekilleştirme için ziyaretçiyi tanımlayan bir çerez/parmak izi
       *     gerekirdi; bu, KVKK açısından ayrı bir rıza konusudur ve sayaç
       *     bunu hak edecek kadar kritik değildir.
       *   - Kötüye kullanıma karşı uygulama katmanında hız sınırı YOKTUR;
       *     ters vekil/WAF katmanında sınırlanmalıdır (bkz. payload.config.ts
       *     içindeki hız sınırlama notu).
       * Bu yüzden sayı bir KABA POPÜLERLİK GÖSTERGESİDİR, denetlenebilir bir
       * istatistik değildir.
       *
       * Editör elle düzeltebilsin diye salt okunur YAPILMADI: yanlış bir
       * artıştan sonra sıfırlamak mümkün olmalıdır.
       */
      name: 'downloads',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: { tr: 'İndirme / İzlenme', en: 'Downloads / views', ru: 'Скачивания / просмотры' },
      admin: {
        position: 'sidebar',
        step: 1,
        description: {
          tr: 'Otomatik artar. Tekilleştirme yapılmaz; kaba bir popülerlik göstergesidir.',
          en: 'Increments automatically. Not deduplicated — a rough popularity signal.',
          ru: 'Увеличивается автоматически, без дедупликации.',
        },
      },
    },
    translationStatusField,
    publishingFields,

    {
      type: 'tabs',
      tabs: [
        // ------------------------------------------------------------------
        {
          label: { tr: 'Künye', en: 'Record', ru: 'Описание' },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              localized: true,
              label: { tr: 'Başlık', en: 'Title', ru: 'Заголовок' },
            },
            {
              name: 'description',
              type: 'textarea',
              localized: true,
              maxLength: 400,
              label: { tr: 'Özet / Açıklama', en: 'Summary / description', ru: 'Аннотация' },
              admin: {
                description: {
                  tr: 'Kartta 1–2 cümle gösterilir. Yayının ne olduğunu ve kime hitap ettiğini söyleyin.',
                  en: 'One or two sentences shown on the card.',
                  ru: 'Одно-два предложения на карточке.',
                },
              },
            },
            {
              name: 'author',
              type: 'text',
              localized: true,
              label: { tr: 'Yazar / Kurum', en: 'Author / institution', ru: 'Автор / организация' },
              admin: {
                description: {
                  tr: 'Örn. “FAO” veya “Orman Genel Müdürlüğü”. Boş bırakılabilir.',
                  en: 'e.g. “FAO” or “General Directorate of Forestry”. Optional.',
                  ru: 'Например «ФАО». Необязательно.',
                },
              },
            },
            {
              /**
               * Eğitim Konuları koleksiyonuyla ORTAK SÖZLÜK.
               * Kütüphane sayfasındaki tematik filtreler bu ilişkiden üretilir
               * ve eğitim kataloğundaki konu filtreleriyle aynı listeyi
               * kullanır: ziyaretçi "Orman Yangınları" konusunu iki bölümde de
               * aynı adla görür.
               */
              name: 'topics',
              type: 'relationship',
              relationTo: 'training-topics',
              hasMany: true,
              label: { tr: 'İlgili Eğitim Konuları', en: 'Related training topics', ru: 'Связанные темы' },
              admin: {
                description: {
                  tr: 'Tematik filtreler bu alandan üretilir. Eğitim kataloğuyla aynı konu listesidir.',
                  en: 'Drives the thematic filters; same list as the training catalogue.',
                  ru: 'Определяет тематические фильтры.',
                },
              },
            },
          ],
        },

        // ------------------------------------------------------------------
        {
          label: { tr: 'Dosya, Video ve Görsel', en: 'File, video & image', ru: 'Файл, видео и изображение' },
          fields: [
            {
              /**
               * VİDEO DOSYASI — HARİCİ SERVİS BAĞIMLILIĞI KALDIRILDI
               * -------------------------------------------------------------------
               * Önceki sürümde burada `videoUrl` vardı: editör bir YouTube/Vimeo
               * adresi yapıştırıyor, site onu gömme adresine çevirip bir
               * `<iframe>` içinde açıyordu. Üç sorunu vardı:
               *
               *   1. GİZLİLİK — oynatıcı açıldığı anda ziyaretçinin IP'si ve
               *      tarayıcı bilgisi üçüncü tarafa gidiyordu. `youtube-nocookie`
               *      ve `dnt=1` bunu azaltır ama ORTADAN KALDIRMAZ.
               *   2. SÜREKLİLİK — kurumun yayını, sahibi olmadığı bir platformun
               *      hesap/telif kararına bağlı kalıyordu.
               *   3. ERİŞİM — YouTube'un engelli olduğu ülkelerden (kurumun hedef
               *      kitlesi Orta Asya'dır) video hiç açılmıyordu.
               *
               * Artık dosya doğrudan Medya kitaplığına yükleniyor ve sitede HTML5
               * `<video>` ile oynatılıyor (bkz. components/library/MediaDialog).
               *
               * `filterOptions`: ilişki seçicisinde YALNIZCA video dosyaları
               * listelenir. Editörün 400 fotoğraf arasından videoyu araması
               * gerekmez ve yanlışlıkla bir JPEG seçmesi mümkün olmaz.
               */
              name: 'videoFile',
              type: 'relationship',
              /*
                ÇOK HEDEFLİ İLİŞKİ — ÖLÇÜLMÜŞ BİR ARIZANIN SONUCU.
                Alan yalnızca `media`ya bakıyordu. Editör videoyu "Site
                Belgeleri"ne yükleyince seçici BOŞ kalıyordu; hata mesajı da
                yoktu, sadece hiçbir şey listelenmiyordu. Ölçüm:
                    document-files: 1 kayıt (videoplayback.mp4, video/mp4)
                    media:          0 kayıt
                    filterOptions sorgusu (media): 0 sonuç
                Video her iki koleksiyona da yüklenebildiği için (bkz.
                collections/Media.ts ve DocumentFiles.ts) seçici de ikisini de
                görmelidir. Aksi hâlde "yüklediğim dosya listede yok" durumu
                kaçınılmazdır.
              */
              relationTo: ['media', 'document-files'],
              label: { tr: 'Video Dosyası', en: 'Video file', ru: 'Видеофайл' },
              /*
                Filtre HER İKİ koleksiyona da uygulanır: nereye yüklenmiş
                olursa olsun yalnızca video dosyaları listelenir.
              */
              filterOptions: () => ({ mimeType: { contains: 'video/' } }),
              admin: {
                condition: (_, siblingData) => siblingData?.resourceType === LIBRARY_VIDEO_TYPE,
                description: {
                  tr: 'Medya Kütüphanesi veya Site Belgeleri — hangisine yüklediyseniz buradan seçebilirsiniz. Yalnızca MP4 (H.264) ve WebM her tarayıcıda oynar; MOV yalnızca Safari’de oynar, diğerlerinde indirme seçeneğine düşer.',
                  en: 'Pick from the Media library or Site documents — whichever you uploaded to. Only MP4 (H.264) and WebM play in every browser; MOV plays in Safari only.',
                  ru: 'Выберите из медиатеки или из документов сайта. В любом браузере воспроизводятся только MP4 и WebM.',
                },
              },
              validate: (value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => {
                if (siblingData?.resourceType !== LIBRARY_VIDEO_TYPE) return true
                return value ? true : 'Video kaydı için bir video dosyası seçilmelidir.'
              },
            },
            {
              /**
               * İNDİRME İZNİ — editörün kararı.
               * Bazı kayıtlar yalnızca izlenmek üzere yayımlanır (telif, katılımcı
               * görüntüsü, ham çekim). Dosya adresi zaten açıktır — bu kutu bir
               * GÜVENLİK ÖNLEMİ DEĞİL, arayüz tercihidir: işaretlenmediğinde
               * oynatıcının altındaki "Videoyu İndir" bağlantısı basılmaz.
               * Gerçek erişim kısıtlaması gerekiyorsa dosya `document-files`
               * koleksiyonuna, erişim seviyesiyle birlikte konmalıdır.
               */
              name: 'allowVideoDownload',
              type: 'checkbox',
              defaultValue: true,
              label: { tr: 'Video indirilebilsin', en: 'Allow video download', ru: 'Разрешить скачивание' },
              admin: {
                condition: (_, siblingData) => siblingData?.resourceType === LIBRARY_VIDEO_TYPE,
                description: {
                  tr: 'Kapatıldığında oynatıcının altındaki indirme bağlantısı gösterilmez. Dosya adresi yine de erişilebilir olduğu için bu bir erişim kısıtlaması değildir.',
                  en: 'Hides the download link under the player. Not an access restriction — the file URL stays reachable.',
                  ru: 'Скрывает ссылку на скачивание. Это не ограничение доступа.',
                },
              },
            },
            {
              name: 'videoDuration',
              type: 'text',
              localized: true,
              label: { tr: 'Süre', en: 'Duration', ru: 'Длительность' },
              admin: {
                condition: (_, siblingData) => siblingData?.resourceType === LIBRARY_VIDEO_TYPE,
                description: {
                  tr: 'Örn. “45 dk”. Kartta tür rozetinin yerinde gösterilir; ziyaretçi ne kadar süre ayıracağını tıklamadan görür.',
                  en: 'e.g. “45 min”. Shown on the card so visitors know the length before clicking.',
                  ru: 'Например «45 мин».',
                },
              },
            },
            {
              /**
               * FOTOĞRAF ALBÜMÜ
               * `hasMany` bir upload ilişkisi: aynı görsel birden fazla
               * albümde kullanılabilir ve Medya kitaplığında tek kopya kalır.
               * Albümün KAPAĞI ayrı bir alandır (`coverImage`); ilk görseli
               * otomatik kapak yapmak, editörün kapak seçme hakkını elinden
               * alırdı.
               */
              name: 'gallery',
              type: 'relationship',
              relationTo: 'media',
              hasMany: true,
              label: { tr: 'Albüm Görselleri', en: 'Album images', ru: 'Изображения альбома' },
              admin: {
                condition: (_, siblingData) => siblingData?.resourceType === LIBRARY_ALBUM_TYPE,
                description: {
                  tr: 'Sıralama buradaki sıradır. Her görselin Medya kaydındaki “alt” metni doldurulmalıdır (WCAG 1.1.1).',
                  en: 'Order follows this list. Each image needs an alt text in its Media record.',
                  ru: 'Порядок соответствует списку. У каждого изображения должен быть alt-текст.',
                },
              },
            },
            {
              /**
               * DOSYA `document-files` ÜZERİNDEN GELİR.
               * O koleksiyon MIME beyaz listesi uygular (Şartname 12.1) ve
               * `humanFileSize` alanını otomatik doldurur. Kart üzerindeki
               * "PDF · 4,2 MB" rozeti oradan okunur — burada elle boyut
               * girilmez, girilseydi dosya değiştiğinde yanlış kalırdı.
               */
              name: 'file',
              type: 'relationship',
              /*
                Aynı gerekçe `videoFile` ile ortaktır: `media` koleksiyonu da
                PDF kabul ediyor, dolayısıyla bir rapor oraya yüklenmiş
                olabilir. Tek hedefli bir ilişki o dosyayı görünmez kılardı.
              */
              relationTo: ['document-files', 'media'],
              label: { tr: 'Doküman Dosyası', en: 'Document file', ru: 'Файл документа' },
              admin: {
                description: {
                  tr: 'Site Belgeleri veya Medya Kütüphanesi — hangisine yüklediyseniz buradan seçebilirsiniz. Dosya boyutu ve türü otomatik okunur.',
                  en: 'Pick from Site documents or the Media library. Size and type are read automatically.',
                  ru: 'Выберите из документов сайта или медиатеки. Размер и тип читаются автоматически.',
                },
              },
            },
            {
              name: 'externalUrl',
              type: 'text',
              label: { tr: 'Dış Bağlantı', en: 'External link', ru: 'Внешняя ссылка' },
              admin: {
                description: {
                  tr: 'Yayın başka bir kurumun sitesinde duruyorsa (örn. FAO yayın arşivi) dosya yüklemek yerine adresini girin.',
                  en: 'If the publication lives on another institution’s site, enter its URL instead of uploading a file.',
                  ru: 'Если публикация размещена на стороннем сайте, укажите адрес.',
                },
              },
              validate: (value: unknown) => {
                if (!value) return true
                /*
                  Yalnızca http/https kabul edilir. `javascript:` ve `data:`
                  şemaları burada engellenir — bu değer doğrudan bir <a href>
                  içine basılıyor (Şartname 12.1).
                */
                return typeof value === 'string' && /^https?:\/\//i.test(value)
                  ? true
                  : 'Adres http:// veya https:// ile başlamalıdır.'
              },
            },
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
              label: { tr: 'Kapak Görseli', en: 'Cover image', ru: 'Обложка' },
              admin: {
                description: {
                  tr: 'İsteğe bağlı. Yüklenmezse kartta belge türü rozeti ve nötr bir zemin gösterilir.',
                  en: 'Optional. Without it the card shows a type badge on a neutral panel.',
                  ru: 'Необязательно.',
                },
              },
            },
          ],
        },
      ],
    },
  ],
}

export default LibraryResources
