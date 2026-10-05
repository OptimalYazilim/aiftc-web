import { notFound } from 'next/navigation'

/**
 * EŞLEŞMEYEN ÇOK PARÇALI YOLLAR → SİTENİN 404 SAYFASI
 * ============================================================================
 * Tek parçalı bilinmeyen yollar (`/tr/olmayan`) serbest sayfa rotasına
 * (`[slug]`) düşer ve oradan `notFound()` ile `[locale]/not-found.tsx`'e
 * gelir. İki ve daha çok parçalı bir yol (`/tr/olmayan/alt`) ise HİÇBİR
 * rotayla eşleşmez; Next o durumda dil katmanını hiç çalıştırmaz ve kendi
 * varsayılan, İngilizce, menüsüz 404'ünü basardı.
 *
 * Bu yakalayıcı o yolları dil katmanının içine alır. Statik ve daha belirli
 * dinamik rotalar (ör. `egitim-programlari/[slug]`, `sanal-sinif/[id]`) her
 * zaman önce eşleşir; buraya yalnızca başka hiçbir rotanın karşılamadığı
 * yollar gelir.
 * ============================================================================
 */
/* Başlık da 404 sayfasından gelsin: meta veride `notFound()` → not-found.tsx'in meta verisi. */
export function generateMetadata(): never {
  notFound()
}

export default function EslesmeyenYol(): never {
  notFound()
}
