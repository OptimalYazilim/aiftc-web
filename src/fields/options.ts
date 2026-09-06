/**
 * Payload `select` alanlarinda kullanilan secenek tipi.
 * `label` bir Record ise Payload admin arayuz diline gore gosterir.
 */
export type SelectOption = {
  value: string
  label: string | Record<string, string>
}

type Option = SelectOption

/**
 * Sartname 21: "ISO ulke ve dil kodlari tercih edilmelidir."
 * Bu dosya, birden fazla koleksiyonda paylasilan secenek listelerini tutar.
 * Tek yerden guncellenir; sema tutarliligi bozulmaz.
 */

/** Sartname 4 + Proje Bilgileri: odak ulkeler (ISO 3166-1 alpha-2). */
export const FOCUS_COUNTRIES: Option[] = [
  { value: 'TR', label: { tr: 'Türkiye', en: 'Türkiye', ru: 'Турция' } },
  { value: 'AZ', label: { tr: 'Azerbaycan', en: 'Azerbaijan', ru: 'Азербайджан' } },
  { value: 'KZ', label: { tr: 'Kazakistan', en: 'Kazakhstan', ru: 'Казахстан' } },
  { value: 'KG', label: { tr: 'Kırgızistan', en: 'Kyrgyzstan', ru: 'Кыргызстан' } },
  { value: 'TJ', label: { tr: 'Tacikistan', en: 'Tajikistan', ru: 'Таджикистан' } },
  { value: 'TM', label: { tr: 'Türkmenistan', en: 'Turkmenistan', ru: 'Туркменистан' } },
  { value: 'UZ', label: { tr: 'Özbekistan', en: 'Uzbekistan', ru: 'Узбекистан' } },
  { value: 'OTHER', label: { tr: 'Diğer', en: 'Other', ru: 'Другое' } },
]

/** Egitim dili (ISO 639-1). Site dillerinden bagimsizdir. */
export const INSTRUCTION_LANGUAGES: Option[] = [
  { value: 'tr', label: { tr: 'Türkçe', en: 'Turkish', ru: 'Турецкий' } },
  { value: 'en', label: { tr: 'İngilizce', en: 'English', ru: 'Английский' } },
  { value: 'ru', label: { tr: 'Rusça', en: 'Russian', ru: 'Русский' } },
]

/** Sartname EK-2 2.2: egitim durumu kategorileri. */
export const TRAINING_STATUSES: Option[] = [
  { value: 'planned', label: { tr: 'Planlanıyor', en: 'Planned', ru: 'Планируется' } },
  {
    value: 'applications-open',
    label: { tr: 'Başvuruya açık', en: 'Applications open', ru: 'Приём заявок открыт' },
  },
  {
    value: 'applications-closed',
    label: { tr: 'Başvuru kapandı', en: 'Applications closed', ru: 'Приём заявок закрыт' },
  },
  { value: 'ongoing', label: { tr: 'Devam ediyor', en: 'Ongoing', ru: 'Проводится' } },
  { value: 'completed', label: { tr: 'Tamamlandı', en: 'Completed', ru: 'Завершено' } },
  { value: 'postponed', label: { tr: 'Ertelendi', en: 'Postponed', ru: 'Перенесено' } },
  { value: 'cancelled', label: { tr: 'İptal edildi', en: 'Cancelled', ru: 'Отменено' } },
]

/** Sartname 7.1: belge turleri. */
export const CERTIFICATE_TYPES: Option[] = [
  {
    value: 'certificate',
    label: {
      tr: 'Sertifika (ulusal/uluslararası geçerli)',
      en: 'Certificate (national/international)',
      ru: 'Сертификат',
    },
  },
  {
    value: 'attendance',
    label: { tr: 'Katılım belgesi', en: 'Certificate of attendance', ru: 'Свидетельство об участии' },
  },
  {
    value: 'achievement',
    label: { tr: 'Başarı belgesi', en: 'Certificate of achievement', ru: 'Свидетельство о достижении' },
  },
  {
    value: 'tot',
    label: { tr: 'Eğitici eğitimi sertifikası', en: 'Training of Trainers certificate', ru: 'Сертификат ToT' },
  },
  {
    value: 'project-specific',
    label: {
      tr: 'Proje kapsamında düzenlenen özel belge',
      en: 'Project-specific document',
      ru: 'Специальный документ проекта',
    },
  },
  { value: 'none', label: { tr: 'Belge verilmiyor', en: 'No document', ru: 'Не выдаётся' } },
]

