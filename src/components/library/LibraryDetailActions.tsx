'use client'

import React, { useState } from 'react'

import type { ResolvedImage, ResolvedVideo } from '@/lib/media'

import { ExternalLink } from '../ui/ExternalLink'

import { GalleryLightbox } from './GalleryLightbox'
import { MediaDialog } from './MediaDialog'

/**
 * KÜTÜPHANE KÜNYE SAYFASI — BİRİNCİL AKSİYON  (Şartname EK-2 Madde 1.5)
 * ============================================================================
 * NEDEN AYRI BİR İSTEMCİ BİLEŞENİ
 * ---------------------------------------------------------------------------
 * Künye sayfasının kendisi bir SUNUCU bileşenidir: metin, meta veriler ve
 * ilişkiler sunucuda üretilir, tarayıcıya JavaScript olarak inmez. Ancak üç
 * şey tarayıcıda olmak zorundadır:
 *
 *   1. Video oynatıcı ve albüm penceresi (`<dialog>` durum tutar),
 *   2. İndirme/izlenme sayacına gönderilen istek,
 *   3. Pencerenin yalnızca AÇILDIĞINDA DOM'a girmesi.
 *
 * Bu üçü bu bileşende toplanır; sayfanın geri kalanı sunucuda kalır.
 *
 * ---------------------------------------------------------------------------
 * AKSİYON SIRASI — LİSTE KARTIYLA AYNI KURAL
 * ---------------------------------------------------------------------------
 *   video → izle · albüm → galeriyi aç · dosya → indir · dış adres → git
 * Hiçbiri yoksa DÜĞME BASILMAZ. Tıklandığında hiçbir şey yapmayan bir düğme
 * bırakılmaz; onun yerine editöre de bilgi veren bir satır yazılır.
 *
 * Yüklenmiş dosya dış adresi YENER: dosya kendi sunucumuzdan servis edilir,
 * ziyaretçinin IP'si üçüncü tarafa gitmez (KVKK 12.2/12.3).
 *
 * ---------------------------------------------------------------------------
 * SAYAÇ ARTIK BURADA
 * ---------------------------------------------------------------------------
 * Sayaç önceden LİSTE kartında artıyordu; kart artık indirmiyor, künyeye
 * bağlanıyor. Sayaç da gerçek eylemin olduğu yere taşındı — böylece sayı
 * "kaç kişi listeyi gördü"yü değil "kaç kişi indirdi/izledi"yi ölçer.
 * ============================================================================
 */

/**
 * ETİKETLER YALNIZCA DÜZ METİNDİR — ÖLÇÜLMÜŞ BİR HATANIN SONUCU.
 * ---------------------------------------------------------------------------
 * Bu bileşen bir SUNUCU bileşeninden (künye sayfası) çağrılır. React Sunucu
 * Bileşenleri sınırından istemciye FONKSİYON geçirilemez; ilk sürümde
 * `openAlbumWithCount: (count) => ...` ve `galleryCounter: (c, t) => ...`
 * vardı ve sayfa şu hatayla 500 döndü:
 *
 *     Functions cannot be passed directly to Client Components unless you
 *     explicitly expose it by marking it with "use server".
 *
 * (Liste kartında aynı desen çalışıyordu çünkü `LibraryCatalog` zaten bir
 * istemci bileşenidir; sınır orada değildi.)
 *
 * Çözüm iki parçalı:
 *   - Sayısı SUNUCUDA bilinen etiket (albümdeki fotoğraf sayısı) sunucuda
 *     doldurulmuş hâlde gelir: `openAlbum`.
 *   - Sayısı ancak ÇALIŞMA ANINDA bilinen etiket (lightbox sayacı) bir
 *     ŞABLON olarak gelir; yer tutucular burada doldurulur.
 */
export type LibraryActionLabels = {
  download: string
  watch: string
  /** Fotoğraf sayısı sunucuda doldurulmuştur: "Galeriyi İncele (4 Fotoğraf)". */
  openAlbum: string
  openExternal: string
  unavailable: string
  closeDialog: string
  downloadVideo: string
  videoUnsupported: string
  captionsLabel: string
  formatLabel: string
  galleryPrevious: string
  galleryNext: string
  /** Ham şablon: "{current} / {total}". Yer tutucular istemcide doldurulur. */
  galleryCounterTemplate: string
  galleryDownloadImage: string
  galleryThumbnails: string
}

