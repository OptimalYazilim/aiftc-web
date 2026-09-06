'use client'

import Image from 'next/image'
import React, { useState } from 'react'

import type { ResolvedImage } from '@/lib/media'

import { GalleryLightbox } from '../library/GalleryLightbox'

/**
 * ALBÜM IZGARASI + TAM EKRAN GÖRÜNTÜLEYİCİ  (Şartname 6.8, 13)
 * ============================================================================
 * Albüm sayfasının tek istemci parçası. Sayfanın geri kalanı sunucuda üretilir;
 * burada yalnızca "hangi kare açık" durumu tutulur.
 *
 * ---------------------------------------------------------------------------
 * IZGARADAN AÇILAN KARE, TIKLANAN KAREDİR
 * ---------------------------------------------------------------------------
 * `GalleryLightbox` baştan başlıyordu (kütüphane kartında tek bir "albümü aç"
 * düğmesi olduğu için doğruydu). Izgarada bu davranış yanlış olurdu: 12.
 * fotoğrafa tıklayan ziyaretçi 1. fotoğrafı görürdü. Bileşene bu iş için
 * `startIndex` eklendi.
 *
 * ---------------------------------------------------------------------------
 * ERİŞİLEBİLİRLİK
 * ---------------------------------------------------------------------------
 *   - Her kare gerçek bir `<button>`dır: klavyeyle sekmelenir, Enter/Boşluk
 *     ile açılır (WCAG 2.1.1). Tıklanabilir `<div>` kullanılmadı.
 *   - Düğmenin erişilebilir adı görselin `alt` metnidir; yoksa "n. fotoğraf"
 *     kalıbına düşülür — ekran okuyucuda on tane adsız "düğme" duyulmaz
 *     (2.4.4 / 4.1.2).
 *   - Görsellerin kendisi `alt=""` ile basılır: adı zaten düğme taşır, ikinci
 *     kez okutmak tekrar üretir.
 *   - Hedefler ızgara hücresi büyüklüğündedir, 44×44'ün çok üstünde (2.5.8).
 * ============================================================================
 */

export type AlbumGalleryLabels = {
  close: string
  previous: string
  next: string
  /** Ham şablon: "{current} / {total}". Sunucu sınırından fonksiyon geçemez. */
  counterTemplate: string
  downloadImage: string
  thumbnailsLabel: string
  /** "{index}. fotoğraf" — alt metni olmayan kare için yedek ad. */
  imageFallbackTemplate: string
}

type Props = {
  images: ResolvedImage[]
  title: string
  labels: AlbumGalleryLabels
}

export const AlbumGallery: React.FC<Props> = ({ images, title, labels }) => {
  const [acikIndex, setAcikIndex] = useState<number | null>(null)

  if (images.length === 0) return null

  const sayacMetni = (current: number, total: number) =>
    labels.counterTemplate.replace('{current}', String(current)).replace('{total}', String(total))

  return (
    <>
      {/*
        IZGARA — KESKİN HATLAR, GÖLGESİZ.
        Kareler arasındaki boşluk 1px'e yakın tutulur (`gap-px`) ve zemin
        çizgi rengidir: fotoğraflar bir yaprak üzerinde dizilmiş gibi durur,
        yuvarlatılmış kartlar hâlinde yüzmez.
      */}
      <ul className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => {
          const ad = image.alt?.trim() || labels.imageFallbackTemplate.replace('{index}', String(index + 1))

          return (
            <li key={`${image.url}-${index}`} className="relative">
              <button
                type="button"
                onClick={() => setAcikIndex(index)}
                className="group block w-full cursor-pointer overflow-hidden bg-surface-alt"
              >
                <span className="sr-only">{ad}</span>
                <Image
                  src={image.url}
                  alt=""
                  width={image.width}
                  height={image.height}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
                />
              </button>
            </li>
          )
        })}
      </ul>

      {/* Pencere yalnızca açıkken DOM'a girer; her açılışta yeniden biner. */}
      {acikIndex !== null ? (
        <GalleryLightbox
          open
          startIndex={acikIndex}
          onClose={() => setAcikIndex(null)}
          title={title}
          images={images}
          labels={{
            close: labels.close,
            previous: labels.previous,
            next: labels.next,
            counter: sayacMetni,
            downloadImage: labels.downloadImage,
            thumbnailsLabel: labels.thumbnailsLabel,
          }}
        />
      ) : null}
    </>
  )
}

export default AlbumGallery
