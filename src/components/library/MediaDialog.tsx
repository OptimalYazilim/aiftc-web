'use client'

import Image from 'next/image'
import React, { useRef, useState } from 'react'

import type { ResolvedVideo } from '@/lib/media'

import { useModalDialog } from './useModalDialog'

/**
 * VİDEO PENCERESİ
 * ============================================================================
 * Albüm görüntüleme buradan ÇIKARILDI: fotoğraf albümleri artık tam ekran bir
 * lightbox'ta açılıyor (bkz. components/library/GalleryLightbox). İki modun
 * tek bileşende durması koşulları birbirine dolaştırıyordu; ortak olan tek şey
 * `<dialog>` kabuğuydu ve o `useModalDialog` kancasına alındı.
 * ============================================================================
 * NEDEN NATIVE `<dialog>` — elle yazılmış bir modal değil
 * ---------------------------------------------------------------------------
 * `dialog.showModal()` tarayıcıdan ÜCRETSİZ olarak şunları getirir:
 *   - odak tuzağı (Tab pencerenin dışına çıkmaz)  → WCAG 2.2 — 2.1.2
 *   - üst katman (top layer): z-index yarışı yok
 *   - `aria-modal` ve arka planın erişilebilirlik ağacından çıkarılması
 * Elle yazılan modallarda bu dördü de tek tek uygulanmak zorundadır ve
 * pratikte en az biri unutulur. Tarayıcı desteği (Chrome/Edge/Firefox/Safari)
 * 2022'den beri tamdır.
 *
 * ESCAPE ise KANCADA garanti altına alınır: `<dialog>`'un `close` olayı her
 * ortamda yayılmıyor (ölçüldü — gerekçe ve ölçüm useModalDialog içinde).
 * Kapanış üç yoldan da (Escape, kapatma düğmesi, arka plana tıklama) aynı
 * `onClose`'a çıkar.
 *
 * ---------------------------------------------------------------------------
 * HTML5 OYNATICI — ÜÇÜNCÜ TARAF YOK
 * ---------------------------------------------------------------------------
 * Burada bir `<iframe>` vardı: video YouTube/Vimeo'dan geliyordu. Artık dosya
 * kurumun kendi sunucusundan servis ediliyor ve yerli `<video>` etiketiyle
 * oynatılıyor. Kazanç üç başlıkta:
 *
 *   GİZLİLİK   → Ziyaretçinin IP'si ve tarayıcı bilgisi hiçbir üçüncü tarafa
 *                gitmez. `youtube-nocookie` bunu AZALTIYORDU, kaldırmıyordu.
 *                KVKK 12.2/12.3 açısından artık aydınlatma gerektiren bir veri
 *                aktarımı yok.
 *   SÜREKLİLİK → Yayın, kurumun sahibi olmadığı bir platformun hesap/telif
 *                kararına bağlı değil.
 *   ERİŞİM     → YouTube'un engelli olduğu ülkelerden (merkezin hedef kitlesi
 *                Orta Asya'dır) video açılıyor.
 *
 * ---------------------------------------------------------------------------
 * OYNATICI YALNIZCA PENCERE AÇIKKEN VAR
 * ---------------------------------------------------------------------------
 * Bileşen `open` false iken hiçbir şey render etmez. `<video>` elemanı
 * pencere açıldığında kurulur, kapanınca DOM'dan sökülür: video durur ve
 * ağdan indirme kesilir — ayrıca `pause()` çağırmaya gerek yoktur.
 *
 * `preload="metadata"`: pencere açıldığında dosyanın TAMAMI değil, yalnızca
 * başlığı (süre, boyutlar) indirilir. `preload="auto"` ölçülü bağlantıda,
 * ziyaretçi oynat'a basmasa bile yüzlerce MB indirtirdi.
 *
 * `poster`: kapak görseli varsa ilk kare yerine o basılır — siyah bir
 * dikdörtgen yerine kaydın kimliği görünür.
 * ============================================================================
 */

