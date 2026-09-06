import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

/**
 * DIS SERVISLER — EK-2 KOPRUSU
 * ============================================================================
 * KAPSAM NOTU
 * EK-2 (Dijital Kutuphane / Yonetim Portali) BASKA BIR EKIP tarafindan
 * SUBDOMAIN uzerinde gelistirilmektedir. Web sitesi bu sistemleri BARINDIRMAZ;
 * yalnizca dogru, dile duyarli ve izlenebilir baglantilar uretir.
 *
 * Bu Global, tum yonlendirmelerin TEK KAYNAGIdir. Kodun hicbir yerinde
 * kutuphane/portal adresi sabit yazilmaz. Boylece:
 *   - Subdomain adresi degisirse tek yerden guncellenir,
 *   - Kutuphane henuz yayinda degilse "yakinda" moduna alinir,
 *   - Baglanti tiklamalari sayilabilir (Sartname 17: "Basvuru baglantisi
 *     tiklamalari" ve "En cok goruntulenen kutuphane kayitlari" raporlamasi).
 *
 * FRONTEND KULLANIMI
 *   const svc = await payload.findGlobal({ slug: 'external-services' })
 *   buildLibraryUrl(svc, { path: '/search', locale: 'ru', params: { subject: 'fire' } })
 * ============================================================================
 */
