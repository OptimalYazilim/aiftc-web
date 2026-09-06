import type { Field, GlobalConfig } from 'payload'

import { isAdminOrEditor } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

/**
 * MENU YONETIMI  (Sartname EK-1 / 3.4, 5, 11.2, 13)
 *
 *  - "Ana menu ve alt menu yapisi" bir teslimattir (3.4).
 *  - "Menu yapisi diller arasinda tutarli olmalidir" (5).
 *    -> Bu nedenle MENU AGACI DILE BAGLI DEGILDIR: ayni ogeler, ayni sirada,
 *       her dilde gorunur. Yalnizca ETIKET (`label`) localized'dir.
 *       Boylece bir editor RU menusune yanlislikla fazladan oge ekleyemez.
 *  - "Basit ve anlasilir menu yapisi" (13) -> iki seviye ile sinirlandirildi.
 */

/**
 * Bir menu ogesinin hedefini belirleyen ortak alanlar.
 * Ana sayfa Hero butonlari da ayni sozlugu kullanir (globals/Homepage.ts),
 * boylece `lib/resolveLink.ts` tek cozucu olarak her ikisini de karsilar.
 */
export const linkTargetFields: Field[] = [
  {
    name: 'type',
    type: 'select',
    required: true,
    defaultValue: 'page',
    label: { tr: 'Bağlantı Türü', en: 'Link type', ru: 'Тип ссылки' },
    options: [
      { value: 'page', label: { tr: 'Site sayfası', en: 'Site page', ru: 'Страница сайта' } },
      { value: 'route', label: { tr: 'Sistem bölümü', en: 'System section', ru: 'Системный раздел' } },
      /**
       * DİKKAT — İKİ FARKLI "KÜTÜPHANE" VAR:
       *   type: 'route' + route: 'library' → SİTE İÇİ bölüm (/tr/kutuphane).
       *                                      Normalde bunu kullanın.
       *   type: 'library' (aşağıdaki)      → EK-2 subdomain'i. Yalnızca
       *                                      gerçekten ayrı bir kütüphane
       *                                      sistemi kurulduysa kullanılır.
       */
      { value: 'library', label: { tr: 'Harici Kütüphane Sistemi (subdomain)', en: 'External library system (subdomain)', ru: 'Внешняя система библиотеки' } },
      { value: 'portal', label: { tr: 'Yönetim Portalı (subdomain)', en: 'Management portal (subdomain)', ru: 'Портал управления' } },
      { value: 'external', label: { tr: 'Harici adres', en: 'External URL', ru: 'Внешний адрес' } },
      { value: 'anchor', label: { tr: 'Sadece başlık (alt menü açar)', en: 'Heading only (opens submenu)', ru: 'Только заголовок' } },
    ],
  },
  {
    name: 'page',
    type: 'relationship',
    relationTo: 'pages',
    label: { tr: 'Sayfa', en: 'Page', ru: 'Страница' },
    admin: { condition: (_, siblingData) => siblingData?.type === 'page' },
  },
  {
    name: 'route',
    type: 'select',
    label: { tr: 'Bölüm', en: 'Section', ru: 'Раздел' },
    admin: { condition: (_, siblingData) => siblingData?.type === 'route' },
    options: [
      /**
       * `home` bu listede EKSİKTİ. `ROUTES` içinde tanımlı olmasına rağmen
       * buraya eklenmediği için menüye "Ana Sayfa" öğesi konamıyordu:
       * kayıt "Bölüm alanı geçersiz" hatasıyla reddediliyordu. Bu dosyanın
       * başındaki not iki listenin senkron tutulmasını zaten şart koşuyor.
       */
      { value: 'home', label: { tr: 'Ana Sayfa', en: 'Home', ru: 'Главная' } },
      { value: 'training-topics', label: { tr: 'Eğitim Konuları', en: 'Training topics', ru: 'Темы обучения' } },
      { value: 'training-programs', label: { tr: 'Eğitim Programları ve Duyurular', en: 'Training programmes', ru: 'Программы обучения' } },
      { value: 'training-calendar', label: { tr: 'Eğitim Takvimi', en: 'Training calendar', ru: 'Календарь обучения' } },
      { value: 'simulation-centre', label: { tr: 'Simülasyon Merkezi', en: 'Simulation centre', ru: 'Центр симуляции' } },
      { value: 'library', label: { tr: 'Dijital Kütüphane', en: 'Digital library', ru: 'Цифровая библиотека' } },
      { value: 'news', label: { tr: 'Haberler ve Duyurular', en: 'News & announcements', ru: 'Новости' } },
      { value: 'gallery', label: { tr: 'Galeri ve Medya', en: 'Gallery & media', ru: 'Галерея' } },
      { value: 'international-guide', label: { tr: 'Uluslararası Katılımcılar', en: 'International participants', ru: 'Международным участникам' } },
      { value: 'projects', label: { tr: 'Projeler', en: 'Projects', ru: 'Проекты' } },
      { value: 'contact', label: { tr: 'İletişim', en: 'Contact', ru: 'Контакты' } },
      { value: 'search', label: { tr: 'Arama', en: 'Search', ru: 'Поиск' } },
    ],
  },
  {
    name: 'path',
    type: 'text',
    label: { tr: 'Yol', en: 'Path', ru: 'Путь' },
    admin: {
      condition: (_, siblingData) => ['library', 'portal'].includes(siblingData?.type),
      description: {
        tr: 'Ana adres Genel Ayarlar > Dış Servisler’den gelir. Buraya yalnızca yol yazın (örn. /collections). Boş bırakılırsa ana sayfaya gider.',
        en: 'Base URL comes from External Services. Enter only the path.',
        ru: 'Базовый адрес — из внешних сервисов. Укажите только путь.',
      },
    },
  },
  {
    name: 'url',
    type: 'text',
    label: { tr: 'Adres', en: 'URL', ru: 'Адрес' },
    admin: { condition: (_, siblingData) => siblingData?.type === 'external' },
  },
]

