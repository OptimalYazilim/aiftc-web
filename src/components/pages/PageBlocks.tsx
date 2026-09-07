import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import type { Page } from '@/payload-types'

import { LocationMap } from '@/components/contact/LocationMap'
import { ExternalLink } from '@/components/ui/ExternalLink'
import { RichTextBlock, hasRichTextContent } from '@/components/ui/RichTextBlock'
import { href as routeHref } from '@/i18n/routes'
import type { Locale } from '@/i18n/locales'
import { buildLibraryLink, buildPortalLink } from '@/lib/externalLinks'
import { resolveFullImage, resolveMedia } from '@/lib/media'
import { getExternalServices, getSiteSettings } from '@/lib/queries'

/**
 * SAYFA BLOKLARI — `Pages.layout` ALANININ ÖN YÜZ KARŞILIĞI
 * ============================================================================
 * `collections/Pages.ts` dokuz blok tipi tanımlar ve editör bunlarla kod
 * yazmadan sayfa kurar. Bu bileşen o dokuzun TAMAMINI basar.
 *
 * ---------------------------------------------------------------------------
 * NEDEN YAZILDI — ÖNCEKİ DURUM
 * ---------------------------------------------------------------------------
 * `[locale]/[slug]/page.tsx` yalnızca `richText` bloğunu render ediyordu;
 * diğer sekizi SESSİZCE ATLANIYORDU. Dosyanın başındaki "KAPSAM SINIRI"
 * kutusu bunu açıkça yazıyor ve şunu şart koşuyordu:
 *
 *   "Kurumsal tanıtım sayfaları (istatistik, ekip, ortak logoları) yayına
 *    alınmadan önce bu bileşene ilgili blok render'ları eklenmelidir."
 *
 * Pratik sonucu şuydu: editör panelde bir "Yönetim Kadrosu" bloğu kurabiliyor,
 * kaydediyor, önizlemede HİÇBİR ŞEY görmüyordu. Kuruluş sayfasının misyon,
 * vizyon, tarihçe ve kadro bölümleri bu yüzden CMS'ten beslenemiyordu.
 *
 * ---------------------------------------------------------------------------
 * HER BLOK KENDİ KAPSAYICISINI TAŞIR
 * ---------------------------------------------------------------------------
 * Bileşen DIŞARIDAN bir `container-page` beklemez; her blok kendi genişliğini
 * kendisi kurar. Sebep `mediaBlock`un "tam ekran" seçeneğidir: dıştan
 * kapsayıcıya alınmış bir bloğu negatif kenar boşluklarıyla dışarı taşırmak
 * kırılgandır ve dar ekranlarda yatay kaydırma üretir. Blok kendi
 * kapsayıcısını seçtiğinde tam ekran, hiçbir hile olmadan tam ekrandır.
 *
 * ---------------------------------------------------------------------------
 * TASARIM DİLİ — EDİTORYAL, GÖLGESİZ, KESKİN
 * ---------------------------------------------------------------------------
 * Bloklar kart DEĞİLDİR. Derinlik gölgeyle değil, üç kademeli zemin
 * (canvas / surface-alt / surface) ve 1px saç teli çizgilerle kurulur.
 * Yuvarlatma yalnızca sitenin geri kalanında kullanılan yerlerde vardır;
 * blok yüzeyleri keskindir. Bölüm başlıkları `eyebrow` + üstte 2px'lik
 * `shell-900` çizgi ile açılır — kütüphane künyesindeki rayla aynı işaret.
 *
 * ---------------------------------------------------------------------------
 * BOŞ BLOK BASILMAZ
 * ---------------------------------------------------------------------------
 * Her blok kendi içeriğini denetler ve boşsa `null` döner. Editör bir blok
 * ekleyip doldurmayı unuttuğunda sayfada başlığı olup gövdesi olmayan bir
 * bölüm kalmaz. Boş bir Lexical alanı `null` DEĞİL, tek boş paragraflı bir
 * ağaçtır; bu yüzden `hasRichTextContent` ile korunur.
 * ============================================================================
 */

type Block = NonNullable<Page['layout']>[number]

/** Bölüm başlığı — yalnızca editör girdiyse basılır. */
const BlockHeading: React.FC<{ id: string; text?: string | null }> = ({ id, text }) =>
  text?.trim() ? (
    <h2 id={id} className="eyebrow border-t-2 border-shell-900 pt-4">
      {text}
    </h2>
  ) : null

