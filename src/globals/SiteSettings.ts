import type { GlobalConfig } from 'payload'

import { isAdminFieldLevel, isAdminOrEditor } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

/**
 * GENEL SITE AYARLARI
 *   6.9  Iletisim bilgileri, adres, telefon, e-posta, ulasim haritasi
 *   10.1 Proje bilgi alani (birincil proje secimi)
 *   10.2 Gorunurluk kurallari: logo seti
 *   12.3 Cerez ve analitik bilgilendirmesi
 *   13   Erisilebilirlik bildirimi
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: { tr: 'Genel Site Ayarları', en: 'Site settings', ru: 'Общие настройки' },
  admin: {
    group: { tr: 'Genel Ayarlar', en: 'Site settings', ru: 'Настройки сайта' },
  },
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  versions: { drafts: false, max: 20 },
  hooks: {
    afterChange: [revalidateGlobal('site-settings')],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        // ------------------------------------------------------------------
        {
          label: { tr: 'Kurum Kimliği', en: 'Identity', ru: 'Идентичность' },
          fields: [
            {
              name: 'siteName',
              type: 'text',
              required: true,
              localized: true,
              defaultValue: 'Antalya Uluslararası Ormancılık Eğitim Merkezi',
              label: { tr: 'Site Adı', en: 'Site name', ru: 'Название сайта' },
            },
            {
              name: 'siteShortName',
              type: 'text',
              defaultValue: 'AIFTC',
              label: { tr: 'Kısa Ad', en: 'Short name', ru: 'Краткое название' },
            },
            {
              name: 'tagline',
              type: 'text',
              localized: true,
              label: { tr: 'Slogan', en: 'Tagline', ru: 'Слоган' },
            },
            {
              name: 'defaultDescription',
              type: 'textarea',
              localized: true,
              maxLength: 300,
              label: { tr: 'Varsayılan Açıklama (SEO)', en: 'Default description (SEO)', ru: 'Описание по умолчанию' },
            },
            {
              name: 'logos',
              type: 'group',
              label: { tr: 'Logolar', en: 'Logos', ru: 'Логотипы' },
              admin: {
                description: {
                  tr: 'Şartname 10.2 — FAO, Tarım ve Orman Bakanlığı ve OGM görünürlük kurallarına uygun kullanım zorunludur.',
                  en: 'Spec 10.2 — logo usage must follow FAO/MAF/OGM visibility rules.',
                  ru: 'П. 10.2 — соблюдение правил использования логотипов.',
                },
              },
              fields: [
                { name: 'primary', type: 'upload', relationTo: 'media', label: { tr: 'Ana Logo', en: 'Primary logo', ru: 'Основной логотип' } },
                { name: 'primaryDark', type: 'upload', relationTo: 'media', label: { tr: 'Koyu Zemin Logosu', en: 'Logo on dark', ru: 'Логотип на тёмном' } },
                { name: 'favicon', type: 'upload', relationTo: 'media', label: { tr: 'Favicon', en: 'Favicon', ru: 'Favicon' } },
                { name: 'ogImage', type: 'upload', relationTo: 'media', label: { tr: 'Paylaşım Görseli (1200×630)', en: 'Social share image', ru: 'Изображение для соцсетей' } },
                {
                  name: 'partnerLogos',
                  type: 'array',
                  label: { tr: 'Kurum / Ortak Logoları', en: 'Institutional & partner logos', ru: 'Логотипы партнёров' },
                  fields: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'image', type: 'upload', relationTo: 'media', required: true },
                    { name: 'url', type: 'text' },
                    { name: 'order', type: 'number', defaultValue: 100 },
                  ],
                },
              ],
            },
          ],
        },

        // ------------------------------------------------------------------
        {
          label: { tr: 'İletişim', en: 'Contact', ru: 'Контакты' },
          fields: [
            {
              name: 'contact',
              type: 'group',
              label: false,
              fields: [
                { name: 'organizationName', type: 'text', localized: true, label: { tr: 'Kurum Adı', en: 'Organisation', ru: 'Организация' } },
                { name: 'address', type: 'textarea', localized: true, label: { tr: 'Adres', en: 'Address', ru: 'Адрес' } },
                {
                  type: 'row',
                  fields: [
                    { name: 'phone', type: 'text', label: { tr: 'Telefon', en: 'Phone', ru: 'Телефон' }, admin: { width: '50%' } },
                    { name: 'fax', type: 'text', label: { tr: 'Faks', en: 'Fax', ru: 'Факс' }, admin: { width: '50%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'email', type: 'email', label: { tr: 'E-posta', en: 'E-mail', ru: 'E-mail' }, admin: { width: '50%' } },
                    { name: 'trainingEmail', type: 'email', label: { tr: 'Eğitim Başvuru E-postası', en: 'Training applications e-mail', ru: 'E-mail для заявок' }, admin: { width: '50%' } },
                  ],
                },
                {
                  name: 'map',
                  type: 'group',
                  label: { tr: 'Ulaşım Haritası', en: 'Location map', ru: 'Карта' },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'latitude', type: 'number', admin: { width: '50%', step: 0.000001 } },
                        { name: 'longitude', type: 'number', admin: { width: '50%', step: 0.000001 } },
                      ],
                    },
                    {
                      name: 'directions',
                      type: 'richText',
                      localized: true,
                      label: { tr: 'Ulaşım Tarifi', en: 'How to get here', ru: 'Как добраться' },
                    },
                    {
                      name: 'staticMapImage',
                      type: 'upload',
                      relationTo: 'media',
                      label: { tr: 'Statik Harita Görseli', en: 'Static map image', ru: 'Статичная карта' },
                      admin: {
                        description: {
                          tr: 'Çerez onayı verilmeden önce gömülü harita yerine bu görsel gösterilir (Şartname 12.3).',
                          en: 'Shown instead of the embedded map before cookie consent (spec 12.3).',
                          ru: 'Показывается вместо карты до согласия на cookie.',
                        },
                      },
                    },
                  ],
                },
                {
                  name: 'socialLinks',
                  type: 'array',
                  label: { tr: 'Sosyal Medya', en: 'Social media', ru: 'Социальные сети' },
                  fields: [
                    { name: 'platform', type: 'text', required: true },
                    { name: 'url', type: 'text', required: true },
                  ],
                },
              ],
            },
          ],
        },

        // ------------------------------------------------------------------
        {
          label: { tr: 'Proje Görünürlüğü', en: 'Project visibility', ru: 'Видимость проекта' },
          fields: [
            {
              name: 'primaryProject',
              type: 'relationship',
              relationTo: 'projects',
              label: { tr: 'Ana Proje', en: 'Primary project', ru: 'Основной проект' },
              admin: {
                description: {
                  tr: 'Şartname 10.1 — sayfa altındaki proje görünürlük şeridinde gösterilir.',
                  en: 'Spec 10.1 — displayed in the project visibility strip.',
                  ru: 'П. 10.1 — отображается в полосе видимости проекта.',
                },
              },
            },
            {
              name: 'visibilityStatement',
              type: 'richText',
              localized: true,
              label: { tr: 'Görünürlük Metni', en: 'Visibility statement', ru: 'Текст видимости' },
              admin: {
                description: {
                  tr: 'Örn. bağışçı/iş birliği bilgisi. Her sayfanın altında görünür.',
                  en: 'e.g. donor/cooperation acknowledgement, shown site-wide in the footer.',
                  ru: 'Напр. информация о доноре.',
                },
              },
            },
          ],
        },

        // ------------------------------------------------------------------
        {
          label: { tr: 'Gizlilik ve Çerez', en: 'Privacy & cookies', ru: 'Конфиденциальность' },
          description: {
            tr: 'Şartname 12.2–12.3 (KVKK / GDPR).',
            en: 'Spec 12.2–12.3 (KVKK / GDPR).',
            ru: 'П. 12.2–12.3.',
          },
          fields: [
            {
              name: 'cookieBanner',
              type: 'group',
              label: { tr: 'Çerez Bildirimi', en: 'Cookie notice', ru: 'Уведомление о cookie' },
              fields: [
                { name: 'enabled', type: 'checkbox', defaultValue: true },
                { name: 'text', type: 'textarea', localized: true },
                {
                  name: 'policyPage',
                  type: 'relationship',
                  relationTo: 'pages',
                  label: { tr: 'Çerez Politikası Sayfası', en: 'Cookie policy page', ru: 'Страница политики cookie' },
                },
                {
                  name: 'allowPreferenceManagement',
                  type: 'checkbox',
                  defaultValue: true,
                  label: { tr: 'Çerez tercih yönetimi göster', en: 'Show cookie preference manager', ru: 'Управление настройками cookie' },
                },
              ],
            },
            {
              name: 'privacyNoticePage',
              type: 'relationship',
              relationTo: 'pages',
              label: { tr: 'KVKK Aydınlatma Metni Sayfası', en: 'Privacy notice page', ru: 'Страница уведомления' },
            },
            {
              name: 'accessibilityStatementPage',
              type: 'relationship',
              relationTo: 'pages',
              label: { tr: 'Erişilebilirlik Bildirimi Sayfası', en: 'Accessibility statement page', ru: 'Заявление о доступности' },
              admin: {
                description: {
                  tr: 'Şartname 13 — WCAG 2.2 AA uyum beyanı ve geri bildirim kanalı.',
                  en: 'Spec 13 — WCAG 2.2 AA conformance statement and feedback channel.',
                  ru: 'П. 13 — заявление о соответствии WCAG 2.2 AA.',
                },
              },
            },
            {
              name: 'analytics',
              type: 'group',
              label: { tr: 'Analitik', en: 'Analytics', ru: 'Аналитика' },
              fields: [
                { name: 'enabled', type: 'checkbox', defaultValue: false },
                {
                  name: 'anonymizeIp',
                  type: 'checkbox',
                  defaultValue: true,
                  label: { tr: 'IP adreslerini anonimleştir', en: 'Anonymise IP addresses', ru: 'Анонимизировать IP' },
                  admin: {
                    description: {
                      tr: 'Şartname 12.3 gereği zorunludur. Kapatmayın.',
                      en: 'Required by spec 12.3. Do not disable.',
                      ru: 'Обязательно согласно п. 12.3.',
                    },
                  },
                },
                { name: 'requiresConsent', type: 'checkbox', defaultValue: true },
              ],
            },
          ],
        },

        // ------------------------------------------------------------------
        {
          label: { tr: 'Bakım Modu', en: 'Maintenance', ru: 'Обслуживание' },
          fields: [
            {
              name: 'maintenanceMode',
              type: 'group',
              label: false,
              // Alan seviyesi erisim, koleksiyon seviyesinden AYRI bir imzaya
              // sahiptir (FieldAccess). Koleksiyon yardimcisi burada tip
              // hatasi verir ve calisma aninda yanlis argumanla cagrilir.
              access: { update: isAdminFieldLevel },
              fields: [
                { name: 'enabled', type: 'checkbox', defaultValue: false },
                { name: 'message', type: 'textarea', localized: true },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export default SiteSettings
