import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/locales'
import { href } from '@/i18n/routes'
import { buildDefaultMainMenu } from '@/lib/defaultNavigation'
import { buildPortalLinks } from '@/lib/portalLinks'
import { getLayoutData } from '@/lib/queries'
import { resolveNavItems } from '@/lib/resolveLink'

import { BrandMark } from './BrandMark'
import { HeaderShell } from './HeaderShell'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MainNav } from './MainNav'
import { PortalLinks } from './PortalLinks'
import { TopUtilityBar } from './TopUtilityBar'

type Props = {
  locale: Locale
  /** Detay sayfalarında dil değiştiricinin doğru kayda gitmesi için. */
  localeAlternates?: Partial<Record<Locale, string>>
}

type MediaLike = { url?: string | null; alt?: string | null; width?: number; height?: number }

type PartnerLogo = {
  name?: string | null
  order?: number | null
  image?: MediaLike | number | null
}

const mediaOf = (value: unknown): MediaLike | null =>
  value && typeof value === 'object' && 'url' in value ? (value as MediaLike) : null

/**
 * SİTE BAŞLIĞI (sunucu bileşeni)
 * ============================================================================
 * Veriyi çeker, bağlantıları çözer ve etkileşimli kabuğa (HeaderShell) verir.
 * Menü verisi sunucuda hazırlanır — istemciye CMS ham verisi gitmez.
 *
 * ---------------------------------------------------------------------------
 * KURUM KİMLİĞİ BLOĞU — RESMÎ LOGOLAR KODA GÖMÜLMEZ
 * ---------------------------------------------------------------------------
 * Şartname 10.2: "logo, isim, proje bilgisi, ortaklık bilgisi ve görünürlük
 * unsurları FAO, Tarım ve Orman Bakanlığı ve OGM'nin ilgili görünürlük
 * kurallarına uygun olmalıdır."
 *
 * Bu yüzden FAO ve OGM amblemleri BU DOSYADA ÇİZİLMEZ ve bir CDN'den
 * çekilmez. Üçü de panelden yüklenir:
 *     Genel Ayarlar > Logolar > Ana Logo             → merkez logosu
 *     Genel Ayarlar > Logolar > Kurum / Ortak Logolar → OGM, FAO, Bakanlık
 * Yüklenmemişse blok yalnızca nötr amblem + kurum adıyla kalır; sahte bir
 * resmî logo üretilmez.
 *
 * Başlıkta en fazla ÜÇ ortak logosu gösterilir (`order` ile sıralanır).
 * Tamamı, görünürlük kurallarının istediği tam boyda, footer'daki proje
 * görünürlük şeridinde durur (bkz. ProjectVisibilityStrip).
 * ============================================================================
 */