/** Sartname 6.4 / EK-2 2.3: egitim teslim bicimi. */
export const DELIVERY_MODES: Option[] = [
  { value: 'in-person', label: { tr: 'Yüz yüze', en: 'In person', ru: 'Очно' } },
  { value: 'online', label: { tr: 'Çevrim içi', en: 'Online', ru: 'Онлайн' } },
  { value: 'hybrid', label: { tr: 'Karma (hibrit)', en: 'Hybrid', ru: 'Смешанный' } },
]

/**
 * EGITIM KONUSU — ANA KATEGORILER  (Sartname EK-2 / dijital kutuphane sozlugu)
 * ============================================================================
 * Liste ONCE `collections/TrainingTopics.ts` icinde satir arasi duruyordu.
 * Buraya alindi cunku artik IKI yerden okunuyor: koleksiyonun `category`
 * secim alani ve /egitim-konulari sayfalari (kategori etiketini `optionLabel`
 * ile basiyorlar). Iki kopya tutulsaydi biri guncellenip oteki
 * unutuldugunda site, panelde secilen kategoriyi HAM ANAHTAR olarak
 * ("forest-pests") gosterirdi.
 *
 * DEGERLER DEGISMEDI — yalnizca tasindi. Anahtarlar da siralama da aynidir,
 * dolayisiyla veritabaninda hicbir karsiligi degismez. Bunlar EK-2 dijital
 * kutuphanesiyle ORTAK sozluktur; degistirmeden once kutuphane ekibiyle
 * koordine olun (koleksiyondaki alan aciklamasi da bunu soyluyor).
 *
 * `components/training/TopicIcon` bu anahtarlardan yalnizca bir kismi icin
 * ozel simge tasir; kalani notr kitap simgesine duser — liste buyudugunde
 * simge eklemek ZORUNLU DEGILDIR.
 */
export const TRAINING_TOPIC_CATEGORIES: Option[] = [
  { value: 'forest-fires', label: { tr: 'Orman yangınları', en: 'Forest fires', ru: 'Лесные пожары' } },
  {
    value: 'integrated-fire-management',
    label: { tr: 'Entegre yangın yönetimi', en: 'Integrated fire management', ru: 'Интегрированное управление пожарами' },
  },
  { value: 'sfm', label: { tr: 'Sürdürülebilir orman yönetimi', en: 'Sustainable forest management', ru: 'Устойчивое лесоуправление' } },
  { value: 'flr', label: { tr: 'Orman peyzaj restorasyonu', en: 'Forest landscape restoration', ru: 'Восстановление лесных ландшафтов' } },
  { value: 'land-degradation', label: { tr: 'Arazi bozulumuyla mücadele', en: 'Combating land degradation', ru: 'Борьба с деградацией земель' } },
  { value: 'climate-change', label: { tr: 'İklim değişikliği', en: 'Climate change', ru: 'Изменение климата' } },
  { value: 'nursery-afforestation', label: { tr: 'Fidanlık ve ağaçlandırma', en: 'Nursery & afforestation', ru: 'Питомники и облесение' } },
  { value: 'silviculture', label: { tr: 'Silvikültür', en: 'Silviculture', ru: 'Лесоводство' } },
  { value: 'protected-areas', label: { tr: 'Korunan alan yönetimi', en: 'Protected area management', ru: 'Управление ООПТ' } },
  { value: 'nature-conservation', label: { tr: 'Doğa koruma', en: 'Nature conservation', ru: 'Охрана природы' } },
  { value: 'gis-rs', label: { tr: 'CBS ve uzaktan algılama', en: 'GIS & remote sensing', ru: 'ГИС и ДЗЗ' } },
  { value: 'forest-pests', label: { tr: 'Orman zararlıları ve hastalıkları', en: 'Forest pests & diseases', ru: 'Вредители и болезни леса' } },
  { value: 'nwfp', label: { tr: 'Odun dışı orman ürünleri', en: 'Non-wood forest products', ru: 'Недревесная продукция леса' } },
  { value: 'forest-livelihoods', label: { tr: 'Orman temelli geçim kaynakları', en: 'Forest-based livelihoods', ru: 'Лесные средства к существованию' } },
  { value: 'gender', label: { tr: 'Toplumsal cinsiyet ve ormancılık', en: 'Gender & forestry', ru: 'Гендер и лесное хозяйство' } },
  { value: 'capacity-development', label: { tr: 'Kurumsal kapasite geliştirme', en: 'Institutional capacity development', ru: 'Развитие институционального потенциала' } },
]

