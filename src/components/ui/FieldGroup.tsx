import React from 'react'

/**
 * FORM ALAN KÜMESİ  (Kontrol Listesi 19 · 112 · 113 · WCAG 1.3.1)
 * ============================================================================
 * 112: "Form alanında, benzer alanlar gruplandırıldı mı?"
 * 113: "Grup kontrolleri için alan kümesi ve başlığı etiketleri
 *       (`<fieldset>` ve `<legend>`) kullanıldı mı?"
 *
 * Görsel olarak HİÇBİR ŞEY DEĞİŞMEZ: tarayıcının `fieldset`e verdiği
 * varsayılan kenarlık, dolgu ve `min-inline-size` sıfırlanır. Değişen tek
 * şey, yardımcı teknolojinin gruba girip çıkarken başlığı duyurmasıdır —
 * "İletişim bilgileri, 4 alandan 1'i" gibi.
 *
 * ---------------------------------------------------------------------------
 * `min-w-0` NEDEN ZORUNLU
 * ---------------------------------------------------------------------------
 * `fieldset` öğesinin `min-inline-size: min-content` şeklinde bir tarayıcı
 * varsayılanı vardır ve bu, içine konan grid/flex düzenlerini taşırır. Sınıf
 * düşürülürse iki sütunlu alan ızgaraları mobilde yatay kayma üretir —
 * görsel düzeni bozmama şartı tam olarak burada kırılırdı.
 *
 * `legend` görünür bir başlıktır; gizlemek gerekirse `gizliBaslik` ile
 * `sr-only` yapılır — silinmez, çünkü başlıksız bir `fieldset` gruplamanın
 * amacını yitirir.
 * ============================================================================
 */
export const FieldGroup: React.FC<{
  baslik: string
  gizliBaslik?: boolean
  className?: string
  children: React.ReactNode
}> = ({ baslik, gizliBaslik = false, className = '', children }) => (
  <fieldset className={`min-w-0 border-0 p-0 ${className}`}>
    <legend
      className={
        gizliBaslik
          ? 'sr-only'
          : 'mb-3 text-xs font-bold uppercase tracking-[0.16em] text-ink-600'
      }
    >
      {baslik}
    </legend>
    {children}
  </fieldset>
)

export default FieldGroup
