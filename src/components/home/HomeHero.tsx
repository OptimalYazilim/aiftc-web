import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import type { ExternalService } from '@/payload-types'

import type { Locale } from '@/i18n/locales'
import { getExternalServices, getHomepage, getSiteSettings } from '@/lib/queries'
import { resolveNavItem, type NavItemInput, type ResolvedNavLink } from '@/lib/resolveLink'

import { ExternalLink } from '../ui/ExternalLink'

/**
 * ANA SAYFA HERO — EDİTORYAL / ETKİ MODELİ  (Şartname 6.1)
 * ============================================================================
 * İçeriğin tamamı `globals/Homepage.ts` üzerinden yönetilir. Bu dosyada
 * hiçbir metin, adres veya görsel sabit yazılmaz.
 *
 * ---------------------------------------------------------------------------
 * NEDEN İKİ KOLONLU DEĞİL, SOL ALTTA TEK BLOK
 * ---------------------------------------------------------------------------
 * Önceki sürüm iki kolonluydu: solda başlık, sağda "cam panel" içinde üç
 * öne çıkan madde. O yerleşim bir SaaS açılış sayfası desenidir — fotoğrafın
 * konusunu paneller örter ve göz iki eşit ağırlıklı blok arasında bölünür.
 *
 * WHO, ILO ve FAO portallarının ortak deseni şudur:
 *     tam genişlikte tek fotoğraf → aşağıdan yukarı güçlenen perde →
 *     metin SOL ALTTA, tek bir aksiyon.
 * Fotoğraf konuşur, tipografi onu sahiplenir. Öne çıkan maddeler Hero'nun
 * İÇİNDEN çıkarılıp altındaki açık zeminli "temel bilgiler" şeridine alındı
 * (bkz. aynı dosyadaki ikinci <section>).
 *
 * ---------------------------------------------------------------------------
 * GÜVENLİ KARARTMA KATMANI — ÖLÇÜM DEĞİŞMEDİ
 * ---------------------------------------------------------------------------
 * Arka plan fotoğrafı editör tarafından yüklendiği için parlak bir görsel
 * gelebilir. Beyaz başlığın her koşulda okunabilir kalması gerekir
 * (WCAG 2.2 — 1.4.3 Kontrast (Asgari), AA).
 *
 * Görselin üzerine shell-950 renginde DÜZ bir taban katmanı konur ve
 * saydamlığı `OVERLAY_MIN` ile SINIRLANIR. Panelde de aynı alt sınır
 * doğrulanır; buradaki `clamp` ikinci savunma hattıdır: eski kayıtlar,
 * içe aktarılan veriler veya API üzerinden yapılan güncellemeler panel
 * doğrulamasını atlayabilir, bu satırı atlayamaz.
 *
 * Ölçüm — en kötü durum, TAMAMEN BEYAZ bir fotoğraf üzerinde beyaz metin:
 *     opaklık 0.60 → 4.48:1   ✗ AA sağlanmaz
 *     opaklık 0.65 → 5.28:1   ✓ taban değer
 *     opaklık 0.72 → 6.6:1    ✓ varsayılan
 *     opaklık 0.92 → 12.9:1
 *
 * Taban katmanın ÜSTÜNE editoryal perde (`hero-scrim`, globals.css) biner.
 * Perde yalnızca KOYULAŞTIRIR — hiçbir noktada açmaz — dolayısıyla yukarıdaki
 * ölçüm geçerliliğini korur; metnin durduğu SOL ALT bölgede kontrast fiilen
 * daha da yükselir. Bu, taban değerin yerine geçmez; onun üstüne pay ekler.
 *
 * ---------------------------------------------------------------------------
 * Görsel `alt=""` ile dekoratif işaretlenir: anlamı başlık taşır, görselin
 * ikinci kez okunması ekran okuyucu kullanıcısı için gürültüdür
 * (WCAG 2.2 — 1.1.1). Bunun karşılığı olarak, Homepage global'i editörü
 * görselin İÇİNE metin yazmaması konusunda uyarır (1.4.5).
 * ============================================================================
 */

