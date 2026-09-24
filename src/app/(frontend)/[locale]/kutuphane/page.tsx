import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import {
  LibraryCatalog,
  type LibraryFilterOption,
} from '@/components/library/LibraryCatalog'
import type { LibraryResourceItem } from '@/components/library/LibraryResourceCard'
import { LIBRARY_ALBUM_TYPE, LIBRARY_RESOURCE_TYPES } from '@/fields/options'
import { isLocale, LOCALE_CODES, type Locale } from '@/i18n/locales'
import { href, ROUTES } from '@/i18n/routes'
import { buildMetadata } from '@/lib/metadata'
import {
  resolveAttachment,
  resolveFullImage,
  resolveMedia,
  resolveVideo,
  type ResolvedImage,
} from '@/lib/media'
import { optionLabel } from '@/lib/optionLabel'
import { payloadClient } from '@/lib/queries'

/**
 * DİJİTAL KÜTÜPHANE — LİSTE  (Şartname 6.6, 11.3, 11.4)
 * ============================================================================
 * ROTA: klasör adı `kutuphane`, `ROUTES.library.tr` ile birebir aynıdır.
 * /tr/kutuphane · /en/library · /ru/biblioteka
 *
 * ---------------------------------------------------------------------------
 * KÜTÜPHANE ARTIK SİTE İÇİNDE
 * ---------------------------------------------------------------------------
 * Önceki mimaride kütüphane EK-2 kapsamında ayrı bir subdomain'di ve site
 * oraya yalnızca bağlantı veriyordu; ana menüdeki öğe "Yakında" rozetiyle
 * tıklanamaz duruyordu. Bu sayfayla birlikte kütüphane ana mimariye alt
 * dizin olarak alındı (bkz. collections/LibraryResources.ts).
 *
 * ---------------------------------------------------------------------------
 * VERİ VE FİLTRELER
 * ---------------------------------------------------------------------------
 * Tüm yayımlanmış kayıtlar TEK sorguda gelir; filtreleme tarayıcıda yapılır
 * (gerekçe: components/library/LibraryCatalog). `depth: 2` gerekir çünkü
 * dosya, kapak ve albüm görselleri ilişki derinliğindedir:
 *     library-resource → file (document-files) → url / mimeType / boyut
 *     library-resource → gallery (media)       → türev boyutlar / alt
 *
 * Filtre seçenekleri SUNUCUDA sayılır. İki sebeple:
 *   1. Sayaçlar ("Rapor 12") ilk boyamada doğru görünür, JavaScript yüklenince
 *      yerinden zıplamaz.
 *   2. Sayısı sıfır olan filtre HİÇ BASILMAZ — ziyaretçi boş sonuç veren bir
 *      butona tıklamaz.
 *
 * ---------------------------------------------------------------------------
 * NEDEN ARTIK STATİK DEĞİL
 * ---------------------------------------------------------------------------
 * Sayfa 5 dakikalık ISR ile üretiliyordu ve Local API'ye `user` GEÇMİYORDU.
 * Sonucu ölçülmüştü (kılavuz 5.6.2): aboneliği geçerli bir katılımcı bile
 * listede yalnızca herkese açık kayıtları görüyordu —
 *
 *     aynı oturum, /api/library-resources → 3 kayıt (1 public + 2 trainee)
 *     aynı oturum, /tr/kutuphane          → "1 yayın"
 *
 * Yani `accessLevel` site yüzünde hiç kimseye bir şey AÇMIYORDU; yalnızca
 * kapatıyordu. Listeyi kişiye özel yapmanın bedeli önbelleğin kalkmasıdır:
 * önbelleğe alınmış bir HTML, sonraki ziyaretçiye ÖNCEKİNİN yetkisiyle
 * üretilmiş listeyi gösterirdi. Bu bir sızıntı olurdu, ödünleşim değil.
 *
 * `force-dynamic` bu yüzden bir tercih değil ZORUNLULUKTUR. Aynı sebeple
 * `generateStaticParams` kaldırıldı: önceden üretilecek bir çıktı yok.
 * ============================================================================
 */
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ locale: Locale }>
  /** `?egitim=<slug>` — bkz. aşağıdaki "EĞİTİME GÖRE SÜZME" notu. */
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const t = await getTranslations({ locale, namespace: 'library' })

  return buildMetadata({
    locale,
    title: t('metaTitle'),
    description: t('pageIntro'),
    pathByLocale: { tr: ROUTES.library.tr, en: ROUTES.library.en, ru: ROUTES.library.ru },
  })
}

