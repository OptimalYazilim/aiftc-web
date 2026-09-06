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

/** Sartname 6.3 / EK-2 1.3: eğitim düzeyi. */
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
 * FILTRE SIRASIDIR. Yeni bir tur eklendiginde messages/*.json icindeki
 * `library.types.*` anahtarlari da eklenmelidir — etiketler burada Payload
 * admin arayuzu icin, sitede ise ceviri sozlugunden okunur.
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
