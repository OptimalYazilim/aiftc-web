import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { LIBRARY_ALBUM_TYPE, LIBRARY_VIDEO_TYPE } from '@/fields/options'
import type { Locale } from '@/i18n/locales'
import { detailHref } from '@/i18n/routes'
import { resolveMedia, type ResolvedImage, type ResolvedVideo } from '@/lib/media'

/**
 * KÜTÜPHANE KAYIT KARTI — WHO EDİTORYAL STİLİ  (Şartname 6.6, 11.3, 13)
 * ============================================================================
 * YATAY DÜZEN, ÜÇ BÖLGE
 *
 *   sol    → kapak görseli veya tür panosu (3/4 oranında), üstünde biçim
 *            rozeti ("PDF · 4,2 MB" / "45 dk" / "12 fotoğraf")
 *   orta   → yıl · tür · sayaç üst başlığı, kalın başlık, 1–2 cümlelik özet
 *   alt    → tek aksiyon: KÜNYE SAYFASINA git
 *
 * ---------------------------------------------------------------------------
 * KART ARTIK İNDİRMİYOR  (Şartname EK-2 Madde 1.5)
 * ---------------------------------------------------------------------------
 * Önceki sürümde kart doğrudan dosyayı indiriyor, videoyu bir pencerede
 * açıyordu. EK-2 Madde 1.2 künyeye kurum, ülke, dil, sürüm, lisans, telif ve
 * DOI/ISBN alanlarını eklediğinde bu düzen taşınamaz hâle geldi: bu bilgiler
 * bir kart yüzeyine sığmaz, sığdırılsaydı kart okunmaz olurdu.
 *
 * Bu yüzden kart tek bir yere bakar — künye sayfasına. Ziyaretçi neyi
 * indirdiğini indirmeden ÖNCE görür. Oynatıcı, albüm penceresi ve indirme
 * sayacı künye sayfasına taşındı (bkz. components/library/
 * LibraryDetailActions), böylece bu bileşenden durum (`useState`) ve
 * `'use client'` gereksinimi tamamen kalktı.
 *
 * ---------------------------------------------------------------------------
 * TÜM KART TIKLANABİLİR — TEK BAĞLANTI
 * ---------------------------------------------------------------------------
 * Başlıktaki bağlantı `after:absolute after:inset-0` ile kartın tamamına
 * yayılır (eğitim kartıyla aynı desen). Böylece:
 *   - imleç kartın her yerinde el işaretine döner,
 *   - ekran okuyucu ve klavye kullanıcısı TEK bağlantı görür — aynı hedefe
 *     giden ikinci bir "Künyeyi İncele" bağlantısı sekme sırasını iki katına
 *     çıkarırdı (WCAG 2.4.4 / 2.4.9).
 * Alt satırdaki "Künyeyi İncele" ibaresi bu yüzden bir bağlantı DEĞİL,
 * yalnızca görsel bir işarettir (`aria-hidden`).
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
 * Boyut ve biçim ÖNCE yüklü dosyadan (`document-files` / `media`) okunur;
 * bu değerler ölçülmüştür. Dosya yoksa — kayıt başka bir kurumun sitesine
 * bağlanıyorsa — katalogdaki `fileFormat` / `fileSize` alanlarına düşülür.
 * Şartname 11.3 ve 13: ziyaretçi neyi, hangi biçimde ve ne büyüklükte
 * indireceğini TIKLAMADAN ÖNCE görür. Ölçülü bağlantıda 40 MB'lık bir PDF'i
 * habersiz indirtmek erişilebilirlik sorunudur. Videoda aynı işi
 * `videoDuration` yapar.
 *
 * ---------------------------------------------------------------------------
 * ERİŞİLEBİLİRLİK
 * ---------------------------------------------------------------------------
 *   - Kartta TEK odak durağı vardır: başlıktaki bağlantı. Alt satırdaki
 *     "Künyeyi İncele" ibaresi `aria-hidden`dır; aynı hedefe ikinci bir durak
 *     eklemek sekme sırasını gereksiz yere uzatırdı (2.4.3).
 *   - Bağlantının erişilebilir adı YAYININ ADIDIR. Ekran okuyucu kullanıcısı
 *     bağlantı listesinde on tane özdeş "Künyeyi İncele" görmez (2.4.4) —
 *     ibare bağlantı metni olsaydı tam olarak bu olurdu.
 *   - Sol pano ve içindeki işaret `aria-hidden`; taşıdıkları bilgi üst
 *     başlıkta METİN olarak da vardır (1.4.1).
 *   - Gerilmiş bağlantı `<li>` sınırında durur, kartlar arasına taşmaz.
 *
 * KONTRAST — ölçülen:
 *     shell-900 başlık / beyaz        15.74:1
 *     ink-600   özet / beyaz           7.39:1
 *     brand-700 üst başlık / beyaz     6.61:1
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
  /** Künye sayfasının adresi bundan üretilir; boşsa kart bağlantısız kalır. */
  slug?: string | null
  title?: string | null
  description?: string | null
  author?: string | null
  publicationYear?: number | null
  /** Tür anahtarı — filtreleme ve pano seçimi için. */
  resourceType?: string | null
  /** Tür etiketi, ziyaretçinin dilinde. */
  resourceTypeLabel?: string | null
  file?: LibraryFile | null
  /** Künyeden gelen biçim/boyut — yalnızca dosyasız (dış bağlantılı) kayıtlarda dolu. */
  fileFormat?: string | null
  fileSize?: string | null
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

/**
 * Kart artık pencere açmadığı için oynatıcı/lightbox etiketleri BU LİSTEDE
 * DEĞİLDİR; onlar künye sayfasında `LibraryActionLabels` altında durur.
 */
export type LibraryCardLabels = {
  /** Alt satırdaki görsel işaret, örn. "Künyeyi İncele". */
  viewRecord: string
  /** Sayaç rozeti, örn. "{count} indirme". */
  downloadsBadge: (count: number) => string
  /** Albüm görsel sayısı rozeti, örn. "12 fotoğraf". */
  photoCount: (count: number) => string
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

/**
 * Katalog kaydının ELLE girilmiş biçimi (`LibraryResources.fileFormat`)
 * → rozet etiketi.
 *
 * Bu yol YALNIZCA dosyasız kayıtlar (dış bağlantı) içindir; yüklü dosya varsa
 * biçim MIME'den okunur ve panelde alan zaten gizlenir. İki kaynak aynı anda
 * dolamaz, dolayısıyla çelişemez.
 *
 * `other` KASITLI OLARAK EKSİK: "DİĞER" yazan bir rozet ziyaretçiye hiçbir şey
 * söylemez. `FORMAT_BY_MIME` ile aynı kural — bilinmeyen biçimde etiket
 * gösterilmez.
 */
const FORMAT_BY_KEY: Record<string, string> = {
  pdf: 'PDF',
  docx: 'DOCX',
  xlsx: 'XLSX',
  pptx: 'PPTX',
  epub: 'EPUB',
  mp4: 'MP4',
  mp3: 'MP3',
  zip: 'ZIP',
  html: 'WEB',
}

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
  locale: Locale
  labels: LibraryCardLabels
}> = ({ item, locale, labels }) => {
  /**
   * KAPAK SEÇİMİ
   * Editörün seçtiği kapak her zaman kazanır. Albümlerde kapak
   * verilmemişse ALBÜMÜN İLK GÖRSELİ kullanılır — soyut bir fotoğraf
   * işareti basmak yerine albümün kendisinden bir kare göstermek, kartın
   * neyi vaat ettiğini doğrudan anlatır.
   */
  const explicitCover = resolveMedia(item.coverImage, 'card')
  /*
    BİÇİM VE BOYUT — ÖNCE DOSYADAN, SONRA KÜNYEDEN.
    Yüklü dosya varsa gerçek dosya kazanır; bu değerler ölçülmüştür, elle
    girilen künye eskimiş olabilir. Dosya yoksa (kayıt başka bir kurumun
    sitesine bağlanıyorsa) katalogdaki alanlara düşülür — Şartname 11.3 ve 13,
    ziyaretçinin tıklamadan önce ne indireceğini bilmesini ister ve dış
    bağlantılı kayıtlarda bunu söyleyebilecek tek yer künyedir.
  */
  const format =
    formatOf(item.file) ?? (item.fileFormat ? (FORMAT_BY_KEY[item.fileFormat] ?? null) : null)
  const size = item.file?.humanFileSize?.trim() || item.fileSize?.trim() || null

  const isVideo = item.resourceType === LIBRARY_VIDEO_TYPE
  const isAlbum = item.resourceType === LIBRARY_ALBUM_TYPE
  const gallery = item.gallery ?? []

  const cover = explicitCover ?? (isAlbum ? (gallery[0] ?? null) : null)

  /**
   * KÜNYE SAYFASININ ADRESİ.
   * Slug'ı olmayan bir kayıt bağlantısız kalır — uydurma bir adrese götüren
   * ölü bir bağlantı basmaktansa kartı sessizce bağlantısız bırakmak yeğdir.
   * (Slug alanı zorunludur ve boş bırakılırsa başlıktan üretilir; bu durum
   * ancak veri elle bozulursa oluşur.)
   */
  const recordHref = item.slug ? detailHref('library-resource', locale, item.slug) : null

  /** Sol panodaki rozet: biçim+boyut, süre veya fotoğraf sayısı. */
  const badge = isVideo
    ? // Süre girilmemişse dosya boyutuna düşülür: ziyaretçi ölçülü bağlantıda
      // ne indireceğini yine de tıklamadan önce görür (Şartname 11.3, 13).
      (item.videoDuration?.trim() || item.video?.humanSize || null)
    : isAlbum
      ? (gallery.length > 0 ? labels.photoCount(gallery.length) : null)
      : [format, size].filter(Boolean).join(' · ') || null

  const downloads = Number(item.downloads) || 0

  return (
    <li
      className={`group relative flex flex-col gap-5 border-b border-line-soft py-6 transition-colors duration-500 sm:flex-row sm:gap-7 ${
        recordHref ? 'cursor-pointer hover:border-shell-900' : ' focus-within:border-shell-900'
      }`}
    >
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
          {recordHref ? (
            /*
              GERİLMİŞ BAĞLANTI: `after:absolute after:inset-0` bağlantının
              tıklanabilir alanını `<li className="relative">` sınırına kadar
              yayar. Kartın tamamı tıklanır ama DOM'da tek bir bağlantı vardır
              — eğitim kartıyla aynı desen.
            */
            <Link
              href={recordHref}
              className="transition-colors duration-500 after:absolute after:inset-0 after:content-[''] group-hover:text-brand-800 focus-visible:text-brand-800 group-focus-within:text-brand-800"
            >
              {item.title}
            </Link>
          ) : (
            item.title
          )}
        </h3>

        {item.author ? <p className="mt-1 text-sm text-ink-600">{item.author}</p> : null}

        {item.description ? (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-600">{item.description}</p>
        ) : null}

        {/* --- Aksiyon: tek hedef, künye sayfası ------------------------ */}
        {/*
          Bu bir BAĞLANTI DEĞİLDİR. Başlıktaki gerilmiş bağlantı zaten kartın
          tamamını kapsıyor; buraya ikinci bir <a> konsaydı klavye kullanıcısı
          aynı hedefe giden iki durak arasında gezinmek zorunda kalırdı.
          İbare yalnızca görsel bir işarettir ve ekran okuyucudan gizlenir
          (WCAG 2.4.4 — bağlantı amacı zaten başlıkta).
        */}
        {recordHref ? (
          <p
            aria-hidden="true"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800"
          >
            {labels.viewRecord}
            <svg
              focusable="false"
              viewBox="0 0 16 16"
              width="1em"
              height="1em"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-500 ease-editorial group-hover:translate-x-1 group-focus-within:translate-x-1"
            >
              <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
            </svg>
          </p>
        ) : null}
      </div>
    </li>
  )
}

export default LibraryResourceCard