/** İlişki alanı çözülmüş bir nesne mi, yoksa yalnızca id mi? */
type TopicRef = { id: string | number; title?: string | null }

const topicOf = (value: unknown): TopicRef | null =>
  value && typeof value === 'object' && 'id' in value ? (value as TopicRef) : null

/**
 * Albüm görselleri SUNUCUDA çözülür, istemciye ham Payload nesnesi gitmez.
 *
 * TÜREV DEĞİL ORİJİNAL kullanılır (`resolveFullImage`): bu görseller tam
 * ekran lightbox'ta gösteriliyor ve 768×512'lik "card" türevi orada yumuşak
 * kalıyordu (ölçüldü: 1200px'lik sahnede görsel 432×288'de takılıyordu).
 * Önizleme şeridi aynı çözümlenmiş görseli kullanır; küçültmeyi `next/image`
 * `sizes` ile tarayıcı yapar, fazladan bir çözümleme gerekmez.
 *
 * `alt` metni olmayan görseller ELENMEZ — eksik alt metin bir içerik
 * hatasıdır, görselin gizlenmesini gerektirmez.
 */
const galleryOf = (value: unknown): ResolvedImage[] =>
  Array.isArray(value)
    ? value
        .map((entry) => resolveFullImage(entry))
        .filter((image): image is ResolvedImage => image !== null)
    : []

/** `?egitim=slug` — dizi gelirse ilk değer, boşsa null. */
const egitimSlugu = (deger: string | string[] | undefined): string | null => {
  const ham = Array.isArray(deger) ? deger[0] : deger
  const temiz = ham?.trim()
  return temiz ? temiz : null
}

