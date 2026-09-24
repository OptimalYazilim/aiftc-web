import Link from 'next/link'
import React from 'react'

import type { Locale } from '@/i18n/locales'
import { detailHref } from '@/i18n/routes'
import { formatDateRange } from '@/lib/dates'
import { trainingStatusClasses, trainingStatusLabel } from '@/lib/trainingStatus'


/**
 * EĞİTİM KARTI — TEK GÖRÜNÜM KAYNAĞI
 * ============================================================================
 * Ana sayfadaki Bento şeridi ve katalog sayfası AYNI kartı kullanır. Ayrı ayrı
 * yazılsalardı biri değiştiğinde diğeri sessizce farklılaşırdı; şartnamedeki
 * "tutarlı arayüz" beklentisi tam olarak bunun kaybolmasıyla bozulur.
 *
 * Bileşen SAF sunumdur: veri çekmez, çeviri kancası kullanmaz. Bu sayede hem
 * sunucu bileşeninden (Bento) hem de istemci bileşeninden (katalog filtresi)
 * çağrılabilir — `useTranslations` kullansaydı sunucu tarafında patlar,
 * `getTranslations` kullansaydı istemci tarafında patlardı. Bu yüzden ekran
 * okuyucuya okunacak durum ön eki `statusPrefix` ile DIŞARIDAN verilir.
 *
 * ERİŞİLEBİLİRLİK
 *   - Kartın TAMAMI tıklanabilirdir: başlık bağlantısı `::after` ile kart
 *     yüzeyine yayılır. Ama ODAKLANILABİLİR TEK ÖĞE yine başlıktır —
 *     ikinci bir odak durağı eklenmez (WCAG 2.2 — 2.4.3 Odak Sırası,
 *     2.4.4 Bağlantı Amacı).
 *   - Durum rozeti renge ek olarak METİN taşır (1.4.1 Rengin Kullanımı).
 * ============================================================================
 */

export type TrainingCardItem = {
  id: string | number
  title?: string | null
  slug?: string | null
  summary?: string | null
  status?: string | null
  startDate?: string | null
  endDate?: string | null
  /**
   * İlk konusunun kategorisi. Karttaki dekoratif ikon kaldırıldığı için
   * ARTIK GÖRÜNÜM ÜRETMEZ; alan, çağıran sayfaların veri eşlemesini bozmamak
   * ve ileride konu bazlı bir gruplama gerekirse hazır olmak için duruyor.
   */
  categoryKey?: string | null
}

type Props = {
  locale: Locale
  item: TrainingCardItem
  /** Ekran okuyucu için rozet ön eki, örn. "Eğitim durumu". */
  statusPrefix: string
  /** Izgara yerleşimi için dışarıdan verilen sınıflar (örn. Bento sütunları). */
  className?: string
  /** Büyük kartta başlık punto olarak büyür. */
  size?: 'default' | 'large'
  showStatus?: boolean
  /** Kart altındaki mikro metin, örn. "Detayları İncele". */
  detailLabel?: string | null
  /** Kartın altına eklenecek serbest içerik (katalogdaki bilgi etiketleri). */
  footer?: React.ReactNode
}

