/**
 * T.C. KİMLİK NUMARASI — BİÇİM DENETİMİ
 * ============================================================================
 * NEDEN AYRI BİR DOSYA
 * ---------------------------------------------------------------------------
 * Bu fonksiyon HEM SUNUCUDA hem İSTEMCİDE çalışır: sunucuda kuralı uygular,
 * istemcide kullanıcıya anında geri bildirim verir. Ama asıl ev olan
 * `lib/edevlet.ts` `node:crypto` içe aktarıyor; oradan içe aktarılsa
 * `node:crypto` istemci paketine sürüklenir ve derleme kırılır.
 *
 * Bağımlılığı olmayan bu dosya, iki tarafın AYNI kodu çalıştırmasını sağlar.
 * Kopyalanmış iki sürüm tutulsaydı biri güncellenip öteki kalır ve istemci
 * "geçerli" dediği bir numaranın sunucuda reddedilmesine yol açardı.
 *
 * ---------------------------------------------------------------------------
 * BU BİR DOĞRULAMA DEĞİLDİR — SADECE BİÇİM DENETİMİ
 * ---------------------------------------------------------------------------
 * Numaranın gerçek bir kişiye ait olduğunu söyleyen tek merci e-Devlet/KPS'dir.
 * Buradaki denetim yalnızca sağlama (checksum) tutarlılığına bakar; anlamsız
 * girdileri ayıklar, kimlik doğrulamaz. Bu ayrım kum havuzunda kritiktir:
 * sağlaması tutan her numara kabul edilir.
 *
 * Algoritma resmîdir ve kamuya açıktır:
 *   · 11 hane, ilk hane sıfır olamaz
 *   · 10. hane: (tek konumlu ilk beş hanenin toplamı × 7 − çift konumlu dört
 *     hanenin toplamı) mod 10
 *   · 11. hane: ilk on hanenin toplamının mod 10'u
 * ============================================================================
 */
export const tcknBicimiGecerli = (deger: string): boolean => {
  if (!/^[1-9][0-9]{10}$/.test(deger)) return false

  const h = deger.split('').map(Number) as number[]
  const tekler = h[0]! + h[2]! + h[4]! + h[6]! + h[8]!
  const ciftler = h[1]! + h[3]! + h[5]! + h[7]!

  /*
    `((x % 10) + 10) % 10` — çıkarma negatif olabilir ve JavaScript'te
    `-3 % 10` sonucu `-3`tür, `7` değil. Tek bir `% 10` ile yazılsaydı bazı
    geçerli numaralar reddedilirdi.
  */
  if (((tekler * 7 - ciftler) % 10 + 10) % 10 !== h[9]) return false

  const ilkOn = h.slice(0, 10).reduce((toplam, basamak) => toplam + basamak, 0)
  return ilkOn % 10 === h[10]
}
