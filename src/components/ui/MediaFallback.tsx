import React from 'react'

/**
 * GÖRSEL YOKKEN — NÖTR KURUMSAL ZEMİN
 * ============================================================================
 * Haber ve eğitim kartlarının kapak görseli editör tarafından yüklenir; çoğu
 * kayıtta başlangıçta yoktur. Bu durumda kartın üst kısmını boş gri bir
 * dikdörtgen olarak bırakmak sayfayı "eksik" gösterir.
 *
 * ---------------------------------------------------------------------------
 * VEKTÖREL AĞAÇ / TEPE ÇİZİMİ KALDIRILDI
 * ---------------------------------------------------------------------------
 * Önceki sürüm ibreli ağaç ve tepe siluetleri basıyordu. İki sorunu vardı:
 *
 *   1. Klipart bir illüstrasyon, editoryal bir haber kartının üstünde
 *      şablon hissi yaratıyordu — asıl fotoğrafın yerini tutmuyor, onun
 *      YOKLUĞUNU süslüyordu.
 *   2. Aynı çizim her kartta tekrar ettiği için dört haber kartı yan yana
 *      geldiğinde liste tek bir desene dönüşüyordu.
 *
 * Yerine yönlü bir ışık geçişi kaldı (`media-frame-light` / `media-frame-dark`,
 * globals.css). Hiçbir şeyi temsil etmez; yalnızca boşluğu kapatır ve
 * yüklenecek fotoğrafın çerçevesini gösterir.
 *
 * ERİŞİLEBİLİRLİK
 * Tamamen dekoratiftir: `aria-hidden` taşır ve alternatif metni YOKTUR.
 * Bilgi taşımadığı için ekran okuyucuya duyurulması yalnızca gürültü olurdu
 * (WCAG 2.2 — 1.1.1).
 *
 * `variant`:
 *   'card'  → kart üstü şerit (3/2 en-boy), açık nötr zemin
 *   'panel' → Bento'nun büyük kartı gibi tüm yüzeyi kaplayan koyu zemin
 * ============================================================================
 */

type Props = {
  variant?: 'card' | 'panel'
  className?: string
}

export const MediaFallback: React.FC<Props> = ({ variant = 'card', className = '' }) => (
  /*
    KONUM SINIFI TEK OLMALI — buradaki hata pahalıya mal oldu.
    Önceki sürümde ortak sınıf dizisinde `relative` vardı ve panel varyantı
    ona `absolute` ekliyordu. Tailwind'in ürettiği CSS'te `.relative`
    `.absolute`'tan SONRA geldiği için sınıf dizilişine bakılmaksızın
    `relative` kazanıyor, kutu sıfır yüksekliğe düşüyor ve degrade hiç
    boyanmıyordu: Bento'nun büyük kartı beyaz kalıyor, üzerindeki beyaz
    metin görünmez oluyordu.

    Bu yüzden `position` sınıfı her varyantta TEK KEZ verilir.
  */
  <div
    aria-hidden="true"
    className={`overflow-hidden ${
      variant === 'card'
        ? `media-frame-light relative w-full ${className.includes('aspect-') ? '' : 'aspect-[3/2]'}`
        : 'media-frame-dark absolute inset-0'
    } ${className}`}
  >
    {/*
      Tek bir ince diyagonal ışık çizgisi. Tekrar eden bir desen DEĞİLDİR —
      yüzeye eğim hissi verir ve kartlar yan yana geldiğinde her birinde aynı
      yerde durmasına rağmen bir "doku" olarak okunmaz.
    */}
    <span
      className={`absolute inset-y-0 left-1/3 w-px -skew-x-12 ${
        variant === 'card' ? 'bg-shell-900/[0.06]' : 'bg-white/10'
      }`}
    />
    <span
      className={`absolute inset-y-0 left-2/3 w-px -skew-x-12 ${
        variant === 'card' ? 'bg-shell-900/[0.04]' : 'bg-white/[0.06]'
      }`}
    />
  </div>
)

export default MediaFallback
