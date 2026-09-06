'use client'

import Image from 'next/image'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { ResolvedImage } from '@/lib/media'

import { useModalDialog } from './useModalDialog'

/**
 * FOTOĞRAF ALBÜMÜ — TAM EKRAN LIGHTBOX  (Şartname 6.6, 6.8, 13)
 * ============================================================================
 * Albüm kartındaki "Galeriyi İncele" düğmesi bunu açar. Kabuk `<dialog>`
 * üzerine kuruludur (odak tuzağı, Escape, üst katman — bkz. useModalDialog).
 *
 * ---------------------------------------------------------------------------
 * NEDEN AYRI BİR BİLEŞEN
 * ---------------------------------------------------------------------------
 * Video penceresiyle (MediaDialog) aynı kabuğu paylaşır ama iç mimarisi
 * tamamen farklıdır: gezinme durumu, klavye okları, önizleme şeridi, ön
 * yükleme. Tek bir bileşene sıkıştırılsaydı iki modun koşulları birbirine
 * dolanırdı. Ortak olan tek şey kabuktur ve o zaten kancaya alındı.
 *
 * ---------------------------------------------------------------------------
 * ERİŞİLEBİLİRLİK — KLAVYE BİRİNCİL, FARE DEĞİL
 * ---------------------------------------------------------------------------
 *   - Sol/Sağ ok: önceki/sonraki görsel. Home/End: ilk/son.
 *   - Escape: `useModalDialog` kancasında garanti altına alınır — `<dialog>`'un
 *     `close` olayı her ortamda yayılmıyor (ölçüldü, kancadaki nota bakınız).
 *   - Ok düğmeleri gerçek `<button>`dır ve 44×44'tür (WCAG 2.2 — 2.5.8).
 *   - Aktif önizleme `aria-current="true"` taşır; ekran okuyucu kaçıncı
 *     görselde olduğunu söyler.
 *   - Sayaç (`3 / 8`) `aria-live="polite"`: ok tuşuyla gezinen görme engelli
 *     kullanıcı konumunun değiştiğini duyar (4.1.3 Durum Mesajları).
 *   - Görsel `alt` metni Medya kaydından gelir ve DEKORATİF DEĞİLDİR.
 *
 * TEK GÖRSELLİK ALBÜM: oklar ve önizleme şeridi hiç basılmaz — tıklandığında
 * hiçbir şey yapmayan kontrol bırakılmaz.
 *
 * ---------------------------------------------------------------------------
 * PERFORMANS
 * ---------------------------------------------------------------------------
 * Yalnızca AKTİF görsel tam boyutta yüklenir. Komşu iki görsel `priority`
 * olmadan önceden istenir (tarayıcı boşta indirir), böylece ok tuşuna
 * basıldığında beyaz bir bekleme olmaz. Sekiz görsellik bir albümde sekizini
 * birden yüklemek ölçülü bağlantıda anlamsız bir maliyettir.
 * ============================================================================
 */

type Labels = {
  close: string
  previous: string
  next: string
  /** "3 / 8" biçimini üretir. */
  counter: (current: number, total: number) => string
  downloadImage: string
  thumbnailsLabel: string
}

type Props = {
  open: boolean
  onClose: () => void
  title: string
  images: ResolvedImage[]
  labels: Labels
}

