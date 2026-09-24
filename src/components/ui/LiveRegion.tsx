'use client'

import React from 'react'

/**
 * KALICI CANLI BÖLGE  (Kontrol Listesi 96 · 103 · 109 · WCAG 4.1.3)
 * ============================================================================
 * NEDEN AYRI VE KALICI BİR BÖLGE GEREKİYOR
 * ---------------------------------------------------------------------------
 * `role="status"` ve `role="alert"` örtük olarak `aria-live` taşır; bu doğru
 * ama YETERLİ DEĞİL. Ekran okuyucular canlı bölgeyi, bölge DOM'da ZATEN
 * VARKEN içeriği değiştiğinde duyurur. Bu projedeki bildirimlerin çoğu ise
 * içerikleriyle BİRLİKTE DOM'a giriyor:
 *
 *     {sonuc ? <AuthNotice …>…</AuthNotice> : null}
 *
 * Burada bölge de metin de aynı anda belirir; okuyucunun "değişiklik" olarak
 * görecek bir öncesi yoktur ve duyuru sessizce atlanabilir. En kötü örnek
 * iletişim formudur: gönderim başarılı olunca FORMUN TAMAMI yerini bildirime
 * bırakır — görmeyen kullanıcı için ekranda hiçbir şey olmamış gibidir.
 *
 * Bu bileşen sayfada HER ZAMAN durur (boşken bile) ve yalnızca metni değişir.
 * Görsel bildirim olduğu gibi kalır; bu bölge onun sesli karşılığıdır.
 *
 * ---------------------------------------------------------------------------
 * `polite` mi `assertive` mi
 * ---------------------------------------------------------------------------
 * Varsayılan `polite`: okuyucu cümlesini bitirir, sonra duyurur. `assertive`
 * kullanıcının o anda dinlediği şeyi KESER ve yalnızca kaybı geri alınamaz
 * durumlar için uygundur. Form sonucu beklenen bir cevaptır, kesmeye değmez.
 *
 * `aria-atomic="true"`: metnin tamamı okunur. Olmadan, okuyucu yalnızca
 * DEĞİŞEN kelimeleri okuyabilir ve "3" gibi bağlamsız bir parça duyulur.
 *
 * `sr-only` görsel düzeni etkilemez — ekrandan kaldırır ama erişilebilirlik
 * ağacında bırakır. `display:none` veya `hidden` KULLANILMAZ: ikisi de bölgeyi
 * ağaçtan tamamen çıkarır ve duyuru hiç yapılmaz.
 * ============================================================================
 */
export const LiveRegion: React.FC<{
  /** Duyurulacak metin. Boş dize sessizliktir; bölge yine de DOM'da kalır. */
  mesaj: string | null | undefined
  aciliyet?: 'polite' | 'assertive'
}> = ({ mesaj, aciliyet = 'polite' }) => (
  <div aria-live={aciliyet} aria-atomic="true" className="sr-only">
    {mesaj ?? ''}
  </div>
)

export default LiveRegion
