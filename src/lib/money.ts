/**
 * PARA ARİTMETİĞİ — TEK KURAL  (Commerce)
 * ============================================================================
 * Bu depodaki İLK para alanı teklif kalemleriyle geldi; kural burada bir kez
 * konur ve para hesabı yapan her yer buradan geçer.
 *
 * ---------------------------------------------------------------------------
 * NEDEN KURUŞ (TAM SAYI) ÜZERİNDEN HESAPLANIYOR
 * ---------------------------------------------------------------------------
 * JavaScript sayıları IEEE-754 kayan noktadır. Ondalık para değerleriyle
 * doğrudan çarpma/toplama yapmak sessizce yanlış sonuç üretir:
 *
 *     19.99 * 3            = 59.97000000000001
 *     0.1 + 0.2            = 0.30000000000000004
 *     1.005.toFixed(2)     = "1.00"        (beklenen "1.01")
 *
 * Bir teklifte bu, "toplam 59,97 yazıyor ama kalemler 59,97 etmiyor" olarak
 * görünür ve hatayı bulmak zordur çünkü ekranda iki değer de doğru okunur.
 *
 * ÇÖZÜM: her tutar önce kuruşa (minor unit) çevrilip TAM SAYI olarak
 * hesaplanır, sonuç en sonda tekrar ana birime döner. Tam sayı toplama ve
 * çarpma JavaScript'te 2^53'e kadar KESİNDİR; bir teklif o sınıra yaklaşmaz.
 *
 * ---------------------------------------------------------------------------
 * NEDEN ALANLAR YİNE DE ANA BİRİMDE SAKLANIYOR
 * ---------------------------------------------------------------------------
 * Panelde editör "1500.00" yazar, "150000" değil. Kuruş cinsinden bir alan
 * her girişte zihinsel çeviri ister ve iki sıfır unutulduğunda hata YÜZ KAT
 * olur. Depolama ana birimde (Postgres `numeric`), aritmetik kuruşta —
 * ikisinin arasındaki tek geçit bu dosyadır.
 *
 * ---------------------------------------------------------------------------
 * YUVARLAMA
 * ---------------------------------------------------------------------------
 * `Math.round` ile YARIM YUKARI. Bankacı yuvarlaması (half-to-even)
 * kullanılmadı: teklif kalemlerinde toplam sapma önemsizdir ve half-up,
 * muhasebe personelinin elle kontrol ederken beklediği davranıştır.
 *
 * İKİ HANE VARSAYILIR. Listedeki üç para biriminin (TRY, EUR, USD) üçü de
 * iki ondalıklıdır. Sıfır ondalıklı bir birim (JPY) veya üç ondalıklı bir
 * birim (KWD) eklenirse BU DOSYA DEĞİŞMELİDİR — o yüzden burada tek bir
 * sabit olarak durur, koda dağılmaz.
 * ============================================================================
 */

/** Ana birimde bir birimin kaç kuruş ettiği. Bkz. yukarıdaki "İKİ HANE" notu. */
const KURUS = 100

/** Ana birim → kuruş (tam sayı). Geçersiz değer 0 sayılır. */
export const kurusaCevir = (tutar: unknown): number => {
  const sayi = Number(tutar)
  if (!Number.isFinite(sayi)) return 0
  return Math.round(sayi * KURUS)
}

/** Kuruş → ana birim, iki haneye yuvarlanmış. */
export const anaBirime = (kurus: number): number => Math.round(kurus) / KURUS

/**
 * Tek bir kalemin tutarı: birim fiyat × adet.
 *
 * Adet TAM SAYIYA yuvarlanır. Kesirli adet (2,5 gün eğitim gibi) meşru bir
 * ihtiyaç olabilir; ama o durumda birim de değişir ("gün" yerine "yarım gün")
 * ve bunu kabul etmek, kesirli çarpımı yeniden kayan noktaya sokardı. Adet
 * tam sayıdır; kesir gerekiyorsa birim fiyat ayarlanır.
 */
export const kalemTutari = (birimFiyat: unknown, adet: unknown): number => {
  const fiyatKurus = kurusaCevir(birimFiyat)
  const sayi = Number(adet)
  const adetTam = Number.isFinite(sayi) && sayi > 0 ? Math.round(sayi) : 0
  return anaBirime(fiyatKurus * adetTam)
}

/** Kalem tutarlarının toplamı — toplama da kuruş üzerinde yapılır. */
export const toplamTutar = (tutarlar: unknown[]): number =>
  anaBirime(tutarlar.reduce<number>((acc, t) => acc + kurusaCevir(t), 0))
