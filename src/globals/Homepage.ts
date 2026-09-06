import type { Field, GlobalConfig } from 'payload'

import { isAdminOrEditor } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

import { linkTargetFields } from './Navigation'

/**
 * ANA SAYFA  (Sartname EK-1 / 6.1)
 * ============================================================================
 * Ana sayfanin EDITOR TARAFINDAN YONETILEN kisimlari burada toplanir:
 *   1) Hero (karsilama alani)      -> 6.1 "kurumsal tanitim alani"
 *   2) One cikan egitimler seridi  -> 6.1 + 6.4
 *
 * Icerigin KENDISI koleksiyonlardan gelir; bu Global yalnizca sunum ve
 * yerlesim kararlarini tutar. Boylece ana sayfa metni degistiginde kod
 * dagitimi (deploy) gerekmez (Sartname 11.2).
 *
 * ---------------------------------------------------------------------------
 * GUVENLI KARARTMA KATMANI — NEDEN ZORUNLU?
 * ---------------------------------------------------------------------------
 * Hero gorseli editor tarafindan yuklenir; acik (parlak) bir fotograf
 * secildiginde beyaz baslik okunamaz hale gelir ve WCAG 2.2 AA (1.4.3 Kontrast)
 * ihlal edilir. Bu nedenle gorselin uzerine her zaman brand-950 (#04240f)
 * renginde bir karartma katmani konur ve saydamligi ASGARI DEGERIN ALTINA
 * DUSURULEMEZ.
 *
 * Olcum (en kotu durum: tamamen BEYAZ bir fotograf, beyaz metin):
 *   opaklik 0.60 -> 4.48:1   YETERSIZ
 *   opaklik 0.65 -> 5.28:1   AA saglanir  <-- taban deger
 *   opaklik 0.75 -> 7.43:1
 * Gercek fotograflar beyazdan koyu oldugu icin gercek kontrast daima daha
 * yuksektir. Taban deger hem burada (min: 65) hem de bilesende
 * (components/home/HomeHero.tsx icindeki clamp) uygulanir: panelden gelen
 * bozuk/eski bir deger bile erisilebilirligi bozamaz.
 * ============================================================================
 */

