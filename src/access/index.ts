import type { Access, FieldAccess } from 'payload'

import type { User } from '@/payload-types'

/**
 * Rol tabanli yetkilendirme (Sartname 12.1).
 *
 *  admin   : Tam yetki. Kullanici, ayar ve tum icerik yonetimi.
 *  editor  : Icerik olusturur, duzenler VE yayimlar.
 *  author  : Icerik olusturur/duzenler ancak yayimlayamaz (taslak birakir).
 *  viewer  : Yalnizca admin panelinde okuma (rapor/kontrol amacli).
 */
export type Role = NonNullable<User['roles']>[number]

const rolesOf = (user: unknown): Role[] => {
  const roles = (user as User | null | undefined)?.roles
  return Array.isArray(roles) ? (roles as Role[]) : []
}

export const hasRole =
  (...allowed: Role[]) =>
  (user: unknown): boolean =>
    rolesOf(user).some((role) => allowed.includes(role))

// --- Collection-level access ------------------------------------------------

/** Herkese acik okuma; taslaklar yalnizca oturum acmis personele gorunur. */
export const publishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true

  return {
    _status: { equals: 'published' },
  }
}

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)

export const isAdmin: Access = ({ req: { user } }) => hasRole('admin')(user)

export const isAdminOrEditor: Access = ({ req: { user } }) => hasRole('admin', 'editor')(user)

/** Icerik olusturma/duzenleme: admin, editor, author. */
export const canAuthorContent: Access = ({ req: { user } }) =>
  hasRole('admin', 'editor', 'author')(user)

/** Silme yalnizca admin ve editorde; author icerik silemez. */
export const canDeleteContent: Access = ({ req: { user } }) => hasRole('admin', 'editor')(user)

/** Kendi kaydini veya admin ise her kaydi okuyabilir (Users icin). */
export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (hasRole('admin')(user)) return true
  return { id: { equals: user.id } }
}

// --- Field-level access -----------------------------------------------------

export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) => hasRole('admin')(user)

/** Yayimlama yetkisi alan bazinda: author "published" secemez. */
export const canPublishFieldLevel: FieldAccess = ({ req: { user } }) =>
  hasRole('admin', 'editor')(user)

/**
 * Alan bazli okuma: yalnizca admin ve editor.
 * `isAdminOrEditor` KOLEKSIYON tipindedir (`Access`) ve alan uzerinde
 * kullanilamaz — Payload alan erisimine `FieldAccess` bekler, iki tipin `id`
 * parametresi farklidir. Sanal sinif parolalari bu fonksiyonla korunur.
 */
export const isAdminOrEditorFieldLevel: FieldAccess = ({ req: { user } }) =>
  hasRole('admin', 'editor')(user)