/** Sartname 6.3 / EK-2 1.3: egitim duzeyi. */
export const TRAINING_LEVELS: Option[] = [
  { value: 'basic', label: { tr: 'Temel', en: 'Basic', ru: 'Базовый' } },
  { value: 'intermediate', label: { tr: 'Orta', en: 'Intermediate', ru: 'Средний' } },
  { value: 'advanced', label: { tr: 'İleri', en: 'Advanced', ru: 'Продвинутый' } },
  { value: 'tot', label: { tr: 'Eğitici eğitimi', en: 'Training of Trainers', ru: 'Подготовка тренеров' } },
]

/** Sartname 6.7: haber/duyuru icerik turleri. */
export const NEWS_CATEGORIES: Option[] = [
  { value: 'training', label: { tr: 'Eğitim haberi', en: 'Training news', ru: 'Новости обучения' } },
  { value: 'project', label: { tr: 'Proje haberi', en: 'Project news', ru: 'Новости проекта' } },
  {
    value: 'cooperation',
    label: { tr: 'Uluslararası iş birliği', en: 'International cooperation', ru: 'Международное сотрудничество' },
  },
  {
    value: 'technical-visit',
    label: { tr: 'Teknik ziyaret', en: 'Technical visit', ru: 'Технический визит' },
  },
  {
    value: 'workshop',
    label: { tr: 'Çalıştay ve toplantı duyurusu', en: 'Workshop & meeting', ru: 'Семинар и встреча' },
  },
  {
    value: 'training-result',
    label: { tr: 'Eğitim sonuç haberi', en: 'Training results', ru: 'Итоги обучения' },
  },
  {
    value: 'publication',
    label: { tr: 'Yayın ve kaynak duyurusu', en: 'Publication & resource', ru: 'Публикации и ресурсы' },
  },
  { value: 'announcement', label: { tr: 'Genel duyuru', en: 'Announcement', ru: 'Объявление' } },
]

/**
 * Sartname EK-2 1.7: erisim seviyeleri.
 * EK-1 tarafinda yalnizca "dosya erisim seviyesi" (11.3) icin kullanilir;
 * gercek yetki kontrolu EK-2 portalindadir.
 */
export const ACCESS_LEVELS: Option[] = [
  { value: 'public', label: { tr: 'Herkese açık', en: 'Public', ru: 'Открытый доступ' } },
  {
    value: 'staff',
    label: { tr: 'OGM/UOEM personeli', en: 'OGM/AIFTC staff', ru: 'Персонал OGM/AIFTC' },
  },
  {
    value: 'participants',
    label: { tr: 'Eğitim katılımcıları', en: 'Training participants', ru: 'Участники обучения' },
  },
  { value: 'trainers', label: { tr: 'Eğitmenler', en: 'Trainers', ru: 'Тренеры' } },
  { value: 'internal', label: { tr: 'Kurum içi', en: 'Internal', ru: 'Внутренний' } },
]

/** Sartname 21: Creative Commons lisans yaklasimlari. */
export const LICENSE_TYPES: Option[] = [
  { value: 'cc-by', label: 'CC BY 4.0' },
  { value: 'cc-by-sa', label: 'CC BY-SA 4.0' },
  { value: 'cc-by-nc', label: 'CC BY-NC 4.0' },
  { value: 'cc-by-nc-nd', label: 'CC BY-NC-ND 4.0' },
  { value: 'cc0', label: 'CC0 1.0' },
  {
    value: 'institutional',
    label: { tr: 'Kurumsal kullanım', en: 'Institutional use', ru: 'Институциональное использование' },
  },
  { value: 'all-rights-reserved', label: { tr: 'Tüm hakları saklı', en: 'All rights reserved', ru: 'Все права защищены' } },
]