export const TrainingCard: React.FC<Props> = ({
  locale,
  item,
  statusPrefix,
  className = '',
  size = 'default',
  showStatus = true,
  detailLabel,
  footer,
}) => {
  /**
   * MİKRO ETKİLEŞİM — AĞIRBAŞLI
   * Kart yerinden oynamaz, gölge büyümez. Üç şey değişir: kenar çizgisi
   * koyulaşır, alttaki ok 4px sağa kayar ve mikro metin en koyu orman tonuna
   * iner. Üçü de 500ms ve aynı editoryal eğriyle.
   * globals.css'teki `prefers-reduced-motion` kuralı bu süreleri otomatik
   * olarak 0.01ms'ye indirir: hareketten rahatsız olan kullanıcı geçişi
   * animasyon olarak GÖRMEZ, durum yine de doğru kalır (WCAG 2.2 — 2.3.3).
   */
  const dateRange = formatDateRange(locale, item.startDate, item.endDate)
  const statusText = showStatus ? trainingStatusLabel(item.status, locale) : null

  return (
    <li
      /*
        GÖLGE VE ZIPLAMA KALDIRILDI — EDİTORYAL DİL.
        Kart artık sayfadan "kalkmıyor". Ayrım tek bir 1px çizgiyle kuruluyor;
        hover'da o çizgi en koyu orman tonuna dönüyor ve altındaki ok kayıyor.
        Yükselme + gölge büyümesi, bir liste ekranında on iki kez tekrarlanınca
        arayüzü huzursuz ve şablon görünümlü yapıyordu.

        Dolgu daraltıldı (p-6 → p-5): bilgi yoğunluğu arttı, nefes alma
        satır aralıklarına ve başlık ile gövde arasındaki ritme bırakıldı.

        Hover renk TEK TAŞIYICI DEĞİL: başlık bağlantısı ve "Detayları İncele"
        mikro metni zaten görünür (WCAG 2.2 — 1.4.1).
      */
      className={`group ease-editorial relative flex cursor-pointer flex-col rounded-card border border-line bg-surface p-5 transition-colors duration-500 hover:border-shell-900 focus-within:border-shell-900 ${
        size === 'large' ? 'justify-center md:p-7' : ''
      } ${className}`}
    >
      {/*
        TEMATİK İKON KALDIRILDI.
        Kartın sol üstünde konuya göre değişen dekoratif bir sembol vardı.
        Hiçbir bilgi taşımıyordu — konu adı zaten kartın altında etiket olarak
        yazılı. On iki kartlık bir listede on iki farklı sembol, tipografik
        hiyerarşiyi bozup göz akışını dağıtıyordu. Yerini durum rozetinin
        kendi ağırlığı alıyor.
      */}
      {statusText ? (
        <p className={`mb-3 ${trainingStatusClasses(item.status)}`}>
          <span className="sr-only">{statusPrefix}: </span>
          {statusText}
        </p>
      ) : null}

      {/*
        DİKEY RİTİM — BOŞLUKLAR MANTIKSAL GRUP ANLATIR
        ---------------------------------------------------------------------
        Kartta üç grup vardır ve aralarındaki mesafe onları AYIRIR:

          rozet                         ── mb-3 ──┐  bağımsız etiket
          tarih  +  BAŞLIK              (mt-1.5)  │  tek bir künye
          açıklama                      (mt-3)    │  ikinci kademe
          alt bilgi ızgarası            (mt-5)    ┘  ayrı bir blok

        Tarih ile başlık arasındaki 1.5 birim, başlık ile açıklama arasındaki
        3 birimden KÜÇÜKTÜR: tarih başlığın parçasıdır, açıklama değildir.
        Eşit boşluk verilseydi dört öğe tek bir sıralı liste gibi okunur,
        hangisinin ana odak olduğu kaybolurdu.

        `text-sm` (14px) tarih ve açıklama için ORTAK ölçüdür; ikisi de
        başlığın altındaki ikincil kademedir.
      */}
      {dateRange ? (
        <time dateTime={item.startDate ?? undefined} className="text-sm text-ink-600">
          {dateRange}
        </time>
      ) : null}

      {/*
        BAŞLIK KARTIN ODAK NOKTASIDIR.
        Bir kademe büyütüldü (text-lg → text-xl), `font-bold` yapıldı ve
        satır aralığı sıkıştırıldı. `leading-tight` + `tracking-tight`,
        globals.css'teki genel h3 kuralını (1.32 / -0.008em) bilerek ezer:
        kart başlığı sayfa içi bir bölüm başlığı değil, bir KÜNYEDİR ve
        iki satıra düştüğünde blok gibi durmalıdır.
      */}
      <h3
        className={`mt-1.5 font-bold leading-tight tracking-tight ${
          size === 'large' ? 'text-2xl lg:text-3xl' : 'text-xl'
        }`}
      >
        <Link
          href={detailHref('training-program', locale, item.slug ?? '')}
          /*
            YAYILAN BAĞLANTI (`after:absolute after:inset-0`).
            Bağlantının tıklama alanı kartın TAMAMINA genişler. Böylece
            "Detayları İncele" mikro metnine tıklamak da çalışır — eskiden
            hiçbir şey yapmıyordu ve imleç metin imleci kalıyordu.

            İKİNCİ BİR BAĞLANTI EKLENMEDİ. Mikro metni ayrı bir <a> yapmak
            klavye kullanıcısını aynı hedefe iki kez uğratırdı
            (WCAG 2.2 — 2.4.3). Odak durağı hâlâ TEK: başlık.

            Takas: kart yüzeyindeki metin artık kolay seçilemez. Kartlarda
            yaygın ve kabul edilen bir takastır; okunacak metin (özet, konum)
            zaten detay sayfasında tam hâliyle var.
          */
          className="text-brand-800 underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline"
        >
          {item.title}
        </Link>
      </h3>

      {/*
        AÇIKLAMA BAŞLIKLA YARIŞMAZ.
        Gövde ölçüsündeydi (17px) ve başlıkla neredeyse aynı ağırlıkta bir
        blok oluşturuyordu. 14px + rahat satır aralığı ile ikincil kademeye
        iner; renk ink-600 (beyaz kartta 7.39:1) okunabilirliği korur.
      */}
      {item.summary ? (
        <p className="mt-3 text-sm leading-relaxed text-ink-600">{item.summary}</p>
      ) : null}

      {footer ? <div className="mt-5">{footer}</div> : null}

      {/*
        MİKRO METİN — bağlantı DEĞİLDİR.
        Başlık zaten aynı yere gidiyor; bunu da odaklanabilir yapmak klavye
        kullanıcısına aynı hedefi iki kez dolaştırırdı (WCAG 2.2 — 2.4.3).
        `aria-hidden` ile ekran okuyucudan gizlenir, `mt-auto` ile kartın
        altına yapışır. Ok, karta gelindiğinde sağa kayar.
      */}
      {detailLabel ? (
        <p
          aria-hidden="true"
          className="ease-editorial mt-auto flex items-center gap-1.5 pt-4 text-sm font-medium text-brand-800 transition-colors duration-500 group-hover:text-shell-950 group-focus-within:text-shell-950"
        >
          {detailLabel}
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
      ) : null}
    </li>
  )
}

export default TrainingCard
