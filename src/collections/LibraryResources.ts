import type { CollectionConfig } from 'payload'

import { canDeleteContent, canManageLibrary, libraryReadAccess } from '@/access'
import {
  FOCUS_COUNTRIES,
  INSTRUCTION_LANGUAGES,
  LIBRARY_ACCESS_LEVELS,
  LIBRARY_ALBUM_TYPE,
  LIBRARY_FILE_FORMATS,
  LIBRARY_RESOURCE_TYPES,
  LIBRARY_VIDEO_TYPE,
  LICENSE_TYPES,
} from '@/fields/options'
import { publishingFields, reviewStatusField, translationStatusField } from '@/fields/publishing'
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
 *                      listesi, boyut hesabı, arşiv bayrağı. Sitenin her
 *                      yerinde kullanılır (eğitim eki, form, duyuru eki) —
 *                      bu kullanımların çoğunda ortada bir katalog kaydı YOKTUR.
 *   library-resources → KATALOG KAYDI (künye). Kütüphanede yayımlanan bir
 *                      yayının kimliğidir. Dosyayı ilişkiyle alır ama
 *                      künye bilgisini KENDİ TUTAR.
 *
 * KÜNYE NEDEN BURADA DURUR (Şartname EK-2 Madde 1.2)
 * ---------------------------------------------------------------------------
 * Dil, biçim, boyut, sürüm ve lisans alanları başlangıçta yalnızca
 * `document-files` içindeydi. Şartname bunları KATALOG ALANI olarak sayar ve
 * pratikte de oraya aittir:
 *
 *   - Katalog kaydı dosyasız olabilir (`externalUrl`). Dosya yoksa dil, biçim,
 *     boyut ve lisansın tutulacağı bir yer de kalmıyordu.
 *   - Aynı dosya birden çok katalog kaydına bağlanabilir; künye kayda özeldir.
 *   - Yayının dili ile dosyanın dili aynı şey değildir: iki dilli bir raporun
 *     tek bir PDF'i olabilir.
 *
 * Bu yüzden alanlar `document-files`ten SİLİNMEDİ, buraya EKLENDİ. Silinselerdi
 * katalog kaydı olmayan ekler (TrainingPrograms.relatedDocuments,
 * News.attachments, InternationalGuide) sürüm ve lisans bilgisini tümüyle
 * kaybederdi.
 *
 * ÇAKIŞMA KURALI: `fileFormat` ve `fileSize` yüklü dosya varken ELLE
 * GİRİLMEZ — kart bunları dosyanın `mimeType`/`filesize` alanından okur
 * (components/library/LibraryResourceCard.tsx). Bu iki alan yalnızca dış
 * bağlantılı kayıtlar içindir.
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
 * `title`, `description`, `slug` ve `keywords` yerelleştirilmiştir; künyenin
 * çevrilebilir kısmı budur. Yayının KENDİSİ çevrilmez: bir rapor tek dilde
 * yayımlanmış olabilir. Yayının hangi dil(ler)de olduğu ayrı bir alanda
 * (`language`) durur ve arayüz dilinden bağımsızdır — Rusça gezinen bir
 * ziyaretçi de yalnızca Türkçe yayımlanmış bir raporun Türkçe olduğunu
 * görebilmelidir.
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
    listSearchableFields: ['title', 'description', 'institution', 'identifier'],
    description: {
      tr: 'Kütüphanede yayımlanan yayınların künyesi. Dosyayı önce “Site Belgeleri”ne yükleyin, sonra buradan ilişkilendirin.',
      en: 'Catalogue records for library publications. Upload the file under “Site documents” first, then link it here.',
      ru: 'Каталожные записи публикаций библиотеки. Сначала загрузите файл в «Документы сайта».',
    },
  },
  access: {
    // Sartname 1.7 — karar sirasi ve gerekcesi access/index.ts icinde.
    read: libraryReadAccess,
    create: canManageLibrary,
    update: canManageLibrary,
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
    reviewStatusField,

    {
      /*
        ERİŞİM SEVİYESİ — ŞARTNAME 1.7
        ---------------------------------------------------------------------
        Bu alan bir ETİKET DEĞİL, ZORLANAN bir kuraldır: koleksiyonun `read`
        erişimi (access/index.ts → `libraryReadAccess`) doğrudan bu değere
        bakar ve yetkisi olmayan kullanıcının sorgusundan kaydı ÇIKARIR.

        Varsayılan `public` DEĞİLDİR — `staff`. Yanlış tarafa düşen varsayılan
        seçilirken şu soru sorulur: "editör alanı doldurmayı unutursa ne olsun?"
        Kapalı bir kaydın yanlışlıkla herkese açılması, açık bir kaydın
        yanlışlıkla kapalı kalmasından çok daha pahalıdır.

        DEĞERLER `Users.role` ile `ACCESS_LEVEL_TO_ROLE` haritası üzerinden
        eşleşir (fields/options.ts). Harita TEK YERDEDİR; yeni bir seviye
        eklenip haritaya yazılmazsa o seviyedeki kayıtları kimse göremez —
        yani hata güvenli tarafa düşer.
      */
      name: 'accessLevel',
      type: 'select',
      required: true,
      defaultValue: 'staff',
      index: true,
      options: LIBRARY_ACCESS_LEVELS,
      label: { tr: 'Erişim Seviyesi', en: 'Access level', ru: 'Уровень доступа' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Bu kaydı kimler görebilir. "Herkese açık" dışındaki seçenekler oturum açmayı ZORUNLU kılar; dışarıdan katılımcılar için ayrıca GEÇERLİ BİR ABONELİK gerekir (Kullanıcılar → Abonelik Bitiş Tarihi). DİKKAT: bu kural kaydı gizler, ekli GÖRSELİN doğrudan adresini korumaz (bkz. docs/access-control-guide.md).',
          en: 'Who can see this record. Anything other than Public requires a login, and external participants also need a valid subscription. NOTE: this hides the record but does not protect an attached image URL.',
          ru: 'Кто видит эту запись. Любой уровень кроме «Открытый» требует входа и действующей подписки для внешних участников.',
        },
      },
    },

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
    {
      /**
       * YÜKLEYEN KULLANICI  (Şartname EK-2 Madde 1.2)
       * ---------------------------------------------------------------------
       * Kaydı kimin kütüphaneye koyduğunu tutar. `versions` zaten sürüm başına
       * bir yazar tutuyor ama o kayıt SON DÜZENLEYENİ gösterir; künyede
       * istenen bilgi ilk yükleyendir ve düzenlemelerle değişmemelidir.
       *
       * OTOMATİK DOLDURULUR, KİLİTLENMEZ. `create` işleminde alan boşsa
       * oturumdaki kullanıcı yazılır. Salt okunur yapılmadı: içerik bir
       * kurumdan toplu geldiğinde (örneğin FAO'nun gönderdiği 40 yayın)
       * gerçek yükleyen, kaydı panele giren editörden farklı olabilir ve
       * künye gerçeği söylemelidir.
       *
       * `seed-*.ts` betikleri `overrideAccess` ile ve çoğu zaman kullanıcısız
       * çalışır; orada alan boş kalır — bu doğru davranıştır, uydurma bir
       * kullanıcı yazmaktansa boş bırakmak yeğdir.
       */
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      label: { tr: 'Yükleyen', en: 'Uploaded by', ru: 'Загрузил' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Kaydı oluştururken otomatik doldurulur. Yayın başka biri adına giriliyorsa değiştirebilirsiniz.',
          en: 'Filled in automatically on creation. Change it if you are entering the record on someone else’s behalf.',
          ru: 'Заполняется автоматически при создании записи.',
        },
      },
      hooks: {
        beforeChange: [
          ({ operation, req, value }) => {
            if (value) return value
            if (operation !== 'create') return value
            return req.user?.id ?? value
          },
        ],
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
              label: { tr: 'Yazar / Editör', en: 'Author / editor', ru: 'Автор / редактор' },
              admin: {
                description: {
                  tr: 'Yayını YAZAN kişi veya ekip. Örn. “Dr. A. Yılmaz” ya da “Yangın Çalışma Grubu”. Yayımlayan kurum için alttaki alanı kullanın. Boş bırakılabilir.',
                  en: 'The person or team who wrote the publication. Use the field below for the issuing institution. Optional.',
                  ru: 'Автор публикации. Для организации-издателя используйте поле ниже.',
                },
              },
            },
            {
              /**
               * KURUM `author`DAN AYRI TUTULUR (Şartname EK-2 Madde 1.2).
               * Alan eskiden "Yazar / Kurum" tek kutusuydu; künyede ikisi
               * farklı bilgidir ve çoğu kurumsal yayında ikisi de vardır
               * ("Dr. A. Yılmaz" yazmıştır, "FAO" yayımlamıştır). Tek kutuda
               * tutulsaydı kuruma göre listeleme mümkün olmazdı.
               *
               * Serbest metin, çünkü kurum listesi kapalı bir küme değildir:
               * FAO, OGM, UNDP, üniversiteler, ortak yayınlar. Kapalı bir
               * seçim listesi ilk yabancı ortak yayında tıkanırdı.
               */
              name: 'institution',
              type: 'text',
              localized: true,
              index: true,
              label: { tr: 'Kurum / Yayıncı', en: 'Institution / publisher', ru: 'Организация / издатель' },
              admin: {
                description: {
                  tr: 'Yayını çıkaran kurum. Örn. “FAO”, “Orman Genel Müdürlüğü”, “AIFTC”. Ortak yayınlarda kurumları eğik çizgiyle ayırın.',
                  en: 'The institution that issued the publication, e.g. “FAO”, “General Directorate of Forestry”.',
                  ru: 'Организация, выпустившая публикацию, например «ФАО».',
                },
              },
            },
            {
              /**
               * YAYININ DİLİ — ARAYÜZ DİLİ DEĞİL.
               * `title`/`description` yerelleştirilmiştir (künyeyi her ziyaretçi
               * kendi dilinde okur); bu alan ise YAYININ KENDİSİNİN hangi
               * dil(ler)de olduğunu söyler ve çevrilmez.
               *
               * `hasMany`: kurumsal yayınların çoğu iki dillidir (TR+EN) ve
               * çoğu zaman tek bir PDF içinde gelir.
               */
              name: 'language',
              type: 'select',
              hasMany: true,
              index: true,
              options: INSTRUCTION_LANGUAGES,
              label: { tr: 'Yayın Dili', en: 'Publication language', ru: 'Язык публикации' },
              admin: {
                description: {
                  tr: 'Yayının kendi dili. Sitenin arayüz dilinden bağımsızdır; iki dilli yayınlarda birden çok seçin.',
                  en: 'The language of the publication itself, independent of the site’s interface language.',
                  ru: 'Язык самой публикации, независимо от языка интерфейса сайта.',
                },
              },
            },
            {
              /**
               * ÜLKE — `News.countries` ve `Projects.focusCountries` ile AYNI
               * SÖZLÜK. Ziyaretçi "Kazakistan" etiketini haberde, projede ve
               * kütüphanede aynı adla görür.
               *
               * `hasMany`: bölgesel yayınlar tek ülkeye ait değildir
               * ("Orta Asya Yangın Raporu" beş ülkeyi birden kapsar).
               */
              name: 'countries',
              type: 'select',
              hasMany: true,
              index: true,
              options: FOCUS_COUNTRIES,
              label: { tr: 'Ülke / Bölge', en: 'Country / region', ru: 'Страна / регион' },
              admin: {
                description: {
                  tr: 'Yayının ilgilendirdiği ülke(ler). Bölgesel yayınlarda birden çok seçin; listede yoksa “Diğer”i işaretleyip ülkeyi özete yazın.',
                  en: 'The country or countries the publication concerns. Pick several for regional publications.',
                  ru: 'Страны, к которым относится публикация.',
                },
              },
            },
            {
              /**
               * ANAHTAR KELİMELER — `TrainingTopics.keywords` ile aynı desen.
               * `topics` kapalı bir sözlüktür (filtre çubuğunu üretir);
               * bu alan serbesttir ve site içi aramayı besler (Şartname 11.4):
               * "GCP/SEC/024/TUR", "orman yangını sonrası rehabilitasyon" gibi
               * konu listesine girmeyecek kadar özel terimler buraya yazılır.
               *
               * `localized`: arama sorgusu ziyaretçinin dilinde gelir.
               */
              name: 'keywords',
              type: 'text',
              hasMany: true,
              localized: true,
              label: { tr: 'Anahtar Kelimeler', en: 'Keywords', ru: 'Ключевые слова' },
              admin: {
                description: {
                  tr: 'Site içi aramayı besler (Şartname 11.4). Her terimi ayrı ayrı girin; konu listesindekileri tekrar etmeyin.',
                  en: 'Feeds on-site search. Enter one term per entry; do not repeat the topics above.',
                  ru: 'Используются для поиска по сайту. Вводите по одному термину.',
                },
              },
            },
            {
              /**
               * KALICI TANIMLAYICI — DOI / ISBN / ISSN
               * ---------------------------------------------------------------
               * Tek bir serbest metin alanı, üç ayrı alan değil: bir yayında
               * bunlardan genellikle YALNIZCA BİRİ bulunur ve üç kutu açmak
               * editöre ikisini boş bırakma yükü bindirirdi.
               *
               * YERELLEŞTİRİLMEZ: tanımlayıcı dilden bağımsızdır, aynı yayının
               * Türkçe ve İngilizce künyesinde aynı DOI durur.
               *
               * Biçim DOĞRULANMAZ. Üç şemanın (DOI 10.x/…, ISBN-10/13, ISSN
               * ####-####) hepsini kapsayan bir düzenli ifade, geçerli ama
               * beklenmedik bir tanımlayıcıyı reddedip editörü kilitleme
               * riskini taşır; alan zaten isteğe bağlıdır.
               */
              name: 'identifier',
              type: 'text',
              index: true,
              label: { tr: 'DOI / ISBN / ISSN', en: 'DOI / ISBN / ISSN', ru: 'DOI / ISBN / ISSN' },
              admin: {
                description: {
                  tr: 'Yayının kalıcı tanımlayıcısı. Ön ek ile birlikte yazın: “DOI: 10.4060/cb1234tr” veya “ISBN 978-605-…”. Yoksa boş bırakın.',
                  en: 'Persistent identifier, written with its prefix, e.g. “DOI: 10.4060/cb1234en”. Leave empty if there is none.',
                  ru: 'Постоянный идентификатор публикации с префиксом, например «DOI: 10.4060/…».',
                },
              },
            },
            {
              /**
               * EĞİTİM BAĞLANTISI — `TrainingPrograms.libraryCollectionKey`
               * İLE KARIŞTIRILMAMALIDIR.
               *
               * O alan, EK-2'de AYRI BİR SİSTEM olarak kurulacak kütüphanedeki
               * koleksiyon/etiket kodunu tutan bir METİNDİR ve altı eğitim
               * kaydında gerçek değerlerle doludur. Bu alan ise SİTE İÇİ
               * kütüphanenin kendi ilişkisidir: gerçek bir yabancı anahtar
               * kurar, kayıt silindiğinde bozulmaz ve iki yönlü gezinmeye
               * izin verir.
               *
               * İkisi bir arada yaşayabilir; biri dış sisteme, öteki içeriye
               * bakar. Metin alanı SİLİNMEDİ çünkü içindeki değerler
               * kurtarılamaz veri olurdu.
               */
              name: 'relatedTrainings',
              type: 'relationship',
              relationTo: 'training-programs',
              hasMany: true,
              label: { tr: 'İlgili Eğitimler', en: 'Related trainings', ru: 'Связанные обучения' },
              admin: {
                description: {
                  tr: 'Bu yayının materyali olduğu eğitim programları.',
                  en: 'Training programmes this publication belongs to.',
                  ru: 'Программы обучения, к которым относится публикация.',
                },
              },
            },
            {
              name: 'relatedProjects',
              type: 'relationship',
              relationTo: 'projects',
              hasMany: true,
              label: { tr: 'İlgili Projeler', en: 'Related projects', ru: 'Связанные проекты' },
              admin: {
                description: {
                  tr: 'Yayın bir proje çıktısıysa (örn. GCP/SEC/024/TUR) projeyi buradan bağlayın.',
                  en: 'If the publication is a project output, link the project here.',
                  ru: 'Если публикация является результатом проекта, укажите проект.',
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
               * ALTYAZI DOSYASI — WCAG 2.2 ÖLÇÜTÜ 1.2.2 (Kayıtlı Ses için
               * Altyazı, Seviye A) · Şartname Madde 13
               * ---------------------------------------------------------------
               * `GalleryAlbums.captionsUrl` ile AYNI DESEN; kütüphanedeki video
               * kayıtları da aynı yükümlülük altındadır ve orada olup burada
               * olmaması bir boşluktu.
               *
               * WebVTT seçildi çünkü HTML5 `<video>` öğesinin `<track>` alt
               * öğesi tarayıcıda YALNIZCA bu biçimi okur; SRT dosyası
               * yüklenirse hiçbir şey görünmez ve hata da vermez.
               *
               * DÜRÜST SINIR: bu alan boş bırakılabilir. Zorunlu yapılsaydı
               * editör alanı doldurmak için altyazısı olmayan bir dosya adresi
               * uydurmak zorunda kalır, kayıt teknik olarak "uyumlu" görünür
               * ama ziyaretçi hâlâ altyazı göremezdi. Uyum, alanın dolu
               * olmasıyla değil altyazının VAR OLMASIYLA sağlanır.
               */
              name: 'captionsUrl',
              type: 'text',
              label: { tr: 'Altyazı (WebVTT)', en: 'Captions (WebVTT)', ru: 'Субтитры (WebVTT)' },
              admin: {
                condition: (_, siblingData) => siblingData?.resourceType === LIBRARY_VIDEO_TYPE,
                description: {
                  tr: 'WCAG 2.2 ölçütü 1.2.2 gereği önerilir. Yalnızca .vtt (WebVTT) biçimi tarayıcıda çalışır; SRT dosyası görünmez. Dosyayı Site Belgeleri’ne yükleyip adresini buraya yapıştırın.',
                  en: 'Recommended by WCAG 2.2 (1.2.2). Only .vtt (WebVTT) works in the browser; SRT files will not display.',
                  ru: 'Рекомендуется по WCAG 2.2 (1.2.2). В браузере работает только формат .vtt (WebVTT).',
                },
              },
              validate: (value: unknown) => {
                if (!value) return true
                if (typeof value !== 'string') return 'Geçersiz değer.'
                /*
                  Değer bir <track src> içine basılır. `externalUrl` ile aynı
                  gerekçe: `javascript:` ve `data:` şemaları engellenir.
                  Site içi yüklemeler `/api/...` ile başlayan göreli adres
                  olduğu için "/" ile başlayanlar da kabul edilir.
                */
                return /^(https?:\/\/|\/)/i.test(value)
                  ? true
                  : 'Adres http://, https:// ya da / ile başlamalıdır.'
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

            /* ================================================================
               KÜNYENİN DOSYA TARAFI  (Şartname EK-2 Madde 1.2)
               ----------------------------------------------------------------
               Aşağıdaki beş alan `document-files` içinde de vardır ve orada
               KALMIŞTIR (gerekçe dosyanın başındaki blokta). Buradakiler
               katalog kaydının kendi künyesidir; kayıt dosyasız olduğunda
               (dış bağlantı) tek bilgi kaynağıdır.
               ================================================================ */
            {
              /**
               * BİÇİM — YALNIZCA DOSYASIZ KAYITLAR İÇİN.
               * Yüklü dosya varsa kart biçimi `mimeType`ten okur
               * (LibraryResourceCard → FORMAT_BY_MIME) ve bu alan kullanılmaz.
               * `admin.condition` bu yüzden alanı yalnızca dosya seçilmemişken
               * gösterir: editöre ikinci bir "doğru" girme fırsatı verilmezse
               * iki değer birbiriyle çelişemez.
               */
              name: 'fileFormat',
              type: 'select',
              options: LIBRARY_FILE_FORMATS,
              label: { tr: 'Dosya Biçimi', en: 'File format', ru: 'Формат файла' },
              admin: {
                condition: (_, siblingData) => !siblingData?.file,
                description: {
                  tr: 'Yalnızca dış bağlantılı kayıtlarda doldurun. Dosya yüklüyse biçim dosyadan otomatik okunur ve bu alan gizlenir.',
                  en: 'Fill in only for records that link out. When a file is attached the format is read from it automatically.',
                  ru: 'Заполняйте только для записей с внешней ссылкой.',
                },
              },
            },
            {
              /**
               * BOYUT — aynı gerekçe. Serbest metin, sayı değil: değer
               * ziyaretçiye okunacak şekilde ("4,2 MB") yazılır ve dış
               * kaynakta boyut çoğu zaman ancak yaklaşık bilinir.
               * `document-files.humanFileSize` ile aynı biçimi kullanın ki
               * kartlar tek tip görünsün.
               */
              name: 'fileSize',
              type: 'text',
              label: { tr: 'Dosya Boyutu', en: 'File size', ru: 'Размер файла' },
              admin: {
                condition: (_, siblingData) => !siblingData?.file,
                description: {
                  tr: 'Yalnızca dış bağlantılı kayıtlarda. Okunabilir biçimde yazın: “4,2 MB”. Dosya yüklüyse boyut otomatik hesaplanır.',
                  en: 'Only for records that link out. Write it readably, e.g. “4.2 MB”.',
                  ru: 'Только для внешних ссылок. Указывайте в читаемом виде, например «4,2 МБ».',
                },
              },
            },
            {
              /**
               * SÜRÜM — varsayılan DEĞERİ YOK.
               * `document-files.version` alanı "1.0" ile başlar çünkü orada
               * her yükleme bir dosya sürümüdür. Katalogda ise yayınların
               * çoğunun sürümü YOKTUR; herkese "1.0" yazmak künyeye uydurma
               * bilgi koymak olurdu. Sürümlü yayınlar (güncellenen rehberler,
               * standartlar) bu alanı elle doldurur.
               */
              name: 'version',
              type: 'text',
              label: { tr: 'Sürüm', en: 'Version', ru: 'Версия' },
              admin: {
                description: {
                  tr: 'Yayının sürümü varsa yazın (örn. “2.1” ya da “Gözden geçirilmiş 2. baskı”). Çoğu yayında boş kalır.',
                  en: 'Version of the publication, if it has one. Usually left empty.',
                  ru: 'Версия публикации, если она есть. Обычно остаётся пустой.',
                },
              },
            },
            {
              /**
               * LİSANS — `LICENSE_TYPES` ORTAK LİSTESİ.
               * Liste `document-files` ile aynıdır; iki yerde ayrı bir lisans
               * sözlüğü tutulsaydı "CC BY 4.0" ile "CC-BY 4.0" gibi ayrışmalar
               * kaçınılmaz olurdu.
               *
               * VARSAYILAN YOK. Telif durumu bilinmeyen bir yayına varsayılan
               * atamak — hangi yöne olursa olsun — kurum adına yanlış bir
               * hukuki beyandır. Boş bırakılan alan "belirtilmemiş" demektir
               * ve kartta lisans rozeti basılmaz.
               */
              name: 'license',
              type: 'select',
              options: LICENSE_TYPES,
              label: { tr: 'Lisans / Kullanım Hakkı', en: 'License', ru: 'Лицензия' },
              admin: {
                description: {
                  tr: 'Yayının kullanım koşulu. Emin değilseniz BOŞ BIRAKIN — yanlış lisans beyanı kurumu bağlar.',
                  en: 'Terms of use. Leave empty if unsure — an incorrect licence statement binds the institution.',
                  ru: 'Условия использования. Если не уверены — оставьте пустым.',
                },
              },
            },
            {
              name: 'copyrightHolder',
              type: 'text',
              label: { tr: 'Telif Sahibi', en: 'Copyright holder', ru: 'Правообладатель' },
              admin: {
                description: {
                  tr: 'Telif hakkı sahibi, yayımlayan kurumdan farklıysa yazın (örn. ortak yayınlarda).',
                  en: 'Fill in when the rights holder differs from the issuing institution.',
                  ru: 'Укажите, если правообладатель отличается от издателя.',
                },
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