/** Hero butonu: etiket + Navigation ile ayni hedef sozlugu. */
const ctaFields = (): Field[] => [
  {
    name: 'label',
    type: 'text',
    localized: true,
    label: { tr: 'Buton Metni', en: 'Button label', ru: 'Текст кнопки' },
    admin: {
      description: {
        tr: 'Boş bırakılırsa buton gösterilmez.',
        en: 'The button is hidden when this is empty.',
        ru: 'Если поле пустое, кнопка не отображается.',
      },
    },
  },
  ...linkTargetFields.map((field) =>
    // Hero butonunda "sadece başlık" seçeneği anlamsızdır; menüden farklı
    // olarak buradan çıkarılır. Diğer türler birebir aynı kalır.
    field.type === 'select' && 'name' in field && field.name === 'type'
      ? {
          ...field,
          required: false,
          options: field.options.filter(
            (option) => typeof option !== 'string' && option.value !== 'anchor',
          ),
        }
      : field,
  ),
]

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: { tr: 'Ana Sayfa', en: 'Homepage', ru: 'Главная страница' },
  admin: {
    group: { tr: 'Genel Ayarlar', en: 'Site settings', ru: 'Настройки сайта' },
    description: {
      tr: 'Ana sayfadaki karşılama alanı ve öne çıkan eğitimler şeridi. Eğitim ve haber içerikleri kendi bölümlerinden yönetilir.',
      en: 'The homepage hero and the featured-training strip. Content itself lives in its own collections.',
      ru: 'Приветственный блок главной страницы и лента избранных обучений.',
    },
  },
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  versions: { drafts: false, max: 20 },
  hooks: {
    afterChange: [revalidateGlobal('homepage')],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        // ==================================================================
        // 1) HERO
        // ==================================================================
        {
          label: { tr: 'Karşılama Alanı (Hero)', en: 'Hero', ru: 'Приветственный блок' },
          fields: [
            {
              name: 'hero',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'eyebrow',
                  type: 'text',
                  localized: true,
                  maxLength: 80,
                  label: { tr: 'Üst Etiket', en: 'Eyebrow', ru: 'Надзаголовок' },
                  admin: {
                    description: {
                      tr: 'Başlığın üzerinde küçük punto ile görünür. Örn. “FAO – OGM iş birliğiyle”.',
                      en: 'Small line above the headline, e.g. “In cooperation with FAO and OGM”.',
                      ru: 'Небольшая строка над заголовком.',
                    },
                  },
                },
                {
                  name: 'headline',
                  type: 'text',
                  localized: true,
                  maxLength: 120,
                  label: { tr: 'Ana Başlık', en: 'Headline', ru: 'Заголовок' },
                  admin: {
                    description: {
                      tr: 'Sayfanın tek H1 başlığıdır (WCAG 2.2 — 1.3.1). Boş bırakılırsa Genel Ayarlar’daki site adı kullanılır.',
                      en: 'The page’s single H1. Falls back to the site name from Site Settings.',
                      ru: 'Единственный H1 страницы. По умолчанию — название сайта.',
                    },
                  },
                },
                {
                  name: 'subheadline',
                  type: 'textarea',
                  localized: true,
                  maxLength: 320,
                  label: { tr: 'Açıklama', en: 'Subheadline', ru: 'Описание' },
                },

                // ---- Görsel ve karartma ------------------------------------
                {
                  name: 'backgroundImage',
                  type: 'upload',
                  relationTo: 'media',
                  label: { tr: 'Arka Plan Görseli', en: 'Background image', ru: 'Фоновое изображение' },
                  admin: {
                    description: {
                      tr: 'En az 1920×900 piksel önerilir. Görsel dekoratiftir; anlam taşıyan metin görselin İÇİNE yazılmamalıdır (WCAG 2.2 — 1.4.5). Boş bırakılırsa kurumsal yeşil degrade kullanılır.',
                      en: 'At least 1920×900 recommended. The image is decorative; do not bake text into it (WCAG 2.2 — 1.4.5). Falls back to the corporate green gradient.',
                      ru: 'Рекомендуется не менее 1920×900. Изображение декоративное.',
                    },
                  },
                },
                {
                  name: 'overlay',
                  type: 'group',
                  label: { tr: 'Karartma Katmanı', en: 'Darkening overlay', ru: 'Затемняющий слой' },
                  admin: {
                    condition: (_, siblingData) => Boolean(siblingData?.backgroundImage),
                    description: {
                      tr: 'Başlığın her fotoğraf üzerinde okunabilir kalmasını sağlar. Alt sınır (%65) ölçümle belirlenmiştir ve kod tarafında da uygulanır; daha düşük bir değer girilemez.',
                      en: 'Keeps the headline readable on any photo. The 65% floor is measured and also enforced in code.',
                      ru: 'Обеспечивает читаемость заголовка на любом фото. Минимум 65% задан в коде.',
                    },
                  },
                  fields: [
                    {
                      name: 'opacity',
                      type: 'number',
                      defaultValue: 72,
                      min: 65,
                      max: 92,
                      label: { tr: 'Karartma Yoğunluğu (%)', en: 'Overlay opacity (%)', ru: 'Плотность затемнения (%)' },
                      /**
                       * Ikili koruma: panelde uyarir, bilesende zorlar.
                       * `min`/`max` tek basina yeterli degildir — eski kayitlar
                       * ve API uzerinden gelen degerler bu kontrolu atlayabilir.
                       */
                      validate: (value: unknown) => {
                        if (value === null || value === undefined || value === '') return true
                        const numeric = Number(value)
                        if (Number.isNaN(numeric)) return 'Sayısal bir değer girin.'
                        if (numeric < 65) {
                          return 'Erişilebilirlik nedeniyle %65’in altına inilemez (WCAG 2.2 — 1.4.3 Kontrast).'
                        }
                        if (numeric > 92) return 'En fazla %92 olabilir; görsel tamamen kaybolur.'
                        return true
                      },
                    },
                    {
                      name: 'style',
                      type: 'select',
                      defaultValue: 'gradient',
                      label: { tr: 'Karartma Biçimi', en: 'Overlay style', ru: 'Тип затемнения' },
                      options: [
                        {
                          value: 'gradient',
                          label: {
                            tr: 'Degrade (metin tarafı daha koyu)',
                            en: 'Gradient (darker behind the text)',
                            ru: 'Градиент (темнее со стороны текста)',
                          },
                        },
                        {
                          value: 'solid',
                          label: { tr: 'Düz karartma', en: 'Solid', ru: 'Сплошное' },
                        },
                      ],
                      admin: {
                        description: {
                          tr: 'Degrade seçilse bile taban karartma her yerde uygulanır; degrade yalnızca metin tarafını EK olarak koyulaştırır.',
                          en: 'The base overlay always applies; the gradient only darkens the text side further.',
                          ru: 'Базовое затемнение применяется всегда.',
                        },
                      },
                    },
                  ],
                },

                // ---- Butonlar ---------------------------------------------
                {
                  name: 'primaryCta',
                  type: 'group',
                  label: { tr: 'Birincil Buton', en: 'Primary button', ru: 'Основная кнопка' },
                  fields: ctaFields(),
                },
                {
                  name: 'secondaryCta',
                  type: 'group',
                  label: { tr: 'İkincil Buton', en: 'Secondary button', ru: 'Вторая кнопка' },
                  fields: ctaFields(),
                },

                // ---- Sağ panel: öne çıkanlar ------------------------------
                {
                  name: 'highlights',
                  type: 'array',
                  maxRows: 3,
                  label: { tr: 'Öne Çıkanlar Paneli', en: 'Highlights panel', ru: 'Панель «Ключевое»' },
                  labels: {
                    singular: { tr: 'Öne Çıkan', en: 'Highlight', ru: 'Пункт' },
                    plural: { tr: 'Öne Çıkanlar', en: 'Highlights', ru: 'Ключевое' },
                  },
                  admin: {
                    description: {
                      tr: 'Hero’nun SAĞ tarafında cam efektli bir panel olarak gösterilir; masaüstünde başlığın yanında durur, mobilde altına akar. Boş bırakılırsa panel hiç oluşturulmaz ve başlık tüm genişliği kullanır.',
                      en: 'Rendered as a glass panel on the RIGHT of the hero. Omitted entirely when empty.',
                      ru: 'Отображается стеклянной панелью справа от заголовка. Пустой список — панель не выводится.',
                    },
                  },
                  fields: [
                    {
                      name: 'title',
                      type: 'text',
                      required: true,
                      localized: true,
                      label: { tr: 'Başlık', en: 'Title', ru: 'Заголовок' },
                      admin: {
                        description: {
                          tr: 'Kısa ve tok. Örn. “14+ Katılımcı Ülke”.',
                          en: 'Short and bold, e.g. “14+ participating countries”.',
                          ru: 'Коротко, напр. «14+ стран-участниц».',
                        },
                      },
                    },
                    {
                      name: 'description',
                      type: 'text',
                      localized: true,
                      maxLength: 120,
                      label: { tr: 'Açıklama', en: 'Description', ru: 'Описание' },
                    },
                  ],
                },

                // ---- Rakamlar ---------------------------------------------
                {
                  name: 'stats',
                  type: 'array',
                  maxRows: 4,
                  label: { tr: 'Kurumsal Rakamlar', en: 'Key figures', ru: 'Ключевые показатели' },
                  labels: {
                    singular: { tr: 'Rakam', en: 'Figure', ru: 'Показатель' },
                    plural: { tr: 'Rakamlar', en: 'Figures', ru: 'Показатели' },
                  },
                  admin: {
                    description: {
                      tr: 'Hero’nun alt şeridinde gösterilir. Örn. “7 ülke”, “1994’ten beri”. Boş bırakılırsa şerit hiç oluşturulmaz.',
                      en: 'Rendered as a strip under the hero. Omitted entirely when empty.',
                      ru: 'Отображается полосой под блоком. Пустой список — полоса не выводится.',
                    },
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'value',
                          type: 'text',
                          required: true,
                          localized: true,
                          label: { tr: 'Değer', en: 'Value', ru: 'Значение' },
                          admin: { width: '40%' },
                        },
                        {
                          name: 'label',
                          type: 'text',
                          required: true,
                          localized: true,
                          label: { tr: 'Açıklama', en: 'Label', ru: 'Подпись' },
                          admin: { width: '60%' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },

        // ==================================================================
        // 2) ONE CIKAN EGITIMLER
        // ==================================================================
        {
          label: { tr: 'Öne Çıkan Eğitimler', en: 'Featured trainings', ru: 'Избранные обучения' },
          description: {
            tr: 'Şeritte hangi eğitimlerin görüneceği eğitim kaydındaki “Ana sayfada öne çıkar” kutusuyla belirlenir. Burada yalnızca sunum ayarlanır.',
            en: 'Which trainings appear is set per record via “Feature on homepage”. Only presentation is configured here.',
            ru: 'Состав ленты задаётся флажком «На главной» в самой записи.',
          },
          fields: [
            {
              name: 'featuredTrainings',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  localized: true,
                  label: { tr: 'Bölüm Başlığı', en: 'Section title', ru: 'Заголовок раздела' },
                  admin: {
                    description: {
                      tr: 'Boş bırakılırsa arayüz çevirisindeki varsayılan başlık kullanılır.',
                      en: 'Falls back to the default UI translation when empty.',
                      ru: 'По умолчанию используется перевод интерфейса.',
                    },
                  },
                },
                {
                  name: 'intro',
                  type: 'textarea',
                  localized: true,
                  maxLength: 280,
                  label: { tr: 'Bölüm Açıklaması', en: 'Section intro', ru: 'Описание раздела' },
                },
                {
                  name: 'limit',
                  type: 'number',
                  defaultValue: 5,
                  min: 1,
                  max: 6,
                  label: { tr: 'Gösterilecek Eğitim Sayısı', en: 'Number of trainings', ru: 'Количество обучений' },
                  admin: {
                    description: {
                      tr: 'Yerleşim (Bento) bu sayıya göre kurulur. 5 değerinde ilk eğitim büyük kart olarak gösterilir — en dengeli görünüm budur.',
                      en: 'The bento layout adapts to this count. 5 gives the most balanced arrangement.',
                      ru: 'Раскладка подстраивается под это число. 5 — самый сбалансированный вариант.',
                    },
                  },
                },
                {
                  name: 'showStatusBadges',
                  type: 'checkbox',
                  defaultValue: true,
                  label: {
                    tr: 'Durum rozetlerini göster',
                    en: 'Show status badges',
                    ru: 'Показывать метки статуса',
                  },
                  admin: {
                    description: {
                      tr: 'Eğitim kaydındaki “Eğitim Durumu” alanını kartın üzerinde rozet olarak gösterir (Başvuruya açık, Devam ediyor, Tamamlandı…).',
                      en: 'Shows the training status field as a badge on each card.',
                      ru: 'Показывает статус обучения меткой на карточке.',
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export default Homepage