/**
 * DIJITAL KUTUPHANE — DOKUMAN TURLERI
 * ============================================================================
 * Kutuphane sayfasindaki filtre cubugu bu listeden uretilir; siralama
 * FILTRE SIRASIDIR.
 *
 * ETIKETLER YALNIZCA BURADADIR. Bu dosyadaki her listede oldugu gibi hem
 * Payload paneli hem de site yuzu ayni `label` nesnesini okur; site tarafinda
 * `fields/options.ts → optionLabel(liste, deger, locale)` cagrilir. Bir zamanlar
 * bu blok "messages/*.json icine `library.types.*` anahtarlari da eklenmelidir"
 * diyordu; oyle bir anahtar hicbir dil dosyasinda YOKTU ve olsaydi da
 * okunmayacakti. Yeni bir tur eklerken tek yapilacak sey asagiya bir satir
 * yazmaktir.
 *
 * Liste kasitli olarak KISA tutuldu. Kutuphane bir arsiv degil, secilmis
 * kaynak koleksiyonudur; on tur ustunde bir filtre cubugu taranamaz hale
 * gelir.
 */
export const LIBRARY_RESOURCE_TYPES: Option[] = [
  { value: 'report', label: { tr: 'Rapor', en: 'Report', ru: 'Отчёт' } },
  {
    value: 'technical-guide',
    label: { tr: 'Teknik Rehber', en: 'Technical guide', ru: 'Техническое руководство' },
  },
  {
    value: 'workshop-presentation',
    label: { tr: 'Çalıştay Sunumu', en: 'Workshop presentation', ru: 'Презентация семинара' },
  },
  {
    value: 'yearbook-statistics',
    label: { tr: 'Yıllık / İstatistik', en: 'Yearbook / statistics', ru: 'Ежегодник / статистика' },
  },
  // Belge olmayan turler: bunlarda `file` degil `videoFile` / `gallery`
  // alanlari doldurulur (bkz. collections/LibraryResources.ts).
  { value: 'video', label: { tr: 'Video Kaydı', en: 'Video recording', ru: 'Видеозапись' } },
  {
    value: 'photo-album',
    label: { tr: 'Fotoğraf Albümü', en: 'Photo album', ru: 'Фотоальбом' },
  },
]

/**
 * Dosya YERINE gomulu/galeri icerigi tasiyan turler.
 * Hem panelde alan gorunurlugu (`admin.condition`) hem de karttaki aksiyon
 * butonu bu kumeye gore secilir; iki yerde ayri liste tutulmaz.
 */
export const LIBRARY_VIDEO_TYPE = 'video'
export const LIBRARY_ALBUM_TYPE = 'photo-album'

/**
 * KUTUPHANE — DOSYA BICIMI  (Sartname EK-2 Madde 1.2 "dosya turu")
 * ============================================================================
 * "Dosya turu" katalog kaydinda IKI ayri sey olabilir:
 *
 *   TUR (genre)   → rapor mu, rehber mi, video mu   → `resourceType`
 *   BICIM (format) → PDF mi, DOCX mi, MP4 mi        → BU LISTE
 *
 * Ikisi karistirilmamalidir. `resourceType` filtre cubugunu uretir; bicim ise
 * karttaki "PDF · 4,2 MB" rozetinde gorunur.
 *
 * ONEMLI: Yuklu bir dosya varsa bicim ELLE GIRILMEZ — kart onu dosyanin
 * `mimeType` alanindan okur (components/library/LibraryResourceCard.tsx,
 * FORMAT_BY_MIME). Bu liste yalnizca dosyanin OLMADIGI durum icindir:
 * kayit `externalUrl` ile baska bir kurumun sitesine isaret ediyorsa
 * ziyaretcinin tiklamadan once neyle karsilasacagini bilmesi gerekir.
 *
 * Degerler MIME degil UZANTI/BICIM adidir; kullanicinin gordugu sey budur.
 */