export default async function LibraryPage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('library')
  const payload = await payloadClient()

  /*
    ======================================================================
    OTURUM SUNUCUDA OKUNUR
    ======================================================================
    `payload.auth` istek başlıklarındaki `aiftc-token` çerezini çözer ve
    kullanıcıyı döner. Bu kullanıcı aşağıdaki sorguya GEÇİRİLİR; ancak o
    zaman `libraryReadAccess` gerçek role göre çalışır ve katılımcı kendi
    seviyesindeki kayıtları GÖREBİLİR.

    Oturum yoksa `user` null gelir ve kural anonim dalına düşer — yani
    davranış eskisiyle birebir aynı kalır.
  */
  const { user } = await payload.auth({ headers: await headers() })

  /*
    ======================================================================
    EĞİTİME GÖRE SÜZME  (`?egitim=<slug>`)
    ======================================================================
    Eğitim künyesindeki "Eğitim Materyallerine Git" düğmesi buraya bu
    parametreyle gelir. Süzme SUNUCUDA yapılır, istemcide değil:

      - sayaçlar ("Rapor 3") doğru kalır; istemcide süzülseydi filtre
        çubuğu süzülmemiş toplamları gösterirdi,
      - adres paylaşılabilir ve yer imine eklenebilir,
      - JavaScript kapalıyken de çalışır.

    Slug ÇÖZÜLEMEZSE süzme UYGULANMAZ ve tüm liste basılır. Alternatif
    (boş liste göstermek) kullanıcıyı "kütüphane boş" sanmaya iterdi;
    burada asıl olan kütüphanedir, süzgeç bir kolaylıktır.
  */
  const istenenEgitim = egitimSlugu((await searchParams).egitim)

  const egitim = istenenEgitim
    ? (
        await payload.find({
          collection: 'training-programs',
          locale,
          where: { slug: { equals: istenenEgitim } },
          limit: 1,
          depth: 0,
          overrideAccess: false,
          user,
        })
      ).docs[0]
    : undefined

  const result = await payload.find({
    collection: 'library-resources',
    locale,
    where: egitim
      ? {
          and: [
            { _status: { equals: 'published' } },
            { relatedTrainings: { in: [egitim.id] } },
          ],
        }
      : { _status: { equals: 'published' } },
    /*
      Öne çıkarılanlar en üstte, sonra yeniden eskiye. Payload çok alanlı
      sıralamayı dizi olarak alır; `-featured` true değerleri öne taşır.
    */
    sort: ['-featured', '-publicationYear', 'title'],
    limit: 500,
    depth: 2,
    /*
      ERİŞİM DENETİMİ AÇIK — ÖLÇÜLMÜŞ BİR SIZINTININ KAPATILMASI
      -------------------------------------------------------------------
      Local API'de `overrideAccess` VARSAYILAN OLARAK `true`'dur; yani bu
      satır olmadan koleksiyonun `read` kuralı (access/index.ts →
      `libraryReadAccess`) HİÇ ÇALIŞMAZ. Sitedeki diğer bütün sayfalar
      `overrideAccess: false` geçiyordu, erişim seviyesi ZORLANAN tek
      koleksiyonun sayfası geçmiyordu.

      Ölçüm (2026-09-06, geliştirme veritabanı):
        kayıt #15  accessLevel=trainee  _status=published
        → /tr/kutuphane oturum AÇMAMIŞ ziyaretçiye "2 yayın listeleniyor"
          diyor, kaydın başlığını, özetini ve 4 fotoğrafını gösteriyordu.

      `overrideAccess: false` ile ve `user` verilmediğinde Payload sorguyu
      anonim kabul eder; `libraryReadAccess` da sorguya
      `accessLevel = 'public'` koşulunu EKLER. Kısıtlı kayıtlar listeye hiç
      girmez — gizlenmez, SORGUYA ALINMAZ.

      SINIR: bu kural KAYDI korur, ekli dosyanın doğrudan adresini korumaz
      (bkz. docs/access-control-guide.md).

      `user`: kuralın ANONİM mi yoksa ROLLÜ mü değerlendirileceğini bu
      belirler. Geçilmediğinde Payload sorguyu oturumsuz sayar — sayfanın
      önceki hâlindeki sorun tam olarak buydu.
    */
    overrideAccess: false,
    user,
  })

  const items: LibraryResourceItem[] = result.docs.map((doc) => {
    const topics = ((doc.topics ?? []) as unknown[])
      .map(topicOf)
      .filter((topic): topic is TopicRef => topic !== null)

    return {
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      description: doc.description,
      author: doc.author,
      publicationYear: doc.publicationYear,
      resourceType: doc.resourceType,
      resourceTypeLabel: optionLabel(LIBRARY_RESOURCE_TYPES, doc.resourceType, locale),
      file: resolveAttachment(doc.file),
      /*
        Künyedeki biçim/boyut yalnızca YEDEK olarak taşınır; dosya varsa kart
        onu kullanmaz (bkz. LibraryResourceCard içindeki seçim).
      */
      fileFormat: doc.fileFormat,
      fileSize: doc.fileSize,
      externalUrl: doc.externalUrl,
      coverImage: doc.coverImage,
      /*
        Video SUNUCUDA çözülür. MIME türü `video/` ile başlamıyorsa `null`
        döner ve kart oynatma düğmesini hiç basmaz — bozuk bir ilişki
        istemciye kadar taşınmaz (bkz. lib/media.ts `resolveVideo`).
      */
      video: resolveVideo(doc.videoFile),
      videoDuration: doc.videoDuration,
      allowVideoDownload: doc.allowVideoDownload !== false,
      gallery: doc.resourceType === LIBRARY_ALBUM_TYPE ? galleryOf(doc.gallery) : [],
      downloads: doc.downloads,
      topicIds: topics.map((topic) => topic.id),
      topicTitles: topics
        .map((topic) => topic.title)
        .filter((title): title is string => Boolean(title)),
    }
  })

  /**
   * TÜR FİLTRELERİ
   * Sıra `LIBRARY_RESOURCE_TYPES`ten gelir (sabit, öngörülebilir), sayaç
   * verilerden. Kaydı olmayan tür listede yer almaz.
   */
  const typeOptions: LibraryFilterOption[] = LIBRARY_RESOURCE_TYPES.map((option) => ({
    value: option.value,
    label: optionLabel(LIBRARY_RESOURCE_TYPES, option.value, locale) ?? option.value,
    count: items.filter((item) => item.resourceType === option.value).length,
  })).filter((option) => option.count > 0)

  /**
   * TEMATİK FİLTRELER
   * Konular kayıtlardan toplanır — ayrı bir sorgu atılmaz. Kütüphanede hiç
   * kaydı olmayan bir eğitim konusu filtre çubuğunu kalabalıklaştırmamalıdır.
   */
  const topicCounts = new Map<string, { label: string; count: number }>()

  for (const doc of result.docs) {
    for (const raw of (doc.topics ?? []) as unknown[]) {
      const topic = topicOf(raw)
      if (!topic?.title) continue

      const key = String(topic.id)
      const existing = topicCounts.get(key)
      topicCounts.set(key, {
        label: topic.title,
        count: (existing?.count ?? 0) + 1,
      })
    }
  }

  const topicOptions: LibraryFilterOption[] = [...topicCounts.entries()]
    .map(([value, { label, count }]) => ({ value, label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, locale))

  return (
    <>
      {/* --- Üst bölüm: kurumsal başlık + açıklama ----------------------- */}
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 className="title-page measure mt-3">
            {t('pageTitle')}
          </h1>
          <p className="lede measure mt-5">{t('pageIntro')}</p>
        </div>
      </section>

      {/* --- Arama, filtreler ve liste ------------------------------------ */}
      <section aria-labelledby="library-list" className="bg-surface-warm">
        <div className="container-page section-block">
          <h2 id="library-list" className="sr-only">
            {t('listHeading')}
          </h2>

          {/*
            AKTİF EĞİTİM SÜZGECİ GÖRÜNÜR OLMALI.
            Süzgeç sessizce uygulansaydı kullanıcı kısalmış bir liste görüp
            "kütüphanede bu kadar mı var?" diye düşünürdü — daha önce abonelik
            kapısında ölçtüğümüz "sessiz düşüm" sorununun aynısı. Şerit hem
            hangi süzgecin açık olduğunu söyler hem de KALDIRMA yolunu verir.
          */}
          {egitim ? (
            <p
              role="status"
              className="mb-8 flex flex-col gap-2 border-s-2 border-s-line-strong bg-surface-alt p-5 text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
            >
              <span className="text-ink-700">
                {t('filteredByTraining', { egitim: egitim.title ?? istenenEgitim ?? '' })}
              </span>
              <Link
                href={href('library', locale)}
                className="shrink-0 font-semibold text-shell-900 underline underline-offset-4 hover:text-brand-800 focus-visible:text-brand-800"
              >
                {t('showAllRecords')}
              </Link>
            </p>
          ) : null}

          {items.length === 0 ? (
            /*
              İki ayrı boşluk, iki ayrı cümle: koleksiyonun tamamen boş olması
              ile SÜZGECİN sonuç vermemesi aynı şey değildir. Tek mesaj
              kullanılsaydı, eğitime materyal bağlanmadığı hâlde ziyaretçi
              "kütüphane boş" sanırdı.
            */
            <p className="rounded-sm border border-line bg-surface p-6 text-ink-700">
              {egitim ? t('noMaterialsForTraining') : t('emptyCollection')}
            </p>
          ) : (
            <LibraryCatalog items={items} types={typeOptions} topics={topicOptions} locale={locale} />
          )}
        </div>
      </section>
    </>
  )
}
