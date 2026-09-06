import type { ExternalService } from '@/payload-types'

import type { Locale } from '@/i18n/locales'
import { href, pageHref, ROUTES, type RouteKey } from '@/i18n/routes'

import { buildLibraryLink, buildPortalLink } from './externalLinks'

/**
 * MENÜ ÖĞESİ → BAĞLANTI ÇÖZÜCÜ
 * ============================================================================
 * `globals/Navigation.ts` içindeki her öğe altı türden biridir. Bu modül
 * hepsini tek bir `ResolvedNavLink` biçimine indirger; bileşenler tür ayrımı
 * yapmaz, yalnızca sonucu render eder.
 *
 * EK-2 kuralı: kütüphane ve portal bağlantıları `ExternalServices` global'inin
 * durumuna tabidir. Kütüphane "yakında" ise `available: false` döner ve menü
 * öğesi tıklanamaz hale gelir — kod tarafında ayrıca kontrol gerekmez.
 * ============================================================================
 */

export type NavItemInput = {
  label?: string | null
  ariaLabel?: string | null
  type?: string | null
  page?: { slug?: string | null } | number | string | null
  route?: string | null
  path?: string | null
  url?: string | null
  highlight?: boolean | null
  description?: string | null
  children?: NavItemInput[] | null
}

export type ResolvedNavLink = {
  label: string
  ariaLabel?: string
  /** Ziyaretçinin göreceği, dile göre yerelleştirilmiş tam yol. */
  href: string | null
  /**
   * next-intl'in kanonik (dil öneksiz, TR segmentli) yolu.
   * Aktif menü öğesi tespiti BUNUNLA yapılır — `href` ile değil.
   * Sebep: `next/navigation`'ın `usePathname`'i sunucuda yeniden yazılmış
   * kanonik yolu, istemcide tarayıcıdaki yerelleştirilmiş yolu döndürür;
   * ikisini karşılaştırmak hidrasyon uyuşmazlığı üretir.
   */
  canonicalPath?: string
  /** Harici adres mi? Yeni sekme + ekran okuyucu uyarısı gerektirir. */
  isExternal: boolean
  /** Tıklanabilir mi? "Yakında"/"gizli" durumundaki EK-2 servisleri için false. */
  available: boolean
  /** Tıklanamıyorsa kullanıcıya gösterilecek açıklama. */
  notice?: string | null
  /** Menüde tamamen gizlenmeli mi? */
  hidden: boolean
  highlight: boolean
  description?: string | null
  /** Analitik için kararlı anahtar (Şartname 17). */
  trackId?: string
  children: ResolvedNavLink[]
}

const isRouteKey = (value: unknown): value is RouteKey =>
  typeof value === 'string' && value in ROUTES

const slugOf = (page: NavItemInput['page']): string | null => {
  if (page && typeof page === 'object' && 'slug' in page) {
    return typeof page.slug === 'string' ? page.slug : null
  }
  return null
}

export const resolveNavItem = (
  item: NavItemInput,
  context: { locale: Locale; services: ExternalService },
): ResolvedNavLink => {
  const { locale, services } = context

  const base: ResolvedNavLink = {
    label: item.label ?? '',
    ariaLabel: item.ariaLabel ?? undefined,
    href: null,
    isExternal: false,
    available: true,
    hidden: false,
    highlight: Boolean(item.highlight),
    description: item.description ?? null,
    // Gizlenmesi gereken alt öğeler burada elenir; üst öğe "yalnızca başlık"
    // ise geriye çocuk kalmadığında kendisi de anlamsızlaşır.
    children: (item.children ?? [])
      .map((child) => resolveNavItem(child, context))
      .filter((child) => !child.hidden),
  }

  switch (item.type) {
    case 'page': {
      const slug = slugOf(item.page)
      return slug
        ? { ...base, href: pageHref(locale, slug), canonicalPath: `/${slug}` }
        : { ...base, available: false, hidden: true }
    }

    case 'route': {
      return isRouteKey(item.route)
        ? { ...base, href: href(item.route, locale), canonicalPath: ROUTES[item.route].tr }
        : { ...base, available: false, hidden: true }
    }

    case 'library': {
      const link = buildLibraryLink(services, {
        locale,
        ...(item.path ? { path: item.path } : { kind: 'home' as const }),
      })

      return {
        ...base,
        // Etiket CMS'te menü öğesinde ayrıca girilmişse o kazanır.
        label: base.label || link.label,
        href: link.href,
        isExternal: true,
        available: link.available,
        notice: link.notice,
        hidden: link.state === 'hidden',
        trackId: 'library',
      }
    }

    case 'portal': {
      const link = buildPortalLink(services, {
        kind: 'custom',
        path: item.path ?? '/',
      })

      return {
        ...base,
        href: link.href,
        isExternal: true,
        available: link.available,
        hidden: link.state === 'hidden',
        trackId: 'portal',
      }
    }

    case 'external': {
      return item.url
        ? { ...base, href: item.url, isExternal: true, trackId: `ext:${item.url}` }
        : { ...base, available: false, hidden: true }
    }

    case 'anchor':
      // Yalnızca başlık: kendisi bağlantı değildir, alt menüyü açar.
      // Görünür alt öğesi kalmadıysa menüden tamamen çıkarılır.
      return {
        ...base,
        href: null,
        available: base.children.length > 0,
        hidden: base.children.length === 0,
      }

    default:
      return { ...base, available: false, hidden: true }
  }
}

export const resolveNavItems = (
  items: NavItemInput[] | null | undefined,
  context: { locale: Locale; services: ExternalService },
): ResolvedNavLink[] =>
  (items ?? []).map((item) => resolveNavItem(item, context)).filter((link) => !link.hidden)