/** Blokları birbirinden ayıran dikey ritim. */
const SECTION = 'mt-14 first:mt-0'

// ===========================================================================
// 1) METİN
// ===========================================================================
const RichTextSection: React.FC<{ block: Extract<Block, { blockType: 'richText' }> }> = ({
  block,
}) => {
  if (!hasRichTextContent(block.content)) return null

  return (
    <section className={`container-page ${SECTION}`}>
      {/* Okunabilir satır genişliği — haber ve hukuki metinlerle aynı ölçü. */}
      <RichTextBlock data={block.content} className="max-w-prose" />
    </section>
  )
}

// ===========================================================================
// 2) GÖRSEL
// ===========================================================================
const MediaSection: React.FC<{ block: Extract<Block, { blockType: 'mediaBlock' }> }> = ({
  block,
}) => {
  /*
    TÜREV DEĞİL ORİJİNAL: bu görseller sayfa genişliğinde, kimi zaman tam
    ekran basılıyor. 768px'lik "card" türevi orada yumuşak kalırdı.
  */
  const image = resolveFullImage(block.media)
  if (!image) return null

  const genislik = block.width ?? 'container'

  const govde = (
    <figure>
      <Image
        src={image.url}
        alt={image.alt || ''}
        width={image.width}
        height={image.height}
        sizes={genislik === 'full' ? '100vw' : genislik === 'wide' ? '90vw' : '(min-width: 1280px) 1024px, 100vw'}
        className="w-full border border-line-soft object-cover"
      />
      {block.caption ? (
        <figcaption className="mt-2 text-xs leading-relaxed text-ink-500">{block.caption}</figcaption>
      ) : null}
    </figure>
  )

  if (genislik === 'full') {
    /*
      Tam ekranda çerçeve kaldırılır: kenarları ekranın dışına taşan bir
      görselin 1px çizgisi anlamsızdır. `container-page` kullanılmaz.
    */
    return (
      <section className={SECTION}>
        <figure>
          <Image
            src={image.url}
            alt={image.alt || ''}
            width={image.width}
            height={image.height}
            sizes="100vw"
            className="w-full object-cover"
          />
          {block.caption ? (
            <figcaption className="container-page mt-2 text-xs leading-relaxed text-ink-500">
              {block.caption}
            </figcaption>
          ) : null}
        </figure>
      </section>
    )
  }

  return (
    <section className={`container-page ${SECTION}`}>
      <div className={genislik === 'wide' ? '' : 'max-w-3xl'}>{govde}</div>
    </section>
  )
}

