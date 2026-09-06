import type { ExternalService, SiteSetting } from '@/payload-types'

import type { Locale } from '@/i18n/locales'

import { buildPortalLink } from './externalLinks'

/**
 * KARDEŞ PORTAL KÜMESİ — TEK KAYNAK
 * ============================================================================
 * Üst hizmet şeridi (masaüstü) ve mobil menü paneli AYNI listeyi gösterir.
 * İki yerde ayrı ayrı kurulsaydı biri değiştiğinde diğeri sessizce
 * farklılaşırdı — "yakında" durumundaki bir servis bir yerde görünüp
 * diğerinde kaybolurdu.
 *
 * DİJİTAL KÜTÜPHANE BURADA DEĞİL — kütüphane artık site içi bir bölümdür
 * (/tr/kutuphane, bkz. collections/LibraryResources.ts) ve ana menüde durur.
 * Kardeş portal listesi yalnızca SİTEDEN ÇIKARAN adresleri gösterir; iç bir
 * bölümü buraya da koymak aynı bağlantıyı üst şeritte ve ana menüde iki kez
 * göstermek olurdu.
 *
 * NEDEN "YAKINDA" OLANLAR DA LİSTELENİYOR
 * Bu küme kurumun dijital ekosistemini ilan eder ("bu merkezin bir
 * kütüphanesi var"), yalnızca bugün tıklanabilen adresleri değil. `href`
 * null döndüğünde bileşenler bunu tıklanamaz metin + "Yakında" rozeti olarak
 * basar. Aynı davranış ana menüde de uygulanıyor (bkz. MainNav.renderLeaf).
 *
 * `state: 'hidden'` olan servis HİÇ görünmez — o, editörün "bu servisi
 * ziyaretçiye söyleme" kararıdır.
 * ============================================================================
 */

export type PortalLink = {
  /** Tıklanabilir değilse null. */
  href: string | null
  label: string
  trackId: string
  /** Ekran okuyucuya okunacak durum açıklaması ("... yakında hizmete girecek"). */
  notice: string | null
}

type ProjectLike = { title?: string | null; externalUrl?: string | null }

export const buildPortalLinks = (
  services: ExternalService,
  settings: SiteSetting,
  options: { locale: Locale; staffLoginLabel: string; projectFallbackLabel: string },
): PortalLink[] => {
  const portal = buildPortalLink(services, { kind: 'login' })

  const project = (settings as { primaryProject?: ProjectLike | number | null }).primaryProject
  const projectData = project && typeof project === 'object' ? project : null

  return [
    projectData?.externalUrl
      ? {
          href: projectData.externalUrl,
          label: projectData.title ?? options.projectFallbackLabel,
          trackId: 'project:topbar',
          notice: null,
        }
      : null,
    portal.state !== 'hidden'
      ? {
          href: portal.available ? portal.href : null,
          label: options.staffLoginLabel,
          trackId: 'portal:topbar',
          notice: portal.notice ?? null,
        }
      : null,
  ].filter(Boolean) as PortalLink[]
}
