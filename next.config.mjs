import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/**
 * `output: 'standalone'` VE WINDOWS
 * ============================================================================
 * Standalone çıktısı üretimde ZORUNLUDUR: `Dockerfile` doğrudan
 * `.next/standalone` dizinini kopyalar. Varsayılan bu yüzden değiştirilmemiştir.
 *
 * Ancak bu adım (`Collecting build traces`) bağımlılıkları sembolik linklerle
 * kopyalar. Windows'ta sembolik link oluşturmak Geliştirici Modu veya yönetici
 * yetkisi ister; ikisi de yoksa derleme şu hatayla düşer:
 *   EPERM: operation not permitted, symlink ... -> .next\standalone\node_modules\...
 * pnpm'in symlink tabanlı store'u bu adımı çok sayıda link üreterek büyütür.
 * Hata KODLA İLGİLİ DEĞİLDİR; derlemenin geri kalanı (tip kontrolü, statik
 * üretim) o noktada çoktan tamamlanmıştır.
 *
 * Kalıcı çözüm (yerel makinede, bir kez):
 *   Ayarlar > Gizlilik ve güvenlik > Geliştiriciler için > Geliştirici Modu
 *
 * Geçici çözüm — yalnızca YEREL doğrulama için standalone'u atlar:
 *   $env:NEXT_BUILD_NO_STANDALONE='true'; pnpm build
 * Docker derlemesi bu değişkeni SET ETMEZ, dolayısıyla üretim çıktısı aynen
 * standalone üretmeye devam eder.
 * ============================================================================
 */
const standaloneDisabled = process.env.NEXT_BUILD_NO_STANDALONE === 'true'

/**
 * DERLEME DİZİNİ — E2E TESTLERİ İÇİN AYRILABİLİR
 * ============================================================================
 * Değişken SET EDİLMEZSE hiçbir şey değişmez: Next varsayılan `.next`i
 * kullanır. Üretim ve Docker derlemeleri bu değişkeni set etmez.
 *
 * NEDEN VAR
 * ---------------------------------------------------------------------------
 * İKİ ÖLÇÜLMÜŞ SORUN (2026-09-26, Windows):
 *
 *  1. Var olan bir `.next` üzerine yeniden derlemek "Cannot find module for
 *     page" (ENOENT) hatalarıyla çöküyor; temiz dizine derlemek her seferinde
 *     başarılı oluyor. E2E koşusu bu yüzden dizini önce silmek zorundadır.
 *
 *  2. Testler `.next`i silseydi geliştirme sunucusunun derlemesi de her
 *     koşuda yok olur, `pnpm dev` baştan derlemek zorunda kalırdı.
 *
 * Testler `.env.test` ile `NEXT_DIST_DIR=.next-test` verir; `next build` ve
 * `next start` aynı yapılandırmayı okuduğu için ikisi de o dizini kullanır ve
 * `.next` hiç ellenmez.
 * ============================================================================
 */
const distDir = process.env.NEXT_DIST_DIR