/** Karartmanın altına inilemeyecek değer. Bkz. yukarıdaki ölçüm tablosu. */
const OVERLAY_MIN = 0.65
const OVERLAY_MAX = 0.92
/** shell-950 — karartma rengi. globals.css ile aynı değer. */
const OVERLAY_RGB = '4, 32, 27'

type MediaLike = {
  url?: string | null
  width?: number | null
  height?: number | null
}

type HeroCta = NavItemInput & { label?: string | null }

type Hero = {
  eyebrow?: string | null
  headline?: string | null
  subheadline?: string | null
  backgroundImage?: MediaLike | number | string | null
  overlay?: { opacity?: number | null; style?: string | null } | null
  primaryCta?: HeroCta | null
  secondaryCta?: HeroCta | null
  stats?: { value?: string | null; label?: string | null; id?: string | null }[] | null
  highlights?: { title?: string | null; description?: string | null; id?: string | null }[] | null
}

const mediaOf = (value: Hero['backgroundImage']): MediaLike | null =>
  value && typeof value === 'object' && 'url' in value && value.url ? value : null

/** Panelden ne gelirse gelsin okunabilir bir değere indirger. */
const safeOverlayOpacity = (raw: unknown): number => {
  const numeric = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(numeric)) return 0.72
  return Math.min(OVERLAY_MAX, Math.max(OVERLAY_MIN, numeric / 100))
}

const resolveCta = (
  cta: HeroCta | null | undefined,
  context: { locale: Locale; services: ExternalService },
): ResolvedNavLink | null => {
  if (!cta?.label) return null

  const link = resolveNavItem(cta, context)
  return link.hidden || !link.href || !link.available ? null : link
}