type Props = {
  id: string | number
  title: string
  /** Kart rozetindekiyle aynı biçim etiketi; ekran okuyucu ekine girer. */
  format?: string | null
  video?: ResolvedVideo | null
  gallery?: ResolvedImage[]
  poster?: string | null
  fileHref?: string | null
  externalHref?: string | null
  allowVideoDownload?: boolean
  captionsUrl?: string | null
  /** Ziyaretçinin arayüz dili — `<track srclang>` için. */
  captionsLang?: string
  labels: LibraryActionLabels
}

const BUTTON_CLASS =
  'group/action inline-flex min-h-12 items-center gap-2 rounded-sm bg-brand-700 px-6 text-sm font-bold text-white transition-colors duration-300 hover:bg-brand-800'

export const LibraryDetailActions: React.FC<Props> = ({
  id,
  title,
  format,
  video,
  gallery = [],
  poster,
  fileHref,
  externalHref,
  allowVideoDownload = true,
  captionsUrl,
  captionsLang,
  labels,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false)

  const canPlay = Boolean(video)
  const canBrowseAlbum = !canPlay && gallery.length > 0
  const href = !canPlay && !canBrowseAlbum ? (fileHref?.trim() || null) : null
  const external = !canPlay && !canBrowseAlbum && !href ? (externalHref?.trim() || null) : null

  /**
   * SAYACI ARTIR — ziyaretçiyi BEKLETMEDEN.
   * `sendBeacon` isteği tarayıcının kuyruğuna bırakır ve hemen döner; sayfa
   * indirme yüzünden değişse bile istek gider. Hata YUTULUR: sayaç bir yan
   * işlevdir, indirmenin önüne asla geçmemelidir.
   */
  const countHit = () => {
    const url = `/api/library/${id}/hit`
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

  /**
   * Lightbox sayacı: "{current} / {total}" şablonundaki yer tutucular
   * burada doldurulur. Şablonun sunucudan DÜZ METİN olarak gelmesinin
   * gerekçesi yukarıdaki blokta.
   */
  const sayacMetni = (current: number, total: number) =>
    labels.galleryCounterTemplate
      .replace('{current}', String(current))
      .replace('{total}', String(total))

  const accessibleSuffix = [title, format ? `${format} ${labels.formatLabel}` : null]
    .filter(Boolean)
    .join(', ')

  return (
    <>
      {canPlay || canBrowseAlbum ? (
        <button
          type="button"
          onClick={() => {
            setDialogOpen(true)
            countHit()
          }}
          className={BUTTON_CLASS}
        >
          {canPlay ? labels.watch : labels.openAlbum}
          <span className="sr-only"> — {title}</span>
        </button>
      ) : href ? (
        <a href={href} onClick={countHit} className={BUTTON_CLASS}>
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
      ) : external ? (
        <ExternalLink
          href={external}
          trackId="library:external"
          className={BUTTON_CLASS}
          onActivate={countHit}
        >
          {labels.openExternal}
          <span className="sr-only"> — {title}</span>
        </ExternalLink>
      ) : (
        <p className="text-sm italic text-ink-500">{labels.unavailable}</p>
      )}

      {/* Pencere yalnızca açıkken DOM'a girer. */}
      {dialogOpen && canPlay ? (
        <MediaDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title={title}
          closeLabel={labels.closeDialog}
          video={video ?? null}
          poster={poster ?? null}
          allowDownload={allowVideoDownload}
          downloadLabel={labels.downloadVideo}
          unsupportedLabel={labels.videoUnsupported}
          captionsUrl={captionsUrl}
          captionsLabel={labels.captionsLabel}
          captionsLang={captionsLang}
        />
      ) : null}

      {dialogOpen && canBrowseAlbum ? (
        <GalleryLightbox
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title={title}
          images={gallery}
          labels={{
            close: labels.closeDialog,
            previous: labels.galleryPrevious,
            next: labels.galleryNext,
            counter: sayacMetni,
            downloadImage: labels.galleryDownloadImage,
            thumbnailsLabel: labels.galleryThumbnails,
          }}
        />
      ) : null}
    </>
  )
}

export default LibraryDetailActions
