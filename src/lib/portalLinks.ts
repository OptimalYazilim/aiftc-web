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
 * PERSONEL GİRİŞİ YALNIZCA YAYINDAYKEN GÖRÜNÜR
 * Önceden "yakında" durumundaki portal da tıklanamaz metin + "Yakında"
 * rozetiyle basılıyordu. Kurum kararıyla kaldırıldı: tıklanamayan bir giriş
 * bağlantısı ziyaretçiye iş görmüyor ve üst şeridi kalabalıklaştırıyordu.
 * Portal `ExternalServices` global'inde `live` yapıldığı anda bağlantı kod
 * değişikliği gerekmeden geri gelir. `coming-soon`, `maintenance` ve
 * `hidden` durumlarında listeye hiç girmez.
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
    portal.available && portal.href
      ? {
          href: portal.href,
          label: options.staffLoginLabel,
          trackId: 'portal:topbar',
          notice: portal.notice ?? null,
        }
      : null,
  ].filter(Boolean) as PortalLink[]
}
