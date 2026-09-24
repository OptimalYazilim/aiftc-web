import dotenv from 'dotenv'

dotenv.config({ path: '.env.test', override: true })

/**
 * GENEL TEMİZLİK — tüm testlerden SONRA bir kez.
 *
 * Temizlik BAŞARISIZ OLSA BİLE koşu başarısız sayılmaz: testlerin sonucu
 * zaten alınmıştır ve bir temizlik hatası yüzünden yeşil bir koşuyu kırmızı
 * göstermek yanıltıcı olurdu. Hata yine de yazdırılır — bir sonraki koşunun
 * başındaki temizlik artığı toplar.
 */
const genelTemizlik = async (): Promise<void> => {
  try {
    const { temizle } = await import('./yardimcilar/tohum.js')
    await temizle()
    console.log('[e2e] test verisi silindi')
  } catch (hata) {
    console.warn('[e2e] temizlik başarısız (koşu yine de geçerli):', hata)
  }
}

export default genelTemizlik
