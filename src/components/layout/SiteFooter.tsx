import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/locales'
import { href } from '@/i18n/routes'
import { TOPIC_PARAM } from '@/lib/catalogParams'
import { buildDefaultMainMenu } from '@/lib/defaultNavigation'
import { getFooterTopics, getLayoutData } from '@/lib/queries'
import { resolveNavItems, type ResolvedNavLink } from '@/lib/resolveLink'

import { ExternalLink } from '../ui/ExternalLink'
import { BrandMark } from './BrandMark'
import { ProjectVisibilityStrip } from './ProjectVisibilityStrip'
import { SocialIcon } from './SocialIcon'

type Props = { locale: Locale }

/**
 * ALT BİLGİ — ILO / WHO STANDARDI  (Şartname 6.9, 10.2, 12.2–12.3, 13)
 * ============================================================================
 * DÖRT KATMAN, YUKARIDAN AŞAĞIYA
 *
 *   A. Kurumsal başlık şeridi
 *        sol   → kurumun kısa tanımı
 *        orta  → resmî amblem / logo yerleşimi
 *        sağ   → "Bültene Abone Olun" kurumsal aksiyonu
 *   B. Dört sütunlu bağlantı ızgarası (kimlik, hızlı menü, konular, iletişim)
 *   C. Proje görünürlük şeridi (FAO / Bakanlık / OGM logoları — Şartname 10.1)
 *   D. Alt çizgi: telif · sosyal medya ikonları · hukuki bağlantılar
 *
 * ZEMİN TONU
 * brand-900 (#062e15) yerine shell-950 (#04201b). Saf yeşil geniş bir yüzeye
 * yayıldığında "marka bloğu" gibi okunuyor ve içerikle footer arasındaki
 * hiyerarşiyi zayıflatıyordu. Kurumsal portallarda footer, sayfanın en
 * OTURAKLI yüzeyidir; tonun içeriğe göre daha derin olması gerekir.
 *
 * KONTRAST — zemin shell-950 (#04201b), ölçülmüş değerler:
 *     beyaz metin     17.11:1
 *     brand-100       14.24:1
 *     white/75         9.96:1
 *     white/60         6.83:1
 *     white/40 kenarlık 3.74:1   (1.4.11 sınırı 3:1 — altına inilmemeli)
 * Bunların altına inen bir ton kullanılmamalıdır; zemin de açılmamalıdır.
 *
 * İÇERİK NEREDEN GELİYOR
 * Hiçbir sütunda kurum bilgisi sabit yazılmaz. Metinler Genel Ayarlar'dan,
 * konular Eğitim Konuları koleksiyonundan, bağlantılar `ROUTES` sözlüğünden
 * gelir. Editör CMS'te `footerColumns` tanımlarsa ek sütunlar olarak eklenir.
 * ============================================================================
 */

const LINK_CLASS =
  'inline-block py-1 text-[0.9375rem] leading-snug text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:text-white focus-visible:underline'

const FooterLink: React.FC<{ link: ResolvedNavLink }> = ({ link }) => {
  if (!link.available || !link.href) {
    /*
      "Yakında" olan bağlantı: tıklanamaz ama OKUNABİLİR kalmalı — burada
      gerçek bir bilgi var ("bu bölüm var, henüz açılmadı"). white/40
      shell-950 üzerinde 3.74:1 verir; etkin olmayan bileşenler 1.4.3
      kapsamı dışında olsa da bu metin bilgi taşıdığı için white/55'e
      (5.94:1) çekildi.
    */
    return (
      <span aria-disabled="true" className="inline-block py-1 text-[0.9375rem] leading-snug text-white/55">
        {link.label}
        {link.notice ? <span className="sr-only">. {link.notice}</span> : null}
      </span>
    )
  }

  return link.isExternal ? (
    <ExternalLink href={link.href} trackId={link.trackId} className={LINK_CLASS}>
      {link.label}
    </ExternalLink>
  ) : (
    <Link href={link.href} aria-label={link.ariaLabel} className={LINK_CLASS}>
      {link.label}
    </Link>
  )
}

