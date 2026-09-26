import { rmSync } from 'node:fs'

/**
 * E2E DERLEME DİZİNİNİ SİLER — KOŞUDAN ÖNCE
 * ============================================================================
 * ÖLÇÜLMÜŞ ZORUNLULUK (2026-09-26, Windows)
 * ---------------------------------------------------------------------------
 * Var olan bir Next derleme dizininin üzerine yeniden derlemek şu hatayla
 * çöküyor:
 *
 *     [Error [PageNotFoundError]: Cannot find module for page: /[locale]/arama]
 *     > Build error occurred
 *     [Error: Failed to collect page data for /[locale]/arama]
 *
 * Aynı derleme TEMİZ bir dizine yapıldığında her seferinde başarılı oluyor.
 * İki kez ölçüldü: kirli dizin → çöküş, `rm -rf` sonrası → başarı.
 *
 * NEDEN AYRI BİR BETİK
 * ---------------------------------------------------------------------------
 * Bu, Playwright yapılandırmasında `node -e "..."` olarak duruyordu; iç içe
 * tırnaklar hem Windows kabuğunda hem TypeScript dizgisinde ayrı ayrı
 * kaçırılmak zorundaydı ve okunaksızdı. Betik olarak tek satır kalır.
 *
 * SİLİNEN DİZİN `.next` DEĞİLDİR: `.env.test` içinde `NEXT_DIST_DIR=.next-test`
 * verilir, böylece geliştirme sunucusunun derlemesi her koşuda yok edilmez.
 * Değişken yoksa betik hiçbir şey silmez — yanlışlıkla `.next`i uçurmasın.
 * ============================================================================
 */
const dizin = process.env.NEXT_DIST_DIR

if (!dizin) {
  console.log('[e2e] NEXT_DIST_DIR tanımsız; derleme dizini temizlenmedi.')
} else if (dizin === '.next') {
  /*
    GÜVENLİK KİLİDİ. `.next` geliştirme sunucusunun derlemesidir; testlerin onu
    silmesi geliştiriciye sebebi belirsiz bir yeniden derleme maliyeti çıkarır.
  */
  console.log('[e2e] NEXT_DIST_DIR=.next — geliştirme derlemesi silinmedi.')
} else {
  rmSync(dizin, { recursive: true, force: true })
  console.log(`[e2e] derleme dizini temizlendi: ${dizin}`)
}