export const ExternalServices: GlobalConfig = {
  slug: 'external-services',
  label: {
    tr: 'Dış Servisler (Kütüphane / Portal)',
    en: 'External services (library / portal)',
    ru: 'Внешние сервисы (библиотека / портал)',
  },
  admin: {
    group: { tr: 'Genel Ayarlar', en: 'Site settings', ru: 'Настройки сайта' },
    description: {
      tr: 'Dijital Kütüphane ve Yönetim Portalı ayrı bir ekip tarafından subdomain üzerinde geliştirilir. Bu sayfadaki adresler sitedeki tüm yönlendirmeleri belirler.',
      en: 'The digital library and management portal run on subdomains built by another team. These settings drive every outbound link on the site.',
      ru: 'Библиотека и портал размещены на поддоменах. Эти настройки определяют все ссылки.',
    },
  },
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  versions: { drafts: false, max: 10 },
  hooks: {
    afterChange: [revalidateGlobal('external-services')],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        // ------------------------------------------------------------------
        // DIJITAL KUTUPHANE (EK-2 / 1)
        // ------------------------------------------------------------------
        {
          label: { tr: 'Dijital Kütüphane', en: 'Digital library', ru: 'Цифровая библиотека' },
          fields: [
            {
              name: 'library',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'status',
                  type: 'select',
                  required: true,
                  defaultValue: 'coming-soon',
                  label: { tr: 'Durum', en: 'Status', ru: 'Статус' },
                  options: [
                    { value: 'live', label: { tr: 'Yayında', en: 'Live', ru: 'Работает' } },
                    { value: 'coming-soon', label: { tr: 'Yakında (bağlantılar pasif)', en: 'Coming soon (links disabled)', ru: 'Скоро (ссылки отключены)' } },
                    { value: 'maintenance', label: { tr: 'Bakımda (uyarı gösterilir)', en: 'Maintenance (notice shown)', ru: 'Обслуживание' } },
                    { value: 'hidden', label: { tr: 'Gizli (menüden kaldır)', en: 'Hidden (removed from menu)', ru: 'Скрыто' } },
                  ],
                  admin: {
                    description: {
                      tr: '“Yakında” seçilirse menüdeki bağlantı tıklanamaz hale gelir ve bilgilendirme metni gösterilir. Site canlıya alınırken kütüphane hazır değilse bu seçeneği kullanın.',
                      en: 'With “Coming soon” the menu item is non-clickable and shows an informational notice.',
                      ru: 'При «Скоро» пункт меню неактивен.',
                    },
                  },
                },
                {
                  name: 'baseUrl',
                  type: 'text',
                  required: true,
                  label: { tr: 'Ana Adres', en: 'Base URL', ru: 'Базовый адрес' },
                  defaultValue: 'https://kutuphane.aiftc.org',
                  validate: (value: unknown) => {
                    if (typeof value !== 'string' || !value) return 'Adres zorunludur.'
                    try {
                      const url = new URL(value)
                      if (url.protocol !== 'https:') return 'Adres https:// ile başlamalıdır (Şartname 12.1).'
                      if (value.endsWith('/')) return 'Adresin sonunda “/” olmamalıdır.'
                      return true
                    } catch {
                      return 'Geçerli bir adres girin (örn. https://kutuphane.aiftc.org).'
                    }
                  },
                  admin: {
                    description: {
                      tr: 'Sonunda “/” olmadan yazın. Örn. https://kutuphane.aiftc.org',
                      en: 'No trailing slash. e.g. https://kutuphane.aiftc.org',
                      ru: 'Без слэша в конце.',
                    },
                  },
                },
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                  localized: true,
                  label: { tr: 'Menüde Görünecek Ad', en: 'Menu label', ru: 'Название в меню' },
                  defaultValue: 'Dijital Kütüphane',
                },
                {
                  name: 'notice',
                  type: 'textarea',
                  localized: true,
                  label: { tr: 'Bilgilendirme Metni', en: 'Notice text', ru: 'Информационный текст' },
                  admin: {
                    condition: (_, siblingData) =>
                      ['coming-soon', 'maintenance'].includes(siblingData?.status),
                  },
                },
                {
                  /**
                   * Dile duyarli derin baglanti sablonu.
                   * Sartname 5: "Dijital kutuphane kayitlarinda dil alani bulunmalidir."
                   * Ziyaretci sitede RU dilindeyse, kutuphaneye de RU filtresiyle gider.
                   */
                  name: 'searchPathTemplate',
                  type: 'text',
                  defaultValue: '/search?lang={locale}',
                  label: { tr: 'Arama Yolu Şablonu', en: 'Search path template', ru: 'Шаблон пути поиска' },
                  admin: {
                    description: {
                      tr: 'Kullanılabilir yer tutucular: {locale}, {query}, {subject}, {trainingCode}. Kütüphane ekibiyle mutabık kalınan biçimi girin.',
                      en: 'Placeholders: {locale}, {query}, {subject}, {trainingCode}. Agree the format with the library team.',
                      ru: 'Плейсхолдеры: {locale}, {query}, {subject}, {trainingCode}.',
                    },
                  },
                },
                {
                  name: 'subjectPathTemplate',
                  type: 'text',
                  defaultValue: '/search?subject={subject}&lang={locale}',
                  label: { tr: 'Konu Filtresi Şablonu', en: 'Subject filter template', ru: 'Шаблон фильтра по теме' },
                },
                {
                  name: 'trainingMaterialsPathTemplate',
                  type: 'text',
                  defaultValue: '/collections/{trainingCode}?lang={locale}',
                  label: {
                    tr: 'Eğitim Materyalleri Şablonu',
                    en: 'Training materials template',
                    ru: 'Шаблон учебных материалов',
                  },
                },
                {
                  name: 'openInNewTab',
                  type: 'checkbox',
                  defaultValue: true,
                  label: { tr: 'Yeni sekmede aç', en: 'Open in a new tab', ru: 'Открывать в новой вкладке' },
                  admin: {
                    description: {
                      tr: 'Açıkken bağlantılara rel="noopener noreferrer" ve ekran okuyucu uyarısı eklenir (WCAG 2.2).',
                      en: 'Adds rel="noopener noreferrer" and a screen-reader hint (WCAG 2.2).',
                      ru: 'Добавляет rel="noopener noreferrer".',
                    },
                  },
                },
                {
                  name: 'trackClicks',
                  type: 'checkbox',
                  defaultValue: true,
                  label: { tr: 'Tıklamaları say', en: 'Count clicks', ru: 'Считать клики' },
                  admin: {
                    description: {
                      tr: 'Şartname 17 raporlaması için anonim tıklama sayacı. Kişisel veri toplanmaz.',
                      en: 'Anonymous click counter for the reporting in spec 17. No personal data.',
                      ru: 'Анонимный счётчик кликов.',
                    },
                  },
                },
                {
                  name: 'featuredCollections',
dbName: 'feat_cols',
                  type: 'array',
                  label: {
                    tr: 'Ana Sayfada Öne Çıkan Koleksiyonlar',
                    en: 'Featured collections on the homepage',
                    ru: 'Избранные коллекции на главной',
                  },
                  maxRows: 6,
                  admin: {
                    description: {
                      tr: 'Şartname 6.1 — “Dijital kütüphaneye hızlı erişim”. Kütüphanedeki koleksiyonlara doğrudan kısayol.',
                      en: 'Spec 6.1 — quick access to the digital library.',
                      ru: 'П. 6.1 — быстрый доступ к библиотеке.',
                    },
                  },
                  fields: [
                    { name: 'title', type: 'text', required: true, localized: true },
                    { name: 'description', type: 'textarea', localized: true },
                    { name: 'path', type: 'text', required: true, admin: { description: { tr: 'Örn. /collections/fire-management', en: 'e.g. /collections/fire-management', ru: 'Напр. /collections/fire-management' } } },
                    { name: 'icon', type: 'upload', relationTo: 'media' },
                  ],
                },
              ],
            },
          ],
        },

        // ------------------------------------------------------------------
        // YONETIM PORTALI (EK-2)
        // ------------------------------------------------------------------
        {
          label: { tr: 'Yönetim Portalı', en: 'Management portal', ru: 'Портал управления' },
          fields: [
            {
              name: 'portal',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'status',
                  type: 'select',
                  required: true,
                  defaultValue: 'coming-soon',
                  label: { tr: 'Durum', en: 'Status', ru: 'Статус' },
                  options: [
                    { value: 'live', label: { tr: 'Yayında', en: 'Live', ru: 'Работает' } },
                    { value: 'coming-soon', label: { tr: 'Yakında', en: 'Coming soon', ru: 'Скоро' } },
                    { value: 'maintenance', label: { tr: 'Bakımda', en: 'Maintenance', ru: 'Обслуживание' } },
                    { value: 'hidden', label: { tr: 'Gizli', en: 'Hidden', ru: 'Скрыто' } },
                  ],
                },
                {
                  name: 'baseUrl',
                  type: 'text',
                  required: true,
                  defaultValue: 'https://portal.aiftc.org',
                  label: { tr: 'Ana Adres', en: 'Base URL', ru: 'Базовый адрес' },
                },
                {
                  name: 'loginPath',
                  type: 'text',
                  defaultValue: '/login',
                  label: { tr: 'Giriş Yolu', en: 'Login path', ru: 'Путь входа' },
                  admin: {
                    description: {
                      tr: 'Üst menüdeki “Personel Girişi” bağlantısı bu yola gider. Kimlik doğrulama tamamen portalda yapılır; web sitesi hiçbir kimlik bilgisi tutmaz veya iletmez.',
                      en: 'The “Staff login” link points here. Authentication happens entirely on the portal.',
                      ru: 'Ссылка «Вход для сотрудников». Аутентификация — только на портале.',
                    },
                  },
                },
                {
                  name: 'applicationPath',
                  type: 'text',
                  defaultValue: '/basvuru',
                  label: { tr: 'Başvuru Yolu', en: 'Application path', ru: 'Путь заявки' },
                },
                {
                  name: 'certificateVerifyPath',
                  type: 'text',
                  defaultValue: '/dogrulama',
                  label: { tr: 'Sertifika Doğrulama Yolu', en: 'Certificate verification path', ru: 'Путь проверки сертификата' },
                  admin: {
                    description: {
                      tr: 'Şartname 7.3. QR kod ve belge numarası ile doğrulama portal tarafında yapılır; web sitesi yalnızca yönlendirir.',
                      en: 'Spec 7.3. QR/number verification runs on the portal; the site only redirects.',
                      ru: 'П. 7.3. Проверка выполняется на портале.',
                    },
                  },
                },
                {
                  name: 'showStaffLoginInHeader',
                  type: 'checkbox',
                  defaultValue: true,
                  label: { tr: 'Üst menüde “Personel Girişi” göster', en: 'Show “Staff login” in the header', ru: 'Показывать «Вход для сотрудников»' },
                },
              ],
            },
          ],
        },

        // ------------------------------------------------------------------
        // DIGER DIS SISTEMLER
        // ------------------------------------------------------------------
        {
          label: { tr: 'Diğer Sistemler', en: 'Other systems', ru: 'Другие системы' },
          fields: [
            {
              name: 'virtualClassroom',
              type: 'group',
              label: { tr: 'Sanal Sınıf', en: 'Virtual classroom', ru: 'Виртуальный класс' },
              admin: {
                description: {
                  tr: 'Şartname EK-2 Genel Hükümler — kurumsal ağda çalışan sanal sınıf modülü. EK-1 kapsamında yalnızca yönlendirme yapılır.',
                  en: 'Spec EK-2 general provisions. EK-1 only links to it.',
                  ru: 'EK-1 только ссылается на модуль.',
                },
              },
              fields: [
                { name: 'enabled', type: 'checkbox', defaultValue: false, label: { tr: 'Etkin', en: 'Enabled', ru: 'Включено' } },
                { name: 'baseUrl', type: 'text', admin: { condition: (_, s) => Boolean(s?.enabled) } },
                { name: 'label', type: 'text', localized: true, admin: { condition: (_, s) => Boolean(s?.enabled) } },
              ],
            },
            {
              name: 'ogm',
              type: 'group',
              label: { tr: 'OGM Kurumsal Site', en: 'OGM corporate site', ru: 'Корпоративный сайт OGM' },
              fields: [
                { name: 'url', type: 'text', defaultValue: 'https://www.ogm.gov.tr', label: { tr: 'Adres', en: 'URL', ru: 'Адрес' } },
                { name: 'legacyPageUrl', type: 'text', defaultValue: 'https://www.ogm.gov.tr/sfm', label: { tr: 'Eski Sayfa', en: 'Legacy page', ru: 'Старая страница' } },
              ],
            },
            {
              name: 'additional',
              type: 'array',
              label: { tr: 'Ek Bağlantılar', en: 'Additional links', ru: 'Дополнительные ссылки' },
              fields: [
                { name: 'key', type: 'text', required: true, admin: { description: { tr: 'Kod içinde kullanılacak anahtar (örn. fao-project)', en: 'Key used in code', ru: 'Ключ для кода' } } },
                { name: 'label', type: 'text', required: true, localized: true },
                { name: 'url', type: 'text', required: true },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export default ExternalServices
