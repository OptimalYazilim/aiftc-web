import type { Field } from 'payload'

/**
 * DAİRE KISITI ALANLARI — kütüphane kaydı ve belge dosyası AYNI alanları taşır
 * ============================================================================
 * Kurum kararı (29.09.2026): eğitim içeriklerine personel dairesine göre
 * erişir. Kısıt yalnızca kayıt üstünde olsaydı, kaydın bağladığı dosya kendi
 * seviyesiyle korunmaya devam eder ve başka dairedeki biri dosyayı doğrudan
 * adresinden indirebilirdi. Bu yüzden iki koleksiyon da bu alanları taşır ve
 * iki okuma kuralı da aynı koşulu kullanır (access/index.ts → daireKosulu).
 *
 * NEDEN AÇIK BİR ANAHTAR, "BOŞ LİSTE = HERKES" DEĞİL
 *   - Editörün niyeti görünür olur: listeyi boşaltan bir editör içeriği
 *     farkında olmadan bütün dairelere açmaz; anahtar kapalı olmadıkça kısıt
 *     sürer.
 *   - Anahtar açık ama liste boşsa içerik HİÇBİR daireye açılmaz (kapalı
 *     tarafa düşer) — panel rolleri yine görür.
 *
 * Herkese açık seviyede anlamsızdır; alanlar yalnızca seviye "public"
 * değilken görünür ve kural da yalnızca seviyeli dalda uygulanır.
 * ============================================================================
 */
export const daireKisitiAlanlari = (): Field[] => [
  {
    name: 'restrictToDepartments',
    type: 'checkbox',
    defaultValue: false,
    label: {
      tr: 'Yalnızca seçili dairelere göster',
      en: 'Show only to selected departments',
      ru: 'Показывать только выбранным департаментам',
    },
    admin: {
      position: 'sidebar',
      condition: (data) => data?.accessLevel && data.accessLevel !== 'public',
      description: {
        tr: 'İşaretliyse, erişim seviyesi uyan kişilerden yalnızca dairesi aşağıdaki listede olanlar görür. Liste boşsa hiçbir daire göremez.',
        en: 'If ticked, only people whose department is listed below can see it (on top of the access level).',
        ru: 'Если отмечено, доступ только у сотрудников перечисленных департаментов.',
      },
    },
  },
  {
    name: 'departments',
    type: 'relationship',
    relationTo: 'departments',
    hasMany: true,
    label: { tr: 'Yetkili Daireler', en: 'Allowed departments', ru: 'Разрешённые департаменты' },
    admin: {
      position: 'sidebar',
      condition: (data) =>
        Boolean(data?.restrictToDepartments) && data?.accessLevel && data.accessLevel !== 'public',
    },
  },
]
