/**
 * İSTEMCİ TARAFI ARAMA KARŞILAŞTIRMASI — TEK KAYNAK
 * ============================================================================
 * Eğitim kataloğu ve dijital kütüphane aynı arama davranışını göstermelidir.
 * Fonksiyon iki dosyada ayrı ayrı duruyordu; biri düzeltilip diğeri unutulunca
 * ziyaretçi aynı kelimeyle bir bölümde sonuç alıp diğerinde alamıyordu.
 *
 * ---------------------------------------------------------------------------
 * ÜÇ AŞAMA, HER BİRİ ÖLÇÜLMÜŞ BİR SORUNU ÇÖZER
 * ---------------------------------------------------------------------------
 * 1. `toLocaleLowerCase('tr')`
 *    Türkçede "I" → "ı" ve "İ" → "i" olmalıdır. Varsayılan `toLowerCase`
 *    bunu İngilizce kurallarıyla yapar: "İKLİM" → "i̇klim" (i + birleşen
 *    nokta) olur ve "iklim" aramasıyla eşleşmez.
 *
 * 2. NOKTASIZ "ı" → "i" KATLAMASI
 *    Türkçe klavyesi olmayan ziyaretçi "yangın" yerine "yangin" yazar. "ı"
 *    (U+0131) BİRLEŞİK BİR KARAKTER DEĞİLDİR: NFD onu ayrıştırmaz, dolayısıyla
 *    3. adımdaki aksan temizliği ona dokunmaz. Bu yüzden ayrıca katlanır.
 *
 *    Ölçüm (kütüphane sayfası, 3 kayıt, biri "Orman Yangını ..."):
 *        "yangın" → 3 sonuç   ✓
 *        "yangin" → 0 sonuç   ✗   ← katlama eklenmeden önce
 *        "yangin" → 3 sonuç   ✓   ← katlamadan sonra
 *
 *    Ters yön de çalışır: metinde "yangin" geçiyorsa "yangın" araması bulur,
 *    çünkü katlama SORGUYA ve METNE aynı şekilde uygulanır.
 *
 * 3. NFD + birleşen işaretlerin (`\p{M}`) silinmesi
 *    "ğ/ş/ü/ö/ç" ve Kiril aksanları burada düşer: "cografya" araması
 *    "coğrafya"yı bulur.
 *
 * ---------------------------------------------------------------------------
 * NEDEN `Intl.Collator` DEĞİL
 * ---------------------------------------------------------------------------
 * `Intl.Collator(locale, { sensitivity: 'base' })` doğru karşılaştırmayı
 * yapar ama yalnızca TAM DİZİ eşitliği için; alt dizi (`includes`) araması
 * sunmaz. Buradaki ihtiyaç "içinde geçiyor mu" olduğundan normalize edilmiş
 * dizide `includes` kullanılır.
 * ============================================================================
 */
export const normalizeForSearch = (value: string): string =>
  value
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')

/**
 * Bir sorgunun, verilen alanlardan HERHANGİ BİRİNDE geçip geçmediği.
 * `null`/`undefined` alanlar sessizce atlanır — çağıran tarafın her alanı
 * ayrıca kontrol etmesi gerekmez.
 */
export const matchesQuery = (
  query: string,
  fields: (string | number | null | undefined)[],
): boolean => {
  const needle = normalizeForSearch(query.trim())
  if (!needle) return true

  return fields
    .filter((field): field is string | number => field !== null && field !== undefined)
    .some((field) => normalizeForSearch(String(field)).includes(needle))
}