type Props = {
  open: boolean
  onClose: () => void
  title: string
  closeLabel: string
  /** Video modu: çözülmüş dosya. Albüm modunda null. */
  video?: ResolvedVideo | null
  /** Oynatıcının kapak karesi (kaydın kapak görseli). */
  poster?: string | null
  /** Oynatıcının altında indirme bağlantısı gösterilsin mi? */
  allowDownload?: boolean
  downloadLabel?: string
  /** Tarayıcı kaynağı oynatamadığında gösterilecek açıklama. */
  unsupportedLabel?: string
}

export const MediaDialog: React.FC<Props> = ({
  open,
  onClose,
  title,
  closeLabel,
  video,
  poster,
  allowDownload = true,
  downloadLabel,
  unsupportedLabel,
}) => {
  const ref = useRef<HTMLDialogElement>(null)

  /**
   * OYNATILAMAYAN KAYNAK — MOV kabul edildiğinden beri gerçek bir olasılık.
   * Medya kitaplığı `video/quicktime` dosyalarını da alıyor (editörün
   * elindeki ham çekimler çoğunlukla MOV). Safari bunları oynatır, Chrome ve
   * Firefox çoğunlukla oynatmaz.
   *
   * Bu durumda `<video>` sessizce SİYAH BİR KUTU olarak kalır: ziyaretçi
   * oynat'a basar, hiçbir şey olmaz ve neden olmadığını anlamaz. Medya
   * elemanının `error` olayı yakalanıp yerine ne olduğunu SÖYLEYEN bir blok
   * basılır.
   *
   * Not: bu bir hata AYIKLAMA değil, beklenen bir durumdur — kodek desteği
   * tarayıcıya göre değişir ve sunucu tarafında önceden bilinemez.
   */
  const [playbackFailed, setPlaybackFailed] = useState(false)

  useModalDialog(ref, onClose)

  if (!open) return null

  return (
    <dialog
      ref={ref}
      aria-label={title}
      /*
        Escape ve kapanış olayları KANCADA ele alınır (bkz. useModalDialog —
        `close` olayı her ortamda yayılmıyor, ölçüldü). Burada yalnızca ARKA
        PLANA tıklama kalır.
      */
      onClick={(event) => {
        // Arka plana (dialog elemanının kendisine) tıklama kapatır; içeriğe
        // tıklama kapatmaz — olay hedefi kontrol edilir.
        if (event.target === ref.current) onClose()
      }}
      className="m-auto w-[min(92vw,64rem)] max-w-none rounded-lg border border-line bg-surface p-0 backdrop:bg-shell-950/80 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line-soft px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          {/*
            Başlığın solunda küçük bir oynatma işareti: pencere açıldığında ne
            tür bir içeriğe bakıldığı, video henüz boyanmadan önce belli olur.
            `aria-hidden` — aynı bilgi başlıkta zaten metin olarak var
            (WCAG 2.2 — 1.1.1).
          */}
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" focusable="false">
              <path fill="currentColor" d="M5 3.4 12.2 8 5 12.6V3.4Z" />
            </svg>
          </span>
          <h2 className="truncate text-base font-bold leading-snug tracking-tight text-shell-900 sm:text-lg">
            {title}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          /* WCAG 2.2 — 2.5.8: 44×44 dokunma hedefi. */
          className="-mr-2 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-600 transition-colors hover:bg-surface-alt hover:text-shell-900"
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
          <span className="sr-only">{closeLabel}</span>
        </button>
      </div>

      {video ? (
        <div className="bg-shell-950">
          {/*
            Oynatma başarısızsa oynatıcı DOM'da kalır ama gizlenir: yeniden
            kurmak yerine gizlemek, tarayıcının ikinci kez indirme denemesini
            önler. Açıklama bloğu onun yerine görünür.
          */}
          {playbackFailed ? (
            <p
              role="status"
              className="flex flex-col items-start gap-3 px-5 py-8 text-sm text-white/85 sm:flex-row sm:items-center"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 24 24"
                className="h-7 w-7 shrink-0 text-white/60"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5v5.5M12 16.2v.3" />
              </svg>
              <span>{unsupportedLabel}</span>
            </p>
          ) : null}

          {/*
            OYNATICI ÇERÇEVESİ
            Kurumsal koyu zemin üzerinde 16/9 bir alan. Tarayıcının YERLİ
            kontrolleri kullanılır — özel bir oynatıcı arayüzü YAZILMADI ve bu
            bilinçli bir karardır:

              - Yerli kontroller klavyeyle çalışır (boşluk, ok tuşları), ekran
                okuyucuya doğru duyurulur ve kullanıcının tarayıcı/işletim
                sistemi tercihlerine (altyazı, oynatma hızı, resim-içinde-resim,
                tam ekran) uyar. Elle yazılan bir oynatıcıda bunların hepsi
                yeniden kurulmak zorundadır ve pratikte en az biri eksik kalır
                (WCAG 2.2 — 2.1.1 Klavye, 4.1.2 Ad-Rol-Değer).
              - Kontroller koyu zemin üzerinde zaten koyu gelir; `accent-color`
                ile ilerleme çubuğu marka yeşiline çekilir. Kontrolün İŞLEVİNİ
                değiştirmeden görünümü kurumsallaştırmanın güvenli yolu budur.
          */}
          <video
            controls
            /* Pencere açılınca dosyanın TAMAMI değil yalnızca başlığı iner. */
            preload="metadata"
            poster={poster ?? undefined}
            /*
              Tüm kaynaklar başarısız olduğunda medya elemanı `error` yayar
              (MEDIA_ERR_SRC_NOT_SUPPORTED). Tek kaynağımız var, dolayısıyla
              bu doğrudan "bu tarayıcı bu kodeği oynatamıyor" demektir.
            */
            onError={() => setPlaybackFailed(true)}
            /*
              `controlsList`: yerli menüdeki indirme öğesi, editör indirmeyi
              kapattıysa gizlenir. Chromium'a özgüdür ve bir GÜVENLİK ÖNLEMİ
              DEĞİLDİR — dosya adresi yine erişilebilirdir; alttaki bağlantıyla
              tutarlı olsun diye vardır.
            */
            controlsList={allowDownload ? undefined : 'nodownload'}
            className={`aspect-video max-h-[70vh] w-full bg-shell-950 [accent-color:var(--color-brand-500)] ${
              playbackFailed ? 'hidden' : ''
            }`}
          >
            <source src={video.url} type={video.mimeType} />
            {/*
              Tarayıcı `<video>` desteklemiyorsa ya da bu MIME türünü
              oynatamıyorsa metin değil ÇALIŞAN bir yol bırakılır.
            */}
            <p className="p-5 text-white">
              <a href={video.url} className="underline underline-offset-4">
                {downloadLabel ?? title}
              </a>
            </p>
          </video>

          {/*
            İNDİRME BAĞLANTISI — oynatıcının altında, ayrı satırda.
            `download` özniteliği BURADA KULLANILIR (belge kartlarının aksine):
            bir video dosyasını sekmede açmak tarayıcıyı ikinci kez indirmeye
            zorlar ve ziyaretçinin beklediği davranış değildir.
          */}
          {allowDownload && downloadLabel ? (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 px-5 py-3 text-sm">
              <a
                href={video.url}
                download
                className="group/dl inline-flex min-h-11 items-center gap-2 font-semibold text-white underline decoration-white/40 decoration-2 underline-offset-4 transition-colors hover:decoration-white"
              >
                {downloadLabel}
                <svg
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 16 16"
                  width="1em"
                  height="1em"
                  className="transition-transform duration-300 group-hover/dl:translate-y-0.5"
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
              {video.humanSize ? <span className="text-white/60">{video.humanSize}</span> : null}
            </p>
          ) : null}
        </div>
      ) : null}
    </dialog>
  )
}

export default MediaDialog
