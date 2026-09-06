import type { ExternalService } from '@/payload-types'

import type { Locale } from '@/i18n/locales'

/**
 * EK-2 subdomain baglantilarini uretmenin TEK yolu.
 * Bilesenlerde asla elle URL birlestirmeyin; bu yardimcilari kullanin.
 */

type TemplateVars = {
  locale: Locale
  query?: string
  subject?: string
  trainingCode?: string
}

const fillTemplate = (template: string, vars: TemplateVars): string =>
  template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = (vars as Record<string, string | undefined>)[key]
    return value ? encodeURIComponent(value) : ''
  })

const joinUrl = (base: string, path: string): string =>
  `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`

export type ServiceState = 'live' | 'coming-soon' | 'maintenance' | 'hidden'

export type ResolvedLink = {
  /** Baglanti tiklanabilir mi? 'coming-soon' / 'hidden' durumunda false. */
  available: boolean
  href: string | null
  label: string
  notice?: string | null
  openInNewTab: boolean
  state: ServiceState
}

/** Dijital kutuphane baglantisi (EK-2). */
export const buildLibraryLink = (
  services: ExternalService,
  options: {
    locale: Locale
    /** Hazir sablonlardan biri veya dogrudan yol. */
    kind?: 'home' | 'search' | 'subject' | 'training-materials'
    path?: string
    query?: string
    subject?: string
    trainingCode?: string
  },
): ResolvedLink => {
  const library = services.library
  const state = (library?.status ?? 'hidden') as ServiceState
  const label = library?.label ?? 'Digital Library'
  const openInNewTab = library?.openInNewTab ?? true

  if (state !== 'live' || !library?.baseUrl) {
    return { available: false, href: null, label, notice: library?.notice, openInNewTab, state }
  }

  const vars: TemplateVars = {
    locale: options.locale,
    query: options.query,
    subject: options.subject,
    trainingCode: options.trainingCode,
  }

  let path = options.path ?? ''

  if (!path) {
    switch (options.kind) {
      case 'search':
        path = fillTemplate(library.searchPathTemplate ?? '/search?lang={locale}', vars)
        break
      case 'subject':
        path = fillTemplate(
          library.subjectPathTemplate ?? '/search?subject={subject}&lang={locale}',
          vars,
        )
        break
      case 'training-materials':
        path = fillTemplate(
          library.trainingMaterialsPathTemplate ?? '/collections/{trainingCode}?lang={locale}',
          vars,
        )
        break
      default:
        path = `/?lang=${options.locale}`
    }
  }

  return {
    available: true,
    href: joinUrl(library.baseUrl, path),
    label,
    notice: null,
    openInNewTab,
    state,
  }
}

/** Yonetim portali baglantisi (EK-2): giris, basvuru, sertifika dogrulama. */
export const buildPortalLink = (
  services: ExternalService,
  options: { kind: 'login' | 'application' | 'certificate-verify' | 'custom'; path?: string },
): ResolvedLink => {
  const portal = services.portal
  const state = (portal?.status ?? 'hidden') as ServiceState

  const label =
    options.kind === 'login'
      ? 'Portal'
      : options.kind === 'certificate-verify'
        ? 'Verification'
        : 'Portal'

  if (state !== 'live' || !portal?.baseUrl) {
    return { available: false, href: null, label, openInNewTab: true, state }
  }

  const path =
    options.path ??
    (options.kind === 'login'
      ? (portal.loginPath ?? '/login')
      : options.kind === 'application'
        ? (portal.applicationPath ?? '/basvuru')
        : options.kind === 'certificate-verify'
          ? (portal.certificateVerifyPath ?? '/dogrulama')
          : '/')

  return {
    available: true,
    href: joinUrl(portal.baseUrl, path),
    label,
    openInNewTab: true,
    state,
  }
}

/**
 * Bir egitim programinin basvuru hedefini coz.
 * `applicationTarget.type` degerine gore dogru URL veya mailto uretir.
 */
export const resolveApplicationHref = (
  target:
    | {
        type?: string | null
        url?: string | null
        portalPath?: string | null
        email?: string | null
      }
    | null
    | undefined,
  services: ExternalService,
): string | null => {
  if (!target?.type) return null

  switch (target.type) {
    case 'external':
      return target.url ?? null
    case 'email':
      return target.email ? `mailto:${target.email}` : null
    case 'portal': {
      const link = buildPortalLink(services, {
        kind: 'custom',
        path: target.portalPath ?? '/basvuru',
      })
      return link.href
    }
    case 'contact':
    case 'none':
    default:
      return null
  }
}