/**
 * DÜŞÜK BELLEK KİPİ — BELLEĞİ KISITLI MAKİNELERDE DERLEYEBİLMEK İÇİN
 * ============================================================================
 * Değişkenler SET EDİLMEZSE hiçbir şey değişmez: Next kendi varsayılanlarını
 * kullanır. Üretim, Docker ve CI derlemeleri bu değişkenleri set etmez; yani
 * CI her zaman VARSAYILAN derlemeyi sınar.
 *
 * ÖLÇÜLMÜŞ SORUN (2026-09-30, Windows, 12 iş parçacıklı, 16 GB makine;
 * başka projelerin geliştirme sunucuları açık, sistemde ~3 GB boş bellek):
 *
 *  1. "Generating static pages" adımında Next 11 işçi süreci AYNI ANDA
 *     başlatır (çekirdek sayısı − 1); her biri Payload yapılandırmasını
 *     yükleyip veritabanına bağlanır. İşçiler açılışta şu hatayla düştü:
 *       FATAL ERROR: Zone Allocation failed - process out of memory
 *       Next.js build worker exited with code: 134
 *     Yığın o anda yalnızca 15–30 MB idi: sınır Node'un değil, İŞLETİM
 *     SİSTEMİNİN sınırıydı.
 *
 *  2. İşçi sayısı 2'ye indirildiğinde de yetmedi: webpack derlemesi sürerken
 *     sistemin boş belleği 40 saniyede ~3 GB'tan 1 GB'ın altına indi ve koşu
 *     durdurulmak zorunda kaldı. (Bu rakam sistemin TAMAMINA aittir; aynı
 *     anda çalışan başka programların payı o ölçümde ayrıştırılmamıştı.
 *     Derlemenin kendi süreç ağacı sonradan ayrı ölçüldü — aşağıda.) Bu
 *     projede özel bir webpack yapılandırması (Payload) olduğu için Next
 *     "derleme işçisi"ni varsayılan olarak KAPATIR ve istemci / sunucu / edge
 *     derleyicileri ana süreçte birlikte yaşar.
 *
 * Hata KODLA İLGİLİ DEĞİLDİR; makinenin o anki durumuyla ilgilidir.
 *
 * `NEXT_BUILD_LOW_MEMORY=true` dört şey yapar:
 *   - `webpackBuildWorker`: derleyiciler ayrı işçi süreçlerinde SIRAYLA
 *     çalışır; her biri bitince belleğini bırakır. ÖLÇÜLDÜ: sunucu derleyicisi
 *     1,7 GB'a çıkıp kapandı; ardından gelen edge ve istemci derleyicileri
 *     sıfırdan başladı.
 *   - `webpackMemoryOptimizations`: Next'in bellek için sunduğu webpack ayarı
 *     (derleme biraz uzar).
 *   - webpack'in DİSK önbelleği kapatılır (`cache: memory`; Next'in bellek
 *     kılavuzundaki öneri). E2E derleme dizini her koşuda silindiği için
 *     (e2e/derleme-temizle.mjs) o önbellek zaten hiç yeniden kullanılamıyor,
 *     yalnızca yazılıyordu.
 *   - statik üretim işçi sayısı 2'ye iner (`NEXT_BUILD_CPUS` ile ayrıca
 *     verilebilir).
 *
 * ÖLÇÜLEN SONUÇ (2026-09-30, aynı makine, başlangıçta 4,2 GB boş bellek):
 *
 *     NEXT_BUILD_LOW_MEMORY=true   NEXT_BUILD_CPUS=1
 *     NODE_OPTIONS=--max-old-space-size=1536
 *
 * ile derleme 4,5 dakikada TAMAMLANDI (webpack adımı 2,6 dk; varsayılan kipte
 * aynı adım 2 dk sürmüştü). Derlemenin süreç ağacı en çok 1,8 GB ayırdı, boş
 * bellek 2,2 GB'ın altına inmedi; ardından 46 testin tamamı geçti.
 *
 * Bu ölçümde derleme, CI'daki gibi AYRI bir adımda koşturuldu (testler
 * `PLAYWRIGHT_SKIP_BUILD=true` ile). Tek komutla (`pnpm test:e2e`) derleme
 * Playwright'ın içinden başlar; araya giren süreçler ~0,4 GB daha tutar.
 * Hangi ayarın ne kadar kazandırdığı AYRI AYRI ölçülmedi: ölçülen, hepsinin
 * birlikte sonucudur.
 *
 *   $env:NEXT_BUILD_LOW_MEMORY='true'; pnpm test:e2e      (PowerShell)
 *   NEXT_BUILD_LOW_MEMORY=true pnpm test:e2e              (bash)
 * ============================================================================
 */
const lowMemory = process.env.NEXT_BUILD_LOW_MEMORY === 'true'
const buildCpus = Number(process.env.NEXT_BUILD_CPUS)
const cpuLimit = Number.isInteger(buildCpus) && buildCpus > 0 ? buildCpus : lowMemory ? 2 : null
const experimental = {
  ...(cpuLimit ? { cpus: cpuLimit } : {}),
  ...(lowMemory ? { webpackBuildWorker: true, webpackMemoryOptimizations: true } : {}),
}
const lowMemoryWebpack = (config, { dev }) => {
  if (config.cache && !dev) config.cache = Object.freeze({ type: 'memory' })
  return config
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(standaloneDisabled ? {} : { output: 'standalone' }),
  ...(distDir ? { distDir } : {}),
  ...(Object.keys(experimental).length > 0 ? { experimental } : {}),
  ...(lowMemory ? { webpack: lowMemoryWebpack } : {}),
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      ...(process.env.NEXT_PUBLIC_SERVER_URL
        ? [
            {
              protocol: new URL(process.env.NEXT_PUBLIC_SERVER_URL).protocol.replace(':', ''),
              hostname: new URL(process.env.NEXT_PUBLIC_SERVER_URL).hostname,
            },
          ]
        : []),
    ],
  },

  // OWASP temel guvenlik basliklari (Sartname 12.1)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

export default withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })
