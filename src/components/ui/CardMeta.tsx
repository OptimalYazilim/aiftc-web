import React from 'react'

/**
 * KART ALT BİLGİSİ — ETİKET / DEĞER IZGARASI
 * ============================================================================
 * NEDEN ORTA NOKTA (·) İLE YAN YANA DİZİM BIRAKILDI
 * ---------------------------------------------------------------------------
 * Alt bilgiler bir ara `Yüz yüze · AIFTC Kampüsü… · Son başvuru…` biçiminde
 * tek akışta diziliyordu. Konum metni uzun olduğu için satır kırılıyor ve
 * ayraçlar sahipsiz kalıyordu. Ölçüldü:
 *
 *     satır 1:  Yüz yüze  ·                 ← ayraç sonda asılı
 *     satır 2:  AIFTC Kampüsü, Simülasyon…
 *     satır 3:  ·  Son başvuru: 21 Mart  ·  28 kişilik kontenjan
 *               ↑ ayraç satır başında
 *
 * Sorun ayraç karakterinde değil, YAKLAŞIMDA: uzunluğu önceden bilinmeyen
 * değerleri tek satıra dizmek, kırılma noktasını şansa bırakır. Bu yüzden
 * dizim ızgaraya alındı.
 *
 * IZGARA — `auto 1fr`
 * ---------------------------------------------------------------------------
 * Sol sütun en geniş etikete göre daralır, sağ sütun kalanı alır. Böylece
 * bütün değerler AYNI dikey hatta başlar; uzun bir konum metni kendi
 * hücresinde sarar ve etiketini yerinden oynatmaz. Satır kırılması artık
 * hiçbir noktalama işaretini havada bırakamaz — çünkü ortada işaret yok.
 *
 * ERİŞİLEBİLİRLİK
 * Etiketler artık GÖRÜNÜR. Önceden `sr-only` idiler: ekran okuyucu "Eğitim
 * yeri" duyuyordu ama gören kullanıcı yalnızca bir adres görüyordu ve bunun
 * eğitim yeri mi yoksa düzenleyen kurum mu olduğunu bağlamdan tahmin etmek
 * zorundaydı. `dl`/`dt`/`dd` yapısı korunur.
 * ============================================================================
 */

export type CardMetaItem = {
  /** Benzersiz anahtar — React listesi için. */
  key: string
  label: string
  value: React.ReactNode
}

export const CardMeta: React.FC<{
  items: (CardMetaItem | null | false | undefined)[]
  className?: string
}> = ({ items, className = '' }) => {
  const gecerli = items.filter((item): item is CardMetaItem => Boolean(item))
  if (gecerli.length === 0) return null

  return (
    <dl
      className={`grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs leading-snug ${className}`}
    >
      {gecerli.map((item) => (
        <React.Fragment key={item.key}>
          {/*
            Etiket sarmaz (`whitespace-nowrap`): iki kelimelik bir etiketin
            ikiye bölünmesi, yanındaki değerle hizasını bozar ve ızgaranın
            sağladığı düzeni yok eder.
          */}
          {/*
            ETİKET / DEĞER AYRIMI RENKLE DEĞİL, AĞIRLIKLA KURULUR.
            İkisi de kısık tonda (ink-500 / ink-600); etiketi ayıran şey
            `font-medium`. Renk farkını açmak, etiketi ikinci bir vurgu
            noktasına çevirirdi — oysa etiket okunması gereken değil,
            değeri ADLANDIRAN öğedir.
          */}
          <dt className="whitespace-nowrap font-medium text-ink-500">{item.label}</dt>
          <dd className="min-w-0 text-ink-600">{item.value}</dd>
        </React.Fragment>
      ))}
    </dl>
  )
}

export default CardMeta
