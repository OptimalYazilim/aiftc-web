import type { Field } from 'payload'

import { formatSlug } from '@/hooks/formatSlug'

type SlugFieldOptions = {
  /** Slug'in turetilecegi alan adi. Varsayilan: 'title' */
  from?: string
  /** Slug dile gore degisir mi? EK-1 uluslararasi SEO icin varsayilan: true */
  localized?: boolean
}

/**
 * Cok dilli slug alani.
 *
 * Sartname 5: "Sayfa URL yapisi cok dilli kullanima uygun olmalidir."
 * localized: true -> /tr/egitimler/orman-yangini-yonetimi
 *                    /en/trainings/forest-fire-management
 *                    /ru/obucheniya/upravlenie-lesnymi-pozharami
 *
 * Kiril alfabesi otomatik latinize edilir (formatSlug icinde).
 */
export const slugField = ({ from = 'title', localized = true }: SlugFieldOptions = {}): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  localized,
  label: {
    tr: 'URL Adresi (slug)',
    en: 'Slug',
    ru: 'URL-адрес (slug)',
  },
  admin: {
    position: 'sidebar',
    description: {
      tr: 'Bos birakilirsa baslik alanindan otomatik uretilir. Yayindaki bir sayfanin slug’ini degistirirseniz Yonlendirmeler (Redirects) bolumunden 301 tanimlayin.',
      en: 'Auto-generated from the title if left empty. If you change a published slug, add a 301 in Redirects.',
      ru: 'Генерируется автоматически из заголовка. При изменении slug добавьте 301-редирект.',
    },
  },
  hooks: {
    beforeValidate: [formatSlug(from)],
  },
})
