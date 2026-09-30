import { sunucuBizimMi, testOrtaminiYukle } from './yardimcilar/ortam'

/**
 * GENEL KURULUM — tüm testlerden ÖNCE bir kez.
 *
 * `.env.test` burada yeniden yüklenir: Playwright yapılandırması ayrı bir
 * modül olarak değerlendirilir ve global kurulum dosyası kendi süreç
 * bağlamında çalışabilir. İki kez yüklemek zararsızdır; hiç yüklememek
 * testlerin geliştirme veritabanına bağlanması demektir. Yükleme ve port
 * kuralı tek yerdedir: `yardimcilar/ortam.ts`.
 */
const TABAN_ADRES = testOrtaminiYukle()

const genelKurulum = async (): Promise<void> => {
  /*
    GÜVENLİK KİLİDİ — YANLIŞ VERİTABANINA BAĞLANMAYI ENGELLER.
    Testler veri siler. Adres `aiftc_test` içermiyorsa koşu HİÇ BAŞLAMAZ.
    Bu kontrol olmasaydı, `.env.test` eksik ya da hatalıyken testler sessizce
    geliştirme veritabanını temizlerdi.
  */
  const adres = process.env.DATABASE_URI ?? ''
  if (!adres.includes('aiftc_test')) {
    throw new Error(
      'GÜVENLİK: DATABASE_URI "aiftc_test" içermiyor. Testler veri siler; ' +
        'yanlış veritabanına bağlanma riski nedeniyle koşu durduruldu. ' +
        '.env.test dosyasını kontrol edin.',
    )
  }

  /*
    GÜVENLİK KİLİDİ 2 — YANLIŞ SUNUCUYA KARŞI KOŞMAYI ENGELLER.
    Yerelde `reuseExistingServer` açıktır: portta zaten bir sunucu cevap
    veriyorsa Playwright kendi sunucusunu BAŞLATMAZ, onu kullanır. O sunucu
    başka bir projeye aitse takımın tamamı anlaşılmaz hatalarla kırılır ve —
    daha kötüsü — testler o yabancı sunucuya istek atmış olur.

    ÖLÇÜLDÜ (2026-09-30): 3100 portunu aynı makinedeki başka bir projenin
    sunucusu tutuyordu. Bu kilit o durumu tek satırlık, ne yapılacağını
    söyleyen bir hataya çevirir; tohumlamadan ÖNCE çalışır.
  */
  const { bizim, ayrinti } = await sunucuBizimMi(TABAN_ADRES)
  if (!bizim) {
    throw new Error(
      `GÜVENLİK: ${TABAN_ADRES} adresinde bu uygulamanın test sunucusu çalışmıyor (${ayrinti}). ` +
        'Port büyük olasılıkla başka bir programa ait. Başka bir port seçin: ' +
        'E2E_PORT=3110 pnpm test:e2e  (ayrıntı: e2e/yardimcilar/ortam.ts).',
    )
  }

  const { tohumla } = await import('./yardimcilar/tohum.js')
  const sonuc = await tohumla()
  console.log(`[e2e] tohum hazır — eğitim #${sonuc.egitimId} (${sonuc.egitimSlug})`)
}

export default genelKurulum
