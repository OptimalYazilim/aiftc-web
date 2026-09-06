'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

/**
 * YERLEŞKE / ULAŞIM HARİTASI  (Şartname 6.9, 12.3)
 * ============================================================================
 * GİZLİLİK — HARİTA KENDİLİĞİNDEN YÜKLENMEZ
 * Gömülü bir harita iframe'i, sayfa açılır açılmaz ziyaretçinin IP adresini
 * üçüncü tarafa (OpenStreetMap sunucuları) gönderir. Şartname 12.3 ve KVKK
 * bunun için önceden bilgilendirme ve tercih ister.
 *
 * Bu yüzden varsayılan olarak yalnızca STATİK bir görsel (ya da görsel
 * yüklenmemişse metin tabanlı bir yer tutucu) gösterilir; harita ancak
 * ziyaretçi açıkça "Haritayı yükle" düğmesine bastığında gelir. Tercih
 * saklanmaz — her ziyarette yeniden sorulur, çünkü kalıcı bir kayıt tutmak
 * için ayrıca rıza gerekirdi.
 *
 * OpenStreetMap tercih edilir: API anahtarı gerektirmez ve Google Maps'e göre
 * belirgin biçimde daha az izleme yapar.
 *
 * ERİŞİLEBİLİRLİK
 *   - Harita TEK BAŞINA yeterli bilgi kaynağı değildir; adres ve ulaşım
 *     tarifi sayfada METİN olarak da bulunur (1.1.1, 1.4.1).
 *   - iframe `title` taşır (4.1.2) ve alternatif olarak OSM'ye giden normal
 *     bir bağlantı verilir.
 * ============================================================================
 */

type Props = {
  latitude?: number | null
  longitude?: number | null
  /** Rıza öncesi gösterilen statik görsel (Genel Ayarlar > İletişim). */
  staticImage?: { url: string; width: number; height: number; alt: string } | null
  /** Yer tutucuda ve iframe başlığında kullanılan kurum adı. */
  placeName: string
  /** Koordinat yokken konum kartında gösterilen açık adres. */
  address?: string | null
}

/** Noktanın etrafında yaklaşık ~1.5 km'lik bir çerçeve. */
const BBOX_PADDING = 0.012

/** Konum kartı ve harita başlığında kullanılan iğne simgesi. */
const PinIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 24 24"
    width="28"
    height="28"
    className="shrink-0 text-brand-700"
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
    />
    <circle cx="12" cy="10" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

export const LocationMap: React.FC<Props> = ({
  latitude,
  longitude,
  staticImage,
  placeName,
  address,
}) => {
  const t = useTranslations('contact')
  const [loaded, setLoaded] = useState(false)

  /**
   * KOORDİNAT YOKKEN — BOŞ KUTU DEĞİL, KONUM KARTI
   * Panelde enlem/boylam girilmemişse gömülü harita kurulamaz. Önceden burada
   * yalnızca gri bir uyarı kutusu vardı ve sayfa yarım görünüyordu.
   *
   * Artık elde olan gerçek veriyle (kurum adı + açık adres) tasarlanmış bir
   * konum kartı basılır. Harita bağlantısı UYDURULMUŞ bir koordinata değil,
   * adresin kendisiyle yapılan bir OpenStreetMap ARAMASINA gider — böylece
   * yanlış bir noktaya yönlendirme riski olmaz.
   *
   * Adres de yoksa kart hiç basılmaz: içi boş bir çerçeve göstermenin
   * ziyaretçiye faydası yoktur.
   */
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    if (!address?.trim()) return null

    const searchUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`

    return (
      <div className="rounded-card border border-line bg-surface-alt p-6">
        <div className="flex gap-4">
          <PinIcon />
          <div className="min-w-0">
            <p className="font-semibold text-ink-900">{placeName}</p>
            <p className="mt-1 whitespace-pre-line text-ink-700">{address}</p>

            <p className="mt-4">
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-accent-700 underline underline-offset-4"
              >
                {t('mapSearchAddress')}
                <span className="sr-only"> {t('opensInNewTab')}</span>
              </a>
            </p>

            <p className="mt-2 text-sm text-ink-600">{t('mapCoordinatesPending')}</p>
          </div>
        </div>
      </div>
    )
  }

  const bbox = [
    longitude - BBOX_PADDING,
    latitude - BBOX_PADDING,
    longitude + BBOX_PADDING,
    latitude + BBOX_PADDING,
  ].join(',')

  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`
  const externalUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`

  return (
    <div>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-card border border-line bg-surface-alt">
        {loaded ? (
          <iframe
            src={embedUrl}
            title={t('mapTitle', { place: placeName })}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full border-0"
          />
        ) : (
          <>
            {staticImage ? (
              <Image
                src={staticImage.url}
                alt={staticImage.alt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : null}

            {/* Rıza katmanı: görsel varsa üzerinde, yoksa boş alanda durur. */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface/85 p-6 text-center">
              <p className="max-w-md text-ink-700">{t('mapConsentNotice')}</p>
              <button
                type="button"
                onClick={() => setLoaded(true)}
                className="inline-flex min-h-11 items-center rounded bg-brand-700 px-5 font-semibold text-white hover:bg-brand-800"
              >
                {t('mapLoad')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Haritayı hiç yüklemek istemeyen için normal bağlantı. */}
      <p className="mt-3 text-sm">
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-700 underline underline-offset-4"
        >
          {t('mapOpenExternal')}
          <span className="sr-only"> {t('opensInNewTab')}</span>
        </a>
      </p>
    </div>
  )
}

export default LocationMap
