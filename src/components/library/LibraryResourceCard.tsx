'use client'

import Image from 'next/image'
import React, { useState } from 'react'

import { LIBRARY_ALBUM_TYPE, LIBRARY_VIDEO_TYPE } from '@/fields/options'
import { resolveMedia, type ResolvedImage, type ResolvedVideo } from '@/lib/media'

import { ExternalLink } from '../ui/ExternalLink'
import { GalleryLightbox } from './GalleryLightbox'
import { MediaDialog } from './MediaDialog'

/**
 * KÜTÜPHANE KAYIT KARTI — WHO EDİTORYAL STİLİ  (Şartname 6.6, 11.3, 13)
 * ============================================================================
 * YATAY DÜZEN, ÜÇ BÖLGE
 *
 *   sol    → kapak görseli veya tür panosu (3/4 oranında), üstünde biçim
 *            rozeti ("PDF · 4,2 MB" / "45 dk" / "12 fotoğraf")
 *   orta   → yıl · tür · sayaç üst başlığı, kalın başlık, 1–2 cümlelik özet
 *   alt    → aksiyon: indir / izle / albümü aç / dış yayına git
 *
 * Neden yatay: kütüphane kartları TARANARAK okunur. Dikey bir ızgarada göz
 * her kartta yeniden yukarıdan aşağı iner; yatay satırlarda başlıklar tek bir
 * dikey eksende hizalanır ve tarama hızlanır. Eğitim/haber kartlarından
 * bilinçli olarak ayrışır — onlar keşfe, bu listeye hizmet eder.
 *
 * ---------------------------------------------------------------------------
 * SOL PANO — BOŞ GRİ DİKDÖRTGEN DEĞİL
 * ---------------------------------------------------------------------------
 * Üç durum vardır ve üçü de tasarlanmıştır:
 *   kapak görseli var  → 3/4 oranında kırpılmış fotoğraf (`object-cover`)
 *   video, kapak yok   → koyu zümrüt degrade + ortada Play işareti
 *   belge, kapak yok   → aynı degradenin nötr tonu + Belge işareti
 *
 * Önceki sürümde ikinci ve üçüncü durum aynı açık gri panoyu basıyordu ve
 * liste "eksik görsel" gibi okunuyordu. İşaret, kaydın NE OLDUĞUNU söyler:
 * ziyaretçi bir videoyu bir rapordan panoya bakarak ayırt eder.
 *
 * ---------------------------------------------------------------------------
 * DOSYA BİLGİSİ NEREDEN GELİYOR
 * ---------------------------------------------------------------------------
 * Boyut ve tür `document-files` kaydından okunur; katalog kaydına
 * kopyalanmaz (bkz. collections/LibraryResources.ts). Şartname 11.3 ve 13:
 * ziyaretçi neyi, hangi biçimde ve ne büyüklükte indireceğini TIKLAMADAN
 * ÖNCE görür. Ölçülü bağlantıda 40 MB'lık bir PDF'i habersiz indirtmek
 * erişilebilirlik sorunudur. Videoda aynı işi `videoDuration` yapar.
 *
 * ---------------------------------------------------------------------------
 * ERİŞİLEBİLİRLİK
 * ---------------------------------------------------------------------------
 *   - Kartta TEK odak durağı vardır: aksiyon düğmesi. Başlık bağlantı
 *     DEĞİLDİR çünkü kaydın ayrı bir detay sayfası yoktur; başlığı da
 *     tıklanabilir yapmak aynı hedefe ikinci bir durak eklerdi (2.4.3).
 *   - Düğmenin erişilebilir adı yalnızca "Dokümanı İndir" değildir: `sr-only`
 *     olarak yayının adı ve biçimi eklenir. Ekran okuyucu kullanıcısı
 *     bağlantı listesinde on tane özdeş "Dokümanı İndir" görmez (2.4.4).
 *   - `download` özniteliği KULLANILMAZ: tarayıcının PDF'i sekmede açma
 *     tercihi kullanıcıya bırakılır.
 *   - Sol pano ve içindeki işaret `aria-hidden`; taşıdıkları bilgi üst
 *     başlıkta METİN olarak da vardır (1.4.1).
 *
 * KONTRAST — ölçülen:
 *     shell-900 başlık / beyaz        15.74:1
 *     ink-600   özet / beyaz           7.39:1
 *     brand-700 üst başlık / beyaz     6.61:1
 *     beyaz / brand-700 buton          6.61:1
 *     beyaz rozet / shell-900 pano    15.74:1
 * ============================================================================
 */