/** Sütun başlığı: küçük punto, geniş harf aralığı, altında ince ayırıcı. */
/** İletişim satırı ikonu — dekoratif; bilgi metinde yazılı. */
const IletisimIkonu: React.FC<{ tur: 'adres' | 'telefon' | 'eposta' }> = ({ tur }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 16 16"
    className="mt-0.5 h-4 w-4 shrink-0 text-brand-100"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {tur === 'adres' ? (
      <>
        <path d="M8 14.5s4.5-4.2 4.5-7.8a4.5 4.5 0 1 0-9 0c0 3.6 4.5 7.8 4.5 7.8Z" />
        <circle cx="8" cy="6.7" r="1.6" />
      </>
    ) : tur === 'telefon' ? (
      <path d="M5.2 2.5 3 3.2c-.5.2-.8.7-.7 1.2.7 4.2 4.1 7.6 8.3 8.3.5.1 1-.2 1.2-.7l.7-2.2-2.6-1.4-1.3 1.2A7 7 0 0 1 5.2 6.2l1.2-1.3Z" />
    ) : (
      <>
        <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
        <path d="m2.5 4.5 5.5 4.2 5.5-4.2" />
      </>
    )}
  </svg>
)

const ColumnHeading: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <h2
    id={id}
    className="mb-4 border-b border-white/10 pb-3 text-xs font-semibold uppercase tracking-wider text-white/90"
  >
    {children}
  </h2>
)

type MediaLike = { url?: string | null; width?: number | null; height?: number | null }

const mediaOf = (value: unknown): MediaLike | null =>
  value && typeof value === 'object' && 'url' in value ? (value as MediaLike) : null

