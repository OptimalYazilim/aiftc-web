import type { GlobalConfig } from 'payload'

import { canAuthorContent } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

/**
 * SIMULASYON MERKEZI SAYFASI  (Sartname EK-1 / 6.5 ve 9.1-9.2)
 *
 * Sayfanin kendisi TEK kayittir -> Global.
 * Sayfada listelenen sistemler (OYMES, BTES, ...) ise
 * `collections/SimulationSystems.ts` icindedir.
 */
export const SimulationCenter: GlobalConfig = {
  slug: 'simulation-center',
  label: { tr: 'Simülasyon Merkezi Sayfası', en: 'Simulation centre page', ru: 'Страница центра симуляции' },
  admin: {
    group: { tr: 'Simülasyon Merkezi', en: 'Simulation centre', ru: 'Центр симуляции' },
    description: {
      tr: 'Sayfanın giriş metni ve teknik kapasite özeti. Sistem kartları (OYMES, BTES) ayrı bölümdedir.',
      en: 'Page intro and capacity summary. System cards live in their own collection.',
      ru: 'Вводный текст и обзор возможностей.',
    },
  },
  access: {
    read: () => true,
    update: canAuthorContent,
  },
  versions: { drafts: true, max: 20 },
  hooks: {
    afterChange: [revalidateGlobal('simulation-center')],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Simülasyon Merkezi',
      label: { tr: 'Sayfa Başlığı', en: 'Page title', ru: 'Заголовок страницы' },
    },
    {
      name: 'purpose',
      type: 'richText',
      localized: true,
      label: { tr: 'Simülasyon Merkezinin Amacı', en: 'Purpose of the simulation centre', ru: 'Цель центра симуляции' },
    },
    {
      name: 'roleInFireTraining',
      type: 'richText',
      localized: true,
      label: {
        tr: 'Orman Yangını Eğitimlerindeki Rolü',
        en: 'Role in forest fire training',
        ru: 'Роль в обучении по лесным пожарам',
      },
    },
    {
      name: 'relationToTraining',
      type: 'richText',
      localized: true,
      label: {
        tr: 'Teorik ve Uygulamalı Eğitimlerle İlişkisi',
        en: 'Relation to theoretical and practical training',
        ru: 'Связь с теоретическим и практическим обучением',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      label: { tr: 'Üst Görsel', en: 'Hero image', ru: 'Главное изображение' },
    },
    {
      name: 'introVideo',
      type: 'group',
      label: { tr: 'Tanıtım Videosu', en: 'Introduction video', ru: 'Вводное видео' },
      fields: [
        { name: 'url', type: 'text', label: { tr: 'Video Adresi (CDN)', en: 'Video URL (CDN)', ru: 'Адрес видео (CDN)' } },
        { name: 'poster', type: 'upload', relationTo: 'media' },
        { name: 'captionsUrl', type: 'text', label: { tr: 'Altyazı (WebVTT)', en: 'Captions (WebVTT)', ru: 'Субтитры (WebVTT)' } },
      ],
    },
    {
      name: 'capacityHighlights',
      type: 'array',
      localized: true,
      maxRows: 6,
      label: { tr: 'Teknik Kapasite Özeti', en: 'Technical capacity highlights', ru: 'Ключевые возможности' },
      fields: [
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
      ],
    },
    {
      name: 'cdn',
      type: 'group',
      label: { tr: 'İçerik Dağıtım Ağı (CDN)', en: 'Content delivery network', ru: 'Сеть доставки контента' },
      admin: {
        description: {
          tr: 'Şartname 6.5 — simülasyon video ve görselleri CDN üzerinden servis edilir.',
          en: 'Spec 6.5 — simulation media is served through a CDN.',
          ru: 'П. 6.5 — медиа доставляется через CDN.',
        },
      },
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: false },
        {
          name: 'baseUrl',
          type: 'text',
          label: { tr: 'CDN Ana Adresi', en: 'CDN base URL', ru: 'Базовый адрес CDN' },
          admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
        },
      ],
    },
  ],
}

export default SimulationCenter