export const SiteHeader = async ({ locale, localeAlternates }: Props) => {
  const t = await getTranslations('nav')
  const { settings, navigation, services } = await getLayoutData(locale)

  /**
   * Menü CMS'ten gelir. Global henüz doldurulmamışsa (yeni kurulum, seed
   * çalıştırılmamış veritabanı) üst bar boş kalmaz: `ROUTES` üzerinden
   * kurulan varsayılan menüye düşülür. Bkz. lib/defaultNavigation.ts
   *
   * Çözümleme her iki durumda da AYNI `resolveNavItems`'tan geçer; böylece
   * Dijital Kütüphane'nin "yakında" davranışı, dış bağlantı işaretlemesi ve
   * aktif öğe tespiti varsayılan menüde de aynen çalışır.
   */
  const cmsItems = resolveNavItems(
    (navigation as { mainMenu?: unknown[] }).mainMenu as never,
    { locale, services: services as never },
  )

  const items =
    cmsItems.length > 0
      ? cmsItems
      : resolveNavItems(buildDefaultMainMenu(t) as never, {
          locale,
          services: services as never,
        })

  const logos = (settings as { logos?: { primary?: unknown; partnerLogos?: PartnerLogo[] } }).logos
  const logo = mediaOf(logos?.primary)
  const siteName = (settings as { siteName?: string }).siteName ?? 'AIFTC'
  const siteShortName = (settings as { siteShortName?: string | null }).siteShortName ?? null

  /**
   * Kardeş portallar TEK YERDE kurulur (bkz. lib/portalLinks.ts) ve iki
   * yere verilir: masaüstünde üst hizmet şeridi, mobilde menü paneli.
   */
  const portals = buildPortalLinks(services as never, settings as never, {
    locale,
    staffLoginLabel: t('staffLogin'),
    projectFallbackLabel: t('projectPortal'),
  })

  const partners = (logos?.partnerLogos ?? [])
    .slice()
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
    .map((partner) => ({ name: partner.name ?? '', image: mediaOf(partner.image) }))
    .filter((partner) => partner.image?.url)
    .slice(0, 3)

  return (
    <HeaderShell
      /*
        `key` NEDEN GEREKLİ — silinmemeli.
        Bu iki eleman AYNI bileşen tipinden (`MainNav`) ve SUNUCU bileşeninden
        İSTEMCİ bileşenine (HeaderShell) prop olarak geçiyor. RSC yükünde
        serileştirilirken React bunları tek bir çocuk listesi gibi ele alıyor
        ve her sayfa yüklenişinde "Each child in a list should have a unique
        key prop" uyarısını basıyordu. Uyarının kaynağı ikili eleme ile
        bulundu: yalnızca `MainNav` açıkken geliyor, açık `key` verilince
        kayboluyor. Sorun listede değil, sınırda.
      */
      nav={<MainNav key="desktop-nav" items={items} variant="desktop" />}
      mobileNav={<MainNav key="mobile-nav" items={items} variant="mobile" />}
      topBar={
        <TopUtilityBar
          locale={locale}
          portals={portals}
          languageSwitcher={<LanguageSwitcher alternates={localeAlternates} variant="bar" />}
        />
      }
      mobileUtility={
        portals.length > 0 ? (
          <nav aria-label={t('portalsLabel')}>
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-ink-600">
              {t('portalsLabel')}
            </p>
            <PortalLinks
              items={portals}
              variant="panel"
              comingSoonLabel={t('comingSoonBadge')}
            />
          </nav>
        ) : null
      }
      brand={
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href={href('home', locale)}
            className="flex min-w-0 items-center gap-3 rounded py-1"
            aria-label={`${siteName} — ${t('home')}`}
          >
            {/*
              Yüklenmiş kurum logosu varsa o; yoksa nötr amblem
              (bkz. components/layout/BrandMark). Başlık hiçbir durumda
              yalnızca düz metinden ibaret kalmaz.
            */}
            {logo?.url ? (
              <Image
                src={logo.url}
                alt=""
                width={logo.width ?? 200}
                height={logo.height ?? 56}
                priority
                className="h-12 w-auto shrink-0"
              />
            ) : (
              <BrandMark />
            )}

            {/*
              İKİ SATIRLI KİMLİK — WHO/ILO deseni.
              Üstte kısa ad (marka), altında kurumun tam unvanı. Tek satırda
              uzun unvan menüyle aynı puntoda yarışır ve başlığın "marka"
              olduğu okunmaz. Kısa ad tanımlı değilse yalnızca tam unvan
              basılır — uydurma bir kısaltma üretilmez.
            */}
            <span className="min-w-0">
              {siteShortName ? (
                <>
                  <span className="block text-lg font-bold leading-none tracking-tight text-shell-900">
                    {siteShortName}
                  </span>
                  <span className="mt-1 block truncate text-xs leading-tight text-ink-600 sm:text-sm">
                    {siteName}
                  </span>
                </>
              ) : (
                <span className="block text-base font-bold leading-tight text-shell-900 sm:text-lg">
                  {siteName}
                </span>
              )}
            </span>
          </Link>

          {/*
            ORTAKLIK BLOĞU — ince dikey çizgiyle ayrılır.
            `alt=""`: aynı kurum adları footer'daki görünürlük şeridinde tam
            hâliyle veriliyor; başlıkta ikinci kez duyurulması ekran okuyucuda
            gürültü olurdu (WCAG 2.2 — 1.1.1). Yine de küme `role="group"` +
            `aria-label` ile adlandırılır ki atlanabilsin, ve adlar `sr-only`
            olarak bir kez okunur.
          */}
          {partners.length > 0 ? (
            <div
              role="group"
              aria-label={t('partnersLabel')}
              className="hidden items-center gap-4 border-l border-line pl-4 md:flex"
            >
              {partners.map((partner, index) => (
                <Image
                  key={`${partner.name}-${index}`}
                  src={partner.image?.url ?? ''}
                  alt=""
                  width={partner.image?.width ?? 120}
                  height={partner.image?.height ?? 44}
                  className="h-9 w-auto shrink-0 object-contain"
                />
              ))}
              <span className="sr-only">{partners.map((p) => p.name).join(', ')}</span>
            </div>
          ) : null}
        </div>
      }
    />
  )
}

export default SiteHeader
