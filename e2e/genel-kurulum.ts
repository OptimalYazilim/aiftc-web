import dotenv from 'dotenv'

/**
 * GENEL KURULUM — tüm testlerden ÖNCE bir kez.
 *
 * `.env.test` burada yeniden yüklenir: Playwright yapılandırması ayrı bir
 * modül olarak değerlendirilir ve global kurulum dosyası kendi süreç
 * bağlamında çalışabilir. İki kez yüklemek zararsızdır; hiç yüklememek
 * testlerin geliştirme veritabanına bağlanması demektir.
 */
dotenv.config({ path: '.env.test', override: true })

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

  const { tohumla } = await import('./yardimcilar/tohum.js')
  const sonuc = await tohumla()
  console.log(`[e2e] tohum hazır — eğitim #${sonuc.egitimId} (${sonuc.egitimSlug})`)
}

export default genelKurulum