export type LibraryFile = {
  url?: string | null
  mimeType?: string | null
  humanFileSize?: string | null
  filesize?: number | null
}

export type LibraryResourceItem = {
  id: string | number
  title?: string | null
  description?: string | null
  author?: string | null
  publicationYear?: number | null
  /** Tür anahtarı — filtreleme ve pano seçimi için. */
  resourceType?: string | null
  /** Tür etiketi, ziyaretçinin dilinde. */
  resourceTypeLabel?: string | null
  file?: LibraryFile | null
  externalUrl?: string | null
  coverImage?: unknown
  /** Video kayıtlarında: `lib/media.ts` ile çözülmüş dosya (url + MIME). */
  video?: ResolvedVideo | null
  videoDuration?: string | null
  /** Oynatıcının altında indirme bağlantısı gösterilsin mi? */
  allowVideoDownload?: boolean
  /** Fotoğraf albümlerinde: çözülmüş görseller. */
  gallery?: ResolvedImage[]
  /** İndirme / izlenme sayacı. */
  downloads?: number | null
  /** Filtreleme için konu id'leri. */
  topicIds: (string | number)[]
  /** Aramaya dahil edilen konu adları. */
  topicTitles: string[]
}

export type LibraryCardLabels = {
  download: string
  watch: string
  openAlbum: string
  openExternal: string
  unavailable: string
  closeDialog: string
  /** Oynatıcının altındaki indirme bağlantısı. */
  downloadVideo: string
  /** Tarayıcı kodeği oynatamadığında gösterilecek açıklama. */
  videoUnsupported: string
  /** Ekran okuyucuya okunacak "biçim" sözcüğü. */
  formatLabel: string
  /** Sayaç rozeti, örn. "{count} indirme". */
  downloadsBadge: (count: number) => string
  /** Albüm görsel sayısı rozeti, örn. "12 fotoğraf". */
  photoCount: (count: number) => string
  /** Albüm düğmesi, örn. "Galeriyi İncele (12 Fotoğraf)". */
  openAlbumWithCount: (count: number) => string
  /** Lightbox etiketleri. */
  galleryPrevious: string
  galleryNext: string
  galleryCounter: (current: number, total: number) => string
  galleryDownloadImage: string
  galleryThumbnails: string
}

/**
 * MIME türü → kısa biçim etiketi.
 * Tanınmayan tür için `DOSYA` gibi bir yer tutucu basılmaz; etiket hiç
 * gösterilmez. Yanlış bir biçim adı, hiç ad olmamasından kötüdür.
 */
const FORMAT_BY_MIME: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'text/csv': 'CSV',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  // Belge EKİ olarak yüklenen kayıtlar (bkz. collections/DocumentFiles).
  'video/mp4': 'MP4',
  'video/webm': 'WEBM',
  'video/quicktime': 'MOV',
}

export const formatOf = (file: LibraryFile | null | undefined): string | null =>
  file?.mimeType ? (FORMAT_BY_MIME[file.mimeType] ?? null) : null

/** Play üçgeni — video panosunun ortasında. */
const PlayGlyph = () => (
  <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden="true" focusable="false">
    <circle cx="32" cy="32" r="23" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <path d="M27 22.5 43 32 27 41.5V22.5Z" fill="currentColor" />
  </svg>
)

/** Belge işareti — dosya panosunun ortasında. */
const DocumentGlyph = () => (
  <svg
    viewBox="0 0 64 64"
    className="h-14 w-14"
    aria-hidden="true"
    focusable="false"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 10h17l11 11v33a3 3 0 0 1-3 3H20a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3Z" />
    <path d="M37 10v11h11" />
    <path d="M25 34h14M25 42h14" />
  </svg>
)

