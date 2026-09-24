import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import type { Locale } from '@/i18n/locales'
import { detailHref } from '@/i18n/routes'
import { formatDate } from '@/lib/dates'
import { resolveMedia } from '@/lib/media'

import { MediaFallback } from '../ui/MediaFallback'

/**
 * HABER KARTI — EDİTORYAL DÜZEN  (Şartname 6.7)
 * ============================================================================
 * Liste sayfasında ve detay sayfasının "diğer haberler" şeridinde kullanılır.
 *
 * ---------------------------------------------------------------------------
 * DÜZEN: FOTOĞRAF → ÜST BAŞLIK → KURUMSAL BAŞLIK
 * ---------------------------------------------------------------------------
 * WHO ve ILO haber kartlarının değişmeyen sırası budur ve sıra tesadüf
 * değildir:
 *
 *   1. Fotoğraf — kartın konusunu bir bakışta veren tek öğe.
 *   2. ÜST BAŞLIK ("4 Eylül 2026 | Teknik Eğitim") — ince, küçük, tek satır.
 *      Tarih ve kategori BURADA birleşir. Önceki sürümde ikisi ayrı görsel
 *      öğeydi (biri düz metin, biri hap rozet); rozet başlıkla yarışıyor ve
 *      kart "etiket + etiket + metin" gibi okunuyordu.
 *   3. BAŞLIK — kalın, koyu, sıkı harf aralıklı. Kartın ağırlık merkezi.
 *
 * Ayrı bir bileşendir (eğitim kartından) çünkü haberin kapak görseli ve
 * kategori etiketi vardır, eğitimin tarih aralığı ve durum rozeti; alan
 * kümeleri örtüşmez.
 *
 * ERİŞİLEBİLİRLİK
 *   - Kartta TEK odak durağı vardır: başlıktaki bağlantı. Kapak görseli de
 *     "Devamını oku" da aynı yere gider; üçünü de odaklanabilir yapmak klavye
 *     kullanıcısına aynı hedefi üç kez dolaştırırdı (WCAG 2.2 — 2.4.3).
 *     Bu yüzden görsel `aria-hidden`, "Devamını oku" ise gerçek bir bağlantı
 *     değil, başlığın devamı gibi okunan görsel bir ipucudur.
 *   - Üst başlıktaki ayraç ("|") `aria-hidden`: ekran okuyucuda "dikey çizgi"
 *     diye okunması bilgi taşımaz. Tarih ve kategori ayrı düğümler kalır.
 *   - `<time dateTime>`: tarih makine tarafından da okunabilir.
 *
 * KONTRAST — beyaz kart zemini üzerinde ölçülen:
 *     shell-900 başlık     15.74:1
 *     ink-600   üst başlık  7.39:1
 *     brand-700 kategori    6.61:1
 * ============================================================================
 */

export type NewsCardItem = {
  id: string | number
  title?: string | null
  slug?: string | null
  summary?: string | null
  publishedAt?: string | null
  categoryLabel?: string | null
  coverImage?: unknown
}

type Props = {
  locale: Locale
  item: NewsCardItem
  readMoreLabel: string
  className?: string
  /** Öneri şeridinde görsel gösterilmez; kart daha kompakt kalır. */
  showImage?: boolean
  /**
   * Editoryal ızgarada ilk haber MANŞETtir: iki sütun genişliğinde durur,
   * fotoğrafı daha geniş orandadır ve başlığı bir kademe büyür.
   */
  size?: 'default' | 'feature'
}

