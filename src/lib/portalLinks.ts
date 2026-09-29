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
 *
 * ---------------------------------------------------------------------------
 * İKİ AYRI ANAHTAR, İKİ AYRI SORU
 * ---------------------------------------------------------------------------
 * Personel girişi için editörün elinde BİRBİRİNDEN BAĞIMSIZ iki ayar var ve
 * karıştırılmamalıdır:
 *
 *   portal.status                  → "Bu servis hangi durumda?"
 *                                    (yayında / yakında / bakımda / gizli)
 *   portal.showStaffLoginInHeader  → "Üst menüde görünsün mü?"
 *
 * Öğe başlıkta ancak İKİSİ BİRDEN izin verirse görünür: portal `live` VE
 * anahtar açık. İkincisi YALNIZCA BAŞLIĞI ilgilendirir. Portal `live` olsa
 * bile kurum onu üst şeritte duyurmak istemeyebilir (örneğin bağlantı yalnızca
 * kurum içi dolaşımda paylaşılıyorsa). Tersi de geçerli: anahtar kapalıyken
 * servisin durumu değişmez, yalnızca başlıkta görünmez. Portal `live` değilken
 * anahtarın görünür bir etkisi olmaz — öğe zaten yukarıdaki kurum kararıyla
 * listeye girmez.
 *
 * ---------------------------------------------------------------------------
 * ANAHTAR NEDEN BURADA UYGULANIYOR
 * ---------------------------------------------------------------------------
 * `buildPortalLink()` (lib/externalLinks.ts) DEĞİL, burası. O fonksiyon
 * portalın adresini çözer ve EĞİTİM BAŞVURULARI da onu kullanır
 * (`resolveApplicationHref`, `applicationTarget.type = 'portal'`). Anahtarı
 * oraya koymak, "üst menüde gösterme" tercihinin eğitim künyesindeki başvuru
 * düğmesini de sessizce kırması demek olurdu — editörün sormadığı bir şey.
 *
 * Burada ise liste TEK YERDE kurulduğu için anahtar hem masaüstü şeridini hem
 * mobil menü panelini birlikte kapsar; ikisi ayrılamaz.
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

  /*
    `!== false` — `=== true` DEĞİL. Bilinçli.

    Alanın şemadaki varsayılanı `true` (bkz. globals/ExternalServices.ts), ama
    bu global alan eklenmeden ÖNCE kaydedilmişse değer veritabanında `null`
    olarak durur. `=== true` yazılsaydı o kayıtlarda öğe bir anda kaybolur ve
    editör hiçbir şey değiştirmediği hâlde başlığın değiştiğini görürdü.

    Dolayısıyla kural şudur: yalnızca AÇIKÇA kapatılmışsa gizlenir. Bu bir
    görünürlük tercihi, güvenlik kapısı değil — belirsiz durumda mevcut
    davranışı korumak doğrudur.
  */
  const basliktaGosterilsin = services.portal?.showStaffLoginInHeader !== false

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
    /*
      İki koşul da sağlanmalı: portal yayında OLMALI (tıklanabilir bir adresi
      var) ve editör onu üst menüde göstermeyi seçmiş OLMALI. Biri bile
      sağlanmazsa öğe listeye HİÇ girmez — "gizli ama DOM'da duruyor" gibi bir
      ara hâl üretilmez, çünkü öyle bir öğe ekran okuyucuya ve klavyeye
      görünmeye devam ederdi.
    */
    portal.available && portal.href && basliktaGosterilsin
      ? {
          href: portal.href,
          label: options.staffLoginLabel,
          trackId: 'portal:topbar',
          notice: portal.notice ?? null,
        }
      : null,
  ].filter(Boolean) as PortalLink[]
}