export const HomeHero = async ({ locale }: { locale: Locale }) => {
  const [homepage, settings, services] = await Promise.all([
    getHomepage(locale),
    getSiteSettings(locale),
    getExternalServices(locale),
  ])

  const hero = ((homepage as { hero?: Hero }).hero ?? {}) as Hero
  const site = settings as { siteName?: string | null; tagline?: string | null }

  // H1 her sayfada bulunmak zorundadır (WCAG 2.2 — 1.3.1, 2.4.6).
  // Hero başlığı boşsa kurum adına düşülür; başlıksız sayfa üretilmez.
  const headline = hero.headline?.trim() || site.siteName || 'AIFTC'
  const subheadline = hero.subheadline?.trim() || site.tagline || null

  const image = mediaOf(hero.backgroundImage)
  const opacity = safeOverlayOpacity(hero.overlay?.opacity)

  const ctaContext = { locale, services: services as ExternalService }
  const primary = resolveCta(hero.primaryCta, ctaContext)
  const secondary = resolveCta(hero.secondaryCta, ctaContext)

  const stats = (hero.stats ?? []).filter((item) => item.value && item.label)
  const highlights = (hero.highlights ?? []).filter((item) => item.title?.trim())

  return (
    <>
      <section
        aria-labelledby="hero-headline"
        // `isolate`: içerideki negatif z-index'ler sayfanın geri kalanına sızmaz.
        className="relative isolate overflow-hidden bg-shell-950 text-white"
      >
        {image?.url ? (
          <>
            <Image
              src={image.url}
              alt=""
              aria-hidden="true"
              fill
              // LCP öğesi: geciktirilmez, öncelikli yüklenir (Şartname 14.1).
              priority
              sizes="100vw"
              className="-z-20 object-cover"
            />
            {/* Taban karartma — ölçülmüş alt sınır. Düz, tek renk. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10"
              style={{ backgroundColor: `rgba(${OVERLAY_RGB}, ${opacity})` }}
            />
          </>
        ) : (
          /*
            Görsel yoksa: matematiksel ızgara DEĞİL, katmanlı ışık
            (`hero-editorial`, globals.css). Beyaz metinle ölçülen ≈15.9:1.

            EDİTÖRE NOT: bu zemin bir YER TUTUCUDUR. Kurumsal portal
            standardı, Hero'da gerçek bir saha fotoğrafı (eğitim, simülasyon
            merkezi, arazi çalışması) bekler. Görsel panelden yüklenir:
            Ana Sayfa > Hero > Arka Plan Görseli.
          */
          <div aria-hidden="true" className="hero-editorial absolute inset-0 -z-20" />
        )}

        {/*
          EDİTORYAL PERDE
          Alttan yukarı ve soldan sağa güçlenir; metnin oturduğu sol alt
          bölgeyi koyulaştırır, fotoğrafın sağ üst köşesini açık bırakır.
          Yalnızca koyulaştırdığı için taban ölçümünü bozmaz.

          Panelde Karartma Biçimi "düz" seçilirse perde UYGULANMAZ — o seçim
          hâlâ anlamlıdır: bazı fotoğraflarda (örn. gökyüzü ağırlıklı) yönlü
          bir perde konuyu ikiye böler, editör düz karartmayı tercih edebilir.
        */}
        {hero.overlay?.style === 'solid' ? null : (
          <div aria-hidden="true" className="hero-scrim absolute inset-0 -z-10" />
        )}

        {/*
          SOL ALT YERLEŞİM
          `justify-end` ile içerik alt kenara yaslanır; `min-h` ile fotoğrafa
          nefes alacak yükseklik verilir. `clamp` kullanılmasının sebebi kısa
          ekranlarda Hero'nun ekranı tümüyle yutmaması — 62vh üst sınırı
          aşağıdaki içeriğin varlığını her zaman belli eder.
        */}
        <div className="container-page flex min-h-[clamp(26rem,62vh,38rem)] flex-col justify-end pb-12 pt-20 sm:pb-16 sm:pt-24 lg:pb-20">
          <div className="max-w-4xl">
            {/*
              ÜST ETİKET — DOLU BLOK
              Önceki sürümde ince, harf aralığı açılmış bir metin satırıydı ve
              fotoğrafın üzerinde eriyip gidiyordu. WHO/ILO deseninde bu satır
              DOLU BİR ETİKET BLOĞUDUR: koyu zümrüt zemin, beyaz metin. Böylece
              fotoğrafın parlaklığından bağımsız olarak okunur.

              KONTRAST: brand-800 (#0a4423) zemin üzerinde beyaz → 11.27:1.
              Zemin opak olduğu için bu değer fotoğraftan ETKİLENMEZ.
            */}
            {hero.eyebrow ? (
              <p className="mb-6 inline-flex items-center bg-brand-800 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white sm:text-sm">
                {hero.eyebrow}
              </p>
            ) : null}

            {/*
              `tracking-tight` + `font-bold`: büyük puntoda harf araları
              genişledikçe başlık dağınık görünür, sıkılaştırma onu tek bir
              kütle hâlinde tutar. `text-balance` satır sonlarını dengeler.
              `drop-shadow`: fotoğraflı dalda harflerin kenarını ayırır —
              kontrastı DEĞİL, kenar netliğini artırır.
            */}
            <h1
              id="hero-headline"
              className="text-balance text-[2.5rem] font-bold leading-[1.08] tracking-tight text-white [text-shadow:0_2px_18px_rgba(4,32,27,0.45)] sm:text-5xl lg:text-6xl"
            >
              {headline}
            </h1>

            {subheadline ? (
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90">
                {subheadline}
              </p>
            ) : null}

            {/*
              TEK VE NET AKSİYON
              Birincil eylem dolu bir butondur. İkincil eylem — panelde
              tanımlıysa — buton DEĞİL, oklu bir metin bağlantısıdır: iki eşit
              ağırlıklı buton yan yana durduğunda ziyaretçi hangisinin asıl
              yol olduğunu okuyamıyordu. İkincil bağlantı gizlenmez, çünkü
              içeriği editör tanımladı; yalnızca ağırlığı düşürülür.
            */}
            {primary || secondary ? (
              <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
                {primary ? <HeroButton link={primary} /> : null}
                {secondary ? <HeroTextLink link={secondary} /> : null}
              </div>
            ) : null}
          </div>
        </div>

        {stats.length > 0 ? (
          <div className="relative border-t border-white/20 bg-shell-950/45 backdrop-blur-sm">
            <div className="container-page">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-6 py-8 md:grid-cols-4">
                {stats.map((stat, index) => (
                  <div key={`${stat.value}-${index}`} className="flex flex-col">
                    <dt className="order-2 mt-1 text-sm leading-snug text-white/80">
                      {stat.label}
                    </dt>
                    <dd className="order-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ) : null}
      </section>

      {/*
        TEMEL BİLGİLER ŞERİDİ — Hero'dan çıkarılan "öne çıkanlar"
        ------------------------------------------------------------------
        Cam panel yerine açık zeminli, dikey çizgilerle bölünmüş üç sütun.
        Bu, ILO ve WHO'nun "key facts" şeridiyle aynı yapıdır: kart yok,
        gölge yok, kutu yok — yalnızca tipografi ve ince ayraçlar.

        `<ul>`: üç madde bir listedir; ekran okuyucu kaç madde olduğunu
        söyler. Başlıklar `<strong>` değil `<p>` + font ağırlığı ile verilir —
        görsel vurgu semantik vurgu değildir.
      */}
      {highlights.length > 0 ? (
        <section aria-labelledby="hero-highlights" className="border-b border-line-soft bg-surface-warm">
          <h2 id="hero-highlights" className="sr-only">
            {site.siteName ?? 'AIFTC'}
          </h2>
          <ul className="container-page grid gap-px py-10 sm:grid-cols-3 sm:gap-0">
            {highlights.map((item, index) => (
              <li
                key={`${item.title}-${index}`}
                className={`px-0 sm:px-8 ${
                  index === 0 ? 'sm:pl-0' : 'sm:border-l sm:border-line-soft'
                } ${index > 0 ? 'mt-6 border-t border-line-soft pt-6 sm:mt-0 sm:border-t-0 sm:pt-0' : ''}`}
              >
                <p className="text-lg font-bold leading-snug tracking-tight text-shell-900">
                  {item.title}
                </p>
                {item.description ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{item.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  )
}

/**
 * BİRİNCİL AKSİYON — dolu beyaz zemin, shell-900 metin.
 * Ölçüm: beyaz üzerine shell-900 → 15.74:1.
 * Hover'da "parlama" OPAKLIKLA değil GÖLGE ile kurulur; böylece metnin
 * kontrastı hiçbir durumda değişmez.
 */
const HeroButton: React.FC<{ link: ResolvedNavLink }> = ({ link }) => {
  const className =
    'ease-editorial inline-flex min-h-12 items-center justify-center rounded-sm bg-white px-7 text-base font-bold text-shell-900 transition-colors duration-300 hover:bg-brand-50 focus-visible:bg-brand-50'

  if (!link.href) return null

  return link.isExternal ? (
    <ExternalLink href={link.href} trackId={link.trackId} className={className}>
      {link.label}
    </ExternalLink>
  ) : (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  )
}

/**
 * İKİNCİL AKSİYON — metin bağlantısı.
 * Alt çizgi KALICIDIR: koyu fotoğraf üzerinde rengi tek başına ayırt edici
 * saymak 1.4.1'i ihlal ederdi. Ok, hover'da sağa kayar (2.3.3 gereği
 * `prefers-reduced-motion` altında otomatik olarak durur).
 */
const HeroTextLink: React.FC<{ link: ResolvedNavLink }> = ({ link }) => {
  const className =
    'group inline-flex min-h-12 items-center gap-2 text-base font-semibold text-white underline decoration-white/50 decoration-2 underline-offset-8 transition-colors hover:decoration-white focus-visible:decoration-white'

  const content = (
    <>
      {link.label}
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 16 16"
        width="1em"
        height="1em"
        className="transition-transform duration-300 group-hover:translate-x-1"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.5 8h11M9.5 4l4 4-4 4"
        />
      </svg>
    </>
  )

  if (!link.href) return null

  return link.isExternal ? (
    <ExternalLink href={link.href} trackId={link.trackId} className={className}>
      {content}
    </ExternalLink>
  ) : (
    <Link href={link.href} className={className}>
      {content}
    </Link>
  )
}

export default HomeHero