export const GalleryLightbox: React.FC<Props> = ({ open, onClose, title, images, labels }) => {
  const ref = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(0)
  const thumbStripRef = useRef<HTMLUListElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  useModalDialog(ref, onClose)

  const total = images.length
  const hasMany = total > 1

  const go = useCallback(
    (next: number) => {
      if (total === 0) return
      // Döngüsel gezinme: son görselden sağa basınca başa döner.
      setIndex(((next % total) + total) % total)
    },
    [total],
  )

  /**
   * KLAVYE GEZİNMESİ
   * Dinleyici `document` üzerindedir çünkü odak ok düğmelerinde, önizleme
   * şeridinde veya kapatma düğmesinde olabilir; hepsini ayrı ayrı dinlemek
   * yerine tek yerden yakalanır. `<dialog>` modal olduğu için bu dinleyici
   * arka plandaki sayfayı ETKİLEMEZ — modal kapalıyken bileşen zaten yok.
   *
   * Escape BURADA ELE ALINMAZ — `useModalDialog` kancasında, üç ayrı yoldan
   * garanti altına alınmıştır.
   */
  useEffect(() => {
    if (!hasMany) return

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault()
          go(index + 1)
          break
        case 'ArrowLeft':
          event.preventDefault()
          go(index - 1)
          break
        case 'Home':
          event.preventDefault()
          go(0)
          break
        case 'End':
          event.preventDefault()
          go(total - 1)
          break
        default:
          break
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [index, go, hasMany, total])

  /** Aktif önizlemeyi şeritte görünür tut (klavyeyle gezerken kaybolmasın). */
  useEffect(() => {
    const strip = thumbStripRef.current
    const active = strip?.querySelector<HTMLElement>('[data-active="true"]')
    active?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [index])

  if (!open || total === 0) return null

  const current = images[index]

  /** Aktif ve komşu görseller — ön yükleme penceresi. */
  const isNear = (i: number) =>
    i === index || i === (index + 1) % total || i === (index - 1 + total) % total

  return (
    <dialog
      ref={ref}
      aria-label={title}
      /*
        Escape ve kapanış olayları KANCADA ele alınır (bkz. useModalDialog —
        `close` olayı her ortamda gelmiyor). Burada yalnızca ARKA PLANA
        tıklama kalır.
      */
      onClick={(event) => {
        /*
          Dialog elemanının KENDİSİNE yapılan tıklama = `::backdrop`.
          Tam ekran lightbox'ta bu neredeyse hiç gerçekleşmez (içerik tüm
          yüzeyi kaplar); asıl "dışarı tıklama" sahne alanında ele alınır
          (aşağıdaki `stageRef`). Yine de bırakıldı: pencere küçük ekranda
          kenar boşluğu bırakırsa orası da kapatır.
        */
        if (event.target === ref.current) onClose()
      }}
      /*
        Zemin TAM OPAK. İlk sürümde `bg-shell-950/98` idi ve arkadaki
        sayfanın metinleri hayalet gibi sızıyordu (ekran görüntüsüyle
        görüldü). Tam ekran bir lightbox'ta fotoğrafın dışında hiçbir şey
        görünmemelidir; %2 saydamlık estetik bir kazanç sağlamıyor, yalnızca
        gürültü ekliyordu.
      */
      className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-shell-950 p-0 text-white backdrop:bg-black/85"
    >
      {/*
        `onClick` yayılımı: iç sarmalayıcı tıklamaları yutmaz — arka plan
        kontrolü olay HEDEFİNE bakar, bu yüzden `stopPropagation` gerekmez ve
        gereksiz bir kesme noktası eklenmez.
      */}
      <div className="flex h-full flex-col">
        {/* --- Üst çubuk ------------------------------------------------- */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            {/*
              `text-white` AÇIKÇA VERİLİR — miras yetmez.
              globals.css'teki `@layer base` bloğu `h1,h2,h3,h4` için
              `color: var(--color-ink-900)` tanımlıyor. Bu, elemanın KENDİ
              üzerinde bir bildirimdir; `<dialog>` üzerindeki `text-white`
              miras yoluyla gelir ve onu yenemez.

              Ölçüldü: başlık shell-950 zemin üzerinde ink-900 (#12181a) ile
              boyanıyordu → 1.2:1, pratikte görünmez. Açık sınıfla 17.1:1.
            */}
            <h2 className="truncate text-sm font-bold leading-snug tracking-tight text-white sm:text-base">
              {title}
            </h2>
            {/*
              Konum sayacı. `aria-live`: ok tuşuyla gezinildiğinde ekran
              okuyucu yeni konumu duyurur.
            */}
            <p aria-live="polite" className="mt-0.5 text-xs text-white/70">
              {labels.counter(index + 1, total)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {/*
              Görseli indir. `download` özniteliği KULLANILIR: bir fotoğrafı
              sekmede açmak kullanıcıyı ikinci bir adıma zorlar.

              ALBÜMÜN TAMAMINI ZIP OLARAK İNDİRME EKLENMEDİ — gerekçesi:
              ZIP'i sunucuda üretmek her istekte tüm görselleri belleğe alıp
              sıkıştırmak demektir (bir albüm 50 MB'ı rahat bulur) ve bu uç
              nokta hız sınırı olmadan açık bir kaynak tüketim vektörüdür.
              İstemcide üretmek ise ek bir kütüphane ve yine tüm görsellerin
              indirilmesi anlamına gelir. Tek görsel indirme, maliyetsiz ve
              ziyaretçinin gerçekten ihtiyaç duyduğu davranıştır.
            */}
            <a
              href={current.url}
              download
              className="inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 16 16"
                width="1em"
                height="1em"
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
              <span className="hidden sm:inline">{labels.downloadImage}</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              /* WCAG 2.2 — 2.5.8: 44×44 dokunma hedefi. */
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20" width="20" height="20">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  d="m4 4 12 12M16 4 4 16"
                />
              </svg>
              <span className="sr-only">{labels.close}</span>
            </button>
          </div>
        </div>

        {/* --- Sahne ------------------------------------------------------ */}
        {/*
          DIŞARI TIKLAMA — SAHNE ALANI
          Tam ekran bir lightbox'ta `<dialog>` yüzeyin tamamını kaplar, bu
          yüzden `::backdrop` pratikte tıklanamaz. Ziyaretçinin beklediği
          davranış "fotoğrafın etrafındaki boşluğa tıklayınca kapansın"dır ve
          o boşluk BURASIDIR.

          Hedef kontrolü şart: fotoğrafın, okların veya önizlemenin üstüne
          yapılan tıklama kapatmamalıdır. `event.target === stageRef.current`
          yalnızca boşluğa yapılan tıklamayı yakalar; `stopPropagation`
          kullanmaya gerek kalmaz.
        */}
        <div
          ref={stageRef}
          onClick={(event) => {
            if (event.target === stageRef.current) onClose()
          }}
          /*
            `fill` mutlak konumlanır ve padding'i yok sayar; bu yüzden ok
            düğmelerinin altında kalmaması için sahne padding'i yerine
            `inset` ile daraltılmış bir görsel alanı kullanılır (aşağıdaki
            iç sarmalayıcı).
          */
          className="relative flex min-h-0 flex-1 items-center justify-center"
        >
          {hasMany ? (
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="absolute left-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-shell-950/70 text-white transition-colors hover:border-white/60 hover:bg-shell-950 sm:left-4"
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="22" height="22">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 5l-7 7 7 7"
                />
              </svg>
              <span className="sr-only">{labels.previous}</span>
            </button>
          ) : null}

          {/*
            Görseller ÜST ÜSTE durur, yalnızca aktif olan görünür. Bu, her
            geçişte `<img>`'in sökülüp yeniden kurulmasını (ve dolayısıyla
            yeniden istek atılmasını) engeller. Uzaktakiler hiç render
            edilmez — sekiz görsellik albümde üç eleman DOM'da olur.
          */}
          {/*
            `fill` YERLEŞİMİ — ölçülmüş bir sorunun çözümü.
            Önceki sürüm `width`/`height` + `w-auto max-h-full` kullanıyordu.
            Sonuç: 1200×839'luk bir sahnede görsel 432×288'de takılı kalıyor,
            boşluğun ortasında küçük duruyordu — çünkü boyut, türevin
            içsel ölçüsünden türetiliyordu.

            `fill` ile görsel KAPSAYICIYI referans alır: `object-contain`
            sayesinde en-boy oranı korunur, kırpılmaz ve sahneye sığdığı
            kadar büyür. Kapsayıcı `relative` olmak zorundadır — sahne
            zaten öyle.
          */}
          <div className="pointer-events-none absolute inset-y-4 inset-x-2 sm:inset-x-20">
          {images.map((image, i) =>
            isNear(i) ? (
              <Image
                key={`${image.url}-${i}`}
                src={image.url}
                alt={image.alt}
                fill
                sizes="(min-width: 640px) 92vw, 100vw"
                priority={i === index}
                className={`object-contain ${i === index ? '' : 'hidden'}`}
              />
            ) : null,
          )}
          </div>

          {hasMany ? (
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="absolute right-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-shell-950/70 text-white transition-colors hover:border-white/60 hover:bg-shell-950 sm:right-4"
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="22" height="22">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span className="sr-only">{labels.next}</span>
            </button>
          ) : null}
        </div>

        {/* --- Alt önizleme şeridi ---------------------------------------- */}
        {hasMany ? (
          <div className="border-t border-white/10 px-4 py-3 sm:px-6">
            <ul
              ref={thumbStripRef}
              aria-label={labels.thumbnailsLabel}
              className="flex gap-2 overflow-x-auto"
            >
              {images.map((image, i) => (
                <li key={`thumb-${image.url}-${i}`} className="shrink-0">
                  <button
                    type="button"
                    data-active={i === index}
                    aria-current={i === index ? 'true' : undefined}
                    onClick={() => go(i)}
                    className={`block overflow-hidden rounded-md border-2 transition-colors ${
                      i === index
                        ? 'border-white'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt=""
                      width={112}
                      height={72}
                      sizes="112px"
                      className="h-14 w-20 object-cover sm:h-16 sm:w-24"
                    />
                    {/*
                      Önizleme görseli DEKORATİFTİR (`alt=""`): asıl görselin
                      alt metni sahnede zaten okunuyor. Düğmenin erişilebilir
                      adı sıradır — ekran okuyucu "3. görsel" der.
                    */}
                    <span className="sr-only">{labels.counter(i + 1, total)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </dialog>
  )
}

export default GalleryLightbox