export const LIBRARY_FILE_FORMATS: Option[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: { tr: 'Word (DOCX)', en: 'Word (DOCX)', ru: 'Word (DOCX)' } },
  { value: 'xlsx', label: { tr: 'Excel (XLSX)', en: 'Excel (XLSX)', ru: 'Excel (XLSX)' } },
  { value: 'pptx', label: { tr: 'PowerPoint (PPTX)', en: 'PowerPoint (PPTX)', ru: 'PowerPoint (PPTX)' } },
  { value: 'epub', label: 'EPUB' },
  { value: 'mp4', label: { tr: 'Video (MP4)', en: 'Video (MP4)', ru: 'Видео (MP4)' } },
  { value: 'mp3', label: { tr: 'Ses (MP3)', en: 'Audio (MP3)', ru: 'Аудио (MP3)' } },
  { value: 'zip', label: { tr: 'Arşiv (ZIP)', en: 'Archive (ZIP)', ru: 'Архив (ZIP)' } },
  { value: 'html', label: { tr: 'Web sayfası', en: 'Web page', ru: 'Веб-страница' } },
  { value: 'other', label: { tr: 'Diğer', en: 'Other', ru: 'Другое' } },
]

// ===========================================================================
// SANAL SINIF  (Sartname — Entegre Canli Egitim ve Sanal Sinif)
// ===========================================================================

/**
 * Canli ders platformu. Kurum hangi altyapiyi kurarsa onu secer; kod
 * platforma gore ADRES URETMEZ, yalnizca panelde girilen adresi kullanir.
 * Boylece yeni bir platform eklemek kod degisikligi gerektirmez.
 */
export const CLASSROOM_PLATFORMS: Option[] = [
  { value: 'jitsi', label: { tr: 'Jitsi Meet', en: 'Jitsi Meet', ru: 'Jitsi Meet' } },
  { value: 'bigbluebutton', label: { tr: 'BigBlueButton', en: 'BigBlueButton', ru: 'BigBlueButton' } },
  { value: 'zoom', label: { tr: 'Zoom', en: 'Zoom', ru: 'Zoom' } },
  { value: 'teams', label: { tr: 'Microsoft Teams', en: 'Microsoft Teams', ru: 'Microsoft Teams' } },
  { value: 'other', label: { tr: 'Diğer', en: 'Other', ru: 'Другое' } },
]

/** Oda durumu. Sartname: "Aktif / Kapali". */
export const CLASSROOM_STATUSES: Option[] = [
  { value: 'active', label: { tr: 'Aktif', en: 'Active', ru: 'Активна' } },
  { value: 'closed', label: { tr: 'Kapalı', en: 'Closed', ru: 'Закрыта' } },
]

// ===========================================================================
// FORM GONDERIMLERI  (Sartname 6.9 iletisim + 6.4 basvuru surecleri)
// ===========================================================================

/**
 * Talep turu. Tek bir gelen kutusunda iki akis ayrilir:
 *   contact              -> genel iletisim/bilgi talebi
 *   training-application -> belirli bir egitime basvuru/ilgi bildirimi
 * Ayrim SECIM alaniyla yapilir, serbest metinle degil: panelde suzulebilsin.
 */
export const SUBMISSION_TYPES: Option[] = [
  { value: 'contact', label: { tr: 'İletişim', en: 'Contact', ru: 'Обращение' } },
  {
    value: 'training-application',
    label: { tr: 'Eğitim Başvurusu', en: 'Training application', ru: 'Заявка на обучение' },
  },
]

/** Islem durumu. Sartname: "Okundu / Bekliyor". */
export const SUBMISSION_STATUSES: Option[] = [
  { value: 'pending', label: { tr: 'Bekliyor', en: 'Pending', ru: 'Ожидает' } },
  { value: 'read', label: { tr: 'Okundu', en: 'Read', ru: 'Прочитано' } },
]

// ===========================================================================
// ERISIM SEVIYELERI  (Sartname 1.7 — Erisim Seviyeleri)
// ===========================================================================

/**
 * HEDEF KITLE ROLU — `Users.role`
 *
 * DIKKAT: bu alan `Users.roles` (COGUL) ile AYNI SEY DEGILDIR.
 *
 *   roles  (cogul)  admin / editor / author / viewer
 *                   PANELDE NE YAPABILIR: icerik olusturma, yayimlama, silme.
 *
 *   role   (tekil)  admin / staff / instructor / trainee
 *                   SITEDE NE GOREBILIR: kutuphane kayitlarinin erisim
 *                   seviyesiyle eslesir.
 *
 * Iki eksen dikeydir: bir egitmen (instructor) panelde hicbir yetkiye sahip
 * olmayabilir; bir editor de egitim katilimcisi olmayabilir.
 */