// ===========================================================================
// 3) SAYILARLA
// ===========================================================================
const StatsSection: React.FC<{
  block: Extract<Block, { blockType: 'statsBlock' }>
  index: number
}> = ({ block, index }) => {
  const items = (block.items ?? []).filter((item) => item?.value?.trim() && item?.label?.trim())
  if (items.length === 0) return null

  const id = `blok-sayilar-${index}`

  return (
    <section
      className={`container-page ${SECTION}`}
      {...(block.heading?.trim() ? { 'aria-labelledby': id } : {})}
    >
      <BlockHeading id={id} text={block.heading} />

      {/*
        `<dl>` seçildi: bunlar gerçekten etiket–değer çiftleridir. Ekran
        okuyucu "katılımcı ülke: 14+" diye okur, iki kopuk metin parçası
        olarak değil.

        `flex-col-reverse` — ÖLÇÜLMÜŞ BİR HATANIN DÜZELTMESİ.
        İlk sürümde etiket `sr-only` bir `<dt>` içinde veriliyor, sonra
        `<dd>` içinde GÖRÜNÜR olarak tekrarlanıyordu. Sonuç: etiket iki kez
        okunuyordu — sayfa metni dökümünde de "yer tutucu ölçüt bir / 00 /
        yer tutucu ölçüt bir" olarak göründü.

        Doğru çözüm etiketi gizleyip kopyalamak değil, DOM sırasını
        bozmadan görsel sırayı çevirmektir: DOM'da `dt` (etiket) önce gelir,
        `column-reverse` onu görsel olarak rakamın ALTINA taşır. Tek metin,
        doğru semantik, istenen görünüm.
      */}
      <dl className={`grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 ${block.heading?.trim() ? 'mt-6' : ''}`}>
        {items.map((item, i) => (
          <div
            key={item.id ?? i}
            className="flex flex-col-reverse border-t border-line-soft pt-4"
          >
            <dt className="mt-2 text-sm leading-snug text-ink-600">{item.label}</dt>
            <dd className="text-4xl font-bold leading-none tracking-tight text-shell-950">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

// ===========================================================================
// 4) KİŞİLER — YÖNETİM / EĞİTMEN KADROSU
// ===========================================================================
const PeopleSection: React.FC<{
  block: Extract<Block, { blockType: 'peopleBlock' }>
  index: number
}> = ({ block, index }) => {
  const people = (block.people ?? []).filter((person) => person?.name?.trim())
  if (people.length === 0) return null

  const id = `blok-kisiler-${index}`

  return (
    <section
      className={`container-page ${SECTION}`}
      {...(block.heading?.trim() ? { 'aria-labelledby': id } : {})}
    >
      <BlockHeading id={id} text={block.heading} />

      <ul className={`grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 ${block.heading?.trim() ? 'mt-6' : ''}`}>
        {people.map((person, i) => {
          const photo = resolveMedia(person.photo, 'card')

          return (
            <li key={person.id ?? i}>
              {/*
                KARE PORTRE, YUVARLAK DEĞİL.
                Yuvarlak avatar "uygulama profili" dilidir; kurumsal bir
                kadro sayfasında kare kırpım hem daha fazla yüz gösterir
                hem sitenin keskin hattıyla uyumludur.
              */}
              <div className="relative aspect-square w-full overflow-hidden border border-line-soft bg-surface-alt">
                {photo ? (
                  <Image
                    src={photo.url}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  /*
                    Fotoğraf yoksa baş harfler. Boş gri bir kare "eksik
                    görsel" gibi okunur; baş harf bir kimlik taşır.
                    `aria-hidden`: ad zaten altta metin olarak var.
                  */
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 grid place-items-center text-2xl font-bold tracking-tight text-shell-900/25"
                  >
                    {person.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((word) => word.charAt(0))
                      .join('')
                      .toLocaleUpperCase('tr-TR')}
                  </span>
                )}
              </div>

              <p className="mt-3 text-base font-bold leading-snug text-shell-900">{person.name}</p>
              {person.role ? <p className="mt-0.5 text-sm text-ink-600">{person.role}</p> : null}
              {person.unit ? <p className="mt-0.5 text-xs text-ink-500">{person.unit}</p> : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// ===========================================================================
// 5) PAYDAŞLAR
// ===========================================================================
const PartnersSection: React.FC<{
  block: Extract<Block, { blockType: 'partnersBlock' }>
  index: number
}> = ({ block, index }) => {
  const partners = (block.partners ?? []).filter((partner) => partner?.name?.trim())
  if (partners.length === 0) return null

  const id = `blok-paydaslar-${index}`

  return (
    <section
      className={`container-page ${SECTION}`}
      {...(block.heading?.trim() ? { 'aria-labelledby': id } : {})}
    >
      <BlockHeading id={id} text={block.heading} />

      <ul className={`flex flex-wrap items-center gap-x-10 gap-y-8 ${block.heading?.trim() ? 'mt-6' : ''}`}>
        {partners.map((partner, i) => {
          const logo = resolveMedia(partner.logo, 'card')

          /*
            Logo `alt=""` ile basılır ve kurum adı METİN olarak yanında
            durur. Adı hem `alt`ta hem metinde vermek ekran okuyucuda çift
            okuma üretir (WCAG 1.1.1).
          */
          const govde = logo ? (
            <>
              <Image
                src={logo.url}
                alt=""
                width={logo.width}
                height={logo.height}
                sizes="140px"
                className="h-10 w-auto object-contain"
              />
              <span className="sr-only">{partner.name}</span>
            </>
          ) : (
            <span className="text-sm font-medium text-ink-700">{partner.name}</span>
          )

          return (
            <li key={partner.id ?? i}>
              {partner.url ? (
                <ExternalLink
                  href={partner.url}
                  trackId="page:partner"
                  className="inline-flex min-h-11 items-center gap-2"
                >
                  {govde}
                </ExternalLink>
              ) : (
                <span className="inline-flex items-center gap-2">{govde}</span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// ===========================================================================
// 6) TARİHÇE / ZAMAN ÇİZELGESİ
// ===========================================================================
const TimelineSection: React.FC<{
  block: Extract<Block, { blockType: 'timelineBlock' }>
  index: number
}> = ({ block, index }) => {
  const entries = (block.entries ?? []).filter(
    (entry) => entry?.year?.trim() && entry?.title?.trim(),
  )
  if (entries.length === 0) return null

  const id = `blok-tarihce-${index}`

  return (
    <section
      className={`container-page ${SECTION}`}
      {...(block.heading?.trim() ? { 'aria-labelledby': id } : {})}
    >
      <BlockHeading id={id} text={block.heading} />

      {/*
        ZAMAN ÇİZELGESİ — NOKTA VE DAİRE YOK.
        Yaygın "dikey çizgi + daireler" deseni dekoratiftir ve ekran
        okuyucuya hiçbir şey söylemez. Burada yapı `<ol>`dur (sıra
        anlamlıdır) ve her girdi kendi saç teli çizgisiyle açılır. Yıl sol
        sütunda sabit genişlikte durur; başlıklar tek bir dikey eksende
        hizalanır ve göz aşağı doğru tarar.
      */}
      <ol className={`${block.heading?.trim() ? 'mt-4' : ''}`}>
        {entries.map((entry, i) => (
          <li
            key={entry.id ?? i}
            className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-6 border-t border-line-soft py-5 sm:grid-cols-[7rem_minmax(0,1fr)]"
          >
            <p className="text-sm font-bold tabular-nums leading-6 tracking-tight text-brand-700">
              {entry.year}
            </p>
            <div className="min-w-0">
              <p className="text-base font-bold leading-6 text-shell-900">{entry.title}</p>
              {entry.description ? (
                <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-ink-600">
                  {entry.description}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ===========================================================================
// 7) YÖNLENDİRME KUTUSU
// ===========================================================================
const CtaSection: React.FC<{
  block: Extract<Block, { blockType: 'ctaBlock' }>
  locale: Locale
  services: Awaited<ReturnType<typeof getExternalServices>>
}> = ({ block, locale, services }) => {
  if (!block.heading?.trim() || !block.buttonLabel?.trim()) return null

  const target = block.target ?? 'internal'
  const path = block.href?.trim() ?? ''

  /*
    HEDEF ÇÖZÜMLEMESİ — DÖRT DURUM.
    Kütüphane ve portal adresleri kod içine YAZILMAZ; ana adres Genel
    Ayarlar'daki Dış Servisler bölümünden gelir ve o servis "yayında"
    değilse bağlantı HİÇ BASILMAZ (bkz. lib/externalLinks). Bu, ziyaretçiyi
    henüz açılmamış bir subdomain'e göndermeyi engeller.
  */
  let dis: { href: string; yeniSekme: boolean } | null = null
  let ic: string | null = null

  if (target === 'library') {
    const link = buildLibraryLink(services, { locale, path: path || undefined })
    if (!link.available || !link.href) return null
    dis = { href: link.href, yeniSekme: link.openInNewTab }
  } else if (target === 'portal') {
    const link = buildPortalLink(services, { kind: 'custom', path: path || '/' })
    if (!link.available || !link.href) return null
    dis = { href: link.href, yeniSekme: true }
  } else if (target === 'external') {
    if (!/^https?:\/\//i.test(path)) return null
    dis = { href: path, yeniSekme: true }
  } else {
    if (!path) return null
    /* Site içi yol dil önekiyle tamamlanır: "/kurulus" → "/tr/kurulus". */
    ic = path.startsWith(`/${locale}/`) || path === `/${locale}` ? path : `/${locale}${path.startsWith('/') ? '' : '/'}${path}`
  }

  const buton =
    'inline-flex min-h-12 items-center gap-2 rounded-sm bg-brand-700 px-6 text-sm font-bold text-white transition-colors duration-300 hover:bg-brand-800'

  return (
    <section className={`${SECTION} border-y border-line bg-surface-alt`}>
      <div className="container-page py-10">
        <div className="max-w-prose">
          <h2 className="title-section">{block.heading}</h2>
          {block.text ? (
            <p className="mt-3 text-base leading-relaxed text-ink-700">{block.text}</p>
          ) : null}
          <p className="mt-6">
            {dis ? (
              <ExternalLink href={dis.href} trackId={`page:cta:${target}`} className={buton}>
                {block.buttonLabel}
              </ExternalLink>
            ) : ic ? (
              <Link href={ic} className={buton}>
                {block.buttonLabel}
              </Link>
            ) : null}
          </p>
        </div>
      </div>
    </section>
  )
}

// ===========================================================================
// 8) SSS
// ===========================================================================
const FaqSection: React.FC<{
  block: Extract<Block, { blockType: 'faqBlock' }>
  index: number
}> = ({ block, index }) => {
  /*
    İlişki `depth >= 1` ile çözülmüşse nesne, yetmezse ham id gelir. Ham id
    ile gösterilecek bir şey yoktur; o kayıtlar elenir.
  */
  const faqs = ((block.faqs ?? []) as unknown[]).filter(
    (faq): faq is { id: number; question?: string | null; answer?: unknown } =>
      Boolean(faq) && typeof faq === 'object' && 'question' in (faq as object),
  )
  if (faqs.length === 0) return null

  const id = `blok-sss-${index}`

  return (
    <section
      className={`container-page ${SECTION}`}
      {...(block.heading?.trim() ? { 'aria-labelledby': id } : {})}
    >
      <BlockHeading id={id} text={block.heading} />

      {/*
        `<details>` KULLANILIR, ELLE YAZILMIŞ AKORDİYON DEĞİL. Yerli öğe
        klavyeyle çalışır, ekran okuyucuya doğru duyurulur, JavaScript
        kapalıyken de açılır ve tarayıcının "sayfada bul" işlevi kapalı
        içeriği de bulur (WCAG 2.1.1, 4.1.2).
      */}
      <div className={block.heading?.trim() ? 'mt-4' : ''}>
        {faqs.map((faq) => (
          <details key={String(faq.id)} className="group border-t border-line-soft py-1">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 py-2 text-base font-semibold text-shell-900 transition-colors duration-300 hover:text-brand-800">
              {faq.question}
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 16 16"
                width="1em"
                height="1em"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 transition-transform duration-300 ease-editorial group-open:rotate-45"
              >
                <path d="M8 3v10M3 8h10" />
              </svg>
            </summary>
            <RichTextBlock data={faq.answer} className="max-w-prose pb-4" />
          </details>
        ))}
      </div>
    </section>
  )
}

// ===========================================================================
// 9) İLETİŞİM + HARİTA
// ===========================================================================
const ContactSection: React.FC<{
  block: Extract<Block, { blockType: 'contactBlock' }>
  locale: Locale
  settings: Awaited<ReturnType<typeof getSiteSettings>>
  labels: {
    heading: string
    address: string
    phone: string
    email: string
    directions: string
    contactPage: string
  }
}> = ({ block, locale, settings, labels }) => {
  const contact = settings?.contact
  if (!contact?.address && !contact?.email && !contact?.phone) return null

  const staticMap = resolveMedia(contact?.map?.staticMapImage, 'hero')
  const siteName = settings?.siteName ?? ''

  const satirlar = [
    contact?.address ? { key: 'address', label: labels.address, value: contact.address } : null,
    contact?.phone ? { key: 'phone', label: labels.phone, value: contact.phone } : null,
    contact?.email ? { key: 'email', label: labels.email, value: contact.email } : null,
  ].filter((row): row is { key: string; label: string; value: string } => row !== null)

  return (
    <section aria-labelledby="blok-iletisim" className={`container-page ${SECTION}`}>
      <h2 id="blok-iletisim" className="eyebrow border-t-2 border-shell-900 pt-4">
        {labels.heading}
      </h2>

      <div className="mt-6 grid gap-x-12 gap-y-8 lg:grid-cols-2">
        <div>
          <dl className="max-w-prose">
            {satirlar.map((row) => (
              <div
                key={row.key}
                className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-4 border-t border-line-soft py-2.5"
              >
                <dt className="text-xs font-semibold uppercase leading-5 tracking-wider text-ink-500">
                  {row.label}
                </dt>
                <dd className="whitespace-pre-line text-sm leading-5 text-shell-900">
                  {row.key === 'email' ? (
                    <a
                      href={`mailto:${row.value}`}
                      className="text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700"
                    >
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>

          {/*
            FORM GÖMÜLMEZ — DÜRÜSTÇE SÖYLENMESİ GEREKEN SINIR.
            Blokta `form` alanı Payload'ın form-builder eklentisine bakar.
            Sitede ise elle yazılmış, KVKK rızası sunucuda doğrulanan ve
            `form-requests` koleksiyonuna yazan ÖZEL bir iletişim formu var
            (components/contact/ContactForm). İki farklı form altyapısını
            aynı sayfada çalıştırmak, ziyaretçinin hangisine yazdığının
            belirsizleşmesi demektir. Bu yüzden blok, çalışan forma
            YÖNLENDİRİR.
          */}
          {block.showForm !== false ? (
            <p className="mt-6">
              <Link
                href={routeHref('contact', locale)}
                className="inline-flex min-h-11 items-center border border-line-strong px-5 text-sm font-semibold text-brand-800 transition-colors duration-300 hover:border-brand-700"
              >
                {labels.contactPage} →
              </Link>
            </p>
          ) : null}
        </div>

        {/*
          Harita KENDİLİĞİNDEN YÜKLENMEZ: `LocationMap` önce statik bir
          görsel/konum kartı gösterir, gömülü harita ancak ziyaretçi
          isterse yüklenir (KVKK 12.3 — IP üçüncü tarafa gitmesin).
        */}
        {block.showMap !== false ? (
          <div>
            {hasRichTextContent(contact?.map?.directions) ? (
              <>
                <h3 className="eyebrow">{labels.directions}</h3>
                <RichTextBlock data={contact?.map?.directions} className="mt-3 max-w-prose" />
              </>
            ) : null}
            <div className={hasRichTextContent(contact?.map?.directions) ? 'mt-4' : ''}>
              <LocationMap
                latitude={contact?.map?.latitude}
                longitude={contact?.map?.longitude}
                staticImage={staticMap}
                placeName={siteName}
                address={contact?.address}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

// ===========================================================================
// DAĞITICI
// ===========================================================================
export const PageBlocks = async ({
  blocks,
  locale,
}: {
  blocks?: Page['layout']
  locale: Locale
}) => {
  const list = blocks ?? []
  if (list.length === 0) return null

  /*
    CTA ve iletişim blokları global ayarlara ihtiyaç duyar. Bu çağrılar
    React `cache()` ile teklenir ve düzen (layout) zaten aynı global'leri
    istediği için VERİTABANINA EK SORGU GİTMEZ — koşullu çağırmak yerine
    doğrudan çağırmak hem daha basit hem bedelsizdir.
  */
  const [tc, tn, settings, services] = await Promise.all([
    getTranslations('contact'),
    getTranslations('nav'),
    getSiteSettings(locale),
    getExternalServices(locale),
  ])

  const contactLabels = {
    heading: tc('detailsHeading'),
    address: tc('address'),
    phone: tc('phone'),
    email: tc('email'),
    directions: tc('directionsHeading'),
    contactPage: tn('contact'),
  }

  return (
    <>
      {list.map((block, index) => {
        const key = block.id ?? `${block.blockType}-${index}`

        switch (block.blockType) {
          case 'richText':
            return <RichTextSection key={key} block={block} />
          case 'mediaBlock':
            return <MediaSection key={key} block={block} />
          case 'statsBlock':
            return <StatsSection key={key} block={block} index={index} />
          case 'peopleBlock':
            return <PeopleSection key={key} block={block} index={index} />
          case 'partnersBlock':
            return <PartnersSection key={key} block={block} index={index} />
          case 'timelineBlock':
            return <TimelineSection key={key} block={block} index={index} />
          case 'ctaBlock':
            return <CtaSection key={key} block={block} locale={locale} services={services} />
          case 'faqBlock':
            return <FaqSection key={key} block={block} index={index} />
          case 'contactBlock':
            return (
              <ContactSection
                key={key}
                block={block}
                locale={locale}
                settings={settings}
                labels={contactLabels}
              />
            )
          default:
            /*
              Tanınmayan blok tipi SESSİZCE atlanır. Koleksiyona yeni bir
              blok eklenip buraya karşılığı yazılmadığında sayfa çökmemeli;
              yalnızca o bölüm görünmemelidir. TypeScript tarafında bu dal
              `never`dır, yani eksik bir blok tipi DERLEME ANINDA yakalanır.
            */
            return null
        }
      })}
    </>
  )
}

export default PageBlocks