/** Fotoğraf işareti — albüm panosunun ortasında. */
const AlbumGlyph = () => (
  <svg
    viewBox="0 0 64 64"
    className="h-14 w-14"
    aria-hidden="true"
    focusable="false"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="12" y="18" width="40" height="30" rx="3" />
    <circle cx="24" cy="29" r="4" />
    <path d="M14 42l11-10 9 8 7-6 11 10" />
  </svg>
)

export const LibraryResourceCard: React.FC<{
  item: LibraryResourceItem
  labels: LibraryCardLabels
}> = ({ item, labels }) => {
  const [dialogOpen, setDialogOpen] = useState(false)

  /**
   * KAPAK SEÇİMİ
   * Editörün seçtiği kapak her zaman kazanır. Albümlerde kapak
   * verilmemişse ALBÜMÜN İLK GÖRSELİ kullanılır — soyut bir fotoğraf
   * işareti basmak yerine albümün kendisinden bir kare göstermek, kartın
   * neyi vaat ettiğini doğrudan anlatır.
   */
  const explicitCover = resolveMedia(item.coverImage, 'card')
  const format = formatOf(item.file)
  const size = item.file?.humanFileSize?.trim() || null

  const isVideo = item.resourceType === LIBRARY_VIDEO_TYPE
  const isAlbum = item.resourceType === LIBRARY_ALBUM_TYPE
  const gallery = item.gallery ?? []

  const cover = explicitCover ?? (isAlbum ? (gallery[0] ?? null) : null)

  /**
   * AKSİYON HEDEFİ — SIRALAMA ÖNEMLİ
   * Video ve albüm pencerede açılır. Belge için yüklenmiş dosya kazanır:
   * kendi sunucumuzdan servis edilir, ziyaretçinin IP'si üçüncü tarafa
   * gitmez (KVKK 12.2/12.3). Dosya yoksa dış adrese düşülür. Hiçbiri yoksa
   * düğme BASILMAZ — tıklandığında hiçbir şey yapmayan bir düğme bırakılmaz.
   */
  const canPlay = isVideo && Boolean(item.video)
  const canBrowseAlbum = isAlbum && gallery.length > 0
  const fileHref = !canPlay && !canBrowseAlbum ? (item.file?.url?.trim() || null) : null
  const externalHref = !canPlay && !canBrowseAlbum && !fileHref
    ? (item.externalUrl?.trim() || null)
    : null

  /**
   * SAYACI ARTIR — ziyaretçiyi BEKLETMEDEN.
   * `sendBeacon` isteği tarayıcının kuyruğuna bırakır ve hemen döner; sayfa
   * indirme yüzünden değişse bile istek gider. Desteklenmiyorsa `keepalive`
   * ile `fetch`e düşülür. Hata YUTULUR: sayaç bir yan işlevdir, indirmenin
   * önüne asla geçmemelidir (bkz. app/api/library/[id]/hit/route.ts).
   */
  const countHit = () => {
    const url = `/api/library/${item.id}/hit`
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(url)
        return
      }
      void fetch(url, { method: 'POST', keepalive: true }).catch(() => {})
    } catch {
      /* sessizce geç */
    }
  }

  /** Sol panodaki rozet: biçim+boyut, süre veya fotoğraf sayısı. */
  const badge = isVideo
    ? // Süre girilmemişse dosya boyutuna düşülür: ziyaretçi ölçülü bağlantıda
      // ne indireceğini yine de tıklamadan önce görür (Şartname 11.3, 13).
      (item.videoDuration?.trim() || item.video?.humanSize || null)
    : isAlbum
      ? (gallery.length > 0 ? labels.photoCount(gallery.length) : null)
      : [format, size].filter(Boolean).join(' · ') || null

  const downloads = Number(item.downloads) || 0

  const buttonClass =
    'group/action inline-flex min-h-11 items-center gap-2 rounded-sm bg-brand-700 px-5 text-sm font-bold text-white transition-colors hover:bg-brand-800'

  /** Ekran okuyucuya okunacak ek: "— 2027 Faaliyet Raporu, PDF biçiminde". */
  const accessibleSuffix = [item.title, format ? `${format} ${labels.formatLabel}` : null]
    .filter(Boolean)
    .join(', ')

  return (
    <li className="group flex flex-col gap-5 border-b border-line-soft py-6 sm:flex-row sm:gap-7">
      {/* --- SOL: kapak veya tür panosu ---------------------------------- */}
      <div className="w-full shrink-0 sm:w-40">
        <div
          aria-hidden="true"
          /*
            ORAN KIRILIMA GÖRE DEĞİŞİR — ölçülmüş gerekçe.
            Kart `sm` altında DİKEY yığılır ve pano tam genişliğe yayılır.
            375px'te 3/4 oranı panoyu 447px yüksekliğe çıkarıyordu: 812px'lik
            bir ekranın yarısından fazlası, henüz başlığı bile okunmamış bir
            kaydın YER TUTUCUSU için. Dikey yığılmada pano bir "afiş"tir,
            `sm` ve üstünde ise metnin yanındaki dikey "kapak"tır — oran da
            buna göre değişir.
          */
          className={`relative flex aspect-[16/10] w-full items-end overflow-hidden rounded-lg sm:aspect-[3/4] ${
            cover
              ? 'bg-surface-alt'
              : isVideo
                ? // Video: koyu zümrüt degrade — Play işareti üstünde parlar.
                  'bg-[linear-gradient(155deg,#0a3a24_0%,#062822_52%,#04201b_100%)]'
                : // Belge/albüm: aynı ailenin daha nötr, açık tonu.
                  'media-frame-light'
          }`}
        >
          {cover ? (
            <Image
              src={cover.url}
              alt=""
              fill
              sizes="160px"
              className="object-cover"
            />
          ) : (
            /*
              Kapak yokken pano BOŞ KALMAZ: kaydın türünü söyleyen bir işaret
              ortalanır. `inset-0` + `grid place-items-center` — rozet zaten
              `items-end` ile alta yaslandığı için işaret ayrı katmandadır.
            */
            <span
              className={`absolute inset-0 grid place-items-center ${
                isVideo ? 'text-white/85' : 'text-shell-900/25'
              }`}
            >
              {isVideo ? <PlayGlyph /> : isAlbum ? <AlbumGlyph /> : <DocumentGlyph />}
            </span>
          )}

          {/*
            Rozet kapak görselinin ÜSTÜNE biner. Zemin opak shell-900'dür,
            yarı saydam değil: fotoğrafın parlaklığı ne olursa olsun beyaz
            metnin kontrastı 15.74:1'de sabit kalır.
          */}
          {badge ? (
            <p className="relative m-2 rounded-sm bg-shell-900 px-2 py-1 text-xs font-bold uppercase tracking-wide text-white">
              {badge}
            </p>
          ) : null}
        </div>
      </div>

      {/* --- ORTA: künye ------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Üst başlık: yıl · tür · sayaç — haber kartıyla aynı editoryal dil. */}
        <p className="flex flex-wrap items-center gap-x-2 text-xs font-semibold uppercase tracking-wider text-ink-600">
          {item.publicationYear ? <span>{item.publicationYear}</span> : null}
          {item.publicationYear && item.resourceTypeLabel ? (
            <span aria-hidden="true" className="font-normal text-line-strong">
              |
            </span>
          ) : null}
          {item.resourceTypeLabel ? (
            <span className="text-brand-700">{item.resourceTypeLabel}</span>
          ) : null}

          {/*
            SAYAÇ ROZETİ — SIFIRKEN BASILMAZ.
            Her kartta "0 indirme" yazması listeyi gürültüye boğar ve yeni
            eklenen bir yayını "kimse ilgilenmemiş" gibi gösterir. Sayı
            yalnızca gerçekten bir şey söylediğinde görünür.
          */}
          {downloads > 0 ? (
            <>
              <span aria-hidden="true" className="font-normal text-line-strong">
                |
              </span>
              <span className="inline-flex items-center gap-1 text-ink-600">
                <svg
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 16 16"
                  width="0.9em"
                  height="0.9em"
                >
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 2.5v9M4 7.5l4 4 4-4M2.5 13.5h11"
                  />
                </svg>
                {labels.downloadsBadge(downloads)}
              </span>
            </>
          ) : null}
        </p>

        <h3 className="mt-1.5 text-lg font-bold leading-snug tracking-tight text-shell-900 sm:text-xl">
          {item.title}
        </h3>

        {item.author ? <p className="mt-1 text-sm text-ink-600">{item.author}</p> : null}

        {item.description ? (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-600">{item.description}</p>
        ) : null}

        {/* --- Aksiyon --------------------------------------------------- */}
        <div className="mt-4">
          {canPlay || canBrowseAlbum ? (
            <button
              type="button"
              onClick={() => {
                setDialogOpen(true)
                countHit()
              }}
              className={buttonClass}
            >
              {canPlay ? labels.watch : labels.openAlbumWithCount(gallery.length)}
              <span className="sr-only"> — {item.title}</span>
              {canPlay ? (
                <svg
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 16 16"
                  width="1em"
                  height="1em"
                  className="transition-transform duration-300 group-hover/action:translate-x-0.5"
                >
                  <path fill="currentColor" d="M4.5 3.2 12.8 8l-8.3 4.8V3.2Z" />
                </svg>
              ) : (
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
                  className="transition-transform duration-300 group-hover/action:translate-x-0.5"
                >
                  <rect x="2.5" y="3.5" width="11" height="9" rx="1.5" />
                  <path d="M3 11l3-3 2.2 2.2L10 8.5l3 2.8" />
                </svg>
              )}
            </button>
          ) : fileHref ? (
            <a href={fileHref} onClick={countHit} className={buttonClass}>
              {labels.download}
              <span className="sr-only"> — {accessibleSuffix}</span>
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 16 16"
                width="1em"
                height="1em"
                className="transition-transform duration-300 group-hover/action:translate-y-0.5"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 2.5v9M4 7.5l4 4 4-4M2.5 13.5h11"
                />
              </svg>
            </a>
          ) : externalHref ? (
            <ExternalLink
              href={externalHref}
              trackId="library:external"
              className={buttonClass}
              onActivate={countHit}
            >
              {labels.openExternal}
              <span className="sr-only"> — {item.title}</span>
            </ExternalLink>
          ) : (
            /*
              Ne dosya, ne video, ne albüm, ne dış adres: kayıt künye olarak
              listelenir ama açılabilir bir şey yoktur. Bu durum editöre de
              bilgi verir ("dosyayı bağlamayı unutmuşum") ve ziyaretçiyi ölü
              bir düğmeye tıklatmaz.
            */
            <p className="text-sm italic text-ink-500">{labels.unavailable}</p>
          )}
        </div>
      </div>

      {/*
        Pencere yalnızca açıkken DOM'a girer (bkz. MediaDialog): kapalıyken
        ne iframe kurulur ne de albüm görselleri istenir.
      */}
      {dialogOpen && canPlay ? (
        <MediaDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title={item.title ?? ''}
          closeLabel={labels.closeDialog}
          video={item.video ?? null}
          poster={cover?.url ?? null}
          allowDownload={item.allowVideoDownload !== false}
          downloadLabel={labels.downloadVideo}
          unsupportedLabel={labels.videoUnsupported}
        />
      ) : null}

      {dialogOpen && canBrowseAlbum ? (
        <GalleryLightbox
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title={item.title ?? ''}
          images={gallery}
          labels={{
            close: labels.closeDialog,
            previous: labels.galleryPrevious,
            next: labels.galleryNext,
            counter: labels.galleryCounter,
            downloadImage: labels.galleryDownloadImage,
            thumbnailsLabel: labels.galleryThumbnails,
          }}
        />
      ) : null}
    </li>
  )
}

export default LibraryResourceCard