/** Menu ogesi: etiket + hedef + erisilebilirlik alanlari. */
const menuItemFields: Field[] = [
  {
    name: 'label',
    type: 'text',
    required: true,
    localized: true,
    label: { tr: 'Menü Etiketi', en: 'Menu label', ru: 'Название пункта' },
  },
  {
    name: 'ariaLabel',
    type: 'text',
    localized: true,
    label: { tr: 'Ekran Okuyucu Metni', en: 'Screen-reader label', ru: 'Текст для скринридера' },
    admin: {
      description: {
        tr: 'Etiket tek başına anlaşılmıyorsa doldurun (WCAG 2.2 — 2.4.4 Bağlantı Amacı).',
        en: 'Fill in when the label alone is ambiguous (WCAG 2.2 — 2.4.4).',
        ru: 'Заполните, если название неоднозначно.',
      },
    },
  },
  ...linkTargetFields,
]

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: { tr: 'Menü Yönetimi', en: 'Navigation', ru: 'Меню' },
  admin: {
    group: { tr: 'Genel Ayarlar', en: 'Site settings', ru: 'Настройки сайта' },
    description: {
      tr: 'Menü ağacı tüm dillerde aynıdır; yalnızca etiketler çevrilir (Şartname 5: “Menü yapısı diller arasında tutarlı olmalıdır”).',
      en: 'The menu tree is identical across locales; only labels are translated.',
      ru: 'Структура меню одинакова для всех языков; переводятся только названия.',
    },
  },
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  versions: { drafts: false, max: 20 },
  hooks: {
    afterChange: [revalidateGlobal('navigation')],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: { tr: 'Ana Menü', en: 'Main menu', ru: 'Главное меню' },
          fields: [
            {
              name: 'mainMenu',
              type: 'array',
              maxRows: 8,
              label: false,
              labels: {
                singular: { tr: 'Menü Öğesi', en: 'Menu item', ru: 'Пункт меню' },
                plural: { tr: 'Menü Öğeleri', en: 'Menu items', ru: 'Пункты меню' },
              },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: '@/components/admin/MenuRowLabel#MenuRowLabel',
                },
                description: {
                  tr: 'En fazla 8 ana başlık. Daha fazlası mobilde okunabilirliği bozar.',
                  en: 'Max 8 top-level items to keep mobile navigation readable.',
                  ru: 'Не более 8 пунктов верхнего уровня.',
                },
              },
              fields: [
                ...menuItemFields,
                {
                  name: 'children',
                  type: 'array',
                  maxRows: 12,
                  label: { tr: 'Alt Menü', en: 'Submenu', ru: 'Подменю' },
                  admin: { initCollapsed: true },
                  fields: menuItemFields,
                },
                {
                  name: 'highlight',
                  type: 'checkbox',
                  defaultValue: false,
                  label: { tr: 'Vurgulu göster (buton)', en: 'Highlight as a button', ru: 'Выделить как кнопку' },
                },
              ],
            },
          ],
        },
        {
          label: { tr: 'Alt Bilgi (Footer)', en: 'Footer', ru: 'Подвал' },
          fields: [
            {
              name: 'footerColumns',
              type: 'array',
              maxRows: 4,
              label: { tr: 'Footer Sütunları', en: 'Footer columns', ru: 'Колонки подвала' },
              admin: { initCollapsed: true },
              fields: [
                { name: 'heading', type: 'text', required: true, localized: true },
                {
                  name: 'links',
                  type: 'array',
                  label: { tr: 'Bağlantılar', en: 'Links', ru: 'Ссылки' },
                  fields: menuItemFields,
                },
              ],
            },
            {
              name: 'footerLegalLinks',
              type: 'array',
              maxRows: 6,
              label: { tr: 'Hukuki Bağlantılar', en: 'Legal links', ru: 'Правовые ссылки' },
              admin: {
                description: {
                  tr: 'KVKK aydınlatma metni, çerez politikası, erişilebilirlik bildirimi (Şartname 12.2–12.3, 13).',
                  en: 'Privacy notice, cookie policy, accessibility statement.',
                  ru: 'Политика конфиденциальности, cookie, доступность.',
                },
              },
              fields: menuItemFields,
            },
          ],
        },
        {
          label: { tr: 'Hızlı Erişim', en: 'Quick access', ru: 'Быстрый доступ' },
          description: {
            tr: 'Şartname 6.1 — ana sayfadaki hızlı erişim kutuları (kütüphane, simülasyon merkezi, eğitim konuları).',
            en: 'Spec 6.1 — homepage quick-access tiles.',
            ru: 'П. 6.1 — плитки быстрого доступа на главной.',
          },
          fields: [
            {
              name: 'quickAccess',
              type: 'array',
              maxRows: 6,
              label: false,
              admin: { initCollapsed: true },
              fields: [
                ...menuItemFields,
                { name: 'description', type: 'textarea', localized: true, maxLength: 200 },
                { name: 'icon', type: 'upload', relationTo: 'media' },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export default Navigation