export const SiteFooter = async ({ locale }: Props) => {
  const t = await getTranslations('footer')
  const tn = await getTranslations('nav')

  const [{ settings, navigation, services }, topics] = await Promise.all([
    getLayoutData(locale),
    getFooterTopics(locale),
  ])

  const cmsColumns = (
    (navigation as { footerColumns?: { heading?: string; links?: unknown[] }[] }).footerColumns ??
    []
  ).map((column) => ({
    heading: column.heading ?? '',
    links: resolveNavItems(column.links as never, { locale, services: services as never }),
  }))

  /**
   * Hızlı menü: CMS'te footer sütunu tanımlı değilse ana menünün aynısı
   * kullanılır. Böylece footer hiçbir zaman boş kalmaz ve iki menü arasında
   * tutarsızlık oluşmaz.
   */
  const quickLinks = resolveNavItems(buildDefaultMainMenu(tn) as never, {
    locale,
    services: services as never,
  })

  const legalLinks = resolveNavItems(
    (navigation as { footerLegalLinks?: unknown[] }).footerLegalLinks as never,
    { locale, services: services as never },
  )

  const contact = (settings as {
    contact?: {
      organizationName?: string | null
      address?: string | null
      phone?: string | null
      email?: string | null
      trainingEmail?: string | null
      socialLinks?: { platform?: string | null; url?: string | null }[] | null
    }
  }).contact

  const site = settings as {
    siteName?: string | null
    siteShortName?: string | null
    tagline?: string | null
    defaultDescription?: string | null
    logos?: { primaryDark?: unknown; primary?: unknown }
  }
  const siteName = site.siteName ?? 'AIFTC'

  /**
   * Koyu zemin logosu varsa O kullanılır. Yoksa açık zemin logosuna DÜŞÜLMEZ:
   * çoğu kurum logosu koyu mürekkeple çizilidir ve shell-950 üzerinde
   * kaybolur. Bu durumda vektörel amblem basılır — o `currentColor` ile
   * çalıştığı için beyaza boyanabilir.
   */
  const darkLogo = mediaOf(site.logos?.primaryDark)

  const social = (contact?.socialLinks ?? []).filter(
    (item): item is { platform: string; url: string } =>
      Boolean(item?.platform?.trim() && item?.url?.trim()),
  )

  /**
   * BÜLTEN AKSİYONU — ÇALIŞAN, DÜRÜST BİR YOL
   * Sitede henüz bülten altyapısı (çift onaylı abonelik, KVKK açık rıza kaydı,
   * çıkış bağlantısı) YOKTUR. Buraya sahte bir e-posta kutusu koymak, verisini
   * hiçbir yere yazmadığımız bir formu kurumsal bir taahhüt gibi göstermek
   * olurdu.
   *
   * İKİ AŞAMALI ÇÖZÜM — ikisi de gerçekten çalışır:
   *   1. Genel Ayarlar'da eğitim/iletişim e-postası tanımlıysa: konusu
   *      hazırlanmış bir e-posta taslağı açılır. Ziyaretçi ne gönderdiğini
   *      görür, kurum talebi kendi yazışma sisteminde kayda alır.
   *   2. Tanımlı değilse: iletişim sayfasına gidilir — orada KVKK açık rıza
   *      onayı olan gerçek bir form vardır.
   * Hiçbir durumda tıklandığında hiçbir şey yapmayan bir buton bırakılmaz.
   */
  const newsletterAddress = contact?.trainingEmail?.trim() || contact?.email?.trim() || null
  const newsletterHref = newsletterAddress
    ? `mailto:${newsletterAddress}?subject=${encodeURIComponent(t('newsletterSubject'))}`
    : href('contact', locale)

  return (
    <footer className="mt-16 bg-shell-950 text-white/75">
      {/* ================= A) Kurumsal başlık şeridi ===================== */}
      {/*
        Solda kurum kimliği (işaret + kısa ad + slogan) TEK blok, sağda bülten
        çağrısı kart içinde. Önceki üç ayrık parça (slogan · amblem · bülten)
        birbirinden kopuk duruyordu. Arkadaki eş yükselti çizgileri ana
        sayfadaki kapanış bandıyla aynı motiftir; dekoratiftir.
      */}
      <div className="relative isolate overflow-hidden border-b border-white/10">
        <svg
          aria-hidden="true"
          className="absolute -left-40 -top-48 -z-10 h-[30rem] w-[30rem] text-white/[0.05]"
          viewBox="0 0 400 400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          {[40, 70, 100, 130, 160, 190, 220].map((r, i) => (
            <path
              key={r}
              d={`M ${200 - r} 200 C ${200 - r} ${200 - r * 0.9 - i * 4}, ${200 + r * 0.8} ${200 - r - i * 6}, ${200 + r} ${200 - i * 3} S ${200 + r * 0.3} ${200 + r * 1.05}, ${200 - r * 0.2} ${200 + r * 0.95} S ${200 - r} ${200 + r * 0.4}, ${200 - r} 200 Z`}
            />
          ))}
        </svg>

        <div className="container-page grid gap-8 py-12 lg:grid-cols-12 lg:items-center">
          {/* sol — kurum kimliği */}
          <div className="flex items-center gap-5 lg:col-span-7">
            {darkLogo?.url ? (
              <Image
                src={darkLogo.url}
                alt=""
                width={darkLogo.width ?? 220}
                height={darkLogo.height ?? 64}
                className="h-14 w-auto shrink-0"
              />
            ) : (
              <BrandMark className="h-16 w-16 text-white" />
            )}
            <div>
              <p className="text-lg font-bold tracking-[0.18em] text-white">
                {site.siteShortName ?? siteName}
              </p>
              <p className="mt-1 max-w-md text-balance leading-relaxed text-white/65">
                {site.tagline?.trim() || t('mission')}
              </p>
            </div>
          </div>

          {/* sağ — bülten aksiyonu */}
          <div className="rounded-card border border-white/10 bg-white/[0.04] p-6 lg:col-span-5">
            <p className="font-semibold text-white">{t('newsletterHeading')}</p>
            <p className="mt-1 text-sm leading-relaxed text-white/65">{t('newsletterIntro')}</p>
            {/*
              `mailto:` bir dış bağlantı değildir — yeni sekme açmaz,
              izleme gerektirmez. İletişim sayfasına düşüldüğünde de aynı
              düz <a> kullanılır: hedef site içidir, ön yükleme gerekmez.
            */}
            <a
              href={newsletterHref}
              className="group mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-white px-5 text-sm font-bold text-shell-950 transition-colors hover:bg-brand-50 focus-visible:bg-brand-50"
            >
              {t('newsletterCta')}
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 16 16"
                width="1em"
                height="1em"
                className="transition-transform duration-300 group-hover:translate-x-1 group-focus-within:translate-x-1"
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
            </a>
          </div>
        </div>
      </div>

      {/* ================= B) Dört sütunlu ızgara ======================== */}
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
        {/* --- 1) Kurumsal kimlik ---------------------------------------- */}
        <section aria-labelledby="footer-identity" className="lg:col-span-4 lg:pr-8">
          <ColumnHeading id="footer-identity">{t('identityHeading')}</ColumnHeading>

          <p className="font-semibold leading-snug text-white">{siteName}</p>

          {contact?.organizationName ? (
            <p className="mt-2 text-sm text-brand-100">{contact.organizationName}</p>
          ) : null}

          {/* Misyon özeti: SEO açıklaması girilmişse o, yoksa arayüz metni. */}
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            {site.defaultDescription?.trim() || t('mission')}
          </p>
        </section>

        {/* --- 2) Hızlı menü --------------------------------------------- */}
        <nav aria-labelledby="footer-quick" className="lg:col-span-2">
          <ColumnHeading id="footer-quick">{t('quickLinksHeading')}</ColumnHeading>
          <ul>
            {quickLinks.map((link, index) => (
              <li key={`${link.label}-${index}`}>
                <FooterLink link={link} />
              </li>
            ))}
          </ul>
        </nav>

        {/* --- 3) Öne çıkan başlıklar ------------------------------------ */}
        {topics.length > 0 ? (
          <nav aria-labelledby="footer-topics" className="lg:col-span-3">
            <ColumnHeading id="footer-topics">{t('topicsHeading')}</ColumnHeading>
            <ul>
              {topics.map((topic) => (
                <li key={String(topic.id)}>
                  {/*
                    Katalogu bu konuyla önseçilmiş açar (bkz. TOPIC_PARAM).
                    Bağlantı dekoratif değildir: hedef sayfa filtreyi uygular.
                  */}
                  <Link
                    href={`${href('training-programs', locale)}?${TOPIC_PARAM}=${topic.slug ?? ''}`}
                    className={LINK_CLASS}
                  >
                    {topic.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {/* --- 4) İletişim ------------------------------------------------ */}
        <section aria-labelledby="footer-contact" className="lg:col-span-3">
          <ColumnHeading id="footer-contact">{t('contactHeading')}</ColumnHeading>

          <address className="not-italic text-sm leading-relaxed">
            <ul className="space-y-3">
              {contact?.address ? (
                <li className="flex gap-3">
                  <IletisimIkonu tur="adres" />
                  <span className="whitespace-pre-line">{contact.address}</span>
                </li>
              ) : null}
              {contact?.phone ? (
                <li className="flex gap-3">
                  <IletisimIkonu tur="telefon" />
                  <a
                    href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}
                    className="text-white/75 underline-offset-4 hover:text-white hover:underline focus-visible:text-white focus-visible:underline"
                  >
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {[contact?.email, contact?.trainingEmail]
                .filter((posta): posta is string => Boolean(posta))
                .map((posta) => (
                  <li key={posta} className="flex gap-3">
                    <IletisimIkonu tur="eposta" />
                    <a
                      href={`mailto:${posta}`}
                      className="break-all text-white/75 underline-offset-4 hover:text-white hover:underline focus-visible:text-white focus-visible:underline"
                    >
                      {posta}
                    </a>
                  </li>
                ))}
            </ul>
          </address>

          {/* Belirgin aksiyon: form ve harita iletişim sayfasındadır. */}
          <p className="mt-4">
            <Link
              href={href('contact', locale)}
              className="group mt-2 inline-flex min-h-11 items-center gap-2 rounded-md border border-white/40 px-4 text-sm font-semibold text-white transition-colors hover:border-white/70 hover:bg-white/10 focus-visible:border-white/70 focus-visible:bg-white/10"
            >
              {t('contactPageLink')}
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 16 16"
                width="1em"
                height="1em"
                className="transition-transform duration-200 group-hover:translate-x-1"
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
            </Link>
          </p>
        </section>
      </div>

      {/* CMS'te ayrıca sütun tanımlanmışsa onlar da eklenir. */}
      {cmsColumns.length > 0 ? (
        <div className="container-page grid gap-10 border-t border-white/10 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {cmsColumns.map((column, index) => (
            <nav key={`${column.heading}-${index}`} aria-labelledby={`footer-cms-${index}`}>
              <ColumnHeading id={`footer-cms-${index}`}>{column.heading}</ColumnHeading>
              <ul>
                {column.links.map((link, linkIndex) => (
                  <li key={`${link.label}-${linkIndex}`}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      ) : null}

      {/* ============ C) Proje görünürlüğü — Şartname 10.1–10.2 ========== */}
      <ProjectVisibilityStrip locale={locale} />

      {/* ================= D) Alt çizgi ================================== */}
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-5 py-6 text-sm lg:flex-row lg:items-center lg:justify-between">
          <p className="m-0 text-white/60">
            © {new Date().getFullYear()} {siteName}. {t('rightsReserved')}
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* --- Sosyal medya ikonları -------------------------------- */}
            {social.length > 0 ? (
              <nav aria-label={t('socialHeading')}>
                <ul className="flex items-center gap-2">
                  {social.map((item, index) => (
                    <li key={`${item.platform}-${index}`}>
                      {/*
                        WCAG 2.2 — 2.5.8: ikon 20px ama tıklama hedefi 44px.
                        Kenarlık 1.4.11 gereği ≥3:1. shell-950 üzerinde ölçüm:
                        white/30 → 2.67:1 (YETERSİZ), white/40 → 3.74:1.
                        Bu yüzden alfa 0.40'ın altına indirilmemelidir.
                      */}
                      <ExternalLink
                        href={item.url}
                        trackId={`social:${item.platform.toLowerCase()}`}
                        hideIcon
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white/75 transition-colors hover:border-white/70 hover:bg-white/10 hover:text-white focus-visible:border-white/70 focus-visible:bg-white/10 focus-visible:text-white"
                      >
                        <SocialIcon platform={item.platform} />
                        <span className="sr-only">{item.platform}</span>
                      </ExternalLink>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}

            {legalLinks.length > 0 ? (
              <nav aria-label={t('legalLinks')}>
                <ul className="flex flex-wrap gap-x-6">
                  {legalLinks.map((link, index) => (
                    <li key={`${link.label}-${index}`}>
                      <FooterLink link={link} />
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}

            {/*
              BAŞA DÖN — JavaScript kullanılmaz.
              `#main-content` bağlantısı hem sayfayı başa kaydırır hem de ODAĞI
              oraya taşır (layout'ta `tabIndex={-1}` ile hazırlanmıştır).
              Script ile yapılan kaydırma odağı taşımaz; klavye kullanıcısı
              tıkladıktan sonra hâlâ footer'da kalır (WCAG 2.2 — 2.4.3).
            */}
            <a
              href="#main-content"
              className="group inline-flex min-h-11 items-center gap-2 text-white/70 transition-colors hover:text-white focus-visible:text-white"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 16 16"
                width="1em"
                height="1em"
                className="transition-transform duration-200 group-hover:-translate-y-0.5"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 13.5v-11M4 6.5l4-4 4 4"
                />
              </svg>
              {t('backToTop')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