export const AUDIENCE_ROLES: Option[] = [
  { value: 'admin', label: { tr: 'Sistem Yöneticisi', en: 'System administrator', ru: 'Системный администратор' } },
  { value: 'staff', label: { tr: 'OGM / UOEM Personeli', en: 'OGM / AIFTC staff', ru: 'Персонал OGM / AIFTC' } },
  { value: 'instructor', label: { tr: 'Eğitmen', en: 'Instructor', ru: 'Преподаватель' } },
  { value: 'trainee', label: { tr: 'Eğitim Katılımcısı', en: 'Trainee', ru: 'Участник обучения' } },
]

/**
 * KUTUPHANE KAYDININ ERISIM SEVIYESI — `LibraryResources.accessLevel`
 *
 * Degerler `AUDIENCE_ROLES` ile BIREBIR eslesir (admin haric: yonetici bir
 * "seviye" degildir, her seviyeyi gorur). Eslesme kasitlidir — erisim kontrolu
 * `VISIBILITY_TO_ROLE` haritasi uzerinden yapilir (asagida). Harita TEK
 * YERDEDIR; eksik kalirsa o seviyedeki kayitlari kimse goremez, yani hata
 * guvenli tarafa duser.
 *
 * NOT — `ACCESS_LEVELS` (yukarida) ESKI ve ZORLANMAYAN bir listedir; yalnizca
 * `DocumentFiles` uzerinde etiket olarak durur, hicbir erisim kurali ona
 * bakmaz. Karistirmayin. Gecis icin bkz. docs/access-control-guide.md
 */
export const LIBRARY_ACCESS_LEVELS: Option[] = [
  { value: 'public', label: { tr: 'Herkese Açık', en: 'Public', ru: 'Открытый доступ' } },
  { value: 'staff', label: { tr: 'Yalnızca OGM / UOEM Personeli', en: 'Staff only', ru: 'Только персонал' } },
  { value: 'instructor', label: { tr: 'Yalnızca Eğitmenler', en: 'Instructors only', ru: 'Только преподаватели' } },
  { value: 'trainee', label: { tr: 'Yalnızca Eğitim Katılımcıları', en: 'Trainees only', ru: 'Только участники' } },
]

/**
 * ERISIM SEVIYESI -> HEDEF KITLE ROLU eslestirmesi.
 *
 * Onceki surumde iki liste BIREBIR AYNI degerleri tasiyordu ve eslestirme
 * ortulukdu (`doc.accessLevel === user.role`). Adlandirma ayrildigi icin
 * (`staff_only` vs `staff`) eslestirme artik ACIK ve TEK YERDE tutulur.
 * Yeni bir gorunurluk eklenirse buraya da satir eklenmelidir; eklenmezse o
 * seviyedeki kayitlari kimse goremez (guvenli tarafa duser).
 */
export const ACCESS_LEVEL_TO_ROLE: Record<string, string> = {
  staff: 'staff',
  instructor: 'instructor',
  trainee: 'trainee',
}

/**
 * ICERIK YONETIM IS AKISI  (Sartname 1.6)
 *
 * Bu alan Payload'in `_status` (draft/published) alaninin YERINE GECMEZ;
 * onun YANINDA calisir. Fark:
 *   _status       teknik yayin durumu — sitede gorunur mu?
 *   reviewStatus  EDITORYAL surec — kim baktı, onaylandi mi?
 * Bir kayit `approved` olup henuz yayimlanmamis olabilir.
 */
export const REVIEW_STATUSES: Option[] = [
  { value: 'draft', label: { tr: 'Taslak', en: 'Draft', ru: 'Черновик' } },
  { value: 'in_review', label: { tr: 'Editör Kontrolünde', en: 'In review', ru: 'На проверке' } },
  { value: 'approved', label: { tr: 'Onaylandı', en: 'Approved', ru: 'Одобрено' } },
  { value: 'published', label: { tr: 'Yayında', en: 'Published', ru: 'Опубликовано' } },
]