export const NewsCard: React.FC<Props> = ({
  locale,
  item,
  readMoreLabel,
  className = '',
  showImage = true,
  size = 'default',
}) => {
  const feature = size === 'feature'
  const cover = showImage ? resolveMedia(item.coverImage, 'card') : null
  const date = formatDate(locale, item.publishedAt)
  const link = detailHref('news-item', locale, item.slug ?? '')

  return (
    <li
      /*
        Gölge ve yükselme kaldırıldı. Derinlik artık tek bir 1px çizgiyle ve
        hover'da o çizginin koyulaşmasıyla kuruluyor; hareketi FOTOĞRAF
        taşıyor (aşağıda `scale-[1.04]`). Kartın kendisi sabit durur.
      */
      className={`group ease-editorial relative flex cursor-pointer flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors duration-500 hover:border-shell-900 ${className} focus-within:border-shell-900`}
    >
      {/*
        Kapak görseli yoksa boş gri alan değil, nötr kurumsal zemin
        (bkz. components/ui/MediaFallback — vektörel ağaç çizimi kaldırıldı).
        `showImage=false` verildiğinde (öneri şeridi) hiçbir görsel alan
        oluşmaz.
      */}
      {showImage ? (
        cover ? (
          <div className="overflow-hidden">
            <Image
              src={cover.url}
              alt=""
              aria-hidden="true"
              width={cover.width}
              height={cover.height}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 45vw, 100vw"
              /*
                Karta gelindiğinde fotoğraf çok hafif büyür. Kart zaten yukarı
                kalkıyor; ikisi birlikte "bu kart tıklanabilir" sinyalini
                verir. Sarmalayıcıdaki `overflow-hidden` olmadan büyüme kartın
                köşe yarıçapını taşardı.
              */
              className={`ease-editorial w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] ${feature ? `aspect-[21/9]` : `aspect-[3/2]`} group-focus-within:scale-[1.04]`}
            />
          </div>
        ) : (
          <MediaFallback
            variant="card"
            /* Manşette kapak yoksa bile oran korunur; yoksa geniş kart
               kare bir boşlukla açılırdı. */
            className={feature ? 'aspect-[21/9]' : ''}
          />
        )
      ) : null}

      <div className="flex flex-1 flex-col p-5">
        {/* --- ÜST BAŞLIK: tarih | kategori ------------------------------ */}
        {date || item.categoryLabel ? (
          <p className="flex flex-wrap items-center gap-x-2 text-xs font-semibold uppercase tracking-wider text-ink-600">
            {date ? <time dateTime={item.publishedAt ?? undefined}>{date}</time> : null}
            {date && item.categoryLabel ? (
              <span aria-hidden="true" className="font-normal text-line-strong">
                |
              </span>
            ) : null}
            {item.categoryLabel ? (
              <span className="text-brand-700">{item.categoryLabel}</span>
            ) : null}
          </p>
        ) : null}

        {/*
          BAŞLIK — kartın ağırlık merkezi.
          Renk shell-900'dür, marka yeşili değil: dört kart yan yana geldiğinde
          dört yeşil başlık listeyi tek bir renk bloğuna çeviriyordu. Bağlantı
          olduğu, hover ve odakta beliren alt çizgiyle işaretlenir; başlık bir
          gövde metninin İÇİNDE değil kendi başına duran bir öğe olduğu için
          bu ayırt edicilik yeterlidir (WCAG 2.2 — 1.4.1).
        */}
        <h3
          className={`mt-2 font-bold leading-snug tracking-tight ${
            feature ? `text-xl sm:text-2xl lg:text-3xl` : `text-lg sm:text-xl`
          }`}
        >
          <Link
            href={link}
            /*
              YAYILAN BAĞLANTI — eğitim kartındaki ile aynı kalıp.
              "Devamını oku" mikro metni `aria-hidden` bir paragraftır ve
              tıklandığında hiçbir şey yapmıyordu; imleç de metin imleci
              kalıyordu. Bağlantı kart yüzeyine yayılınca ikisi de düzeldi,
              odak durağı yine TEK.
            */
            className="text-shell-900 decoration-2 underline-offset-4 transition-colors after:absolute after:inset-0 after:content-[''] hover:text-brand-800 hover:underline focus-visible:underline focus-visible:text-brand-800 focus-within:text-brand-800"
          >
            {item.title}
          </Link>
        </h3>

        {item.summary ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.summary}</p>
        ) : null}

        {/*
          Bağlantı DEĞİL: başlık zaten aynı yere gidiyor (bkz. üstteki not).
          Ok, karta gelindiğinde sağa kayar; `group` kartın kökündedir.
          `mt-auto`: kart yüksekliği içeriğe göre değişse de bu satır her
          zaman kartın en altına oturur.
        */}
        <p
          aria-hidden="true"
          className="ease-editorial mt-auto flex items-center gap-1.5 pt-4 text-sm font-semibold text-brand-800 transition-colors duration-500 group-hover:text-shell-950 group-focus-within:text-shell-950"
        >
          {readMoreLabel}
          <svg
            viewBox="0 0 16 16"
            width="1em"
            height="1em"
            className="ease-editorial transition-transform duration-500 group-hover:translate-x-1 group-focus-within:translate-x-1"
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
        </p>
      </div>
    </li>
  )
}

export default NewsCard
