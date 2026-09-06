import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminFieldLevel, isAdminOrSelf } from '@/access'

/**
 * Yonetim paneli kullanicilari (Sartname 11.2 + 12.1 rol tabanli yetkilendirme).
 *
 * NOT: Bu koleksiyon YALNIZCA icerik yoneticileri icindir. Site ziyaretcileri
 * icin uyelik yoktur; EK-1 kapsaminda son kullanici hesabi tutulmaz (12.2:
 * "Gereksiz kisisel veri toplanmayacaktir").
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: { tr: 'Kullanıcı', en: 'User', ru: 'Пользователь' },
    plural: { tr: 'Kullanıcılar', en: 'Users', ru: 'Пользователи' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles', 'updatedAt'],
    group: { tr: 'Sistem', en: 'System', ru: 'Система' },
  },
  auth: {
    tokenExpiration: 60 * 60 * 8, // 8 saat
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000, // 15 dakika kilit (Sartname 12.1)
    useAPIKey: false,
    depth: 0,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  access: {
    read: isAdminOrSelf,
    create: isAdmin,
    update: isAdminOrSelf,
    delete: isAdmin,
    admin: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: { tr: 'Ad Soyad', en: 'Full name', ru: 'ФИО' },
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['author'],
      saveToJWT: true,
      access: {
        create: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
      label: { tr: 'Roller', en: 'Roles', ru: 'Роли' },
      options: [
        { value: 'admin', label: { tr: 'Yönetici', en: 'Administrator', ru: 'Администратор' } },
        { value: 'editor', label: { tr: 'Editör (yayımlayabilir)', en: 'Editor (can publish)', ru: 'Редактор' } },
        { value: 'author', label: { tr: 'İçerik Girişi (taslak)', en: 'Author (draft only)', ru: 'Автор' } },
        { value: 'viewer', label: { tr: 'Görüntüleyici', en: 'Viewer', ru: 'Наблюдатель' } },
      ],
      admin: {
        description: {
          tr: 'İçerik Girişi rolü yayımlama yapamaz; kayıtları taslak olarak bırakır.',
          en: 'The Author role cannot publish; records stay as drafts.',
          ru: 'Роль «Автор» не может публиковать; записи остаются черновиками.',
        },
      },
    },
    {
      name: 'unit',
      type: 'text',
      label: { tr: 'Birim', en: 'Unit', ru: 'Подразделение' },
      admin: { position: 'sidebar' },
    },
    {
      name: 'preferredAdminLanguage',
      type: 'select',
      defaultValue: 'tr',
      label: { tr: 'Panel Dili', en: 'Admin language', ru: 'Язык панели' },
      options: [
        { value: 'tr', label: 'Türkçe' },
        { value: 'en', label: 'English' },
        { value: 'ru', label: 'Русский' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}

export default Users
